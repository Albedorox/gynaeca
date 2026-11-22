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
export const EXERCISE_TIP =
  'Tipp der Gynäkologin: mindestens an 3 bis 5 Tagen pro Woche 30 Minuten moderate Bewegung, zum Beispiel Gehen. Das kann die Schmerzwahrnehmung senken.'

/* ---------- Selbstfürsorge bei Endometriose (Wissensbasis, Abschnitt Selbstfürsorge) ---------- */

export interface CareItem {
  label: string
  icon: string
}

/** Ab so vielen Minuten gilt ein Tag als ausreichend bewegt. */
export const MOVEMENT_GOAL_MIN = 30
/** Ziel: an so vielen Tagen pro Woche (von–bis) */
export const MOVEMENT_WEEK_GOAL: readonly [number, number] = [3, 5]
export const MOVEMENT_STEPS = [15, 30, 45, 60, 90]

export const MOVEMENT_TYPES: CareItem[] = [
  { label: 'Spazieren', icon: 'walk' },
  { label: 'Radfahren', icon: 'bike' },
  { label: 'Schwimmen', icon: 'swim' },
  { label: 'Ausdauersport', icon: 'run' },
  { label: 'Yoga', icon: 'yoga' },
  { label: 'Dehnen / Pilates', icon: 'stretch' },
  { label: 'Krafttraining', icon: 'dumbbell' },
  { label: 'Beckenboden-Übungen', icon: 'pelvis' },
  { label: 'Beckenboden-Physio', icon: 'pelvis' },
]

export const RELAX_TYPES: CareItem[] = [
  { label: 'Atemübung', icon: 'breath' },
  { label: 'Meditation', icon: 'lotus' },
  { label: 'Progressive Muskelentspannung', icon: 'muscle' },
  { label: 'Bodyscan', icon: 'bodyscan' },
  { label: 'Achtsamkeitsübung', icon: 'eye' },
  { label: 'Zeit in der Natur', icon: 'tree' },
  { label: 'Bewusste Pause', icon: 'cup' },
  { label: 'Ausreichend Schlaf', icon: 'moon' },
]

export const AID_TYPES: CareItem[] = [
  { label: 'Wärmepflaster', icon: 'patch' },
  { label: 'Wärmflasche', icon: 'hotwater' },
  { label: 'Körnerkissen', icon: 'pillow' },
  { label: 'Warmes Bad', icon: 'bath' },
  { label: 'TENS-Gerät', icon: 'tens' },
  { label: 'Massage', icon: 'hand' },
]

/** Mediterran orientierte, entzündungsarme Kost: diese Kategorien zählen als "günstig". */
export const FOOD_GOOD: CareItem[] = [
  { label: 'Gemüse', icon: 'leaf' },
  { label: 'Obst', icon: 'apple' },
  { label: 'Vollkorn', icon: 'wheat' },
  { label: 'Hülsenfrüchte', icon: 'bean' },
  { label: 'Fisch', icon: 'fish' },
  { label: 'Olivenöl', icon: 'olive' },
  { label: 'Nüsse & Samen', icon: 'nut' },
  { label: 'Kräutertee', icon: 'cup' },
]
/** Kategorien, die bei Endometriose eher gemieden werden sollten. */
export const FOOD_LESS: CareItem[] = [
  { label: 'Rotes Fleisch / Wurst', icon: 'meat' },
  { label: 'Zucker / Kuchen', icon: 'cake' },
  { label: 'Fertigessen / Fast Food', icon: 'pizza' },
  { label: 'Weißmehl', icon: 'bread' },
  { label: 'Milchprodukte', icon: 'milk' },
  { label: 'Kaffee', icon: 'coffee' },
  { label: 'Alkohol', icon: 'wine' },
  { label: 'Scharf gewürzt', icon: 'chili' },
]

export const SUPPLEMENTS: CareItem[] = [
  { label: 'Omega-3', icon: 'fish' },
  { label: 'Vitamin D3', icon: 'sun' },
  { label: 'Kurkuma', icon: 'root' },
  { label: 'Ingwer', icon: 'root' },
  { label: 'Bromelain / Ananas', icon: 'pineapple' },
  { label: 'Magnesium', icon: 'pill' },
]

export const FOOD_REACTIONS = ['Gut vertragen', 'Blähbauch', 'Bauchschmerzen', 'Übelkeit', 'Durchfall', 'Verstopfung']

export const MEAL_SLOTS: { id: 'morgens' | 'mittags' | 'abends' | 'zwischendurch'; label: string; placeholder: string }[] = [
  { id: 'morgens', label: 'Frühstück', placeholder: 'z. B. Haferflocken mit Beeren' },
  { id: 'mittags', label: 'Mittag', placeholder: 'z. B. Linsensalat, Vollkornbrot' },
  { id: 'abends', label: 'Abend', placeholder: 'z. B. Lachs mit Gemüse' },
  { id: 'zwischendurch', label: 'Zwischendurch', placeholder: 'z. B. Nüsse, Kuchen' },
]

/** Gläser à 250 ml, ab denen der Tag als ausreichend getrunken gilt (ca. 1,5 l). */
export const WATER_GOAL = 6

export const RELAX_TIP =
  'Entspannung senkt Stresshormone wie Cortisol. Weniger Stress kann das Schmerzempfinden lindern, schon wenige Minuten am Tag helfen.'
export const FOOD_TIP =
  'Empfohlen wird eine angepasste mediterrane Ernährung: viel frisches Obst und Gemüse, Vollkorn, Hülsenfrüchte, Fisch und Olivenöl, wenig rotes Fleisch, Zucker und Fertigprodukte. Omega-3, Vitamin D3, Kurkuma, Ingwer und Bromelain (Ananas) wirken entzündungshemmend. Das Tagebuch zeigt Ihnen, was Ihnen persönlich guttut.'
export const AID_TIP = 'Wärme entspannt die Muskulatur im Becken und lindert krampfartige Schmerzen. Erfassen Sie Hilfsmittel an jedem Tag, nicht nur während der Periode.'

export const SEX_OPTIONS: { id: 'geschuetzt' | 'ungeschuetzt' | 'kein'; label: string }[] = [
  { id: 'ungeschuetzt', label: 'Ungeschützt' },
  { id: 'geschuetzt', label: 'Mit Kondom' },
  { id: 'kein', label: 'Kein GV' },
]

export const NFP_DISCLAIMER =
  'Die Fruchtbarkeitsauswertung folgt den Regeln der natürlichen Familienplanung (symptothermale Methode). Sie ist keine sichere Verhütungsmethode und ersetzt keine ärztliche Beratung. Die Anwendung erfolgt in eigener Verantwortung. Kein Schutz vor sexuell übertragbaren Krankheiten. Bei strikter Anwendung aller Regeln liegt der Pearl-Index der Methode laut Studien bei 0,4; für diese App gibt es noch keine eigene Studie.'
