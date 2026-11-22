import { Icon } from './Icons'
import { useState } from 'react'
import type { AppData } from '../lib/useData'
import { courseOn } from '../lib/useData'
import { formatDE, parseISO, shiftMonth, toISO, todayISO, weekdayShort } from '../lib/dates'
import { cycleDay, cycleLabel, cycleStats } from '../lib/cycles'
import { medCount } from '../lib/model'
import { careLine, careSummary, comparable, foodLine, movedEnough, painCompare, relaxed, unhealthyDay, usedAids } from '../lib/care'

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
  const mod = data.settings.modules
  const gyn = data.courses.filter((c) => c.kind === 'gyn' && c.start <= today && (c.end === null || c.end >= from))
  const sexDays = days.filter((d) => d.sex === 'geschuetzt' || d.sex === 'ungeschuetzt')
  const care = careSummary(data.dayList, from, today)
  const dec = (n: number | null) => (n === null ? '–' : String(n).replace('.', ','))
  const top = (l: [string, number][]) => l.slice(0, 6).map(([k, v]) => `${k} ${v}×`).join(', ')
  const cmpLine = (label: string, f: Parameters<typeof painCompare>[3], lag: number) => {
    const c = painCompare(data.days, from, today, f, lag)
    return comparable(c) ? `${label}: Ø Schmerz ${dec(c.withAvg)} (${c.withN} Tage) gegenüber ${dec(c.withoutAvg)} (${c.withoutN} Tage)` : null
  }

  return (
    <div className="page report-page">
      <header className="page-head no-print">
        <button className="icon-btn" onClick={onBack} aria-label="Zurück"><Icon name="back" /></button>
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
        <h1>Gynaeca · Zyklusblatt</h1>
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

        {mod.gynMeds && gyn.length > 0 && (
          <p>
            Regelmäßige Medikamente:{' '}
            {gyn.map((c) => `${c.name}${c.dose ? ` (${c.dose})` : ''} ab ${formatDE(c.start)}${c.end ? ` bis ${formatDE(c.end)}` : ', läuft'}`).join('; ')}
          </p>
        )}
        {mod.sex && sexDays.length > 0 && (
          <p>
            Geschlechtsverkehr an {sexDays.length} Tagen, davon ungeschützt {sexDays.filter((d) => d.sex === 'ungeschuetzt').length}
            {mod.endo && days.some((d) => d.painTypes.gv !== undefined) ? ` · Schmerz beim GV an ${days.filter((d) => d.painTypes.gv !== undefined).length} Tagen` : ''}
          </p>
        )}

        {mod.endo && (
          <>
            <h2>Selbstfürsorge und Ernährung</h2>
            <ul className="report-list">
              <li>Bewegung ≥ 30 min an {care.moveDays} Tagen (Ø {dec(care.movePerWeek)} pro Woche, Empfehlung 3–5){care.movement.length ? ` · ${top(care.movement)}` : ''}</li>
              <li>Entspannung/Achtsamkeit an {care.relaxDays} Tagen{care.relax.length ? ` · ${top(care.relax)}` : ''}{care.avgStress !== null ? ` · Ø Stress ${dec(care.avgStress)}/10` : ''}</li>
              <li>Hilfsmittel an {care.aidDays} Tagen{care.aids.length ? ` · ${top(care.aids)}` : ''}</li>
              <li>Ernährungstagebuch an {care.foodDays} Tagen · Cheat Days {care.cheatDays} · ungünstige Tage {care.unhealthyDays}{care.food.length ? ` · ${top(care.food)}` : ''}</li>
              {care.supplements.length > 0 && <li>Ergänzungsmittel: {top(care.supplements)}</li>}
              {care.reactions.length > 0 && <li>Verträglichkeit: {top(care.reactions)}</li>}
              {[
                cmpLine('Nach Cheat Day / ungünstiger Ernährung (Tag und Folgetag)', unhealthyDay, 1),
                cmpLine('Mit ≥ 30 min Bewegung', movedEnough, 0),
                cmpLine('Mit Entspannungsübung', relaxed, 0),
                cmpLine('Mit Wärme/Hilfsmittel', usedAids, 0),
              ]
                .filter(Boolean)
                .map((l) => <li key={l!}>{l}</li>)}
            </ul>
          </>
        )}

        <h2>Tagesverlauf</h2>
        <table className="days">
          <thead>
            <tr>
              <th>Datum</th><th>ZT</th><th>Blutung</th><th>Schmerz</th><th>Medikation</th><th>Symptome / Notiz</th>
              {mod.endo && <th>Selbstfürsorge / Ernährung</th>}
              {mod.sex && <th>GV</th>}
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
                {mod.endo && <td>{[careLine(d), foodLine(d)].filter(Boolean).join(' · ')}</td>}
                {mod.sex && <td>{d.sex === 'ungeschuetzt' ? 'GV' : d.sex === 'geschuetzt' ? 'GV (K)' : ''}</td>}
                {nfp && <td>{[d.temp?.toFixed(2).replace('.', ','), d.mucus, d.lh].filter(Boolean).join(' ')}</td>}
                {data.settings.modules.contraception && <td>{courseOn(data.courses, d.date)?.name ?? ''}</td>}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="foot">Blutung 0–5 (0,5er-Schritte), Sp = Schmierblutung, GV (K) = mit Kondom, Schmerz 0–10, ZT = Zyklustag, X/Y = Blutungstage/Zykluslänge.</p>
      </div>
    </div>
  )
}
