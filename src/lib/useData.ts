import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo } from 'react'
import { db, mergeSettings } from './db'
import { computeCycles, type Cycle } from './cycles'
import { emptyDay, type ContraceptionCourse, type DayEntry, type Settings } from './model'
import { todayISO, type ISODate } from './dates'
import { evaluateNfp, type NfpCycle } from './nfp'
import { cycleAlerts, type CycleAlert } from './alerts'

export interface AppData {
  ready: boolean
  settings: Settings
  days: Map<ISODate, DayEntry>
  dayList: DayEntry[]
  courses: ContraceptionCourse[]
  cycles: Cycle[]
  /** NFP-Auswertung je Zyklus (leer, wenn das Modul aus ist) */
  nfp: NfpCycle[]
  alerts: CycleAlert[]
}

/** Lädt alle Daten live aus IndexedDB. Die Datenmenge ist klein (ein Eintrag pro Tag). */
export function useAppData(): AppData {
  const settingsRow = useLiveQuery(() => db.settings.get('app'), [], null)
  // Ältere Einträge um neue Felder ergänzen
  const dayList = useLiveQuery(async () => (await db.days.orderBy('date').toArray()).map((d) => ({ ...emptyDay(d.date), ...d })), [], null)
  const courses = useLiveQuery(() => db.courses.orderBy('start').toArray(), [], null)

  const settings = useMemo(() => mergeSettings(settingsRow ?? undefined), [settingsRow])
  const days = useMemo(() => new Map((dayList ?? []).map((d) => [d.date, d])), [dayList])
  const cycles = useMemo(
    () => computeCycles(dayList ?? [], settings),
    [dayList, settings.countSpotting, settings.minGapDays], // eslint-disable-line react-hooks/exhaustive-deps
  )

  const today = todayISO()
  const nfp = useMemo(
    () => (settings.modules.nfp ? evaluateNfp(cycles, days, settings, courses ?? [], today) : []),
    [cycles, days, settings, courses, today],
  )
  const alerts = useMemo(() => cycleAlerts(cycles, settings, courses ?? [], today), [cycles, settings, courses, today])

  return {
    nfp,
    alerts,
    ready: settingsRow !== null && dayList !== null && courses !== null,
    settings,
    days,
    dayList: dayList ?? [],
    courses: courses ?? [],
    cycles,
  }
}

export function courseOn(courses: ContraceptionCourse[], iso: ISODate): ContraceptionCourse | undefined {
  return courses.find((c) => c.start <= iso && (c.end === null || iso <= c.end))
}
