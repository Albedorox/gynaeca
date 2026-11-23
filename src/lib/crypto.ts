// Ende-zu-Ende-Verschlüsselung für den Sync (Konzept: docs/sync/README.md).
//
// Hauptschlüssel (32 Byte Zufall)
//   ├─ HKDF → Datenschlüssel  (AES-256-GCM, verschlüsselt jeden Datensatz)
//   └─ HKDF → Indexschlüssel  (HMAC-SHA-256, verschleiert Datensatz-Namen wie das Datum)
//
// Der Hauptschlüssel verlässt das Gerät nur verpackt:
//   - mit einem Schlüssel aus dem Sync-Passwort (Argon2id)
//   - mit einem Schlüssel aus dem Wiederherstellungscode (HKDF, der Code hat 120 Bit Zufall)
//
// Alles außer Argon2id kommt aus der WebCrypto-Schnittstelle des Browsers.

import { db, type SyncCollection } from './db'

export const KEY_FORMAT = 1
export const KEY_VERSION = 1

export interface Argon2Params {
  /** Speicher in KiB */
  m: number
  /** Durchläufe */
  t: number
  /** Parallelität */
  p: number
}

/** 64 MiB, 3 Durchläufe: auf aktuellen Handys etwa 0,5 bis 1,5 Sekunden */
export const DEFAULT_ARGON2: Argon2Params = { m: 65536, t: 3, p: 1 }

/** Mindestlänge des Sync-Passworts */
export const MIN_PASSPHRASE_LENGTH = 10

/** Entspricht einer Zeile in public.key_bundles (Spaltennamen wie in der Datenbank) */
export interface KeyBundle {
  format: number
  kdf: 'argon2id'
  kdf_params: Argon2Params
  salt: string
  wrapped_key: string
  recovery_salt: string
  recovery_wrapped_key: string
  key_version: number
}

/** Die beiden Arbeitsschlüssel, nicht exportierbar */
export interface SyncKeys {
  enc: CryptoKey
  idx: CryptoKey
}

/** Sync-Passwort oder Wiederherstellungscode passt nicht */
export class WrongSecretError extends Error {
  constructor() {
    super('Das Passwort oder der Wiederherstellungscode ist nicht richtig.')
    this.name = 'WrongSecretError'
  }
}

const subtle = globalThis.crypto.subtle
const enc = new TextEncoder()
const dec = new TextDecoder()
const WRAP_AAD = enc.encode('gynaeca/wrap/v1')

// ---------------------------------------------------------------------------
// Einrichten und Entsperren
// ---------------------------------------------------------------------------

/**
 * Erzeugt einen neuen Hauptschlüssel und verpackt ihn zweimal.
 * Der Wiederherstellungscode wird nur hier zurückgegeben und muss der Nutzerin angezeigt werden.
 */
export async function createVault(
  passphrase: string,
  params: Argon2Params = DEFAULT_ARGON2,
): Promise<{ bundle: KeyBundle; recoveryCode: string; keys: SyncKeys }> {
  const master = random(32)
  const code = random(15)
  const salt = random(16)
  const recoverySalt = random(16)
  const bundle: KeyBundle = {
    format: KEY_FORMAT,
    kdf: 'argon2id',
    kdf_params: params,
    salt: b64(salt),
    wrapped_key: await wrap(master, await passphraseKek(passphrase, salt, params)),
    recovery_salt: b64(recoverySalt),
    recovery_wrapped_key: await wrap(master, await recoveryKek(code, recoverySalt)),
    key_version: KEY_VERSION,
  }
  const keys = await deriveKeys(master)
  master.fill(0)
  return { bundle, recoveryCode: formatRecoveryCode(code), keys }
}

export async function unlockWithPassphrase(bundle: KeyBundle, passphrase: string): Promise<SyncKeys> {
  const master = await unwrapWithPassphrase(bundle, passphrase)
  try {
    return await deriveKeys(master)
  } finally {
    master.fill(0)
  }
}

export async function unlockWithRecoveryCode(bundle: KeyBundle, code: string): Promise<SyncKeys> {
  const master = await unwrapWithRecoveryCode(bundle, code)
  try {
    return await deriveKeys(master)
  } finally {
    master.fill(0)
  }
}

