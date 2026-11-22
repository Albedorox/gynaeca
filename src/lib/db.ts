import Dexie, { type Table } from 'dexie'
import type { ContraceptionCourse, DayEntry, Settings } from './model'
import { DEFAULT_SETTINGS, emptyDay, isEmptyDay, normalizeDay } from './model'
import type { ISODate } from './dates'

/** Sammlungen, die später synchronisiert werden (siehe docs/sync/README.md) */
export type SyncCollection = 'day' | 'course' | 'settings'

/**
 * Sync-Status je Datensatz. Wird bei jeder lokalen Änderung im selben Schritt gesetzt,
 * damit der spätere Sync weiß, was noch zu senden ist.
 */
export interface SyncMeta {
  col: SyncCollection
  /** lokaler Schlüssel: Datum, uid des Verlaufs oder 'app' */
  key: string
  /** zuletzt bekannte Serverversion (0 = noch nie synchronisiert) */
  version: number
  /** 1 = lokale Änderung noch nicht gesendet */
  dirty: 0 | 1
  /** 1 = lokal gelöscht (Löschmarke) */
  deleted: 0 | 1
  /** zuletzt synchronisierter Stand, Basis für das Zusammenführen */
  base?: unknown
}

/** Gerätebezogener Sync-Zustand (eine Zeile, id 'state') */
export interface SyncState {
  id: 'state'
  deviceId: string
  /** angemeldete Nutzerin, zu der die lokalen Daten gehören */
  userId: string | null
  /** höchste abgeholte seq */
  cursor: number
  lastSyncAt: number | null
}

/** WebCrypto-Schlüssel (nicht exportierbar), erst mit dem Sync belegt */
export interface StoredKey {
  id: string
  key: CryptoKey
}

// Alle Daten liegen lokal im Browser (IndexedDB) auf diesem Gerät.
// Ein Konto ist optional und synchronisiert nur verschlüsselt.
class ZyklusDB extends Dexie {
  days!: Table<DayEntry, string>
  courses!: Table<ContraceptionCourse, number>
  settings!: Table<Settings, string>
  sync!: Table<SyncMeta, [SyncCollection, string]>
  syncState!: Table<SyncState, string>
  keys!: Table<StoredKey, string>

  constructor() {
    super('die-frau-zyklusblatt')
    this.version(1).stores({
      days: 'date',
      courses: '++id, start, end',
      settings: 'id',
    })
    // Version 2: Vorbereitung für den Sync. Verläufe bekommen eine geräteübergreifende uid.
    this.version(2)
      .stores({
        days: 'date',
        courses: '++id, start, end, &uid',
        settings: 'id',
        sync: '[col+key], dirty',
        syncState: 'id',
        keys: 'id',
      })
      .upgrade(async (tx) => {
        await tx
          .table('courses')
          .toCollection()
          .modify((c: ContraceptionCourse) => {
            if (!c.uid) c.uid = newId()
          })
        // Bestehende Daten gelten als noch nicht gesendet
        const now: SyncMeta[] = []
        await tx.table('days').toCollection().each((d: DayEntry) => now.push(meta('day', d.date)))
        await tx.table('courses').toCollection().each((c: ContraceptionCourse) => now.push(meta('course', c.uid!)))
        if (await tx.table('settings').get('app')) now.push(meta('settings', 'app'))
        await tx.table('sync').bulkPut(now)
      })
  }
}

export const db = new ZyklusDB()

export function newId(): string {
  return crypto.randomUUID()
}

function meta(col: SyncCollection, key: string, deleted = false): SyncMeta {
  return { col, key, version: 0, dirty: 1, deleted: deleted ? 1 : 0 }
}

/** Markiert einen Datensatz als geändert. Muss in einer Transaktion laufen, die db.sync enthält. */
async function track(col: SyncCollection, key: string, deleted = false): Promise<void> {
  const cur = await db.sync.get([col, key])
  await db.sync.put({ ...(cur ?? meta(col, key)), dirty: 1, deleted: deleted ? 1 : 0 })
}

// ---------------------------------------------------------------------------
// Einstellungen
// ---------------------------------------------------------------------------

export async function getSettings(): Promise<Settings> {
  const s = await db.settings.get('app')
  return mergeSettings(s)
}

export function mergeSettings(s: Partial<Settings> | undefined): Settings {
  return { ...DEFAULT_SETTINGS, ...s, modules: { ...DEFAULT_SETTINGS.modules, ...s?.modules }, appearance: { ...DEFAULT_SETTINGS.appearance, ...s?.appearance }, id: 'app' }
}

