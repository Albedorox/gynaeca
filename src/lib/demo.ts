// Beispieldaten zum Ausprobieren: drei vollständige Zyklen und ein laufender.
// Eigene, frei erfundene Werte (keine Kopie fremder Beispielzyklen).
import { db, saveSettings } from './db'
import { addDays, todayISO, type ISODate } from './dates'
import { emptyDay, type DayEntry, type MucusCode } from './model'

const BLEED = [3, 4, 3, 2, 1, 0.5]
const LOW = [36.45, 36.5, 36.4, 36.45, 36.35, 36.4, 36.45, 36.4, 36.5, 36.45, 36.4, 36.45, 36.35]
const HIGH = [36.7, 36.75, 36.8, 36.75, 36.8, 36.85, 36.8, 36.75, 36.8, 36.75, 36.7, 36.75, 36.7, 36.6, 36.55]

function cycle(start: ISODate, length: number, shift: number): DayEntry[] {
  const out: DayEntry[] = []
  const rise = 13 + shift // Index der 1.hM
  for (let i = 0; i < length; i++) {
    const d = emptyDay(addDays(start, i))
    d.bleeding = BLEED[i] ?? 0
    if (i === 0) d.pain = 6
    if (i === 1) d.pain = 4
    if (i < 2) d.meds = [{ name: 'Ibuprofen', doseMg: 400, count: i === 0 ? 2 : 1 }]
    if (i < 2) d.painTypes = { regel: d.pain ?? 0 }
    d.temp = i < rise ? LOW[i % LOW.length] : HIGH[Math.min(HIGH.length - 1, i - rise)]
    if (i === 20) d.tempDisturbed = true
    let m: MucusCode | null = null
    const peak = rise - 1
    if (i >= 6 && i < peak - 4) m = i < 8 ? 't' : 'Ø'
    else if (i >= peak - 4 && i < peak - 2) m = 'f'
    else if (i === peak - 2) m = 'S'
    else if (i >= peak - 1 && i <= peak) m = 'S+'
    else if (i === peak + 1) m = 'S'
    else if (i > peak + 1) m = 't'
    d.mucus = m
    d.mucusSource = m ? 'muttermund' : null
    if (i === peak - 1) d.lh = 'pos'
    if (i === peak) d.lh = 'peak'
    addCare(d, i, start)
    d.updatedAt = Date.now()
    out.push(d)
  }
  return out
}

// Selbstfürsorge-Beispiel: wechselnde, aber reproduzierbare Werte je Tag
function addCare(d: DayEntry, i: number, start: ISODate) {
  const k = (i * 7 + Number(start.slice(8))) % 11
  d.movementMin = [30, 0, 45, 15, 60, 30, 0, 30, 90, 15, 45][k]
  if (d.movementMin) d.movement = [['Spazieren'], ['Radfahren'], ['Yoga'], ['Spazieren', 'Beckenboden-Übungen'], ['Schwimmen']][k % 5]
  if (k % 3 === 0) d.relax = [['Atemübung'], ['Meditation'], ['Zeit in der Natur', 'Achtsamkeitsübung']][k % 3 === 0 ? (i % 3) : 0]
  d.stress = [3, 5, 2, 6, 4, 7, 3, 2, 5, 4, 3][k]
  if (i < 3) d.aids = i === 0 ? ['Wärmflasche', 'Wärmepflaster'] : ['Wärmflasche']
  else if (k === 4) d.aids = ['Körnerkissen']
  const cheat = k === 6
  d.cheatDay = cheat
  d.food = cheat
    ? ['Zucker / Kuchen', 'Fertigessen / Fast Food', 'Alkohol']
    : [['Gemüse', 'Obst', 'Vollkorn', 'Olivenöl'], ['Gemüse', 'Fisch', 'Kräutertee'], ['Obst', 'Hülsenfrüchte', 'Nüsse & Samen', 'Kaffee'], ['Gemüse', 'Weißmehl', 'Kaffee']][k % 4]
  d.supplements = k % 2 === 0 ? ['Omega-3', 'Vitamin D3'] : ['Vitamin D3']
  d.water = 4 + (k % 4)
  d.meals = cheat
    ? { mittags: 'Pizza', zwischendurch: 'Schokoladenkuchen, Cola', abends: 'Wein, Chips' }
    : { morgens: 'Haferflocken mit Beeren', mittags: k % 2 ? 'Linsensalat' : 'Gemüsepfanne mit Reis', abends: k % 2 ? 'Lachs mit Brokkoli' : 'Vollkornbrot, Hummus' }
  if (cheat) {
    d.foodReaction = ['Blähbauch']
    d.pain = Math.max(d.pain ?? 0, 5)
  }
  if (k === 2 || k === 8) d.sex = k === 2 ? 'geschuetzt' : 'ungeschuetzt'
  if (d.pain === null && k % 4 === 1) d.pain = 2
}

/** Schreibt Beispieldaten, sodass der laufende Zyklus heute an Tag 9 ist. */
export async function loadDemo(): Promise<void> {
  const today = todayISO()
  const lengths = [28, 30, 27]
  const total = lengths.reduce((a, b) => a + b, 0)
  let start = addDays(today, -(total + 8))
  const days: DayEntry[] = []
  lengths.forEach((l, i) => {
    days.push(...cycle(start, l, i === 1 ? 2 : 0))
    start = addDays(start, l)
  })
  days.push(...cycle(start, 9, 0))
  // Folgetag nach dem Cheat Day: etwas mehr Schmerz
  for (let i = 1; i < days.length; i++) if (days[i - 1].cheatDay && (days[i].pain ?? 0) < 4) days[i].pain = 4
  await db.transaction('rw', db.days, db.courses, async () => {
    await db.days.clear()
    await db.days.bulkPut(days)
    await db.courses.clear()
    await db.courses.add({ kind: 'gyn', name: 'Agnus castus (Mönchspfeffer)', dose: '1 Tablette morgens', start: addDays(today, -60), end: null })
  })
  await saveSettings({
    modules: { contraception: false, pain: true, endo: true, symptoms: true, nfp: true, nfpMucus: true, nfpCervix: false, lh: true, gynMeds: true, sex: true },
    birthYear: new Date().getFullYear() - 31,
    menarcheAge: 12,
  })
}
