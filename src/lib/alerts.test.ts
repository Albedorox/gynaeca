import { describe, expect, it } from 'vitest'
import { cycleAlerts } from './alerts'
import { DEFAULT_SETTINGS } from './model'
import type { Cycle } from './cycles'
import { addDays } from './dates'

function cycles(lengths: number[], start = '2025-01-01'): Cycle[] {
  const out: Cycle[] = []
  let s = start
  for (const l of lengths) {
    out.push({ start: s, end: addDays(s, l - 1), length: l, bleedDays: 5, periodEnd: addDays(s, 4) })
    s = addDays(s, l)
  }
  out.push({ start: s, end: null, length: null, bleedDays: 5, periodEnd: addDays(s, 4) })
  return out
}
const st = (birthYear: number | null, menarcheAge: number | null = 12) => ({ ...DEFAULT_SETTINGS, birthYear, menarcheAge })

describe('cycleAlerts', () => {
  it('POI-Hinweis vor 40 nach 4 Monaten ohne Blutung', () => {
    const c = cycles([28, 28])
    const today = addDays(c[2].start, 125)
    expect(cycleAlerts(c, st(1995), [], today).map((a) => a.id)).toContain('poi')
  })
  it('90-Tage-Hinweis ohne Alter', () => {
    const c = cycles([28])
    expect(cycleAlerts(c, st(null), [], addDays(c[1].start, 95)).map((a) => a.id)).toContain('pause-90')
  })
  it('Jugendliche: 40 Tage sind in den ersten 3 Jahren normal', () => {
    const c = cycles([40, 42, 38, 41])
    const today = addDays(c[4].start, 3)
    expect(cycleAlerts(c, st(2011, 13), [], today).map((a) => a.id)).not.toContain('laenge')
    expect(cycleAlerts(c, st(1995), [], today).map((a) => a.id)).toContain('laenge')
  })
  it('Perimenopause: wiederholte Sprünge ≥ 7 Tage', () => {
    const c = cycles([26, 35, 25, 34, 27])
    expect(cycleAlerts(c, st(1980), [], addDays(c[5].start, 3)).map((a) => a.id)).toContain('peri-frueh')
  })
  it('unter Hormonen keine Hinweise', () => {
    const c = cycles([28])
    const s = { ...st(1995), modules: { ...DEFAULT_SETTINGS.modules, contraception: true } }
    expect(cycleAlerts(c, s, [{ name: 'Pille', start: '2025-01-01', end: null }], addDays(c[1].start, 130))).toEqual([])
  })
})
