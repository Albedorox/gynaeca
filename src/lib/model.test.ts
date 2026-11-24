import { describe, expect, it } from 'vitest'
import { emptyDay, isEmptyDay, normalizeDay, type DayEntry } from './model'

// Schutz für neue Felder: Wer DayEntry ein Feld hinzufügt und isEmptyDay vergisst,
// würde Tage mit nur diesem Feld beim Speichern löschen. Dieser Test fällt dann auf.
// Zusatzangaben, die allein nichts bedeuten (gehören zu temp bzw. mucus), zählen bewusst nicht.
const IGNORED = new Set(['date', 'updatedAt', 'tempDisturbed', 'mucusSource'])

function filled(v: unknown): unknown {
  if (typeof v === 'boolean') return true
  if (typeof v === 'number') return v + 1
  if (typeof v === 'string') return 'x'
  if (v === null) return 1
  if (Array.isArray(v)) return ['x']
  return { morgens: 'x' }
}

describe('isEmptyDay', () => {
  it('ein leerer Tag ist leer', () => {
    expect(isEmptyDay(emptyDay('2026-01-01'))).toBe(true)
  })

  for (const key of Object.keys(emptyDay('2026-01-01')).filter((k) => !IGNORED.has(k))) {
    it(`erkennt das Feld „${key}“`, () => {
      const d = emptyDay('2026-01-01') as unknown as Record<string, unknown>
      d[key] = filled(d[key])
      expect(isEmptyDay(d as unknown as DayEntry)).toBe(false)
    })
  }

  it('normalizeDay behält unbekannte Felder (neuere App-Version auf anderem Gerät)', () => {
    const d = normalizeDay({ date: '2026-01-01', zukunft: 1 } as Partial<DayEntry> & { date: string })
    expect((d as unknown as Record<string, unknown>).zukunft).toBe(1)
  })
})
