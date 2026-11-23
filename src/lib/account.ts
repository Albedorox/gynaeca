// Nutzerkonto und automatischer Sync (Konzept: docs/sync/README.md).
//
// Ohne Konto wird hier nichts geladen: Der Supabase-Client wird erst nachgeladen,
// wenn sich jemand anmeldet oder bereits angemeldet ist.

import { useSyncExternalStore } from 'react'
import { liveQuery } from 'dexie'
import type { SupabaseClient } from '@supabase/supabase-js'
import { CONSENT_VERSION, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './config'
import { db, detachFromAccount, hasLocalData, wipeLocal } from './db'
import {
  createVault,
  forgetKeys,
  loadKeys,
  storeKeys,
  unlockWithPassphrase,
  unlockWithRecoveryCode,
  WrongSecretError,
  type KeyBundle,
  type SyncKeys,
} from './crypto'
import { AccountMismatchError, runSync, supabaseTransport } from './sync'

const AUTH_STORAGE_KEY = 'gynaeca-auth'

export type AccountStatus =
  | 'loading'
  /** nicht angemeldet */
  | 'signedOut'
  /** Code wurde per E-Mail verschickt */
  | 'codeSent'
  /** angemeldet, aber noch kein Schlüssel auf dem Server: Einwilligung und Sync-Passwort einrichten */
  | 'needsSetup'
  /** angemeldet, Schlüssel auf dem Server, aber nicht auf diesem Gerät: Sync-Passwort eingeben */
  | 'needsUnlock'
  /** alles eingerichtet, Sync läuft */
  | 'ready'

export interface AccountState {
  status: AccountStatus
  email: string | null
  userId: string | null
  syncing: boolean
  lastSyncAt: number | null
  error: string | null
  /** nur direkt nach dem Einrichten gesetzt, damit der Code einmal angezeigt wird */
  recoveryCode: string | null
}

let state: AccountState = { status: 'loading', email: null, userId: null, syncing: false, lastSyncAt: null, error: null, recoveryCode: null }
const listeners = new Set<() => void>()

function set(patch: Partial<AccountState>) {
  state = { ...state, ...patch }
  listeners.forEach((l) => l())
}

export function useAccount(): AccountState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => state,
  )
}

// ---------------------------------------------------------------------------
// Supabase-Client (nachgeladen)
// ---------------------------------------------------------------------------

let clientPromise: Promise<SupabaseClient> | null = null

function client(): Promise<SupabaseClient> {
  clientPromise ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: AUTH_STORAGE_KEY },
    }),
  )
  return clientPromise
}

function hasStoredSession(): boolean {
  try {
    return !!localStorage.getItem(AUTH_STORAGE_KEY)
  } catch {
    return false
  }
}

function message(e: unknown): string {
  if (e instanceof WrongSecretError) return e.message
  if (e instanceof AccountMismatchError) return e.message
  const m = e instanceof Error ? e.message : String(e)
  if (/fetch|network|Failed to/i.test(m)) return 'Keine Verbindung. Bitte später erneut versuchen.'
  if (/expired|invalid/i.test(m) && /otp|token/i.test(m)) return 'Der Code ist falsch oder abgelaufen.'
  if (/rate limit/i.test(m)) return 'Zu viele Versuche. Bitte in ein paar Minuten erneut versuchen.'
  return m
}

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

let started = false

/** Beim App-Start aufrufen. Ohne gespeicherte Anmeldung wird nichts nachgeladen. */
export async function initAccount(): Promise<void> {
  if (started) return
  started = true
  const st = await db.syncState.get('state')
  set({ lastSyncAt: st?.lastSyncAt ?? null })
  if (!hasStoredSession()) {
    set({ status: 'signedOut' })
    return
  }
  try {
    const sb = await client()
    const { data } = await sb.auth.getSession()
    if (!data.session) {
      set({ status: 'signedOut' })
      return
    }
    await afterSignIn(data.session.user.id, data.session.user.email ?? null)
  } catch (e) {
    // Offline: mit gespeicherten Schlüsseln trotzdem „bereit“, Sync versucht es später
    const keys = await loadKeys()
    if (keys && st?.userId) {
      set({ status: 'ready', userId: st.userId, error: null })
      startAutoSync()
    } else set({ status: 'signedOut', error: message(e) })
  }
}

// ---------------------------------------------------------------------------
// Anmelden per E-Mail-Code
// ---------------------------------------------------------------------------

export async function requestCode(email: string): Promise<void> {
  set({ error: null })
  try {
    const sb = await client()
    const { error } = await sb.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: true } })
    if (error) throw error
    set({ status: 'codeSent', email: email.trim() })
  } catch (e) {
    set({ error: message(e) })
  }
}

export async function verifyCode(code: string): Promise<void> {
  set({ error: null })
  try {
    const sb = await client()
    const { data, error } = await sb.auth.verifyOtp({ email: state.email!, token: code.replace(/\s/g, ''), type: 'email' })
    if (error) throw error
    if (!data.user) throw new Error('Anmeldung fehlgeschlagen.')
    await afterSignIn(data.user.id, data.user.email ?? state.email)
  } catch (e) {
    set({ error: message(e) })
  }
}

export function backToEmail(): void {
  set({ status: 'signedOut', error: null })
}

async function afterSignIn(userId: string, email: string | null): Promise<void> {
  const st = await db.syncState.get('state')
  if (st?.userId && st.userId !== userId) {
    // Daten eines anderen Kontos auf dem Gerät: nicht vermischen
    const sb = await client()
    await sb.auth.signOut({ scope: 'local' })
    set({ status: 'signedOut', error: 'Auf diesem Gerät liegen Daten eines anderen Kontos. Bitte melden Sie sich mit diesem Konto an oder entfernen Sie zuerst die Daten vom Gerät.' })
    return
  }
  set({ userId, email })
  const keys = await loadKeys()
  if (keys) {
    set({ status: 'ready' })
    startAutoSync()
    return
  }
  const bundle = await fetchBundle()
  set({ status: bundle ? 'needsUnlock' : 'needsSetup' })
}

