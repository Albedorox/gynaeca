// Präparate-Verlauf: hormonelle Verhütung und Dauermedikation über die ganze Nutzungszeit.
// Grundlage sind die Einnahmezeiträume (ContraceptionCourse). Die Verträglichkeit wird aus den
// ohnehin erfassten Tagen abgeleitet: Wie oft kam ein Symptom während der Einnahme vor,
// verglichen mit Zeiten ohne hormonelles Präparat?

import { addDays, daysInMonth, diffDays, formatDE, pad, parseISO, toISO, type ISODate } from './dates'
import type { Cycle } from './cycles'
import type { ContraceptionCourse, DayEntry, PrepForm, PrepRating } from './model'

// ---------------------------------------------------------------------------
// Formen, Schemata, Gründe
// ---------------------------------------------------------------------------

export const PREP_FORMS: { id: PrepForm; label: string; short: string; icon: string }[] = [
  { id: 'pille', label: 'Pille', short: 'Pille', icon: 'pill' },
  { id: 'minipille', label: 'Mini­pille', short: 'Minipille', icon: 'minipill' },
  { id: 'ring', label: 'Vaginal­ring', short: 'Vaginalring', icon: 'vring' },
  { id: 'pflaster', label: 'Hormon­pflaster', short: 'Hormonpflaster', icon: 'patch' },
  { id: 'spirale', label: 'Hormon­spirale', short: 'Hormonspirale', icon: 'ius' },
  { id: 'staebchen', label: 'Hormon­stäbchen', short: 'Hormonstäbchen', icon: 'implant' },
  { id: 'spritze', label: 'Drei­monats­spritze', short: 'Dreimonatsspritze', icon: 'shot' },
  { id: 'dauer', label: 'Dauer­medikament', short: 'Dauermedikament', icon: 'sprout' },
]

export function formLabel(f: PrepForm | undefined): string {
  return PREP_FORMS.find((x) => x.id === f)?.short ?? 'Hormonelle Verhütung'
}

/** Form eines Zeitraums. Ältere Einträge haben keine Form: Dauermedikamente erkennt man an kind. */
export function formOf(c: ContraceptionCourse): PrepForm | undefined {
  return c.kind === 'gyn' ? 'dauer' : c.form
}

/** Passende Einnahmeschemata je Form */
export function schedulesFor(f: PrepForm | undefined): string[] {
  switch (f) {
    case 'spirale':
      return ['Liegedauer 3 Jahre', 'Liegedauer 5 Jahre', 'Liegedauer bis 8 Jahre']
    case 'staebchen':
      return ['Liegedauer 3 Jahre']
    case 'spritze':
      return ['alle 12 Wochen', 'alle 13 Wochen']
    case 'ring':
    case 'pflaster':
      return ['3 Wochen + 1 Woche Pause', 'Langzyklus', 'durchgehend']
    case 'dauer':
      return ['1× täglich', '2× täglich', 'durchgehend', 'zyklusabhängig']
    case 'minipille':
      return ['durchgehend', '24+4']
    default:
      return ['21+7', '24+4', 'Langzyklus', 'durchgehend']
  }
}

export const RATINGS: { id: PrepRating; label: string; long: string }[] = [
  { id: 'gut', label: 'gut', long: 'gut vertragen' },
  { id: 'mittel', label: 'mittel', long: 'mittelmäßig vertragen' },
  { id: 'schlecht', label: 'schlecht', long: 'schlecht vertragen' },
]

export const STOP_REASONS = [
  'Zwischenblutungen',
  'Stimmungsschwankungen',
  'Libido vermindert',
  'Gewichtszunahme',
  'Hautprobleme',
  'Kopfschmerzen',
  'Thromboserisiko',
  'Kinderwunsch',
  'Pause gewünscht',
  'Ärztlicher Rat',
  'Liegedauer abgelaufen',
  'Wirkung erreicht',
]

// ---------------------------------------------------------------------------
// Präparateliste
// ---------------------------------------------------------------------------

