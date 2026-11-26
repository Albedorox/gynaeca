import { describe, expect, it } from 'vitest'
import { addDays } from './dates'
import { computeCycles } from './cycles'
import { emptyDay, type ContraceptionCourse, type DayEntry } from './model'
import {
  BREAKTHROUGH,
  durationLabel,
  hormonePauses,
  isBreakthrough,
  monthEnd,
  monthStart,
  overlapping,
  periodLabel,
  PREP_CATALOG,
  prepStats,
  searchCatalog,
} from './preparations'

const S = { countSpotting: false, minGapDays: 7 }
const day = (date: string, p: Partial<DayEntry>): DayEntry => ({ ...emptyDay(date), ...p })
const course = (p: Partial<ContraceptionCourse>): ContraceptionCourse => ({ name: 'X', start: '2026-01-01', end: null, ...p })

/** Tage von start an, n Stück, mit Eigenschaften je Index */
function run(start: string, n: number, f: (i: number) => Partial<DayEntry>): DayEntry[] {
  return Array.from({ length: n }, (_, i) => day(addDays(start, i), { note: '.', ...f(i) }))
}

describe('durationLabel', () => {
  it('rechnet Jahre und Monate nach Kalender', () => {
    expect(durationLabel('2010-03-01', '2012-08-31')).toBe('2 J 6 M')
    expect(durationLabel('2024-04-02', '2025-02-28')).toBe('10 M')
    expect(durationLabel('2024-04-01', '2025-03-31')).toBe('1 J')
    expect(durationLabel('2026-01-01', '2026-01-21')).toBe('3 W')
    expect(durationLabel('2026-01-01', '2026-01-05')).toBe('5 T')
  })
})

describe('periodLabel', () => {
  it('zeigt Nachträge als ungefähre Monate', () => {
    expect(periodLabel({ start: '2010-03-01', end: '2012-08-31', approx: true }, '2026-11-26')).toBe('ca. 03/2010 – 08/2012')
  })
  it('laufende Zeiträume enden heute', () => {
    expect(periodLabel({ start: '2025-06-02', end: null }, '2026-11-26')).toBe('06/2025 – heute')
    expect(periodLabel({ start: '2025-06-02', end: null }, '2026-11-26', true)).toBe('seit 02.06.2025')
  })
  it('Monat in ersten und letzten Tag umwandeln', () => {
    expect(monthStart('2024-02')).toBe('2024-02-01')
    expect(monthEnd('2024-02')).toBe('2024-02-29')
  })
})

describe('searchCatalog', () => {
  it('findet nach Namensanfang zuerst, dann nach Wirkstoff', () => {
    expect(searchCatalog('ya').map((c) => c.name)).toEqual(['Yasmin', 'Yasminelle', 'Yaz', 'Sayana'])
    const d = searchCatalog('drospi').map((c) => c.name)
    expect(d).toContain('Slinda')
    expect(d).toContain('Yaz')
    expect(searchCatalog('  ')).toEqual([])
  })
  it('jeder Eintrag hat Wirkstoff und Schema', () => {
    for (const c of PREP_CATALOG) {
      expect(c.substance.length).toBeGreaterThan(3)
      expect(c.schedule.length).toBeGreaterThan(1)
    }
    expect(new Set(PREP_CATALOG.map((c) => c.name.toLowerCase())).size).toBe(PREP_CATALOG.length)
  })
})

describe('overlapping', () => {
  const list = [course({ id: 1, start: '2020-01-01', end: '2020-12-31' }), course({ id: 2, start: '2022-01-01', end: null }), course({ id: 3, kind: 'gyn', start: '2019-01-01', end: null })]
  it('meldet nur hormonelle Überschneidungen', () => {
    expect(overlapping(list, '2021-01-01', '2021-06-30')).toBeUndefined()
    expect(overlapping(list, '2020-12-01', '2021-02-01')?.id).toBe(1)
    expect(overlapping(list, '2030-01-01', null)?.id).toBe(2)
    expect(overlapping(list, '2020-06-01', '2020-07-01', 1)).toBeUndefined()
  })
})

