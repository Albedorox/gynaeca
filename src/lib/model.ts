import type { ISODate } from './dates'
import type { BackLocation, PainCharacter, PainType } from './knowledge'

export interface MedIntake {
  /** Präparat oder Wirkstoff, z. B. "Ibuprofen" */
  name: string
  /** Wirkstoffmenge pro Einnahme in mg (optional) */
  doseMg: number | null
  /** Anzahl Einnahmen an diesem Tag */
  count: number
}

export type MucusCode = 't' | 'Ø' | 'f' | 'S' | 'S+'
export type LhResult = 'neg' | 'pos' | 'peak'
export type CervixOpening = 'geschlossen' | 'leicht' | 'offen'
export type CervixFirmness = 'hart' | 'mittel' | 'weich'
export type CervixPosition = 'tief' | 'mittel' | 'hoch'

export type MealSlot = 'morgens' | 'mittags' | 'abends' | 'zwischendurch'
export type SexEntry = 'geschuetzt' | 'ungeschuetzt' | 'kein'

export interface DayEntry {
  date: ISODate
  /** Blutungsstärke 0–5 in 0,5er-Schritten */
  bleeding: number
  spotting: boolean
  /** Unterbauchschmerz 0–10, null = nicht erfasst */
  pain: number | null
  meds: MedIntake[]
  /** Stärke je Schmerzart (NRS 0–10) */
  painTypes: Partial<Record<PainType, number>>
  backLocations: BackLocation[]
  painCharacter: PainCharacter[]
  /** Beeinträchtigung im Alltag (Endometriose-Modul) */
  impairments: string[]
  /** Alt: Bewegung/Entspannung als eine Liste. Wird beim Lesen in movement/relax übernommen. */
  selfcare: string[]
  /** Stress 0–10 */
  stress: number | null
  /** Bewegung in Minuten am Tag, null = nicht erfasst (Endometriose-Modul) */
  movementMin: number | null
  /** Art der Bewegung, z. B. "Spazieren" */
  movement: string[]
  /** Entspannungs- und Achtsamkeitsübungen */
  relax: string[]
  /** Hilfsmittel wie Wärmepflaster oder Wärmflasche */
  aids: string[]
  /** Ernährungstagebuch: was gegessen wurde (Kategorien) */
  food: string[]
  /** Ergänzungsmittel, z. B. Omega-3 */
  supplements: string[]
  /** Mahlzeiten als Freitext */
  meals: Partial<Record<MealSlot, string>>
  /** Wasser/Tee in Gläsern à 250 ml */
  water: number | null
  /** Ungesunder Tag ("Cheat Day") */
  cheatDay: boolean
  /** Wie das Essen vertragen wurde */
  foodReaction: string[]
  /** Geschlechtsverkehr: null = nicht erfasst */
  sex: SexEntry | null
  symptoms: string[]
  note: string
  /** Basaltemperatur in °C, 2 Nachkommastellen */
  temp: number | null
  /** Temperatur gestört (z. B. Alkohol, wenig Schlaf) */
  tempDisturbed: boolean
  mucus: MucusCode | null
  /** Wo der Schleim beurteilt wurde */
  mucusSource: 'muttermund' | 'aussen' | null
  cervixOpening: CervixOpening | null
  cervixFirmness: CervixFirmness | null
  cervixPosition: CervixPosition | null
  lh: LhResult | null
  /** Manuell gesetzter Zyklusbeginn (überschreibt die Automatik) */
  cycleStart: boolean | null
  updatedAt: number
}

export interface ContraceptionCourse {
  id?: number
  /** Geräteübergreifende Kennung für den Sync (ab Datenbank-Version 2) */
  uid?: string
  /** Zeitpunkt der letzten Änderung (ms) */
  updatedAt?: number
  name: string
  start: ISODate
  /** Letzter Einnahmetag (inklusive). null = läuft noch */
  end: ISODate | null
  /** 'gyn' = regelmäßiges gynäkologisches Medikament (z. B. Agnus castus); fehlt = hormonelle Verhütung */
  kind?: 'gyn'
  /** Dosis oder Einnahmehinweis, frei (z. B. "1 Tablette morgens") */
  dose?: string
}

