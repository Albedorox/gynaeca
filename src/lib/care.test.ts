import { describe, expect, it } from 'vitest'
import { careSummary, movementWeek, painCompare, unhealthyDay } from './care'
import { emptyDay, isEmptyDay, normalizeDay, type DayEntry } from './model'
import { addDays } from './dates'

function day(date: string, p: Partial<DayEntry>): DayEntry {
  return { ...emptyDay(date), ...p, updatedAt: 1 }
}

describe('Selbstfürsorge', () => {
  it('übernimmt alte selfcare-Werte in die neuen Felder', () => {
    const d = normalizeDay({ ...emptyDay('2026-01-05'), selfcare: ['Bewegung ≥ 30 min', 'Yoga / Entspannung', 'Beckenboden-Physiotherapie'] })
    expect(d.movementMin).toBe(30)
    expect(d.movement).toEqual(['Yoga', 'Beckenboden-Physio'])
    expect(d.selfcare).toEqual([])
  })

  it('zählt neue Felder für leere Tage mit', () => {
    expect(isEmptyDay(emptyDay('2026-01-01'))).toBe(true)
    expect(isEmptyDay({ ...emptyDay('2026-01-01'), aids: ['Wärmflasche'] })).toBe(false)
    expect(isEmptyDay({ ...emptyDay('2026-01-01'), meals: { morgens: '  ' } })).toBe(true)
    expect(isEmptyDay({ ...emptyDay('2026-01-01'), cheatDay: true })).toBe(false)
    expect(isEmptyDay({ ...emptyDay('2026-01-01'), sex: 'ungeschuetzt' })).toBe(false)
  })

  it('zeigt die Bewegungswoche ab Montag', () => {
    // 2026-01-07 ist ein Mittwoch
    const m = new Map([['2026-01-06', day('2026-01-06', { movementMin: 45 })], ['2026-01-07', day('2026-01-07', { movementMin: 15 })]])
    const w = movementWeek(m, '2026-01-07')
    expect(w[0].date).toBe('2026-01-05')
    expect(w.map((x) => x.ok)).toEqual([false, true, false, false, false, false, false])
    expect(w[2].some).toBe(true)
  })

  it('vergleicht Schmerz mit Cheat Day am Vortag', () => {
    const list: DayEntry[] = []
    const start = '2026-02-01'
    for (let i = 0; i < 10; i++) list.push(day(addDays(start, i), { pain: 2, cheatDay: i === 3 }))
    list[4].pain = 7 // Tag nach dem Cheat Day
    const m = new Map(list.map((d) => [d.date, d]))
    const c = painCompare(m, start, addDays(start, 9), (d) => !!d?.cheatDay, 1)
    expect(c.withN).toBe(2)
    expect(c.withAvg).toBe(4.5)
    expect(c.withoutAvg).toBe(2)
  })

  it('erkennt ungünstige Ernährungstage und fasst zusammen', () => {
    expect(unhealthyDay(day('2026-01-01', { food: ['Alkohol', 'Zucker / Kuchen'] }))).toBe(true)
    expect(unhealthyDay(day('2026-01-01', { food: ['Alkohol', 'Gemüse'] }))).toBe(false)
    const s = careSummary(
      [day('2026-01-01', { movementMin: 30, aids: ['Wärmflasche'] }), day('2026-01-02', { movementMin: 60, aids: ['Wärmflasche', 'Wärmepflaster'], stress: 4 })],
      '2026-01-01',
      '2026-01-07',
    )
    expect(s.moveDays).toBe(2)
    expect(s.movePerWeek).toBe(2)
    expect(s.aids[0]).toEqual(['Wärmflasche', 2])
    expect(s.avgStress).toBe(4)
  })
})
