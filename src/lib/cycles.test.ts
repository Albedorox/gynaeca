import { describe, expect, it } from 'vitest'
import { computeCycles, cycleDay, cycleLabel, predictNext } from './cycles'
import { addDays } from './dates'
import { emptyDay, type DayEntry } from './model'

const S = { countSpotting: false, minGapDays: 7 }

function day(date: string, p: Partial<DayEntry>): DayEntry {
  return { ...emptyDay(date), ...p }
}
function period(start: string, strengths: number[]): DayEntry[] {
  return strengths.map((b, i) => day(addDays(start, i), { bleeding: b }))
}

describe('computeCycles', () => {
  it('berechnet X/Y für abgeschlossene Zyklen', () => {
    const days = [...period('2026-01-01', [3, 4, 2, 1, 0.5]), ...period('2026-01-26', [2, 3, 1, 0.5])]
    const cycles = computeCycles(days, S)
    expect(cycles).toHaveLength(2)
    expect(cycleLabel(cycles[0])).toBe('5/25')
    expect(cycles[0].end).toBe('2026-01-25')
    expect(cycleLabel(cycles[1])).toBe('4/–')
  })

  it('zählt Zwischenblutungen nicht als neuen Zyklus', () => {
    const days = [...period('2026-01-01', [3, 3, 2]), day('2026-01-08', { bleeding: 0.5 }), ...period('2026-01-29', [2, 2])]
    const cycles = computeCycles(days, S)
    expect(cycles.map((c) => c.start)).toEqual(['2026-01-01', '2026-01-29'])
    expect(cycles[0].length).toBe(28)
  })

  it('überbrückt einen einzelnen blutungsfreien Tag in der Periode', () => {
    const days = [...period('2026-03-01', [3, 2, 0, 1]), ...period('2026-03-29', [2])]
    expect(computeCycles(days, S)[0].bleedDays).toBe(3)
  })

  it('zählt Schmierblutung am Rand optional mit', () => {
    const days = [
      day('2026-02-28', { spotting: true }),
      ...period('2026-03-01', [3, 2, 1]),
      day('2026-03-04', { spotting: true }),
      ...period('2026-03-29', [2]),
    ]
    expect(computeCycles(days, S)[0].bleedDays).toBe(3)
    expect(computeCycles(days, { ...S, countSpotting: true })[0].bleedDays).toBe(5)
  })

  it('respektiert manuellen Zyklusbeginn', () => {
    const days = [...period('2026-01-01', [3, 3]), day('2026-01-05', { bleeding: 1, cycleStart: true })]
    expect(computeCycles(days, S).map((c) => c.start)).toEqual(['2026-01-01', '2026-01-05'])
  })

  it('liefert Zyklustage', () => {
    const cycles = computeCycles(period('2026-01-01', [2]), S)
    expect(cycleDay(cycles, '2026-01-10')).toBe(10)
    expect(cycleDay(cycles, '2025-12-31')).toBeNull()
  })

  it('funktioniert über Sommerzeit und Jahreswechsel', () => {
    const days = [...period('2026-03-20', [2, 2]), ...period('2026-04-17', [2])]
    expect(computeCycles(days, S)[0].length).toBe(28)
    const ny = [...period('2025-12-20', [2]), ...period('2026-01-17', [2])]
    expect(computeCycles(ny, S)[0].length).toBe(28)
  })
})

describe('predictNext', () => {
  const mk = (start: string, length: number | null, bleedDays = 5) => ({ start, end: null, length, bleedDays, periodEnd: start })
  it('mittelt abgeschlossene Zyklen', () => {
    const p = predictNext([mk('2026-01-01', 28, 4), mk('2026-01-29', 30, 6), mk('2026-02-28', null)], '2026-03-05')
    expect(p).toEqual({ start: '2026-03-29', days: 5, length: 29 })
  })
  it('keine Prognose ohne abgeschlossenen Zyklus oder bei Überfälligkeit', () => {
    expect(predictNext([mk('2026-01-01', null)], '2026-01-05')).toBeNull()
    expect(predictNext([mk('2026-01-01', 28), mk('2026-01-29', null)], '2026-02-27')).toBeNull()
  })
})
