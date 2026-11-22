// Auswertung nach den Regeln der natürlichen Familienplanung (symptothermale Methode).
// Quellen und Herleitung: docs/knowledge/README.md, Abschnitt "NFP".
//
// Regeln in Kurzform:
// - Temperatur: erste höhere Messung (1.hM) liegt über den 6 vorangehenden gültigen Werten.
//   Hilfslinie = höchster dieser 6 Werte. Regulär: 1.hM und 2 weitere Werte über der Hilfslinie,
//   der dritte mindestens 0,20 °C darüber. Ausnahme 1: dritter Wert unter 0,20 °C, dann muss ein
//   vierter Wert über der Hilfslinie liegen. Ausnahme 2: der 2. oder 3. Wert fällt auf/unter die
//   Hilfslinie, er wird ignoriert und ein weiterer Wert muss 0,20 °C darüber liegen. Beide
//   Ausnahmen werden nicht kombiniert. Gestörte Werte werden ausgeklammert.
// - Zervixschleim: Höhepunkt = letzter Tag der besten Qualität, gefolgt von 3 Tagen mit
//   schlechterer Qualität (strenge Auswertung: alle 3 Tage müssen eingetragen sein).
//   Ein neuer Tag mit gleich guter oder besserer Qualität vor Abschluss der Auswertung
//   macht den bisherigen Höhepunkt ungültig.
// - Doppelte Kontrolle: unfruchtbar ab dem Abend des Tages, an dem beide Auswertungen
//   abgeschlossen sind. Danach ändert sich in diesem Zyklus nichts mehr.
// - Zyklusanfang: erster Zyklus fruchtbar ab Tag 1. 5-Tage-Regel nur, wenn im Vorzyklus eine
//   1.hM ausgewertet wurde. Minus-8: früheste 1.hM minus 8, verkürzt die 5 Tage, sobald eine
//   1.hM vor Zyklustag 13 lag; ab 12 ausgewerteten Zyklen ersetzt sie die 5-Tage-Regel.
//   Schleim f, S oder S+ (bzw. Muttermundveränderung) beendet die unfruchtbare Zeit sofort.

import { addDays, diffDays, type ISODate } from './dates'
import type { Cycle } from './cycles'
import type { ContraceptionCourse, DayEntry, MucusCode, Settings } from './model'

export const MUCUS_RANK: Record<MucusCode, number> = { t: 0, 'Ø': 1, f: 2, S: 3, 'S+': 4 }

export type TempRule = 'regulär' | 'Ausnahmeregel 1' | 'Ausnahmeregel 2'
export type StartRule = 'erster Zyklus' | '5-Tage-Regel' | 'Minus-8-Regel'

export interface NfpCycle {
  start: ISODate
  end: ISODate | null
  applicable: boolean
  reasonNotApplicable?: string
  /** Letzter unfruchtbarer Tag am Zyklusanfang (inklusive) oder null */
  infertileUntil: ISODate | null
  startRule: StartRule
  /** Tag, an dem Schleim oder Muttermund die unfruchtbare Zeit am Anfang vorzeitig beendet hat */
  earlySignDay: ISODate | null
  firstHigher: ISODate | null
  /** Zyklustag der 1.hM */
  firstHigherZT: number | null
  coverline: number | null
  tempRule: TempRule | null
  tempDone: ISODate | null
  peak: ISODate | null
  peakDone: ISODate | null
  /** Unfruchtbar ab dem Abend dieses Tages */
  infertileFrom: ISODate | null
  ovulation: { from: ISODate; to: ISODate } | null
  lhPositive: ISODate | null
  /** Verwendetes zweites Zeichen */
  sign: 'Schleim' | 'Muttermund' | null
  notes: string[]
}

export type DayStatus = 'unfruchtbar' | 'fruchtbar' | 'ab-abend' | 'offen'

type NfpSettings = Pick<Settings, 'modules'>

const hundredths = (t: number) => Math.round(t * 100)
/** Auf 0,05 °C runden (Sensiplan-Konvention), Ergebnis in Hundertstel */
const round05 = (t: number) => Math.round(t * 20) * 5

interface TempPoint {
  date: ISODate
  v: number // Hundertstel °C, auf 0,05 gerundet
}

export interface TempEval {
  firstHigher: ISODate
  coverline: number
  rule: TempRule
  done: ISODate
}