export async function saveSettings(patch: Partial<Settings>): Promise<void> {
  await db.transaction('rw', db.settings, db.sync, async () => {
    const cur = await getSettings()
    await db.settings.put({ ...cur, ...patch, id: 'app' })
    await track('settings', 'app')
  })
}

// ---------------------------------------------------------------------------
// Tage
// ---------------------------------------------------------------------------

/** Ändert einen Tag. Leere Tage werden entfernt, damit die DB schlank bleibt. */
export async function updateDay(date: ISODate, patch: Partial<DayEntry> | ((d: DayEntry) => Partial<DayEntry>)): Promise<void> {
  await db.transaction('rw', db.days, db.sync, async () => {
    const raw = await db.days.get(date)
    const cur = raw ? normalizeDay(raw) : emptyDay(date)
    const p = typeof patch === 'function' ? patch(cur) : patch
    const next: DayEntry = { ...cur, ...p, date, updatedAt: Date.now() }
    if (isEmptyDay(next)) {
      if (!raw) return
      await db.days.delete(date)
      await track('day', date, true)
    } else {
      await db.days.put(next)
      await track('day', date)
    }
  })
}

// ---------------------------------------------------------------------------
// Verläufe (Verhütung, gynäkologische Medikamente)
// ---------------------------------------------------------------------------

export async function addCourse(c: Omit<ContraceptionCourse, 'id' | 'uid' | 'updatedAt'>): Promise<number> {
  return db.transaction('rw', db.courses, db.sync, async () => {
    const uid = newId()
    const id = await db.courses.add({ ...c, uid, updatedAt: Date.now() })
    await track('course', uid)
    return id
  })
}

export async function updateCourse(id: number, patch: Partial<Omit<ContraceptionCourse, 'id' | 'uid'>>): Promise<void> {
  await db.transaction('rw', db.courses, db.sync, async () => {
    const cur = await db.courses.get(id)
    if (!cur) return
    await db.courses.put({ ...cur, ...patch, id, uid: cur.uid, updatedAt: Date.now() })
    await track('course', cur.uid!)
  })
}

export async function deleteCourse(id: number): Promise<void> {
  await db.transaction('rw', db.courses, db.sync, async () => {
    const cur = await db.courses.get(id)
    if (!cur) return
    await db.courses.delete(id)
    await track('course', cur.uid!, true)
  })
}

// ---------------------------------------------------------------------------
// Ganzen Bestand ersetzen oder löschen (Import, Demo, „Alle Daten löschen“)
// ---------------------------------------------------------------------------

export interface DataSet {
  days: DayEntry[]
  courses: Omit<ContraceptionCourse, 'id'>[]
  /** undefined = Einstellungen unverändert lassen, null = löschen */
  settings?: Settings | null
}

/**
 * Ersetzt Tage und Verläufe (und optional die Einstellungen) in einem Schritt.
 * Entfernte Datensätze werden als gelöscht markiert, neue und geänderte als zu senden.
 */
export async function replaceAll(data: DataSet): Promise<void> {
  await db.transaction('rw', [db.days, db.courses, db.settings, db.sync], async () => {
    const oldDays = (await db.days.toCollection().primaryKeys()) as string[]
    const oldCourses = (await db.courses.toArray()).map((c) => c.uid!).filter(Boolean)
    const now = Date.now()
    const courses = data.courses.map((c) => ({ ...c, uid: c.uid ?? newId(), updatedAt: now }))
    const keepDays = new Set(data.days.map((d) => d.date))
    const keepCourses = new Set(courses.map((c) => c.uid))

    await db.days.clear()
    await db.courses.clear()
    await db.days.bulkPut(data.days)
    await db.courses.bulkAdd(courses)

    for (const d of oldDays) if (!keepDays.has(d)) await track('day', d, true)
    for (const u of oldCourses) if (!keepCourses.has(u)) await track('course', u, true)
    for (const d of keepDays) await track('day', d)
    for (const u of keepCourses) await track('course', u)

    if (data.settings === null) {
      await db.settings.clear()
      await track('settings', 'app', true)
    } else if (data.settings) {
      await db.settings.put({ ...data.settings, id: 'app' })
      await track('settings', 'app')
    }
  })
}

/** Löscht alle Einträge und Einstellungen auf diesem Gerät. */
export async function clearAll(): Promise<void> {
  await replaceAll({ days: [], courses: [], settings: null })
}
