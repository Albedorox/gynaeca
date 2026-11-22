import Dexie, { type Table } from 'dexie'
import type { ContraceptionCourse, DayEntry, Settings } from './model'
import { DEFAULT_SETTINGS, emptyDay, isEmptyDay, normalizeDay } from './model'
import type { ISODate } from './dates'

// Alle Daten liegen ausschließlich lokal im Browser (IndexedDB) auf diesem Gerät.
class ZyklusDB extends Dexie {
  days!: Table<DayEntry, string>
  courses!: Table<ContraceptionCourse, number>
  settings!: Table<Settings, string>

  constructor() {
    super('die-frau-zyklusblatt')
    this.version(1).stores({
      days: 'date',
      courses: '++id, start, end',
      settings: 'id',
    })
  }
}

export const db = new ZyklusDB()

export async function getSettings(): Promise<Settings> {
  const s = await db.settings.get('app')
  return mergeSettings(s)
}

export function mergeSettings(s: Partial<Settings> | undefined): Settings {
  return { ...DEFAULT_SETTINGS, ...s, modules: { ...DEFAULT_SETTINGS.modules, ...s?.modules }, appearance: { ...DEFAULT_SETTINGS.appearance, ...s?.appearance }, id: 'app' }
}

export async function saveSettings(patch: Partial<Settings>): Promise<void> {
  const cur = await getSettings()
  await db.settings.put({ ...cur, ...patch, id: 'app' })
}

/** Ändert einen Tag. Leere Tage werden entfernt, damit die DB schlank bleibt. */
export async function updateDay(date: ISODate, patch: Partial<DayEntry> | ((d: DayEntry) => Partial<DayEntry>)): Promise<void> {
  await db.transaction('rw', db.days, async () => {
    const raw = await db.days.get(date)
    const cur = raw ? normalizeDay(raw) : emptyDay(date)
    const p = typeof patch === 'function' ? patch(cur) : patch
    const next: DayEntry = { ...cur, ...p, date, updatedAt: Date.now() }
    if (isEmptyDay(next)) await db.days.delete(date)
    else await db.days.put(next)
  })
}
