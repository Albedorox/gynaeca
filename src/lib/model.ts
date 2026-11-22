import type { ISODate } from './dates'

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

export interface DayEntry {
  date: ISODate
  /** Blutungsstärke 0–5 in 0,5er-Schritten */
  bleeding: number
  spotting: boolean
  /** Unterbauchschmerz 0–10, null = nicht erfasst */
  pain: number | null
  meds: MedIntake[]
  symptoms: string[]
  note: string
  /** Basaltemperatur in °C, 2 Nachkommastellen */
  temp: number | null
  /** Temperatur gestört (z. B. Alkohol, wenig Schlaf) */
  tempDisturbed: boolean
  mucus: MucusCode | null
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
  name: string
  start: ISODate
  /** Letzter Einnahmetag (inklusive). null = läuft noch */
  end: ISODate | null
}

export interface MedFavorite {
  name: string
  doses: number[]
}

export interface Settings {
  id: 'app'
  modules: {
    contraception: boolean
    symptoms: boolean
    nfp: boolean
    lh: boolean
  }
  /** Schmierblutung am Anfang/Ende der Periode zur Blutungsdauer zählen */
  countSpotting: boolean
  /** Mindestanzahl blutungsfreier Tage, damit eine Blutung als neue Periode gilt */
  minGapDays: number
  medFavorites: MedFavorite[]
  contraceptionFavorites: string[]
  customSymptoms: string[]
}

export const SYMPTOM_CATALOG: { group: string; items: string[] }[] = [
  {
    group: 'Endometriose',
    items: ['Dysmenorrhoe stark', 'Schmerz beim Stuhlgang', 'Schmerz beim Wasserlassen', 'Schmerz beim GV', 'Rückenschmerz', 'Ausstrahlung ins Bein', 'Blähbauch (Endo-Belly)', 'Erschöpfung'],
  },
  { group: 'Verdauung', items: ['Durchfall', 'Verstopfung', 'Übelkeit', 'Blähungen'] },
  { group: 'Allgemein', items: ['Kopfschmerzen', 'Migräne', 'Brustspannen', 'Unreine Haut', 'Schlafprobleme', 'Wassereinlagerungen'] },
  { group: 'Stimmung', items: ['Stimmungsschwankungen', 'Gereizt', 'Traurig', 'Ängstlich', 'Energiegeladen'] },
]

export const DEFAULT_SETTINGS: Settings = {
  id: 'app',
  modules: { contraception: false, symptoms: true, nfp: false, lh: false },
  countSpotting: false,
  minGapDays: 7,
  medFavorites: [
    { name: 'Ibuprofen', doses: [200, 400, 600, 800] },
    { name: 'Naproxen', doses: [250, 500] },
    { name: 'Buscopan', doses: [10, 20] },
    { name: 'Paracetamol', doses: [500, 1000] },
  ],
  contraceptionFavorites: ['Pille', 'Minipille', 'Hormonring', 'Pflaster'],
  customSymptoms: [],
}

export function emptyDay(date: ISODate): DayEntry {
  return {
    date,
    bleeding: 0,
    spotting: false,
    pain: null,
    meds: [],
    symptoms: [],
    note: '',
    temp: null,
    tempDisturbed: false,
    mucus: null,
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
