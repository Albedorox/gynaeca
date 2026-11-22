import { useState } from 'react'
import type { AppData } from '../lib/useData'
import { addDays, diffDays, formatDE, monthShort, parseISO, todayISO } from '../lib/dates'
import { cycleStats, type Cycle } from '../lib/cycles'
import { medCount } from '../lib/model'
import { MonthsZoom } from './Overview'
import { Icon } from './Icons'

interface Props {
  data: AppData
  onReport: () => void
  onTable: () => void
  onFertility: () => void
  onPickMonth: (y: number, m0: number) => void
}

// Orientierungswerte für Erwachsene (FIGO): Zyklus 24–38 Tage, Blutung bis 8 Tage.
// Altersabhängige Hinweise kommen zusätzlich aus alerts.ts.
const CYCLE_OK = [24, 38] as const
const BLEED_OK = [1, 8] as const

export default function Stats({ data, onReport, onTable, onFertility, onPickMonth }: Props) {
  const [tab, setTab] = useState<'cycles' | 'year'>('cycles')
  return (
    <div className="page stats">
      <header className="tab-head">
        <h1>Statistik</h1>
        <div className="seg" role="tablist">
          <button role="tab" aria-selected={tab === 'cycles'} className={tab === 'cycles' ? 'on' : ''} onClick={() => setTab('cycles')}>Zyklen</button>
          <button role="tab" aria-selected={tab === 'year'} className={tab === 'year' ? 'on' : ''} onClick={() => setTab('year')}>Jahresblatt</button>
        </div>
      </header>
      {tab === 'year' ? (
        <MonthsZoom data={data} onPickMonth={onPickMonth} />
      ) : (
        <div className="page-body">
          <CycleCards data={data} />
          <BarCard title="Zykluslänge" unit="Tage" cycles={data.cycles.filter((c) => c.length !== null)} value={(c) => c.length as number} ok={CYCLE_OK} />
          <BarCard title="Periodendauer" unit="Tage" cycles={data.cycles} value={(c) => c.bleedDays} ok={BLEED_OK} />
          <PainCard data={data} />

          <button className="promo" onClick={onReport}>
            <span className="promo-icon"><Icon name="doc" size={28} /></span>
            <span>
              <b>Bericht für die Praxis</b>
              <small>Blutung, Schmerz und Medikamente als PDF für Ihre Gynäkologin</small>
            </span>
            <Icon name="chevron" className="lr-chev" />
          </button>
          <div className="list-card">
            <button className="list-row" onClick={onTable}>
              <span className="lr-icon"><Icon name="table" /></span>
              <span className="lr-main">Zyklusblatt als Tabelle<small>Ein Monat, alle Werte pro Tag, zum Eintragen</small></span>
              <Icon name="chevron" className="lr-chev" />
            </button>
            {data.settings.modules.nfp && (
              <button className="list-row" onClick={onFertility}>
                <span className="lr-icon"><Icon name="thermo" /></span>
                <span className="lr-main">Fruchtbarkeit<small>NFP-Auswertung, Temperaturkurve, Anleitung</small></span>
                <Icon name="chevron" className="lr-chev" />
              </button>
            )}
          </div>

          <History data={data} />
        </div>
      )}
    </div>
  )
}

function Badge({ ok }: { ok: boolean | null }) {
  if (ok === null) return null
  return <span className={`badge ${ok ? 'ok' : 'warn'}`}>{ok ? '✓ im üblichen Bereich' : 'außerhalb des üblichen Bereichs'}</span>
}

function CycleCards({ data }: { data: AppData }) {
  const closed = data.cycles.filter((c) => c.length !== null)
  const last = closed[closed.length - 1]
  const lastPeriod = data.cycles[data.cycles.length - 1]
  const s = cycleStats(data.cycles)
  const fmt = (n: number | null) => (n === null ? '–' : String(n).replace('.', ','))
  return (
    <>
      <div className="kpis">
        <div className="kpi">
          <small>Letzter Zyklus</small>
          <b>{last ? `${last.length} Tage` : '–'}</b>
          {last && <Badge ok={last.length! >= CYCLE_OK[0] && last.length! <= CYCLE_OK[1]} />}
        </div>
        <div className="kpi">
          <small>Letzte Periode</small>
          <b>{lastPeriod ? `${lastPeriod.bleedDays} ${lastPeriod.bleedDays === 1 ? 'Tag' : 'Tage'}` : '–'}</b>
          {lastPeriod && <Badge ok={lastPeriod.bleedDays <= BLEED_OK[1]} />}
        </div>
      </div>
      <div className="kpis three">
        <div className="kpi small"><small>Zyklen</small><b>{s.count}</b></div>
        <div className="kpi small"><small>Ø Länge</small><b>{fmt(s.avgLength)}</b></div>
        <div className="kpi small"><small>Spanne</small><b>{s.minLength !== null ? `${s.minLength}–${s.maxLength}` : '–'}</b></div>
      </div>
    </>
  )
}