/** Temperaturauswertung über die gültigen Werte eines Zyklus. */
export function evaluateTemperature(points: TempPoint[]): TempEval | null {
  for (let k = 6; k < points.length; k++) {
    const low = points.slice(k - 6, k).map((p) => p.v)
    const h = Math.max(...low)
    if (points[k].v <= h) continue
    const a = points[k + 1]?.v
    const b = points[k + 2]?.v
    const c = points[k + 3]?.v
    const done = (i: number, rule: TempRule): TempEval => ({ firstHigher: points[k].date, coverline: h / 100, rule, done: points[i].date })
    if (a === undefined || b === undefined) return null // noch nicht genug Werte
    if (a > h && b > h) {
      if (b >= h + 20) return done(k + 2, 'regulär')
      if (c === undefined) return null
      if (c > h) return done(k + 3, 'Ausnahmeregel 1')
      continue
    }
    // Ausnahmeregel 2: genau einer der Werte 2 oder 3 fällt auf/unter die Hilfslinie
    if ((a <= h) !== (b <= h)) {
      if (c === undefined) return null
      if (c >= h + 20) return done(k + 3, 'Ausnahmeregel 2')
    }
  }
  return null
}

function cervixScore(d: DayEntry | undefined): number | null {
  if (!d) return null
  const o = d.cervixOpening === null ? null : { geschlossen: 0, leicht: 1, offen: 2 }[d.cervixOpening]
  const f = d.cervixFirmness === null ? null : { hart: 0, mittel: 1, weich: 2 }[d.cervixFirmness]
  const p = d.cervixPosition === null ? null : { tief: 0, mittel: 1, hoch: 2 }[d.cervixPosition]
  if (o === null && f === null && p === null) return null
  return (o ?? 0) + (f ?? 0) + (p ?? 0)
}

function overlapsContraception(courses: ContraceptionCourse[], start: ISODate, end: ISODate): boolean {
  return courses.some((c) => c.start <= end && (c.end === null || c.end >= start))
}

/**
 * Wertet alle Zyklen aus. `today` begrenzt den laufenden Zyklus.
 */
