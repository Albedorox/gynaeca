import { useState } from 'react'
import type { AppData } from '../lib/useData'
import { courseOn } from '../lib/useData'
import { formatDE, parseISO, shiftMonth, toISO, todayISO, weekdayShort } from '../lib/dates'
import { cycleDay, cycleLabel, cycleStats } from '../lib/cycles'
import { medCount } from '../lib/model'

/** Druckbares Zyklusblatt für den Arztbesuch. "Als PDF speichern" über den Druckdialog. */
export default function Report({ data, onBack }: { data: AppData; onBack: () => void }) {
  const [months, setMonths] = useState(3)
  const today = todayISO()
  const t = parseISO(today)
  const s = shiftMonth(t.y, t.m0, -(months - 1))
  const from = toISO(s.y, s.m0, 1)

  const days = data.dayList.filter((d) => d.date >= from && d.date <= today)
  const cycles = data.cycles.filter((c) => (c.end ?? today) >= from)
  const stats = cycleStats(cycles)
  const medTotals = new Map<string, number>()
  for (const d of days) for (const m of d.meds) medTotals.set(m.name, (medTotals.get(m.name) ?? 0) + m.count)
  const painDays = days.filter((d) => (d.pain ?? 0) > 0)
  const avgPain = painDays.length ? (painDays.reduce((a, d) => a + (d.pain ?? 0), 0) / painDays.length).toFixed(1).replace('.', ',') : '–'
  const nfp = data.settings.modules.nfp

  return (
    <div className="page report-page">
      <header className="page-head no-print">
        <button className="icon-btn" onClick={onBack} aria-label="Zurück">‹</button>
        <h1>Arztbericht</h1>
        <span className="spacer" />
        <select value={months} onChange={(e) => setMonths(Number(e.target.value))} aria-label="Zeitraum">
          <option value={1}>1 Monat</option>
          <option value={3}>3 Monate</option>
          <option value={6}>6 Monate</option>
          <option value={12}>12 Monate</option>
        </select>
        <button className="btn primary" onClick={() => window.print()}>Drucken / PDF</button>
      </header>
      <div className="report">
        <h1>Zyklusblatt</h1>
        <p>Zeitraum {formatDE(from)} bis {formatDE(today)} · erstellt am {formatDE(today)}</p>

        <h2>Zyklen</h2>
        <table>
          <thead>
            <tr><th>Beginn</th><th>Blutung/Zyklus</th><th>Max. Schmerz</th><th>Schmerzmittel-Einnahmen</th></tr>
          </thead>
          <tbody>
            {cycles.map((c) => {
              const inC = data.dayList.filter((d) => d.date >= c.start && (c.end === null || d.date <= c.end))
              return (
                <tr key={c.start}>
                  <td>{formatDE(c.start)}</td>
                  <td><b>{cycleLabel(c)}</b>{c.length === null ? ' (läuft)' : ''}</td>
                  <td>{Math.max(0, ...inC.map((d) => d.pain ?? 0))}</td>
                  <td>{inC.reduce((a, d) => a + medCount(d), 0)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <p>
          Ø Zykluslänge {stats.avgLength ?? '–'} Tage (Spanne {stats.minLength ?? '–'}–{stats.maxLength ?? '–'}) · Ø Blutungsdauer {stats.avgBleed ?? '–'} Tage ·
          Schmerztage {painDays.length}, Ø Stärke {avgPain}
        </p>
        {medTotals.size > 0 && (
          <p>
            Schmerzmittel gesamt: {[...medTotals].map(([n, c]) => `${n} ${c}×`).join(', ')}
          </p>
        )}

        <h2>Tagesverlauf</h2>
        <table className="days">
          <thead>
            <tr>
              <th>Datum</th><th>ZT</th><th>Blutung</th><th>Schmerz</th><th>Medikation</th><th>Symptome / Notiz</th>
              {nfp && <th>NFP</th>}
              {data.settings.modules.contraception && <th>Verhütung</th>}
            </tr>
          </thead>
          <tbody>
            {days.map((d) => (
              <tr key={d.date} className={data.cycles.some((c) => c.start === d.date) ? 'cs' : ''}>
                <td>{weekdayShort(d.date)} {formatDE(d.date)}</td>
                <td>{cycleDay(data.cycles, d.date) ?? ''}</td>
                <td>{d.bleeding ? String(d.bleeding).replace('.', ',') : ''}{d.spotting ? ' Sp' : ''}</td>
                <td>{d.pain ?? ''}</td>
                <td>{d.meds.map((m) => `${m.name}${m.doseMg ? ` ${m.doseMg} mg` : ''} ${m.count}×`).join(', ')}</td>
                <td>{[d.symptoms.join(', '), d.note].filter(Boolean).join(' · ')}</td>
                {nfp && <td>{[d.temp?.toFixed(2).replace('.', ','), d.mucus, d.lh].filter(Boolean).join(' ')}</td>}
                {data.settings.modules.contraception && <td>{courseOn(data.courses, d.date)?.name ?? ''}</td>}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="foot">Blutung 0–5 (0,5er-Schritte), Sp = Schmierblutung, Schmerz 0–10, ZT = Zyklustag, X/Y = Blutungstage/Zykluslänge.</p>
      </div>
    </div>
  )
}