/**
 * Neues Sync-Passwort setzen. Entsperrt wird mit dem alten Passwort oder dem Wiederherstellungscode.
 * Nur die Verpackung ändert sich, die Datensätze bleiben unverändert.
 */
export async function changePassphrase(
  bundle: KeyBundle,
  unlock: { passphrase: string } | { recoveryCode: string },
  newPassphrase: string,
  params: Argon2Params = DEFAULT_ARGON2,
): Promise<KeyBundle> {
  const master =
    'passphrase' in unlock
      ? await unwrapWithPassphrase(bundle, unlock.passphrase)
      : await unwrapWithRecoveryCode(bundle, unlock.recoveryCode)
  try {
    const salt = random(16)
    return {
      ...bundle,
      kdf: 'argon2id',
      kdf_params: params,
      salt: b64(salt),
      wrapped_key: await wrap(master, await passphraseKek(newPassphrase, salt, params)),
    }
  } finally {
    master.fill(0)
  }
}

async function unwrapWithPassphrase(bundle: KeyBundle, passphrase: string): Promise<Uint8Array> {
  const kek = await passphraseKek(passphrase, unb64(bundle.salt), bundle.kdf_params)
  return unwrap(bundle.wrapped_key, kek)
}

async function unwrapWithRecoveryCode(bundle: KeyBundle, code: string): Promise<Uint8Array> {
  const bytes = parseRecoveryCode(code)
  if (!bytes) throw new WrongSecretError()
  const kek = await recoveryKek(bytes, unb64(bundle.recovery_salt))
  return unwrap(bundle.recovery_wrapped_key, kek)
}

// ---------------------------------------------------------------------------
// Datensätze
// ---------------------------------------------------------------------------

export interface RecordContext {
  userId: string
  collection: SyncCollection
  recordKey: string
  keyVersion?: number
}

/**
 * Datensatz-Name für den Server: HMAC über Sammlung und lokalen Schlüssel.
 * Derselbe Tag ergibt auf jedem Gerät denselben Namen, der Server sieht aber kein Datum.
 */
export async function recordKey(keys: SyncKeys, collection: SyncCollection, localKey: string): Promise<string> {
  const mac = await subtle.sign('HMAC', keys.idx, enc.encode(`${collection}:${localKey}`))
  return b64url(new Uint8Array(mac))
}

/** Verschlüsselt einen Datensatz. Ergebnis: base64(iv || Chiffretext) */
export async function encryptRecord(keys: SyncKeys, ctx: RecordContext, data: unknown): Promise<string> {
  const iv = random(12)
  const ct = await subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource, additionalData: aad(ctx) as BufferSource },
    keys.enc,
    enc.encode(JSON.stringify(data)) as BufferSource,
  )
  return b64(concat(iv, new Uint8Array(ct)))
}

/** Entschlüsselt einen Datensatz. Wirft, wenn Inhalt oder Zuordnung (AAD) nicht passen. */
export async function decryptRecord<T = unknown>(keys: SyncKeys, ctx: RecordContext, payload: string): Promise<T> {
  const raw = unb64(payload)
  if (raw.length < 12 + 16) throw new Error('Datensatz ist zu kurz')
  const pt = await subtle.decrypt(
    { name: 'AES-GCM', iv: raw.subarray(0, 12) as BufferSource, additionalData: aad(ctx) as BufferSource },
    keys.enc,
    raw.subarray(12) as BufferSource,
  )
  return JSON.parse(dec.decode(pt)) as T
}

/** Bindet den Chiffretext an Nutzerin, Sammlung und Datensatz: der Server kann nichts vertauschen. */
function aad(ctx: RecordContext): Uint8Array {
  return enc.encode(`gynaeca/v1|${ctx.userId}|${ctx.collection}|${ctx.recordKey}|${ctx.keyVersion ?? KEY_VERSION}`)
}

// ---------------------------------------------------------------------------
// Schlüssel auf dem Gerät (nicht exportierbare CryptoKey-Objekte in IndexedDB)
// ---------------------------------------------------------------------------

export async function storeKeys(keys: SyncKeys): Promise<void> {
  await db.keys.bulkPut([
    { id: 'enc', key: keys.enc },
    { id: 'idx', key: keys.idx },
  ])
}

