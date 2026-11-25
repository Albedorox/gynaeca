import { describe, expect, it } from 'vitest'
import { DAY_SECTIONS, hideSection, moveSection, resolveLayout, showSection } from './dayLayout'
import { DEFAULT_SETTINGS } from './model'

const all = { ...DEFAULT_SETTINGS.modules, endo: true, contraception: true, nfp: true }
const std = DAY_SECTIONS.map((s) => s.id)

describe('Tagesansicht-Layout', () => {
  it('ohne Einstellung gilt die Standardreihenfolge', () => {
    expect(resolveLayout(undefined, all).visible).toEqual(std)
    expect(resolveLayout({ order: [], hidden: [] }, all).hidden).toEqual([])
  })

  it('abgeschaltete Funktionen landen in „off“, nicht in sichtbar oder ausgeblendet', () => {
    const r = resolveLayout({ order: [], hidden: ['contra'] }, DEFAULT_SETTINGS.modules)
    expect(r.visible).not.toContain('contra')
    expect(r.hidden).toEqual([])
    expect(r.off).toContain('contra')
  })

  it('Verschieben ändert nur die sichtbare Reihenfolge', () => {
    const l = moveSection(undefined, all, std.indexOf('symptoms'), 0)
    expect(resolveLayout(l, all).visible.slice(0, 2)).toEqual(['symptoms', 'pain'])
  })

  it('Ausblenden verschiebt nach „Ausgeblendet“, Einblenden ans Ende der sichtbaren Liste', () => {
    let l = hideSection(undefined, 'pain')
    let r = resolveLayout(l, all)
    expect(r.visible).not.toContain('pain')
    expect(r.hidden).toEqual(['pain'])
    l = showSection(l, all, 'pain')
    r = resolveLayout(l, all)
    expect(r.hidden).toEqual([])
    expect(r.visible.at(-1)).toBe('pain')
  })

  it('unbekannte und doppelte Kennungen werden ignoriert, neue Abschnitte erscheinen am Ende', () => {
    const r = resolveLayout({ order: ['note', 'xyz', 'note', 'pain'], hidden: ['xyz'] }, all)
    expect(r.visible.slice(0, 2)).toEqual(['note', 'pain'])
    expect(r.visible).toHaveLength(std.length)
    expect(r.hidden).toEqual([])
  })
})
