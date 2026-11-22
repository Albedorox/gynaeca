import { describe, expect, it } from 'vitest'
import { computeCycles } from './cycles'
import { addDays, type ISODate } from './dates'
import { DEFAULT_SETTINGS, emptyDay, type DayEntry, type MucusCode } from './model'
import { dayStatus, evaluateNfp, evaluateTemperature } from './nfp'

const pts = (start: ISODate, temps: number[]) => temps.map((t, i) => ({ date: addDays(start, i), v: Math.round(t * 20) * 5 }))

describe('evaluateTemperature', () => {
  it('reguläre Auswertung: dritte höhere Messung 0,2 über der Hilfslinie', () => {
    const r = evaluateTemperature(pts('2026-01-01', [36.4, 36.45, 36.4, 36.5, 36.45, 36.4, 36.6, 36.65, 36.7]))
    expect(r?.rule).toBe('regulär')
    expect(r?.coverline).toBe(36.5)
    expect(r?.firstHigher).toBe('2026-01-07')
    expect(r?.done).toBe('2026-01-09')
  })
  it('Ausnahmeregel 1: vierter Wert nötig', () => {
    const r = evaluateTemperature(pts('2026-01-01', [36.4, 36.45, 36.4, 36.5, 36.45, 36.4, 36.6, 36.6, 36.65, 36.6]))
    expect(r?.rule).toBe('Ausnahmeregel 1')
    expect(r?.done).toBe('2026-01-10')
  })
  it('Ausnahmeregel 2: ein Wert auf der Hilfslinie wird übergangen', () => {
    const r = evaluateTemperature(pts('2026-01-01', [36.4, 36.45, 36.4, 36.5, 36.45, 36.4, 36.6, 36.5, 36.65, 36.7]))
    expect(r?.rule).toBe('Ausnahmeregel 2')
    expect(r?.done).toBe('2026-01-10')
  })
  it('ohne genug Werte keine Auswertung', () => {
    expect(evaluateTemperature(pts('2026-01-01', [36.4, 36.45, 36.4, 36.5, 36.45, 36.4, 36.6]))).toBeNull()
  })
})

function cycleDays(start: ISODate, temps: number[], mucus: (MucusCode | null)[], bleed = 5): DayEntry[] {
  return temps.map((t, i) => ({
    ...emptyDay(addDays(start, i)),
    bleeding: i < bleed ? 3 : 0,
    temp: t,
    mucus: mucus[i] ?? null,
  }))
}

// 28 Tage: Schleim-Höhepunkt ZT 14, Temperaturanstieg ab ZT 15
const T = [36.5, 36.5, 36.45, 36.4, 36.4, 36.45, 36.4, 36.45, 36.4, 36.5, 36.45, 36.4, 36.45, 36.4, 36.65, 36.7, 36.75, 36.7, 36.75, 36.8, 36.75, 36.7, 36.75, 36.7, 36.7, 36.65, 36.6, 36.55]
const M: (MucusCode | null)[] = [null, null, null, null, null, 't', 't', 'Ø', 'Ø', 'f', 'f', 'S', 'S+', 'S+', 'S', 'f', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't']

describe('evaluateNfp', () => {
  const settings = { modules: { ...DEFAULT_SETTINGS.modules, nfp: true } }
  const c1 = cycleDays('2026-01-01', T, M)
  const c2 = cycleDays('2026-01-29', T, M)
  const all = [...c1, ...c2, { ...emptyDay('2026-02-26'), bleeding: 3 }]
  const days = new Map(all.map((d) => [d.date, d]))
  const cycles = computeCycles(all, DEFAULT_SETTINGS)
  const res = evaluateNfp(cycles, days, settings, [], '2026-02-26')

  it('doppelte Kontrolle: unfruchtbar ab Abend des späteren Abschlusses', () => {
    const r = res[0]
    expect(r.peak).toBe('2026-01-14')
    expect(r.peakDone).toBe('2026-01-17')
    expect(r.tempDone).toBe('2026-01-17')
    expect(r.infertileFrom).toBe('2026-01-17')
    expect(r.startRule).toBe('erster Zyklus')
    expect(r.infertileUntil).toBeNull()
  })
  it('zweiter Zyklus: Minus-8 verkürzt die 5-Tage-Regel nicht, wenn 1.hM ab ZT 13', () => {
    const r = res[1]
    expect(r.firstHigherZT).toBe(15)
    expect(r.startRule).toBe('5-Tage-Regel')
    expect(r.infertileUntil).toBe('2026-02-02')
    expect(dayStatus(res, '2026-02-01', '2026-02-26')).toBe('unfruchtbar')
    expect(dayStatus(res, '2026-02-03', '2026-02-26')).toBe('fruchtbar')
    expect(dayStatus(res, '2026-02-14', '2026-02-26')).toBe('ab-abend')
    expect(dayStatus(res, '2026-02-20', '2026-02-26')).toBe('unfruchtbar')
  })
  it('zweites S+ vor Abschluss verschiebt den Höhepunkt', () => {
    const m2 = [...M]
    m2[15] = 'S+' // ZT 16
    const c = cycleDays('2026-01-01', T, m2)
    const d = new Map(c.map((x) => [x.date, x]))
    const r = evaluateNfp(computeCycles(c, DEFAULT_SETTINGS), d, settings, [], '2026-01-28')[0]
    expect(r.peak).toBe('2026-01-16')
    expect(r.infertileFrom).toBe('2026-01-19')
  })
  it('mit hormoneller Verhütung keine Auswertung', () => {
    const r = evaluateNfp(cycles, days, settings, [{ name: 'Pille', start: '2026-01-01', end: '2026-01-20' }], '2026-02-26')
    expect(r[0].applicable).toBe(false)
  })
  it('Schleim f am Zyklusanfang beendet die unfruchtbare Zeit', () => {
    const c2b = c2.map((d, i) => (i === 3 ? { ...d, mucus: 'f' as MucusCode } : d))
    const a = [...c1, ...c2b]
    const r = evaluateNfp(computeCycles(a, DEFAULT_SETTINGS), new Map(a.map((d) => [d.date, d])), settings, [], '2026-02-26')[1]
    expect(r.earlySignDay).toBe('2026-02-01')
    expect(r.infertileUntil).toBe('2026-01-31')
  })
})