export async function loadKeys(): Promise<SyncKeys | null> {
  const [e, i] = await db.keys.bulkGet(['enc', 'idx'])
  return e && i ? { enc: e.key, idx: i.key } : null
}

export async function forgetKeys(): Promise<void> {
  await db.keys.clear()
}

// ---------------------------------------------------------------------------
// Wiederherstellungscode: 15 Byte = 24 Zeichen Crockford-Base32, in Vierergruppen
// ---------------------------------------------------------------------------

const B32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

export function formatRecoveryCode(bytes: Uint8Array): string {
  let bits = 0
  let value = 0
  let out = ''
  for (const b of bytes) {
    value = (value << 8) | b
    bits += 8
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31]
  return out.match(/.{1,4}/g)!.join('-')
}

/** Liest einen eingetippten Code. Groß-/Kleinschreibung, Leerzeichen, Bindestriche und O/I/L-Verwechslungen sind egal. */
export function parseRecoveryCode(input: string): Uint8Array | null {
  const s = input
    .toUpperCase()
    .replace(/[\s-]/g, '')
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1')
  if (s.length !== 24) return null
  const out = new Uint8Array(15)
  let bits = 0
  let value = 0
  let n = 0
  for (const ch of s) {
    const v = B32.indexOf(ch)
    if (v < 0) return null
    value = ((value << 5) | v) & 0xffff
    bits += 5
    if (bits >= 8) {
      out[n++] = (value >>> (bits - 8)) & 0xff
      bits -= 8
    }
  }
  return out
}

// ---------------------------------------------------------------------------
// Bausteine
// ---------------------------------------------------------------------------

async function passphraseKek(passphrase: string, salt: Uint8Array, p: Argon2Params): Promise<CryptoKey> {
  // Erst bei Bedarf laden: Wer kein Konto nutzt, lädt die Bibliothek nie
  const { argon2id } = await import('hash-wasm')
  const raw = await argon2id({
    password: passphrase.normalize('NFC'),
    salt,
    parallelism: p.p,
    iterations: p.t,
    memorySize: p.m,
    hashLength: 32,
    outputType: 'binary',
  })
  return subtle.importKey('raw', raw as BufferSource, 'AES-GCM', false, ['encrypt', 'decrypt'])
}

async function recoveryKek(code: Uint8Array, salt: Uint8Array): Promise<CryptoKey> {
  const base = await subtle.importKey('raw', code as BufferSource, 'HKDF', false, ['deriveKey'])
  return subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: salt as BufferSource, info: enc.encode('gynaeca/recovery/v1') },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

async function deriveKeys(master: Uint8Array): Promise<SyncKeys> {
  const base = await subtle.importKey('raw', master as BufferSource, 'HKDF', false, ['deriveKey'])
  const salt = new Uint8Array(32)
  const encKey = await subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt, info: enc.encode('gynaeca/enc/v1') },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
  const idxKey = await subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt, info: enc.encode('gynaeca/idx/v1') },
    base,
    { name: 'HMAC', hash: 'SHA-256', length: 256 },
    false,
    ['sign'],
  )
  return { enc: encKey, idx: idxKey }
}

async function wrap(master: Uint8Array, kek: CryptoKey): Promise<string> {
  const iv = random(12)
  const ct = await subtle.encrypt({ name: 'AES-GCM', iv: iv as BufferSource, additionalData: WRAP_AAD }, kek, master as BufferSource)
  return b64(concat(iv, new Uint8Array(ct)))
}

async function unwrap(wrapped: string, kek: CryptoKey): Promise<Uint8Array> {
  const raw = unb64(wrapped)
  try {
    const pt = await subtle.decrypt(
      { name: 'AES-GCM', iv: raw.subarray(0, 12) as BufferSource, additionalData: WRAP_AAD },
      kek,
      raw.subarray(12) as BufferSource,
    )
    return new Uint8Array(pt)
  } catch {
    throw new WrongSecretError()
  }
}

function random(n: number): Uint8Array {
  return globalThis.crypto.getRandomValues(new Uint8Array(n))
}

function concat(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length + b.length)
  out.set(a)
  out.set(b, a.length)
  return out
}

function b64(bytes: Uint8Array): string {
  let s = ''
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(s)
}

function unb64(s: string): Uint8Array {
  const bin = atob(s)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

function b64url(bytes: Uint8Array): string {
  return b64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