export interface MedFavorite {
  name: string
  doses: number[]
}

export type ThemeMode = 'system' | 'dunkel' | 'hell'
export type ThemePalette = 'rose' | 'beere' | 'lavendel' | 'salbei' | 'ozean' | 'sand'

export interface Settings {
  id: 'app'
  /** Erscheinungsbild: Hell/Dunkel und Akzentfarbe */
  appearance: { mode: ThemeMode; palette: ThemePalette }
  modules: {
    contraception: boolean
    /** Schmerz & Medikamente */
    pain: boolean
    /** Endometriose-Abfrage (Schmerzarten, Alltag, Stress, Bewegung) */
    endo: boolean
    symptoms: boolean
    /** Fruchtbarkeit (natürliche Familienplanung) */
    nfp: boolean
    /** Zeichen, die in die NFP-Auswertung eingehen */
    nfpMucus: boolean
    nfpCervix: boolean
    lh: boolean
    /** Regelmäßige gynäkologische Medikamente */
    gynMeds: boolean
    /** Geschlechtsverkehr */
    sex: boolean
  }
  /** Geburtsjahr für altersabhängige Hinweise */
  birthYear: number | null
  /** Alter bei der ersten Periode */
  menarcheAge: number | null
  /** Hinweis zum Fruchtbarkeitsmodul gelesen */
  nfpDisclaimerAccepted: boolean
  /** Schmierblutung am Anfang/Ende der Periode zur Blutungsdauer zählen */
  countSpotting: boolean
  /** Mindestanzahl blutungsfreier Tage, damit eine Blutung als neue Periode gilt */
  minGapDays: number
  medFavorites: MedFavorite[]
  contraceptionFavorites: string[]
  gynMedFavorites: string[]
  customSymptoms: string[]
}

export const SYMPTOM_CATALOG: { group: string; items: string[] }[] = [
  {
    group: 'Endometriose',
    items: ['Dysmenorrhoe stark', 'Schmerz beim Stuhlgang', 'Schmerz beim Wasserlassen', 'Schmerz beim GV', 'Rückenschmerz', 'Ausstrahlung ins Bein', 'Blähbauch (Endo-Belly)', 'Erschöpfung'],
  },
  { group: 'Verdauung', items: ['Durchfall', 'Verstopfung', 'Übelkeit', 'Blähungen'] },
  { group: 'Allgemein', items: ['Kopfschmerzen', 'Migräne', 'Brustspannen', 'Unreine Haut', 'Schlafprobleme', 'Wassereinlagerungen'] },
  { group: 'Stimmung', items: ['Ausgeglichen', 'Energiegeladen', 'Stimmungsschwankungen', 'Gereizt', 'Traurig', 'Ängstlich'] },
]

export const DEFAULT_SETTINGS: Settings = {
  id: 'app',
  appearance: { mode: 'dunkel', palette: 'rose' },
  modules: { contraception: false, pain: true, endo: false, symptoms: true, nfp: false, nfpMucus: true, nfpCervix: false, lh: false, gynMeds: true, sex: true },
  birthYear: null,
  menarcheAge: null,
  nfpDisclaimerAccepted: false,
  countSpotting: false,
  minGapDays: 7,
  medFavorites: [
    { name: 'Ibuprofen', doses: [200, 400, 600, 800] },
    { name: 'Naproxen', doses: [250, 500] },
    { name: 'Buscopan', doses: [10, 20] },
    { name: 'Paracetamol', doses: [500, 1000] },
  ],
  contraceptionFavorites: ['Pille', 'Minipille', 'Hormonring', 'Pflaster'],
  gynMedFavorites: ['Agnus castus (Mönchspfeffer)', 'Dienogest', 'Progesteron', 'Eisen'],
  customSymptoms: [],
}

