import { useLiveQuery } from 'dexie-react-hooks'
import { useMemo } from 'react'
import { db, mergeSettings } from './db'
import { computeCycles, type Cycle } from './cycles'
import type { ContraceptionCourse, DayEntry, Settings } from './model'
import type { ISODate } from './dates'

export interface AppData {
  ready: boolean
  settings: Settings
  days: Map<ISODate, DayEntry>
  dayList: DayEntry[]
  courses: ContraceptionCourse[]
  cycles: Cycle[]
}

/** Lädt alle Daten live aus IndexedDB. Die Datenmenge ist klein (ein Eintrag pro Tag). */
export function useAppData(): AppData {
  const settingsRow = useLiveQuery(() => db.settings.get('app'), [], null)
  const dayList = useLiveQuery(() => db.days.orderBy('date').toArray(), [], null)
  const courses = useLiveQuery(() => db.courses.orderBy('start').toArray(), [], null)

  const settings = useMemo(() => mergeSettings(settingsRow ?? undefined), [settingsRow])
  const days = useMemo(() => new Map((dayList ?? []).map((d) => [d.date, d])), [dayList])
  const cycles = useMemo(
    () => computeCycles(dayList ?? [], settings),
    [dayList, settings.countSpotting, settings.minGapDays], // eslint-disable-line react-hooks/exhaustive-deps
  )

  return {
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
