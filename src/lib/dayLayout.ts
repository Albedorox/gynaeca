// Reihenfolge und Sichtbarkeit der Abschnitte in der Tagesansicht.
// „Mein Zyklus“ steht immer oben und ist hier nicht enthalten.
import type { DayLayout, Settings } from './model'

type Modules = Settings['modules']

export interface DaySectionDef {
  id: string
  title: string
  icon: string
  /** Ist die zugehörige Funktion in den Einstellungen eingeschaltet? */
  available: (m: Modules) => boolean
}

/** Standardreihenfolge (so wie die Tagesansicht vor dem Anpassen aussah) */
export const DAY_SECTIONS: DaySectionDef[] = [
  { id: 'pain', title: 'Schmerz', icon: 'bolt', available: (m) => m.pain },
  { id: 'meds', title: 'Schmerzmittel', icon: 'pill', available: (m) => m.pain },
  { id: 'gyn', title: 'Regelmäßige Medikamente', icon: 'pill', available: (m) => m.gynMeds },
  { id: 'symptoms', title: 'Symptome', icon: 'sparkle', available: (m) => m.symptoms },
  { id: 'mood', title: 'Stimmung', icon: 'happy', available: (m) => m.symptoms },
  { id: 'movement', title: 'Bewegung', icon: 'walk', available: (m) => m.endo },
  { id: 'relax', title: 'Entspannung & Achtsamkeit', icon: 'lotus', available: (m) => m.endo },
  { id: 'aids', title: 'Hilfsmittel', icon: 'hotwater', available: (m) => m.endo },
  { id: 'food', title: 'Ernährung', icon: 'apple', available: (m) => m.endo },
  { id: 'contra', title: 'Verhütung', icon: 'pill', available: (m) => m.contraception },
  { id: 'nfp', title: 'Fruchtbarkeit', icon: 'thermo', available: (m) => m.nfp },
  { id: 'sex', title: 'Geschlechtsverkehr', icon: 'heart', available: (m) => m.sex },
  { id: 'note', title: 'Notiz', icon: 'note', available: () => true },
]

export const SECTION_BY_ID: Record<string, DaySectionDef> = Object.fromEntries(DAY_SECTIONS.map((s) => [s.id, s]))
const DEFAULT_ORDER = DAY_SECTIONS.map((s) => s.id)

export interface ResolvedLayout {
  /** Sichtbar, in dieser Reihenfolge */
  visible: string[]
  /** Ausgeblendet (Funktion an, aber nicht in der Tagesansicht) */
  hidden: string[]
  /** Funktion in den Einstellungen aus */
  off: string[]
}

/** Gespeicherte Reihenfolge bereinigen: Unbekanntes und Doppeltes weg, neue Abschnitte ans Ende. */
export function fullOrder(layout: DayLayout | undefined): string[] {
  const out: string[] = []
  for (const id of layout?.order ?? []) if (SECTION_BY_ID[id] && !out.includes(id)) out.push(id)
  for (const id of DEFAULT_ORDER) if (!out.includes(id)) out.push(id)
  return out
}

export function resolveLayout(layout: DayLayout | undefined, modules: Modules): ResolvedLayout {
  const order = fullOrder(layout)
  const hiddenSet = new Set(layout?.hidden ?? [])
  const off = order.filter((id) => !SECTION_BY_ID[id].available(modules))
  const on = order.filter((id) => SECTION_BY_ID[id].available(modules))
  return {
    visible: on.filter((id) => !hiddenSet.has(id)),
    // in der Reihenfolge, in der sie ausgeblendet wurden
    hidden: (layout?.hidden ?? []).filter((id, i, a) => SECTION_BY_ID[id] && a.indexOf(id) === i && on.includes(id)),
    off,
  }
}

/** Sichtbaren Abschnitt von Position `from` nach `to` verschieben (Positionen in `visible`). */
export function moveSection(layout: DayLayout | undefined, modules: Modules, from: number, to: number): DayLayout {
  const { visible } = resolveLayout(layout, modules)
  if (from === to || from < 0 || from >= visible.length) return { order: fullOrder(layout), hidden: [...(layout?.hidden ?? [])] }
  const next = visible.slice()
  const [id] = next.splice(from, 1)
  next.splice(Math.max(0, Math.min(next.length, to)), 0, id)
  const rest = fullOrder(layout).filter((x) => !next.includes(x))
  return { order: [...next, ...rest], hidden: [...(layout?.hidden ?? [])] }
}

/** Ausblenden: Abschnitt wandert in die Gruppe „Ausgeblendet“. */
export function hideSection(layout: DayLayout | undefined, id: string): DayLayout {
  const hidden = (layout?.hidden ?? []).filter((x) => x !== id)
  return { order: fullOrder(layout), hidden: [...hidden, id] }
}

/** Einblenden: Abschnitt kommt ans Ende der sichtbaren Liste. */
export function showSection(layout: DayLayout | undefined, modules: Modules, id: string): DayLayout {
  const { visible } = resolveLayout(layout, modules)
  const hidden = (layout?.hidden ?? []).filter((x) => x !== id)
  const vis = visible.filter((x) => x !== id)
  const rest = fullOrder(layout).filter((x) => x !== id && !vis.includes(x))
  return { order: [...vis, id, ...rest], hidden }
}

export const DEFAULT_LAYOUT: DayLayout = { order: [], hidden: [] }