async function fetchBundle(): Promise<KeyBundle | null> {
  const sb = await client()
  const { data, error } = await sb.from('key_bundles').select('format,kdf,kdf_params,salt,wrapped_key,recovery_salt,recovery_wrapped_key,key_version').maybeSingle()
  if (error) throw error
  return (data as KeyBundle | null) ?? null
}

// ---------------------------------------------------------------------------
// Einrichten (erstes Gerät) und Entsperren (weitere Geräte)
// ---------------------------------------------------------------------------

/** Einwilligung speichern, Schlüssel erzeugen und hochladen, ersten Sync starten. */
export async function setupSync(passphrase: string): Promise<void> {
  set({ error: null })
  try {
    const sb = await client()
    const { error: ce } = await sb.from('consents').insert({ kind: 'sync_health_data', version: CONSENT_VERSION, granted: true })
    if (ce) throw ce
    const { bundle, recoveryCode, keys } = await createVault(passphrase)
    const { error: be } = await sb.from('key_bundles').insert(bundle)
    if (be) throw be
    await storeKeys(keys)
    set({ status: 'ready', recoveryCode })
    await syncNow(keys)
    startAutoSync()
  } catch (e) {
    set({ error: message(e) })
  }
}

export function recoveryCodeNoted(): void {
  set({ recoveryCode: null })
}

/**
 * Sync-Passwort (oder Wiederherstellungscode) eingeben.
 * @param replaceLocal Daten auf diesem Gerät vorher entfernen und nur die Kontodaten übernehmen
 */
export async function unlock(secret: string, kind: 'passphrase' | 'recovery', replaceLocal: boolean): Promise<void> {
  set({ error: null })
  try {
    const bundle = await fetchBundle()
    if (!bundle) throw new Error('Für dieses Konto ist noch kein Sync eingerichtet.')
    const keys = kind === 'passphrase' ? await unlockWithPassphrase(bundle, secret) : await unlockWithRecoveryCode(bundle, secret)
    if (replaceLocal) await wipeLocal()
    await storeKeys(keys)
    set({ status: 'ready' })
    await syncNow(keys)
    startAutoSync()
  } catch (e) {
    set({ error: message(e) })
  }
}

export { hasLocalData }

// ---------------------------------------------------------------------------
// Sync
// ---------------------------------------------------------------------------

let running: Promise<void> | null = null
let again = false

/** Startet einen Sync-Durchlauf. Läuft schon einer, folgt direkt danach ein weiterer. */
export async function syncNow(keysArg?: SyncKeys): Promise<void> {
  if (state.status !== 'ready' || !state.userId) return
  if (running) {
    again = true
    return running
  }
  running = (async () => {
    set({ syncing: true })
    try {
      do {
        again = false
        const keys = keysArg ?? (await loadKeys())
        if (!keys) throw new Error('Schlüssel fehlt auf diesem Gerät.')
        const sb = await client()
        await runSync({ transport: supabaseTransport(sb), keys, userId: state.userId! })
      } while (again)
      set({ lastSyncAt: Date.now(), error: null })
    } catch (e) {
      set({ error: message(e) })
    } finally {
      set({ syncing: false })
      running = null
    }
  })()
  return running
}

let autoStarted = false

/** Sync beim Start, im Vordergrund, bei Netz, kurz nach Änderungen und alle 5 Minuten */
function startAutoSync(): void {
  if (autoStarted) return
  autoStarted = true
  let timer: number | undefined
  const soon = (ms: number) => {
    window.clearTimeout(timer)
    timer = window.setTimeout(() => void syncNow(), ms)
  }
  document.addEventListener('visibilitychange', () => document.visibilityState === 'visible' && soon(300))
  window.addEventListener('online', () => soon(300))
  window.setInterval(() => document.visibilityState === 'visible' && void syncNow(), 5 * 60_000)
  liveQuery(() => db.sync.where('dirty').equals(1).count()).subscribe({
    next: (n) => {
      if (n > 0 && !running) soon(3000)
    },
  })
  soon(0)
}

// ---------------------------------------------------------------------------
// Abmelden und Konto löschen
// ---------------------------------------------------------------------------

/** @param removeLocal Daten von diesem Gerät entfernen (z. B. bei geteilten Geräten) */
export async function signOut(removeLocal: boolean): Promise<void> {
  set({ error: null })
  try {
    // Ausstehende Änderungen vorher noch senden, wenn möglich
    if (!removeLocal) await syncNow().catch(() => undefined)
    const sb = await client()
    await sb.auth.signOut({ scope: 'local' })
  } catch {
    // Abmelden klappt lokal auch ohne Netz
  }
  if (removeLocal) await wipeLocal()
  else await detachFromAccount()
  await forgetKeys()
  set({ status: 'signedOut', userId: null, email: null, lastSyncAt: null, recoveryCode: null })
}

/** Löscht Konto, Schlüssel und alle Daten auf dem Server. Die Daten auf diesem Gerät bleiben. */
export async function deleteAccount(): Promise<void> {
  set({ error: null })
  try {
    const sb = await client()
    const { error } = await sb.rpc('delete_my_account')
    if (error) throw error
    await sb.auth.signOut({ scope: 'local' }).catch(() => undefined)
    await detachFromAccount()
    set({ status: 'signedOut', userId: null, email: null, lastSyncAt: null, recoveryCode: null })
  } catch (e) {
    set({ error: message(e) })
  }
}
