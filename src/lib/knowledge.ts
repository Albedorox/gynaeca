// Klinische Kriterien aus der Wissensbasis (docs/knowledge/README.md).
// Praxisbestätigt durch die beratende Gynäkologin, ergänzt um Leitlinien und Literatur.

export interface BleedingLevel {
  value: number
  label: string
  /** Kurzkriterium für die Nutzerin */
  criterion: string
}

/** Blutungsstufen 0–5. Gezählt werden volle Tampons pro Tag, Teilfüllungen anteilig. */
export const BLEEDING_LEVELS: BleedingLevel[] = [
  { value: 0, label: 'Keine', criterion: 'keine Blutung' },
  { value: 0.5, label: 'Schmierblutung', criterion: 'nur Slipeinlage nötig' },
  { value: 1, label: 'Sehr leicht', criterion: '1–2 volle Tampons am Tag' },
  { value: 2, label: 'Leicht', criterion: '2–3 volle Tampons am Tag' },
  { value: 3, label: 'Periodenstark', criterion: '3–4 volle Tampons am Tag (normal)' },
  { value: 4, label: 'Hypermenorrhoe', criterion: 'ab 5 volle Tampons oder kleine Koagel' },
  { value: 5, label: 'Sehr stark', criterion: 'z. B. jede halbe Stunde eine Vorlage oder große Koagel' },
]

export function bleedingLevel(v: number): BleedingLevel {
  // Zwischenstufen (1,5; 2,5 …) gehören zur unteren Stufe
  const exact = BLEEDING_LEVELS.find((l) => l.value === v)
  if (exact) return exact
  const lower = [...BLEEDING_LEVELS].reverse().find((l) => l.value <= v) ?? BLEEDING_LEVELS[0]
  return { ...lower, label: `${lower.label}+` }
}

export function painCategory(nrs: number): 'kein' | 'leicht' | 'mittel' | 'stark' {
  if (nrs <= 0) return 'kein'
  if (nrs <= 3) return 'leicht'
  if (nrs <= 6) return 'mittel'
  return 'stark'
}

/** Ab dieser Schmerzstärke fragt die App aktiv nach Medikamenten (WHO-Stufe 1). */
export const MED_PROMPT_FROM = 4

export type PainType = 'regel' | 'unterbauch' | 'gv' | 'stuhlgang' | 'wasserlassen' | 'mittel' | 'ruecken'

export const PAIN_TYPES: { id: PainType; label: string; hint: string }[] = [
  { id: 'regel', label: 'Regelschmerz', hint: 'vor oder während der Periode' },
  { id: 'unterbauch', label: 'Unterbauch außerhalb der Periode', hint: 'unabhängig von der Blutung' },
  { id: 'gv', label: 'Beim Geschlechtsverkehr', hint: 'vor allem tief' },
  { id: 'stuhlgang', label: 'Beim Stuhlgang', hint: '' },
  { id: 'wasserlassen', label: 'Beim Wasserlassen', hint: '' },
  { id: 'mittel', label: 'Mittelschmerz', hint: 'einseitig um den Eisprung' },
  { id: 'ruecken', label: 'Rücken', hint: 'Stelle unten auswählen' },
]

export type BackLocation = 'kreuz' | 'isg-l' | 'isg-r' | 'steiss' | 'bein-l' | 'bein-r'

export const BACK_LOCATIONS: { id: BackLocation; label: string }[] = [
  { id: 'kreuz', label: 'Unterer Rücken, mittig (Kreuz)' },
  { id: 'isg-l', label: 'Neben dem Kreuzbein links (über dem Po)' },
  { id: 'isg-r', label: 'Neben dem Kreuzbein rechts (über dem Po)' },
  { id: 'steiss', label: 'Ganz unten über der Po-Falte (Steißbein)' },
  { id: 'bein-l', label: 'Strahlt ins linke Bein / Leiste' },
  { id: 'bein-r', label: 'Strahlt ins rechte Bein / Leiste' },
]

export type PainCharacter = 'krampfartig' | 'brennend' | 'stechend' | 'dumpf' | 'dauerhaft'
export const PAIN_CHARACTERS: { id: PainCharacter; label: string }[] = [
  { id: 'krampfartig', label: 'krampfartig' },
  { id: 'brennend', label: 'brennend' },
  { id: 'stechend', label: 'stechend' },
  { id: 'dumpf', label: 'dumpf' },
  { id: 'dauerhaft', label: 'Dauerschmerz, unabhängig vom Zyklus' },
]

export const IMPAIRMENTS = ['Krankgeschrieben / Fehltag', 'Verabredung abgesagt', 'Bettruhe nötig', 'Alltag stark eingeschränkt']
export const SELFCARE = ['Bewegung ≥ 30 min', 'Ausdauersport', 'Yoga / Entspannung', 'Beckenboden-Übungen', 'Beckenboden-Physiotherapie']

export const EXERCISE_TIP =
  'Tipp der Gynäkologin: mindestens an 3 bis 5 Tagen pro Woche 30 Minuten moderate Bewegung, zum Beispiel Gehen. Das kann die Schmerzwahrnehmung senken.'

export const NFP_DISCLAIMER =
  'Die Fruchtbarkeitsauswertung folgt den Regeln der natürlichen Familienplanung (symptothermale Methode). Sie ist keine sichere Verhütungsmethode und ersetzt keine ärztliche Beratung. Die Anwendung erfolgt in eigener Verantwortung. Kein Schutz vor sexuell übertragbaren Krankheiten. Bei strikter Anwendung aller Regeln liegt der Pearl-Index der Methode laut Studien bei 0,4; für diese App gibt es noch keine eigene Studie.'
