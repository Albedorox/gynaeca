// Auswertung der Selbstfürsorge im Endometriose-Modul: Bewegung, Entspannung,
// Hilfsmittel und Ernährung, jeweils im Vergleich zum Schmerz.
import { addDays, diffDays, parseISO, type ISODate } from './dates'
import type { DayEntry } from './model'
import { FOOD_GOOD, FOOD_LESS, MOVEMENT_GOAL_MIN } from './knowledge'

const GOOD = new Set(FOOD_GOOD.map((x) => x.label))
const LESS = new Set(FOOD_LESS.map((x) => x.label))

export const movedEnough = (d: DayEntry | undefined): boolean => (d?.movementMin ?? 0) >= MOVEMENT_GOAL_MIN
export const relaxed = (d: DayEntry | undefined): boolean => (d?.relax.length ?? 0) > 0
export const usedAids = (d: DayEntry | undefined): boolean => (d?.aids.length ?? 0) > 0
export const hasFood = (d: DayEntry | undefined): boolean =>
  !!d && (d.food.length > 0 || d.supplements.length > 0 || d.cheatDay || Object.values(d.meals).some((v) => v && v.trim()) || d.water !== null || d.foodReaction.length > 0)
/** Ungünstiger Ernährungstag: Cheat Day oder mindestens zwei ungünstige Kategorien */
export const unhealthyDay = (d: DayEntry | undefined): boolean => !!d && (d.cheatDay || d.food.filter((f) => LESS.has(f)).length >= 2)
export const goodFoodCount = (d: DayEntry | undefined): number => (d ? d.food.filter((f) => GOOD.has(f)).length : 0)

/** Montag der Woche */
export function weekStart(iso: ISODate): ISODate {
  const { y, m0, d } = parseISO(iso)
  return addDays(iso, -((new Date(Date.UTC(y, m0, d)).getUTCDay() + 6) % 7))
}

/** Die sieben Tage (Mo–So) der Woche mit der Angabe, ob das Bewegungsziel erreicht wurde. */
export function movementWeek(days: Map<ISODate, DayEntry>, iso: ISODate): { date: ISODate; ok: boolean; some: boolean }[] {
  const mo = weekStart(iso)
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(mo, i)
    const e = days.get(date)
    return { date, ok: movedEnough(e), some: (e?.movementMin ?? 0) > 0 || (e?.movement.length ?? 0) > 0 }
  })
}

export interface PainCompare {
  withAvg: number | null
  withN: number
  withoutAvg: number | null
  withoutN: number
}

/**
 * Vergleicht den Schmerz an Tagen mit und ohne Faktor. Mit lag = 1 zählt ein Faktor
 * auch für den Folgetag (z. B. Cheat Day am Vortag). Berücksichtigt nur Tage mit Schmerzeintrag.
 */
export function painCompare(days: Map<ISODate, DayEntry>, from: ISODate, to: ISODate, factor: (d: DayEntry | undefined) => boolean, lag = 0): PainCompare {
  const w: number[] = []
  const wo: number[] = []
  const n = diffDays(from, to)
  for (let i = 0; i <= n; i++) {
    const date = addDays(from, i)
    const e = days.get(date)
    if (e?.pain == null) continue
    let f = false
    for (let k = 0; k <= lag && !f; k++) f = factor(days.get(addDays(date, -k)))
    ;(f ? w : wo).push(e.pain)
  }
  const avg = (a: number[]) => (a.length ? Math.round((a.reduce((s, x) => s + x, 0) / a.length) * 10) / 10 : null)
  return { withAvg: avg(w), withN: w.length, withoutAvg: avg(wo), withoutN: wo.length }
}

/** Aussagekräftig erst, wenn auf beiden Seiten genug Tage liegen. */
export const comparable = (c: PainCompare, min = 3): boolean => c.withN >= min && c.withoutN >= min

export interface CareSummary {
  span: number
  moveDays: number
  movePerWeek: number
  relaxDays: number
  aidDays: number
  foodDays: number
  cheatDays: number
  unhealthyDays: number
  avgStress: number | null
  movement: [string, number][]
  relax: [string, number][]
  aids: [string, number][]
  food: [string, number][]
  supplements: [string, number][]
  reactions: [string, number][]
}

function countAll(list: DayEntry[], pick: (d: DayEntry) => string[]): [string, number][] {
  const m = new Map<string, number>()
  for (const d of list) for (const x of pick(d)) m.set(x, (m.get(x) ?? 0) + 1)
  return [...m].sort((a, b) => b[1] - a[1])
}

export function careSummary(dayList: DayEntry[], from: ISODate, to: ISODate): CareSummary {
  const list = dayList.filter((d) => d.date >= from && d.date <= to)
  const span = diffDays(from, to) + 1
  const moveDays = list.filter(movedEnough).length
  const stress = list.filter((d) => d.stress !== null).map((d) => d.stress as number)
  return {
    span,
    moveDays,
    movePerWeek: Math.round((moveDays / span) * 7 * 10) / 10,
    relaxDays: list.filter(relaxed).length,
    aidDays: list.filter(usedAids).length,
    foodDays: list.filter(hasFood).length,
    cheatDays: list.filter((d) => d.cheatDay).length,
    unhealthyDays: list.filter(unhealthyDay).length,
    avgStress: stress.length ? Math.round((stress.reduce((a, b) => a + b, 0) / stress.length) * 10) / 10 : null,
    movement: countAll(list, (d) => d.movement),
    relax: countAll(list, (d) => d.relax),
    aids: countAll(list, (d) => d.aids),
    food: countAll(list, (d) => d.food),
    supplements: countAll(list, (d) => d.supplements),
    reactions: countAll(list, (d) => d.foodReaction),
  }
}

/** Kurze Zusammenfassung eines Tages für Bericht und Tagebuch. */
export function careLine(d: DayEntry): string {
  const parts: string[] = []
  if (d.movementMin !== null || d.movement.length) parts.push(`Bewegung${d.movementMin ? ` ${d.movementMin} min` : ''}${d.movement.length ? ` (${d.movement.join(', ')})` : ''}`)
  if (d.relax.length) parts.push(`Entspannung: ${d.relax.join(', ')}`)
  if (d.stress !== null) parts.push(`Stress ${d.stress}`)
  if (d.aids.length) parts.push(d.aids.join(', '))
  return parts.join(' · ')
}

export function foodLine(d: DayEntry): string {
  const parts: string[] = []
  if (d.cheatDay) parts.push('Cheat Day')
  if (d.food.length) parts.push(d.food.join(', '))
  if (d.supplements.length) parts.push(`Supplemente: ${d.supplements.join(', ')}`)
  if (d.water !== null) parts.push(`${d.water} Gläser`)
  if (d.foodReaction.length) parts.push(d.foodReaction.join(', '))
  return parts.join(' · ')
}