export interface CatalogEntry {
  name: string
  form: PrepForm
  substance: string
  dose: string
  schedule: string
}

/**
 * Gängige Präparate in Deutschland mit Wirkstoff und Dosierung je Tablette bzw. Freisetzung.
 * Nur als Vorschlag beim Eintippen; die Nutzerin kann alles ändern. Angaben laut Fachinformation,
 * Stand 11/2026. Bei Änderungen bitte die Packungsbeilage gegenprüfen.
 */
export const PREP_CATALOG: CatalogEntry[] = [
  // Kombinationspillen
  { name: 'Maxim', form: 'pille', substance: 'Dienogest, Ethinylestradiol', dose: '2 mg / 0,03 mg', schedule: '21+7' },
  { name: 'Valette', form: 'pille', substance: 'Dienogest, Ethinylestradiol', dose: '2 mg / 0,03 mg', schedule: '21+7' },
  { name: 'Leios', form: 'pille', substance: 'Levonorgestrel, Ethinylestradiol', dose: '0,1 mg / 0,02 mg', schedule: '21+7' },
  { name: 'Miranova', form: 'pille', substance: 'Levonorgestrel, Ethinylestradiol', dose: '0,1 mg / 0,02 mg', schedule: '21+7' },
  { name: 'Microgynon', form: 'pille', substance: 'Levonorgestrel, Ethinylestradiol', dose: '0,15 mg / 0,03 mg', schedule: '21+7' },
  { name: 'Minisiston', form: 'pille', substance: 'Levonorgestrel, Ethinylestradiol', dose: '0,125 mg / 0,03 mg', schedule: '21+7' },
  { name: 'Yasmin', form: 'pille', substance: 'Drospirenon, Ethinylestradiol', dose: '3 mg / 0,03 mg', schedule: '21+7' },
  { name: 'Yasminelle', form: 'pille', substance: 'Drospirenon, Ethinylestradiol', dose: '3 mg / 0,02 mg', schedule: '21+7' },
  { name: 'Yaz', form: 'pille', substance: 'Drospirenon, Ethinylestradiol', dose: '3 mg / 0,02 mg', schedule: '24+4' },
  { name: 'Belara', form: 'pille', substance: 'Chlormadinonacetat, Ethinylestradiol', dose: '2 mg / 0,03 mg', schedule: '21+7' },
  { name: 'Chariva', form: 'pille', substance: 'Chlormadinonacetat, Ethinylestradiol', dose: '2 mg / 0,03 mg', schedule: '21+7' },
  { name: 'Lamuna 20', form: 'pille', substance: 'Desogestrel, Ethinylestradiol', dose: '0,15 mg / 0,02 mg', schedule: '21+7' },
  { name: 'Lamuna 30', form: 'pille', substance: 'Desogestrel, Ethinylestradiol', dose: '0,15 mg / 0,03 mg', schedule: '21+7' },
  { name: 'Lovelle', form: 'pille', substance: 'Desogestrel, Ethinylestradiol', dose: '0,15 mg / 0,02 mg', schedule: '21+7' },
  { name: 'Marvelon', form: 'pille', substance: 'Desogestrel, Ethinylestradiol', dose: '0,15 mg / 0,03 mg', schedule: '21+7' },
  { name: 'Zoely', form: 'pille', substance: 'Nomegestrolacetat, Estradiol', dose: '2,5 mg / 1,5 mg', schedule: '24+4' },
  { name: 'Qlaira', form: 'pille', substance: 'Estradiolvalerat, Dienogest', dose: 'mehrphasig', schedule: '26+2' },
  // Gestagen-Monopräparate (Minipille)
  { name: 'Cerazette', form: 'minipille', substance: 'Desogestrel', dose: '0,075 mg', schedule: 'durchgehend' },
  { name: 'Jubrele', form: 'minipille', substance: 'Desogestrel', dose: '0,075 mg', schedule: 'durchgehend' },
  { name: 'Slinda', form: 'minipille', substance: 'Drospirenon', dose: '4 mg', schedule: '24+4' },
  { name: '28 mini', form: 'minipille', substance: 'Levonorgestrel', dose: '0,03 mg', schedule: 'durchgehend' },
  // Ring, Pflaster
  { name: 'NuvaRing', form: 'ring', substance: 'Etonogestrel, Ethinylestradiol', dose: '0,12 mg / 0,015 mg pro Tag', schedule: '3 Wochen + 1 Woche Pause' },
  { name: 'Circlet', form: 'ring', substance: 'Etonogestrel, Ethinylestradiol', dose: '0,12 mg / 0,015 mg pro Tag', schedule: '3 Wochen + 1 Woche Pause' },
  { name: 'Evra', form: 'pflaster', substance: 'Norelgestromin, Ethinylestradiol', dose: '203 µg / 33,9 µg pro Tag', schedule: '3 Wochen + 1 Woche Pause' },
  // Hormonspiralen, Stäbchen, Spritze
  { name: 'Mirena', form: 'spirale', substance: 'Levonorgestrel', dose: '52 mg', schedule: 'Liegedauer bis 8 Jahre' },
  { name: 'Kyleena', form: 'spirale', substance: 'Levonorgestrel', dose: '19,5 mg', schedule: 'Liegedauer 5 Jahre' },
  { name: 'Jaydess', form: 'spirale', substance: 'Levonorgestrel', dose: '13,5 mg', schedule: 'Liegedauer 3 Jahre' },
  { name: 'Implanon NXT', form: 'staebchen', substance: 'Etonogestrel', dose: '68 mg', schedule: 'Liegedauer 3 Jahre' },
  { name: 'Depo-Clinovir', form: 'spritze', substance: 'Medroxyprogesteronacetat', dose: '150 mg', schedule: 'alle 12 Wochen' },
  { name: 'Sayana', form: 'spritze', substance: 'Medroxyprogesteronacetat', dose: '104 mg', schedule: 'alle 13 Wochen' },
  // Dauermedikamente
  { name: 'Visanne', form: 'dauer', substance: 'Dienogest', dose: '2 mg', schedule: 'durchgehend' },
  { name: 'Agnucaston', form: 'dauer', substance: 'Mönchspfeffer-Trockenextrakt', dose: '4 mg', schedule: '1× täglich' },
  { name: 'Utrogest', form: 'dauer', substance: 'Progesteron', dose: '', schedule: 'zyklusabhängig' },
]