export function evaluateNfp(
  cycles: Cycle[],
  days: Map<ISODate, DayEntry>,
  settings: NfpSettings,
  courses: ContraceptionCourse[],
  today: ISODate,
): NfpCycle[] {
  const results: NfpCycle[] = []
  const useMucus = settings.modules.nfpMucus
  const useCervix = !useMucus && settings.modules.nfpCervix
  const sign: NfpCycle['sign'] = useMucus ? 'Schleim' : useCervix ? 'Muttermund' : null

  const quality = (iso: ISODate): number | null => {
    const d = days.get(iso)
    if (useMucus) return d?.mucus != null ? MUCUS_RANK[d.mucus] : null
    if (useCervix) return cervixScore(d)
    return null
  }
  /** Ab dieser Qualität gilt ein Zeichen als fruchtbar (Schleim f, S, S+ bzw. Muttermund verändert) */
  const fertileQ = 2

  for (let ci = 0; ci < cycles.length; ci++) {
    const cyc = cycles[ci]
    const last = cyc.end ?? today
    const r: NfpCycle = {
      start: cyc.start,
      end: cyc.end,
      applicable: true,
      infertileUntil: null,
      startRule: 'erster Zyklus',
      earlySignDay: null,
      firstHigher: null,
      firstHigherZT: null,
      coverline: null,
      tempRule: null,
      tempDone: null,
      peak: null,
      peakDone: null,
      infertileFrom: null,
      ovulation: null,
      lhPositive: null,
      sign,
      notes: [],
    }
    results.push(r)

    if (overlapsContraception(courses, cyc.start, last)) {
      r.applicable = false
      r.reasonNotApplicable = 'Hormonelle Verhütung in diesem Zyklus: keine Auswertung möglich.'
      continue
    }

    const span: ISODate[] = []
    for (let iso = cyc.start; iso <= last; iso = addDays(iso, 1)) span.push(iso)

    // LH-Test
    r.lhPositive = span.find((iso) => {
      const lh = days.get(iso)?.lh
      return lh === 'pos' || lh === 'peak'
    }) ?? null

    // --- Temperatur ---
    const points: TempPoint[] = []
    for (const iso of span) {
      const d = days.get(iso)
      if (d?.temp != null && !d.tempDisturbed) points.push({ date: iso, v: round05(d.temp) })
    }
    const te = evaluateTemperature(points)
    if (te) {
      r.firstHigher = te.firstHigher
      r.firstHigherZT = diffDays(cyc.start, te.firstHigher) + 1
      r.coverline = te.coverline
      r.tempRule = te.rule
      r.tempDone = te.done
    }

    // --- Zyklusanfang ---
    const prev = results.slice(0, ci).filter((p) => p.applicable && p.firstHigherZT !== null)
    const prevCycle = results[ci - 1]
    const evaluatedCount = prev.length
    const earliest = prev.length ? Math.min(...prev.map((p) => p.firstHigherZT as number)) : null
    let lastInfertileZT = 0
    if (evaluatedCount >= 12 && earliest !== null) {
      r.startRule = 'Minus-8-Regel'
      lastInfertileZT = earliest - 8
    } else if (prevCycle && prevCycle.applicable && prevCycle.firstHigherZT !== null) {
      r.startRule = '5-Tage-Regel'
      lastInfertileZT = 5
      if (earliest !== null && earliest < 13) {
        r.startRule = 'Minus-8-Regel'
        lastInfertileZT = Math.min(5, earliest - 8)
      }
    }
    if (sign === null) lastInfertileZT = 0 // ohne zweites Zeichen keine Freigabe am Anfang
    if (lastInfertileZT >= 1) {
      let until = addDays(cyc.start, lastInfertileZT - 1)
      for (let iso = cyc.start; iso <= until && iso <= last; iso = addDays(iso, 1)) {
        const q = quality(iso)
        if (q !== null && q >= fertileQ) {
          r.earlySignDay = iso
          until = addDays(iso, -1)
          break
        }
      }
      r.infertileUntil = until >= cyc.start ? until : null
    }

    // --- Schleim- bzw. Muttermund-Höhepunkt und doppelte Kontrolle ---
    if (sign === null) {
      r.notes.push('Für eine Auswertung nach der doppelten Kontrolle Zervixschleim oder Muttermund einschalten.')
    } else {
      let maxQ = -1
      let peak: ISODate | null = null
      for (const iso of span) {
        const q = quality(iso)
        if (q !== null && q >= maxQ && q >= fertileQ) {
          maxQ = q
          peak = iso
        }
        // Höhepunkt bestätigt, wenn die 3 Folgetage eingetragen und schlechter sind
        let confirmed: ISODate | null = null
        if (peak && diffDays(peak, iso) >= 3) {
          const after = [1, 2, 3].map((i) => quality(addDays(peak as ISODate, i)))
          if (after.every((q2) => q2 !== null && q2 < maxQ)) confirmed = addDays(peak, 3)
        }
        if (confirmed && r.tempDone && r.tempDone <= iso) {
          r.peak = peak
          r.peakDone = confirmed
          r.infertileFrom = confirmed > r.tempDone ? confirmed : r.tempDone
          break
        }
        if (confirmed && !r.peakDone) {
          r.peak = peak
          r.peakDone = confirmed
        }
        if (r.peakDone && peak !== r.peak) {
          // neuer Höhepunkt vor Abschluss der Auswertung: alter Kandidat ungültig
          r.peak = null
          r.peakDone = null
        }
      }
      if (!r.peak && peak) r.peak = peak
      if (r.peak && !r.peakDone) {
        const missing = [1, 2, 3].map((i) => addDays(r.peak as ISODate, i)).filter((iso) => iso <= last && quality(iso) === null)
        if (missing.length) r.notes.push(`${sign} an ${missing.length} Tag(en) nach dem möglichen Höhepunkt nicht eingetragen.`)
      }
      if (r.peak && r.firstHigher) {
        const gap = diffDays(r.peak, r.firstHigher)
        if (gap > 5 || gap < -3) r.notes.push('Höhepunkt und Temperaturanstieg passen zeitlich nicht gut zusammen. Bitte den Zyklus prüfen.')
      }
    }

    // --- Eisprung-Schätzung ---
    if (r.firstHigher) {
      const center = r.peak && Math.abs(diffDays(r.peak, r.firstHigher)) <= 3 ? r.peak : addDays(r.firstHigher, -1)
      r.ovulation = { from: addDays(center, -1), to: addDays(center, 1) }
    }
  }
  return results
}

export function nfpCycleFor(results: NfpCycle[], iso: ISODate): NfpCycle | undefined {
  for (let i = results.length - 1; i >= 0; i--) if (results[i].start <= iso) return results[i]
  return undefined
}

export function dayStatus(results: NfpCycle[], iso: ISODate, today: ISODate): DayStatus | null {
  const r = nfpCycleFor(results, iso)
  if (!r || !r.applicable) return null
  if (r.end && iso > r.end) return null
  if (r.infertileFrom) {
    if (iso === r.infertileFrom) return 'ab-abend'
    if (iso > r.infertileFrom) return 'unfruchtbar'
  }
  // Zukünftige Tage sind offen: erst die Beobachtung an diesem Tag entscheidet
  if (iso > today) return 'offen'
  if (r.infertileUntil && iso <= r.infertileUntil) return 'unfruchtbar'
  return 'fruchtbar'
}

export function isOvulationDay(results: NfpCycle[], iso: ISODate): boolean {
  const r = nfpCycleFor(results, iso)
  return !!r?.ovulation && iso >= r.ovulation.from && iso <= r.ovulation.to
}

export const STATUS_LABEL: Record<DayStatus, string> = {
  unfruchtbar: 'unfruchtbar',
  fruchtbar: 'fruchtbar',
  'ab-abend': 'unfruchtbar ab Abend',
  offen: 'noch offen',
}

export { hundredths }