describe('hormonePauses', () => {
  it('findet Lücken ab 30 Tagen und die Zeit seit dem letzten Präparat', () => {
    const list = [
      course({ start: '2012-09-03', end: '2016-05-29' }),
      course({ start: '2017-10-02', end: '2019-03-18' }),
      course({ start: '2019-03-25', end: '2024-03-14' }),
      course({ kind: 'gyn', start: '2024-04-02', end: null }),
    ]
    expect(hormonePauses(list, '2026-11-26')).toEqual([
      { start: '2016-05-30', end: '2017-10-01' },
      { start: '2024-03-15', end: null },
    ])
  })
  it('keine Pause, solange ein Präparat läuft', () => {
    expect(hormonePauses([course({ start: '2025-01-01', end: null })], '2026-11-26')).toEqual([])
  })
})

describe('prepStats', () => {
  // 60 Tage ohne Präparat (Kopfschmerz an jedem 10. Tag), dann 60 Tage mit Präparat
  // (Kopfschmerz an jedem 4. Tag, Libido vermindert an jedem 6.)
  const before = run('2026-01-01', 60, (i) => ({ symptoms: i % 10 === 0 ? ['Kopfschmerzen'] : [], bleeding: i < 4 ? 3 : 0 }))
  const during = run('2026-03-02', 60, (i) => ({
    symptoms: [...(i % 4 === 0 ? ['Kopfschmerzen'] : []), ...(i % 6 === 0 ? ['Libido vermindert'] : [])],
    // Periode am Anfang, dazu sechs einzelne Schmierblutungen mitten im Zyklus
    bleeding: i < 4 ? 3 : 0,
    spotting: i >= 10 && i < 40 && i % 5 === 0,
    pain: i < 2 ? 6 : null,
  }))
  const days = [...before, ...during]
  const cycles = computeCycles(days, S)
  const c = course({ id: 1, start: '2026-03-02', end: '2026-04-30' })

  it('vergleicht mit Zeiten ohne Präparat', () => {
    const st = prepStats(c, days, cycles, [c], '2026-11-26')!
    expect(st.trackedDays).toBe(60)
    expect(st.baseDays).toBe(60)
    const head = st.symptoms.find((s) => s.name === 'Kopfschmerzen')!
    expect(head).toMatchObject({ days: 15, pct: 25, basePct: 10, notable: true })
    const lib = st.symptoms.find((s) => s.name === 'Libido vermindert')!
    expect(lib).toMatchObject({ days: 10, pct: 17, basePct: 0, notable: true })
    expect(st.avgPain).toBe(6)
  })

  it('erkennt Zwischenblutungen außerhalb der Periode', () => {
    const st = prepStats(c, days, cycles, [c], '2026-11-26')!
    const bt = st.symptoms.find((s) => s.name === BREAKTHROUGH)!
    expect(bt.days).toBe(6)
    expect(bt.notable).toBe(true)
    expect(isBreakthrough(during[0], cycles)).toBe(false)
    expect(isBreakthrough(during[10], cycles)).toBe(true)
  })

  it('ohne Vergleichszeit zählt nur, was häufig ist', () => {
    const st = prepStats(c, during, computeCycles(during, S), [c], '2026-11-26')!
    expect(st.baseDays).toBe(0)
    expect(st.symptoms.find((s) => s.name === 'Kopfschmerzen')).toMatchObject({ basePct: null, notable: true })
  })

  it('keine Auswertung bei Nachträgen oder zu wenigen Tagen', () => {
    expect(prepStats({ ...c, approx: true }, days, cycles, [c], '2026-11-26')).toBeNull()
    const short = course({ start: '2026-04-25', end: '2026-04-30' })
    expect(prepStats(short, days, cycles, [short], '2026-11-26')).toBeNull()
  })

  it('Dauermedikament: Vergleich mit Tagen ohne dieses Mittel', () => {
    const g = course({ id: 9, kind: 'gyn', name: 'Agnucaston', start: '2026-03-02', end: '2026-04-30' })
    const st = prepStats(g, days, cycles, [g], '2026-11-26')!
    expect(st.baseDays).toBe(60)
  })
})
