import { Icon } from './Icons'
import { useMemo, useState } from 'react'
import type { AppData } from '../lib/useData'
import { addDays, diffDays, formatDE, todayISO, weekdayShort, type ISODate } from '../lib/dates'
import { computeCycles } from '../lib/cycles'
import { saveSettings } from '../lib/db'
import { NFP_DISCLAIMER } from '../lib/knowledge'
import { dayStatus, evaluateNfp, isOvulationDay, STATUS_LABEL, type DayStatus, type NfpCycle } from '../lib/nfp'
import { nfpPhaseNote } from '../lib/alerts'
import { emptyDay, type DayEntry, type MucusCode } from '../lib/model'
import { LhHowTo } from './NfpSheet'
import type { SheetKind } from '../App'

interface Props {
  data: AppData
  onBack: () => void
  openSheet: (k: SheetKind, d: ISODate) => void
}

const STATUS_TEXT: Record<DayStatus, string> = {
  unfruchtbar: 'Nach den Regeln unfruchtbar.',
  fruchtbar: 'Fruchtbare Zeit. Eine Schwangerschaft ist möglich.',
  'ab-abend': 'Die Auswertung ist heute abgeschlossen. Unfruchtbar ab heute Abend.',
  offen: 'Wird nach Ihrer Beobachtung an diesem Tag ausgewertet.',
}

export default function FertilityView({ data, onBack, openSheet }: Props) {
  const today = todayISO()
  const s = data.settings
  const [idx, setIdx] = useState<number | null>(null)
  const [curve, setCurve] = useState(false)
  const [example, setExample] = useState(false)
  const [help, setHelp] = useState<'kurve' | 'lh' | null>(null)

  if (!s.nfpDisclaimerAccepted) {
    return (
      <Page title="Fruchtbarkeit" onBack={onBack}>
        <section className="card">
          <h2>Bevor Sie starten</h2>
          <p>{NFP_DISCLAIMER}</p>
          <p className="hint">
            Die Auswertung braucht tägliche Einträge: die Aufwachtemperatur und {s.modules.nfpMucus ? 'den Zervixschleim' : 'den Muttermund'}. Im ersten
            Zyklus gilt die Zeit bis zur Auswertung nach dem Eisprung als fruchtbar.
          </p>
          <button className="btn primary full" onClick={() => saveSettings({ nfpDisclaimerAccepted: true })}>Verstanden</button>
        </section>
      </Page>
    )
  }

  const results = data.nfp
  const sel = idx ?? results.length - 1
  const r = results[sel]
  const st = dayStatus(results, today, today)
  const ovuToday = isOvulationDay(results, today)
  const phase = nfpPhaseNote(s, today)
  const zt = r ? diffDays(r.start, today) + 1 : null

  return (
    <Page title="Fruchtbarkeit" onBack={onBack} onPrint={() => window.print()}>
      <section className={`fert-today fert-${st ?? 'none'}`}>
        <small>Heute, {weekdayShort(today)} {formatDE(today)}{zt && sel === results.length - 1 ? ` · Zyklustag ${zt}` : ''}</small>
        <b>{ovuToday ? 'Eisprung wahrscheinlich' : st ? STATUS_LABEL[st] : 'keine Auswertung'}</b>
        <span>{st ? STATUS_TEXT[st] : r?.reasonNotApplicable ?? 'Tragen Sie zuerst eine Periode ein.'}</span>
        <button className="btn small" onClick={() => openSheet('nfp', today)}>Heute eintragen</button>
      </section>

      <WeekStrip results={results} today={today} />
      {phase && <p className="msg">{phase}</p>}

      {r && (
        <section className="card">
          <div className="cycle-nav">
            <button className="icon-btn" disabled={sel === 0} onClick={() => setIdx(sel - 1)} aria-label="Vorheriger Zyklus">‹</button>
            <h2>
              Zyklus ab {formatDE(r.start)}
              {r.end ? ` (${diffDays(r.start, r.end) + 1} Tage)` : ' (läuft)'}
            </h2>
            <button className="icon-btn" disabled={sel === results.length - 1} onClick={() => setIdx(sel + 1)} aria-label="Nächster Zyklus">›</button>
          </div>
          <Summary r={r} />
          <div className="chips">
            <button className={`chip${curve ? ' on' : ''}`} onClick={() => setCurve(!curve)} aria-pressed={curve}>Kurve anzeigen</button>
            <button className="chip" onClick={() => setHelp(help === 'kurve' ? null : 'kurve')}>So lese ich die Kurve</button>
          </div>
          {help === 'kurve' && <CurveHelp />}
          {curve && <Chart r={r} days={data.days} today={today} />}
        </section>
      )}

      <section className="card">
        <h2>Zum Ausprobieren</h2>
        <p className="hint">Ein frei erfundener Beispielzyklus zeigt, wie die App auswertet.</p>
        <button className={`chip${example ? ' on' : ''}`} onClick={() => setExample(!example)} aria-pressed={example}>Beispielzyklus anzeigen</button>
        {example && <ExampleCycle />}
        {s.modules.lh && (
          <>
            <h2>LH-Test</h2>
            <button className="chip" onClick={() => setHelp(help === 'lh' ? null : 'lh')}>Anleitung</button>
            {help === 'lh' && <LhHowTo />}
          </>
        )}
      </section>

      <p className="hint disclaimer">{NFP_DISCLAIMER}</p>
    </Page>
  )
}