/** Vorschläge beim Eintippen: Name beginnt mit dem Text, sonst Wirkstoff enthält ihn. */
export function searchCatalog(q: string, catalog: CatalogEntry[] = PREP_CATALOG): CatalogEntry[] {
  const s = q.trim().toLowerCase()
  if (!s) return []
  const byName = catalog.filter((c) => c.name.toLowerCase().startsWith(s))
  const bySubst = catalog.filter((c) => !byName.includes(c) && (c.name.toLowerCase().includes(s) || c.substance.toLowerCase().includes(s)))
  return [...byName, ...bySubst]
}

export function catalogEntry(name: string): CatalogEntry | undefined {
  const s = name.trim().toLowerCase()
  return PREP_CATALOG.find((c) => c.name.toLowerCase() === s)
}

// ---------------------------------------------------------------------------
// Zeiträume, Dauer, Anzeige
// ---------------------------------------------------------------------------

export function isHormonal(c: ContraceptionCourse): boolean {
  return c.kind !== 'gyn'
}

/** Letzter Tag, der in Auswertungen zählt (laufende Zeiträume enden heute). */
export function effectiveEnd(c: Pick<ContraceptionCourse, 'end'>, today: ISODate): ISODate {
  return c.end === null || c.end > today ? today : c.end
}

/** Dauer als "2 J 6 M", "11 M", "3 W" oder "5 T" (Kalender, inklusive Endtag). */
export function durationLabel(start: ISODate, endIncl: ISODate): string {
  const days = diffDays(start, endIncl) + 1
  if (days < 14) return `${Math.max(days, 1)} T`
  const a = parseISO(start)
  const b = parseISO(addDays(endIncl, 1))
  let months = (b.y - a.y) * 12 + (b.m0 - a.m0)
  if (b.d < a.d) months--
  if (months < 1) return `${Math.round(days / 7)} W`
  const y = Math.floor(months / 12)
  const m = months % 12
  return y ? (m ? `${y} J ${m} M` : `${y} J`) : `${m} M`
}

