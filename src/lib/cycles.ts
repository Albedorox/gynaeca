import { addDays, diffDays, type ISODate } from './dates'
import type { DayEntry, Settings } from './model'

export interface Cycle {
  /** Zyklustag 1 = erster Tag mit Blutung > 0 (oder manuell gesetzter Beginn) */
  start: ISODate
  /** Letzter Tag vor der nächsten Periode; null, solange der Zyklus läuft */
  end: ISODate | null
  /** Gesamtlänge in Tagen; null, solange der Zyklus läuft */
  length: number | null
  /** Anzahl Blutungstage der Periode */
  bleedDays: number
  /** Letzter Tag, der zur Periode gezählt wurde */
  periodEnd: ISODate
}

type CycleSettings = Pick<Settings, 'countSpotting' | 'minGapDays'>

/**
 * Ermittelt die Zyklen aus den Tageseinträgen.
 *
 * Regeln:
 * - Eine Blutung (Stärke > 0) startet einen neuen Zyklus, wenn davor mindestens
 *   `minGapDays` blutungsfreie Tage liegen. So zählt eine Zwischenblutung nicht als Periode.
 * - `cycleStart === true` an einem Tag erzwingt einen Zyklusbeginn, `false` verhindert ihn.
 * - Zykluslänge = Tage vom Zyklustag 1 bis einschließlich zum Tag vor der nächsten Periode.
 * - Blutungsdauer = zusammenhängende Blutungstage ab Zyklustag 1. Ein einzelner blutungsfreier
 *   Tag mitten in der Periode unterbricht sie nicht. Mit `countSpotting` zählen reine
 *   Schmierblutungstage direkt vor dem Beginn und am Ende mit.
 */
export function computeCycles(days: DayEntry[], settings: CycleSettings): Cycle[] {
  const byDate = new Map<ISODate, DayEntry>()
  for (const d of days) byDate.set(d.date, d)
  const sorted = [...days].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))

  const starts: ISODate[] = []
  let lastBleed: ISODate | null = null
  for (const d of sorted) {
    const bleeds = d.bleeding > 0
    let isStart = false
    if (d.cycleStart === true) isStart = true
    else if (bleeds && d.cycleStart !== false) {
      isStart = lastBleed === null || diffDays(lastBleed, d.date) - 1 >= settings.minGapDays
    }
    if (isStart) starts.push(d.date)
    if (bleeds) lastBleed = d.date
  }

  const isBleed = (iso: ISODate) => (byDate.get(iso)?.bleeding ?? 0) > 0
  const isSpot = (iso: ISODate) => {
    const e = byDate.get(iso)
    return !!e && e.spotting && e.bleeding === 0
  }

  return starts.map((start, i) => {
    const next = starts[i + 1] ?? null
    const end = next ? addDays(next, -1) : null
    const inCycle = (iso: ISODate) => end === null || iso <= end

    // Periode ab Start verfolgen (1 Tag Lücke erlaubt)
    let periodEnd = start
    let cursor = start
    for (;;) {
      const n1 = addDays(cursor, 1)
      const n2 = addDays(cursor, 2)
      if (inCycle(n1) && isBleed(n1)) cursor = n1
      else if (inCycle(n2) && isBleed(n2) && !isBleed(n1)) cursor = n2
      else break
      periodEnd = cursor
    }
    let bleedDays = diffDays(start, periodEnd) + 1
    // Tage ohne Blutung innerhalb der Periode (Lücken) nicht mitzählen
    for (let iso = start; iso <= periodEnd; iso = addDays(iso, 1)) {
      if (!isBleed(iso) && !(settings.countSpotting && isSpot(iso))) bleedDays--
    }

    if (settings.countSpotting) {
      let after = addDays(periodEnd, 1)
      while (inCycle(after) && isSpot(after)) {
        bleedDays++
        periodEnd = after
        after = addDays(after, 1)
      }
      const prevEnd = i > 0 ? starts[i - 1] : null
      let before = addDays(start, -1)
      while (isSpot(before) && (prevEnd === null || before > prevEnd)) {
        bleedDays++
        before = addDays(before, -1)
      }
    }

    return {
      start,
      end,
      length: next ? diffDays(start, next) : null,
      bleedDays,
      periodEnd,
    }
  })
}

export function cycleLabel(c: Cycle): string {
  return `${c.bleedDays}/${c.length ?? '–'}`
}

/** Zyklus, in den ein Datum fällt (oder undefined vor dem ersten erfassten Zyklus) */
export function cycleFor(cycles: Cycle[], iso: ISODate): Cycle | undefined {
  for (let i = cycles.length - 1; i >= 0; i--) {
    if (cycles[i].start <= iso) return cycles[i]
  }
  return undefined
}

export function cycleDay(cycles: Cycle[], iso: ISODate): number | null {
  const c = cycleFor(cycles, iso)
  return c ? diffDays(c.start, iso) + 1 : null
}

export interface CycleStats {
  count: number
  avgLength: number | null
  minLength: number | null
  maxLength: number | null
  avgBleed: number | null
}

export function cycleStats(cycles: Cycle[]): CycleStats {
  const closed = cycles.filter((c) => c.length !== null)
  const lens = closed.map((c) => c.length as number)
  const avg = (a: number[]) => (a.length ? Math.round((a.reduce((s, x) => s + x, 0) / a.length) * 10) / 10 : null)
  return {
    count: closed.length,
    avgLength: avg(lens),
    minLength: lens.length ? Math.min(...lens) : null,
    maxLength: lens.length ? Math.max(...lens) : null,
    avgBleed: avg(cycles.map((c) => c.bleedDays)),
  }
}

export interface Prediction {
  /** Voraussichtlicher Beginn der nächsten Periode */
  start: ISODate
  /** Voraussichtliche Dauer in Tagen */
  days: number
  /** Zugrunde gelegte Zykluslänge */
  length: number
}

/**
 * Grobe Prognose der nächsten Periode: Durchschnitt der letzten (bis zu 6) abgeschlossenen Zyklen.
 * Braucht mindestens einen abgeschlossenen Zyklus. Ist die Periode schon überfällig, gibt es keine Prognose.
 * Nur zur Orientierung, nicht zur Verhütung.
 */
export function predictNext(cycles: Cycle[], today: ISODate): Prediction | null {
  const cur = cycles[cycles.length - 1]
  if (!cur || cur.length !== null) return null
  const closed = cycles.filter((c) => c.length !== null).slice(-6)
  if (closed.length === 0) return null
  const length = Math.round(closed.reduce((s, c) => s + (c.length as number), 0) / closed.length)
  const days = Math.max(1, Math.round(closed.reduce((s, c) => s + c.bleedDays, 0) / closed.length))
  const start = addDays(cur.start, length)
  if (start <= today) return null
  return { start, days, length }
}