function Page({ title, onBack, onPrint, children }: { title: string; onBack: () => void; onPrint?: () => void; children: React.ReactNode }) {
  return (
    <div className="page fertility">
      <header className="page-head">
        <button className="icon-btn" onClick={onBack} aria-label="Zurück"><Icon name="back" /></button>
        <h1>{title}</h1>
        <span className="spacer" />
        {onPrint && <button className="btn ghost small" onClick={onPrint}>Drucken</button>}
      </header>
      <div className="page-body">{children}</div>
    </div>
  )
}

function WeekStrip({ results, today }: { results: NfpCycle[]; today: ISODate }) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 3))
  return (
    <div className="week-strip" aria-label="Fruchtbarkeit dieser Tage">
      {days.map((iso) => {
        const st = dayStatus(results, iso, today)
        const ovu = isOvulationDay(results, iso)
        return (
          <div key={iso} className={`ws-day fert-${st ?? 'none'}${iso === today ? ' today' : ''}`}>
            <small>{weekdayShort(iso)}</small>
            <b>{Number(iso.slice(8))}</b>
            <i>{ovu ? 'Eisprung' : st ? STATUS_LABEL[st].replace('unfruchtbar ab Abend', 'ab Abend') : '–'}</i>
          </div>
        )
      })}
    </div>
  )
}

function Summary({ r }: { r: NfpCycle }) {
  if (!r.applicable) return <p className="msg">{r.reasonNotApplicable}</p>
  const zt = (iso: ISODate) => diffDays(r.start, iso) + 1
  const rows: [string, string][] = []
  rows.push([
    'Zyklusanfang',
    r.infertileUntil
      ? `${r.startRule}: unfruchtbar bis Zyklustag ${zt(r.infertileUntil)}`
      : r.startRule === 'erster Zyklus'
        ? 'Kein ausgewerteter Vorzyklus: fruchtbar ab Tag 1'
        : `${r.startRule}: keine unfruchtbaren Tage`,
  ])
  if (r.earlySignDay) rows.push(['Vorzeitig beendet', `${r.sign} am Zyklustag ${zt(r.earlySignDay)} zeigt fruchtbare Zeit an`])
  rows.push([
    'Temperatur',
    r.firstHigher
      ? `Erste höhere Messung Zyklustag ${r.firstHigherZT}, Hilfslinie ${r.coverline?.toFixed(2).replace('.', ',')} °C${r.tempDone ? `, ausgewertet am Tag ${zt(r.tempDone)} (${r.tempRule})` : ''}`
      : 'noch kein Anstieg ausgewertet',
  ])
  if (r.sign)
    rows.push([
      r.sign === 'Schleim' ? 'Schleim-Höhepunkt' : 'Muttermund-Höhepunkt',
      r.peak ? `Zyklustag ${zt(r.peak)}${r.peakDone ? `, ausgewertet am Tag ${zt(r.peakDone)}` : ', Auswertung läuft'}` : 'noch nicht erkennbar',
    ])
  rows.push(['Ergebnis', r.infertileFrom ? `unfruchtbar ab dem Abend von Zyklustag ${zt(r.infertileFrom)} (doppelte Kontrolle)` : 'Auswertung nach dem Eisprung steht noch aus'])
  if (r.ovulation) rows.push(['Eisprung', `wahrscheinlich Zyklustag ${zt(r.ovulation.from)} bis ${zt(r.ovulation.to)}`])
  if (r.lhPositive) rows.push(['LH-Test', `erstmals positiv am Zyklustag ${zt(r.lhPositive)}`])
  return (
    <>
      <dl className="summary">
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      {r.notes.map((n) => (
        <p key={n} className="msg">{n}</p>
      ))}
    </>
  )
}