export function emptyDay(date: ISODate): DayEntry {
  return {
    date,
    bleeding: 0,
    spotting: false,
    pain: null,
    meds: [],
    painTypes: {},
    backLocations: [],
    painCharacter: [],
    impairments: [],
    selfcare: [],
    stress: null,
    movementMin: null,
    movement: [],
    relax: [],
    aids: [],
    food: [],
    supplements: [],
    meals: {},
    water: null,
    cheatDay: false,
    foodReaction: [],
    sex: null,
    symptoms: [],
    note: '',
    temp: null,
    tempDisturbed: false,
    mucus: null,
    mucusSource: null,
    cervixOpening: null,
    cervixFirmness: null,
    cervixPosition: null,
    lh: null,
    cycleStart: null,
    updatedAt: 0,
  }
}

/** true, wenn der Tag keinerlei Eingaben enthält (wird dann gelöscht statt gespeichert) */
export function isEmptyDay(d: DayEntry): boolean {
  return (
    d.bleeding === 0 &&
    !d.spotting &&
    d.pain === null &&
    d.meds.length === 0 &&
    Object.keys(d.painTypes ?? {}).length === 0 &&
    (d.backLocations ?? []).length === 0 &&
    (d.painCharacter ?? []).length === 0 &&
    (d.impairments ?? []).length === 0 &&
    (d.selfcare ?? []).length === 0 &&
    (d.stress ?? null) === null &&
    (d.movementMin ?? null) === null &&
    (d.movement ?? []).length === 0 &&
    (d.relax ?? []).length === 0 &&
    (d.aids ?? []).length === 0 &&
    (d.food ?? []).length === 0 &&
    (d.supplements ?? []).length === 0 &&
    Object.values(d.meals ?? {}).every((v) => !v || !v.trim()) &&
    (d.water ?? null) === null &&
    !d.cheatDay &&
    (d.foodReaction ?? []).length === 0 &&
    (d.sex ?? null) === null &&
    d.symptoms.length === 0 &&
    d.note.trim() === '' &&
    d.temp === null &&
    d.mucus === null &&
    d.cervixOpening === null &&
    d.cervixFirmness === null &&
    d.cervixPosition === null &&
    d.lh === null &&
    d.cycleStart === null
  )
}

export function medCount(d: DayEntry | undefined): number {
  return d ? d.meds.reduce((s, m) => s + m.count, 0) : 0
}

// Frühere Einträge kannten nur "selfcare". Diese Werte werden in die neuen Felder übernommen.
const LEGACY_SELFCARE: Record<string, (d: DayEntry) => void> = {
  'Bewegung ≥ 30 min': (d) => {
    if (d.movementMin === null || d.movementMin < 30) d.movementMin = 30
  },
  Ausdauersport: (d) => addOnce(d.movement, 'Ausdauersport'),
  'Beckenboden-Übungen': (d) => addOnce(d.movement, 'Beckenboden-Übungen'),
  'Beckenboden-Physiotherapie': (d) => addOnce(d.movement, 'Beckenboden-Physio'),
  'Yoga / Entspannung': (d) => addOnce(d.movement, 'Yoga'),
}
function addOnce(list: string[], v: string) {
  if (!list.includes(v)) list.push(v)
}

/** Ergänzt fehlende Felder und übernimmt Altwerte. Gibt immer ein neues Objekt zurück. */
export function normalizeDay(raw: Partial<DayEntry> & { date: ISODate }): DayEntry {
  const d: DayEntry = { ...emptyDay(raw.date), ...raw }
  d.movement = [...(d.movement ?? [])]
  d.meals = { ...(d.meals ?? {}) }
  if ((d.selfcare ?? []).length) {
    for (const s of d.selfcare) (LEGACY_SELFCARE[s] ?? ((x: DayEntry) => addOnce(x.movement, s)))(d)
    d.selfcare = []
  }
  return d
}