export function monthYear(iso: ISODate): string {
  const { y, m0 } = parseISO(iso)
  return `${pad(m0 + 1)}/${y}`
}

/** Zeitraum für Karten und Bericht: Monatsangabe bei Nachträgen oder langen Zeiträumen. */
export function periodLabel(c: Pick<ContraceptionCourse, 'start' | 'end' | 'approx'>, today: ISODate, exact = false): string {
  const f = (iso: ISODate) => (exact && !c.approx ? formatDE(iso) : monthYear(iso))
  const from = `${c.approx ? 'ca. ' : ''}${f(c.start)}`
  if (c.end === null || c.end > today) return exact && !c.approx ? `seit ${formatDE(c.start)}` : `${from} – heute`
  return `${from} – ${f(c.end)}`
}

/** Monat "YYYY-MM" in Start- bzw. Endtag umwandeln */
export function monthStart(ym: string): ISODate {
  const [y, m] = ym.split('-').map(Number)
  return toISO(y, m - 1, 1)
}
export function monthEnd(ym: string): ISODate {
  const [y, m] = ym.split('-').map(Number)
  return toISO(y, m - 1, daysInMonth(y, m - 1))
}

/** Überschneidet sich ein hormoneller Zeitraum mit einem anderen? (nur einer zur selben Zeit) */
export function overlapping(courses: ContraceptionCourse[], start: ISODate, end: ISODate | null, exceptId?: number): ContraceptionCourse | undefined {
  const far = '9999-12-31'
  return courses.find((c) => isHormonal(c) && c.id !== exceptId && c.start <= (end ?? far) && start <= (c.end ?? far))
}

export interface Pause {
  start: ISODate
  /** null = bis heute */
  end: ISODate | null
}

/** Lücken ohne hormonelle Verhütung ab dem ersten Präparat, mindestens 30 Tage. */
export function hormonePauses(courses: ContraceptionCourse[], today: ISODate, minDays = 30): Pause[] {
  const h = courses.filter(isHormonal).sort((a, b) => (a.start < b.start ? -1 : 1))
  const out: Pause[] = []
  let covered: ISODate | null = null
  for (const c of h) {
    if (covered !== null && diffDays(covered, c.start) - 1 >= minDays) out.push({ start: addDays(covered, 1), end: addDays(c.start, -1) })
    const e = effectiveEnd(c, today)
    if (covered === null || e > covered) covered = e
  }
  if (covered !== null && covered < today && diffDays(covered, today) >= minDays) out.push({ start: addDays(covered, 1), end: null })
  return out
}

// ---------------------------------------------------------------------------
// Auswertung: Verträglichkeit aus den erfassten Tagen
// ---------------------------------------------------------------------------

export const BREAKTHROUGH = 'Zwischenblutung'

export interface SymptomRate {
  name: string
  /** Tage mit dem Symptom während der Einnahme */
  days: number
  /** Anteil in Prozent während der Einnahme */
  pct: number
  /** Anteil in Prozent in Zeiten ohne Präparat; null = keine Vergleichszeit */
  basePct: number | null
  /** Deutlich häufiger als ohne Präparat (oder ohne Vergleich: häufig) */
  notable: boolean
}

export interface PrepStats {
  /** Erfasste Tage während der Einnahme */
  trackedDays: number
  /** Erfasste Tage in der Vergleichszeit */
  baseDays: number
  symptoms: SymptomRate[]
  avgBleed: number | null
  avgCycle: number | null
  avgPain: number | null
}

/** Mindestmenge, damit eine Auswertung etwas aussagt */
export const MIN_TRACKED = 14
const MIN_DAYS = 5
const RATIO = 1.5
/** Ohne Vergleichszeit: ab diesem Anteil gilt ein Symptom als auffällig */
const NO_BASE_PCT = 10