function CurveHelp() {
  return (
    <div className="howto">
      <p>
        <b>Punkte:</b> Ihre Aufwachtemperatur. Nach dem Eisprung steigt sie um etwa 0,2 bis 0,5 °C und bleibt bis zur nächsten Periode hoch.
      </p>
      <p>
        <b>Gestrichelte Linie (Hilfslinie):</b> der höchste der 6 Werte vor der ersten höheren Messung. Drei höhere Messungen in Folge über der Linie,
        die dritte mindestens 0,2 °C darüber, schließen die Temperaturauswertung ab (mit zwei Ausnahmeregeln).
      </p>
      <p>
        <b>Schleimzeile:</b> H markiert den Höhepunkt, also den letzten Tag mit der besten Qualität. Danach zählt die App 1, 2, 3 Tage mit schlechterer
        Qualität.
      </p>
      <p>
        <b>Farbband unten:</b> Erst wenn Temperatur und Schleim beide ausgewertet sind, ist die Zeit ab dem Abend unfruchtbar (doppelte Kontrolle).
        Hohle Punkte sind gestörte Werte und zählen nicht.
      </p>
    </div>
  )
}

const MUCUS_ROW: Record<MucusCode, string> = { t: 't', 'Ø': 'Ø', f: 'f', S: 'S', 'S+': 'S+' }

function Chart({ r, days, today }: { r: NfpCycle; days: Map<ISODate, DayEntry>; today: ISODate }) {
  const [pick, setPick] = useState<ISODate | null>(null)
  const last = r.end ?? today
  const span: ISODate[] = []
  for (let iso = r.start; iso <= last; iso = addDays(iso, 1)) span.push(iso)
  const temps = span.map((iso) => days.get(iso)?.temp).filter((t): t is number => t != null)
  if (temps.length === 0) return <p className="hint">Noch keine Temperaturen in diesem Zyklus.</p>
  const lo = Math.floor((Math.min(...temps) - 0.1) * 10) / 10
  const hi = Math.ceil((Math.max(...temps) + 0.1) * 10) / 10
  const W = 16
  const left = 34
  const top = 22
  const H = 150
  const width = left + span.length * W + 8
  const y = (t: number) => top + ((hi - t) / (hi - lo)) * H
  const x = (i: number) => left + i * W + W / 2
  const rowMucus = top + H + 18
  const rowBand = rowMucus + 14
  const height = rowBand + 24
  const results = [r]
  const peakIdx = r.peak ? span.indexOf(r.peak) : -1
  const fhIdx = r.firstHigher ? span.indexOf(r.firstHigher) : -1
  const ticks: number[] = []
  for (let t = lo; t <= hi + 1e-9; t += 0.1) ticks.push(Math.round(t * 100) / 100)

  // Linie nur durch gültige Werte
  const valid = span.map((iso, i) => ({ i, d: days.get(iso) })).filter((p) => p.d?.temp != null && !p.d.tempDisturbed)
  const path = valid.map((p, k) => `${k ? 'L' : 'M'}${x(p.i)},${y(p.d!.temp!)}`).join(' ')
  const picked = pick ? days.get(pick) ?? emptyDay(pick) : null

  return (
    <div className="chart-wrap">
      <div className="chart-scroll">
        <svg width={width} height={height} role="img" aria-label="Temperaturkurve dieses Zyklus">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={left} x2={width - 8} y1={y(t)} y2={y(t)} className="grid" />
              <text x={left - 4} y={y(t) + 3} className="axis" textAnchor="end">{t.toFixed(1).replace('.', ',')}</text>
            </g>
          ))}
          {span.map((iso, i) =>
            (days.get(iso)?.bleeding ?? 0) > 0 ? <rect key={iso} x={x(i) - 5} y={4} width={10} height={8} rx={4} className="bleed-mark" /> : null,
          )}
          {r.coverline !== null && fhIdx >= 0 && (
            <line x1={x(Math.max(0, fhIdx - 6))} x2={width - 8} y1={y(r.coverline)} y2={y(r.coverline)} className="coverline" />
          )}
          <path d={path} className="tline" />
          {span.map((iso, i) => {
            const d = days.get(iso)
            if (d?.temp == null) return null
            const n = fhIdx >= 0 && i >= fhIdx && i < fhIdx + 4 ? i - fhIdx + 1 : null
            return (
              <g key={iso}>
                <circle cx={x(i)} cy={y(d.temp)} r={4} className={d.tempDisturbed ? 'tdot off' : 'tdot'} />
                {n !== null && r.tempDone && iso <= r.tempDone && (
                  <text x={x(i)} y={y(d.temp) - 8} className="num" textAnchor="middle">{n}</text>
                )}
              </g>
            )
          })}
          {span.map((iso, i) => {
            const m = days.get(iso)?.mucus
            const tag = i === peakIdx ? 'H' : peakIdx >= 0 && i > peakIdx && i <= peakIdx + 3 ? String(i - peakIdx) : null
            return (
              <text key={iso} x={x(i)} y={rowMucus} className={`mrow${tag === 'H' ? ' peak' : ''}`} textAnchor="middle">
                {tag ?? (m ? MUCUS_ROW[m] : '')}
              </text>
            )
          })}
          {span.map((iso, i) => {
            const st = dayStatus(results, iso, today)
            return <rect key={iso} x={left + i * W + 1} y={rowBand} width={W - 2} height={8} rx={2} className={`band fert-${st ?? 'none'}`} />
          })}
          {span.map((iso, i) =>
            i % 5 === 0 ? (
              <text key={iso} x={x(i)} y={height - 2} className="axis" textAnchor="middle">{i + 1}</text>
            ) : null,
          )}
          {/* Große Trefferflächen pro Tag */}
          {span.map((iso, i) => (
            <rect key={iso} x={left + i * W} y={0} width={W} height={height} fill="transparent" onClick={() => setPick(pick === iso ? null : iso)}>
              <title>{formatDE(iso)}</title>
            </rect>
          ))}
          {pick && <line x1={x(span.indexOf(pick))} x2={x(span.indexOf(pick))} y1={top} y2={top + H} className="cross" />}
        </svg>
      </div>
      <div className="chart-legend">
        <span><i className="lg-dot" /> Temperatur</span>
        <span><i className="lg-dash" /> Hilfslinie</span>
        <span><i className="lg-band fert-fruchtbar" /> fruchtbar</span>
        <span><i className="lg-band fert-unfruchtbar" /> unfruchtbar</span>
      </div>
      <p className="hint">
        {picked
          ? `Zyklustag ${diffDays(r.start, picked.date) + 1}, ${formatDE(picked.date)}: ${picked.temp != null ? `${picked.temp.toFixed(2).replace('.', ',')} °C${picked.tempDisturbed ? ' (gestört)' : ''}` : 'keine Temperatur'}${picked.mucus ? `, Schleim ${picked.mucus}` : ''}${picked.lh ? `, LH ${picked.lh === 'neg' ? 'negativ' : 'positiv'}` : ''}`
          : 'Tippen Sie auf einen Tag, um die Werte zu sehen.'}
      </p>
    </div>
  )
}

