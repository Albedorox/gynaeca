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
    d.updatedAt = Date.now()
    out.push(d)
  }
  return out
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
  await db.transaction('rw', db.days, async () => {
    await db.days.clear()
    await db.days.bulkPut(days)
  })
  await saveSettings({
    modules: { contraception: false, pain: true, endo: true, symptoms: true, nfp: true, nfpMucus: true, nfpCervix: false, lh: true },
    birthYear: new Date().getFullYear() - 31,
    menarcheAge: 12,
  })
}