/** Blutung oder Schmierblutung außerhalb der erkannten Periode */
export function isBreakthrough(d: DayEntry, cycles: Cycle[]): boolean {
  if (d.bleeding <= 0 && !d.spotting) return false
  return !cycles.some((c) => d.date >= c.start && d.date <= c.periodEnd)
}

function inRange(iso: ISODate, start: ISODate, end: ISODate): boolean {
  return iso >= start && iso <= end
}

const round1 = (n: number) => Math.round(n * 10) / 10

/**
 * Wertet einen Einnahmezeitraum aus. Vergleich: bei hormoneller Verhütung alle erfassten Tage ohne
 * hormonelles Präparat; bei Dauermedikamenten alle erfassten Tage ohne dieses Mittel.
 * Nachgetragene Zeiträume (nur Monat/Jahr) und zu wenige erfasste Tage ergeben null.
 */
export function prepStats(course: ContraceptionCourse, dayList: DayEntry[], cycles: Cycle[], courses: ContraceptionCourse[], today: ISODate): PrepStats | null {
  if (course.approx) return null
  const end = effectiveEnd(course, today)
  if (course.start > end) return null
  const during = dayList.filter((d) => inRange(d.date, course.start, end))
  if (during.length < MIN_TRACKED) return null

  const hormonal = courses.filter(isHormonal)
  const base = dayList.filter((d) => {
    if (d.date > today) return false
    if (isHormonal(course)) return !hormonal.some((c) => inRange(d.date, c.start, effectiveEnd(c, today)))
    return !inRange(d.date, course.start, end) && !courses.some((c) => c !== course && c.kind === 'gyn' && c.name === course.name && inRange(d.date, c.start, effectiveEnd(c, today)))
  })
  const hasBase = base.length >= MIN_TRACKED

  const count = (list: DayEntry[], name: string) =>
    list.filter((d) => (name === BREAKTHROUGH ? isBreakthrough(d, cycles) : d.symptoms.includes(name))).length

  const names = new Set<string>([BREAKTHROUGH])
  for (const d of during) for (const s of d.symptoms) names.add(s)

  const symptoms: SymptomRate[] = []
  for (const name of names) {
    const n = count(during, name)
    if (n === 0) continue
    const pct = Math.round((n / during.length) * 100)
    const basePct = hasBase ? Math.round((count(base, name) / base.length) * 100) : null
    const notable = n >= MIN_DAYS && (basePct === null ? pct >= NO_BASE_PCT : pct >= Math.max(basePct * RATIO, basePct + 2))
    symptoms.push({ name, days: n, pct, basePct, notable })
  }
  symptoms.sort((a, b) => Number(b.notable) - Number(a.notable) || b.pct - a.pct)

  // Zyklen, die ganz in den Zeitraum fallen
  const inside = cycles.filter((c) => c.start >= course.start && (c.end ?? today) <= end)
  const closed = inside.filter((c) => c.length !== null)
  const avg = (a: number[]) => (a.length ? round1(a.reduce((s, x) => s + x, 0) / a.length) : null)
  const painDays = during.filter((d) => (d.pain ?? 0) > 0).map((d) => d.pain as number)

  return {
    trackedDays: during.length,
    baseDays: hasBase ? base.length : 0,
    symptoms,
    avgBleed: avg(inside.map((c) => c.bleedDays)),
    avgCycle: avg(closed.map((c) => c.length as number)),
    avgPain: avg(painDays),
  }
}

/** Kurzer Text für den Bericht, z. B. "Zwischenblutung 9 % (2 %)" */
export function rateText(r: SymptomRate): string {
  return `${r.name} ${r.pct} %${r.basePct !== null ? ` (${r.basePct} %)` : ''}`
}

/** Sortierung: neueste zuerst */
export function byStartDesc(a: ContraceptionCourse, b: ContraceptionCourse): number {
  return a.start < b.start ? 1 : a.start > b.start ? -1 : 0
}