/** Frei erfundener Beispielzyklus (28 Tage), Höhepunkt Tag 14, Anstieg ab Tag 15. */
function ExampleCycle() {
  const { r, days } = useMemo(() => {
    const T = [36.5, 36.45, 36.4, 36.45, 36.35, 36.4, 36.45, 36.35, 36.4, 36.5, 36.45, 36.4, 36.45, 36.35, 36.6, 36.5, 36.75, 36.8, 36.75, 36.8, 36.85, 36.8, 36.75, 36.8, 36.75, 36.7, 36.65, 36.55]
    const M: (MucusCode | null)[] = [null, null, null, null, null, 't', 't', 'Ø', 'Ø', 'f', 'f', 'S', 'S+', 'S+', 'S', 'f', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't', 't']
    const start = '2026-03-02'
    const list: DayEntry[] = T.map((t, i) => ({ ...emptyDay(addDays(start, i)), bleeding: i < 5 ? [3, 3, 2, 1, 0.5][i] : 0, temp: t, mucus: M[i] }))
    list.push({ ...emptyDay(addDays(start, 28)), bleeding: 3 })
    const map = new Map(list.map((d) => [d.date, d]))
    const res = evaluateNfp(computeCycles(list, { countSpotting: false, minGapDays: 7 }), map, { modules: { contraception: false, pain: false, endo: false, symptoms: false, nfp: true, nfpMucus: true, nfpCervix: false, lh: false } }, [], addDays(start, 28))
    return { r: res[0], days: map }
  }, [])
  return (
    <>
      <Summary r={r} />
      <p className="hint">
        Hier greift Ausnahmeregel 2: Der Wert an Tag 16 liegt nicht über der Hilfslinie und wird übergangen. Weil es der erste Zyklus ist, gilt der
        Anfang als fruchtbar.
      </p>
      <Chart r={r} days={days} today={addDays('2026-03-02', 28)} />
    </>
  )
}