function BarCard({ title, unit, cycles, value, ok }: { title: string; unit: string; cycles: Cycle[]; value: (c: Cycle) => number; ok: readonly [number, number] }) {
  const list = cycles.slice(-8)
  const max = Math.max(ok[1], ...list.map(value)) + 2
  return (
    <section className="card chart-card">
      <div className="card-head">
        <h2>{title}</h2>
        <small className="muted">letzte {list.length || 0}</small>
      </div>
      {list.length === 0 ? (
        <p className="hint">Erscheint, sobald ein Zyklus abgeschlossen ist.</p>
      ) : (
        <div className="bars" style={{ ['--max' as string]: max }}>
          <div className="bars-band" style={{ bottom: `${(ok[0] / max) * 100}%`, height: `${((ok[1] - ok[0]) / max) * 100}%` }} aria-hidden="true" />
          {list.map((c) => {
            const v = value(c)
            const inRange = v >= ok[0] && v <= ok[1]
            return (
              <div key={c.start} className="bar-col" title={`ab ${formatDE(c.start)}: ${v} ${unit}`}>
                <span className="bar-val">{v}</span>
                <span className={`bar${inRange ? '' : ' warn'}`} style={{ height: `${(v / max) * 100}%` }} />
                <small>{Number(c.start.slice(8))}. {monthShort(parseISO(c.start).m0)}</small>
              </div>
            )
          })}
        </div>
      )}
      <p className="hint">Hinterlegt: üblicher Bereich {ok[0]}–{ok[1]} {unit}.</p>
    </section>
  )
}

function PainCard({ data }: { data: AppData }) {
  if (!data.settings.modules.pain) return null
  const today = todayISO()
  const from = addDays(today, -89)
  const days = data.dayList.filter((d) => d.date >= from && d.date <= today)
  const painDays = days.filter((d) => (d.pain ?? 0) > 0)
  const strong = painDays.filter((d) => (d.pain ?? 0) >= 7).length
  const meds = days.reduce((s, d) => s + medCount(d), 0)
  const avg = painDays.length ? (painDays.reduce((s, d) => s + (d.pain ?? 0), 0) / painDays.length).toFixed(1).replace('.', ',') : '–'
  return (
    <section className="card">
      <div className="card-head">
        <h2>Schmerz</h2>
        <small className="muted">letzte 90 Tage</small>
      </div>
      <div className="kpis three flat">
        <div className="kpi small"><small>Tage mit Schmerz</small><b>{painDays.length}</b></div>
        <div className="kpi small"><small>Ø Stärke</small><b>{avg}</b></div>
        <div className="kpi small"><small>Einnahmen</small><b>{meds}</b></div>
      </div>
      {strong > 0 && <p className="hint">{strong} {strong === 1 ? 'Tag' : 'Tage'} mit starkem Schmerz (7–10).</p>}
    </section>
  )
}

function History({ data }: { data: AppData }) {
  const list = [...data.cycles].reverse().slice(0, 12)
  return (
    <section className="card">
      <div className="card-head">
        <h2>Zyklusverlauf</h2>
      </div>
      <div className="legend left">
        <span><i className="lg k-period" />Periode</span>
        <span><i className="lg-dot dot-pain" />Schmerz ≥ 4</span>
      </div>
      {list.length === 0 && <p className="hint">Sobald eine Blutung erfasst ist, erscheinen hier die Zyklen.</p>}
      {list.map((c) => {
        const len = c.length ?? Math.max(1, diffDays(c.start, todayISO()) + 1)
        return (
          <div key={c.start} className="hist">
            <div className="hist-meta">
              <b>{formatDE(c.start).slice(0, 6)} – {c.end ? formatDE(c.end).slice(0, 6) : 'jetzt'}</b>
              <small>{c.bleedDays} Tage Periode · {len} Tage Zyklus{c.length === null ? ' (läuft)' : ''}</small>
            </div>
            <div className="hist-strip" aria-hidden="true">
              {Array.from({ length: len }, (_, i) => {
                const iso = addDays(c.start, i)
                const e = data.days.get(iso)
                const per = (e?.bleeding ?? 0) > 0 || iso <= c.periodEnd
                return <i key={i} className={`hs${per ? ' per' : ''}${(e?.pain ?? 0) >= 4 ? ' pain' : ''}`} />
              })}
            </div>
          </div>
        )
      })}
    </section>
  )
}
