import { describe, expect, it } from 'vitest'
import { merge3 } from './merge'

describe('merge3', () => {
  it('nur eine Seite geändert', () => {
    expect(merge3({ a: 1, b: 1 }, { a: 2, b: 1 }, { a: 1, b: 3 }, true)).toEqual({ a: 2, b: 3 })
  })
  it('Listen: Hinzufügen und Entfernen beider Seiten', () => {
    expect(merge3({ s: ['x', 'y'] }, { s: ['x', 'y', 'l'] }, { s: ['y', 'r'] }, true)).toEqual({ s: ['y', 'l', 'r'] })
  })
  it('Medikamente je Name, bei Abweichung die neuere Seite', () => {
    const base = { meds: [{ name: 'Ibuprofen', doseMg: 400, count: 1 }] }
    const local = { meds: [{ name: 'Ibuprofen', doseMg: 400, count: 2 }] }
    const remote = { meds: [{ name: 'Ibuprofen', doseMg: 400, count: 1 }, { name: 'Buscopan', doseMg: 10, count: 1 }] }
    expect(merge3(base, local, remote, false)).toEqual({ meds: [{ name: 'Ibuprofen', doseMg: 400, count: 2 }, { name: 'Buscopan', doseMg: 10, count: 1 }] })
  })
  it('Einzelwert beidseitig geändert: localWins entscheidet', () => {
    expect(merge3({ p: 1 }, { p: 2 }, { p: 3 }, true)).toEqual({ p: 2 })
    expect(merge3({ p: 1 }, { p: 2 }, { p: 3 }, false)).toEqual({ p: 3 })
  })
  it('Objekte rekursiv', () => {
    expect(merge3({ m: { a: 'x' } }, { m: { a: 'x', b: 'l' } }, { m: { a: 'y' } }, true)).toEqual({ m: { a: 'y', b: 'l' } })
  })
})
