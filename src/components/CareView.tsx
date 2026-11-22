import { useState } from 'react'
import type { AppData } from '../lib/useData'
import { addDays, daysInMonth, formatDE, monthName, parseISO, shiftMonth, toISO, todayISO, weekdayShort, type ISODate } from '../lib/dates'
import type { DayEntry } from '../lib/model'
import { careSummary, comparable, goodFoodCount, hasFood, movedEnough, painCompare, relaxed, unhealthyDay, usedAids, type PainCompare } from '../lib/care'
import { MEAL_SLOTS, MOVEMENT_GOAL_MIN } from '../lib/knowledge'
import type { CareTab } from './CareSections'
import { Icon } from './Icons'

interface Props {
  data: AppData
  tab: CareTab
  setTab: (t: CareTab) => void
  onBack: () => void
  onPickDay: (d: ISODate) => void
}

const TABS: { id: CareTab; label: string }[] = [
  { id: 'food', label: 'Ernährung' },
  { id: 'move', label: 'Bewegung' },
  { id: 'relax', label: 'Entspannung' },
  { id: 'aids', label: 'Hilfsmittel' },
]

/** Wie ein Tag im Kalender des jeweiligen Bereichs markiert wird. */
function markOf(tab: CareTab, e: DayEntry | undefined): string {
  if (!e) return ''
  switch (tab) {
    case 'food':
      if (unhealthyDay(e)) return 'm-less'
      if (goodFoodCount(e) >= 3) return 'm-good'
      return hasFood(e) ? 'm-some' : ''
    case 'move':
      return movedEnough(e) ? 'm-good' : (e.movementMin ?? 0) > 0 || e.movement.length ? 'm-some' : ''
    case 'relax':
      return relaxed(e) ? 'm-relax' : ''
    case 'aids':
      return usedAids(e) ? 'm-warm' : ''
  }
}

const COMPARE: Record<CareTab, { factor: (d: DayEntry | undefined) => boolean; lag: number; with: string; without: string }> = {
  food: { factor: unhealthyDay, lag: 1, with: 'Cheat Day oder ungünstig gegessen (am Tag oder Vortag)', without: 'sonst' },
  move: { factor: movedEnough, lag: 0, with: `mit ≥ ${MOVEMENT_GOAL_MIN} min Bewegung`, without: 'weniger Bewegung' },
  relax: { factor: relaxed, lag: 0, with: 'mit Entspannungsübung', without: 'ohne' },
  aids: { factor: usedAids, lag: 0, with: 'mit Hilfsmittel', without: 'ohne' },
}

/** Endometriose-Tagebuch: Monatskalender je Bereich, Zusammenhang mit Schmerz und Ernährungstagebuch. */
export default function CareView({ data, tab, setTab, onBack, onPickDay }: Props) {
  const today = todayISO()
  const t = parseISO(today)
  const [ym, setYm] = useState({ y: t.y, m0: t.m0 })
  const { y, m0 } = ym
  const n = daysInMonth(y, m0)
  const first = toISO(y, m0, 1)
  const last = toISO(y, m0, n)
  const lead = (new Date(Date.UTC(y, m0, 1)).getUTCDay() + 6) % 7
  const cells = Array.from({ length: Math.ceil((lead + n) / 7) * 7 }, (_, i) => addDays(first, i - lead))
  const sum = careSummary(data.dayList, first, last < today ? last : today)
  const c = COMPARE[tab]
  const cmp = painCompare(data.days, addDays(today, -89), today, c.factor, c.lag)
  const monthDays = data.dayList.filter((d) => d.date >= first && d.date <= last)

  return (
    <div className="page care">
      <header className="page-head">
        <button className="icon-btn" onClick={onBack} aria-label="Zurück"><Icon name="back" /></button>
        <h1>Endometriose-Tagebuch</h1>
        <span className="spacer" />
      </header>
      <div className="page-body">
        <div className="seg care-tabs" role="tablist">
          {TABS.map((x) => (
            <button key={x.id} role="tab" aria-selected={tab === x.id} className={tab === x.id ? 'on' : ''} onClick={() => setTab(x.id)}>
              {x.label}
            </button>
          ))}
        </div>

        <section className="card">
          <div className="cal-head">
            <button className="icon-btn" onClick={() => setYm(shiftMonth(y, m0, -1))} aria-label="Vorheriger Monat"><Icon name="back" /></button>
            <span className="cal-title small">{monthName(m0)} {y}</span>
            <button className="icon-btn" onClick={() => setYm(shiftMonth(y, m0, 1))} aria-label="Nächster Monat"><Icon name="chevron" /></button>
          </div>
          <div className="cal-wd" aria-hidden="true">
            {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((w) => <span key={w}>{w}</span>)}
          </div>
          <div className="cv-grid" role="grid" aria-label={`${monthName(m0)} ${y}`}>
            {cells.map((iso) => {
              const e = data.days.get(iso)
              const out = iso < first || iso > last
              const mark = markOf(tab, e)
              const per = (e?.bleeding ?? 0) > 0
              return (
                <button
                  key={iso}
                  role="gridcell"
                  className={`cv-day ${mark}${out ? ' out' : ''}${iso === today ? ' today' : ''}`}
                  onClick={() => onPickDay(iso)}
                  aria-label={`${Number(iso.slice(8))}. ${monthName(parseISO(iso).m0)}${e?.pain != null ? `, Schmerz ${e.pain}` : ''}${e?.cheatDay ? ', Cheat Day' : ''}`}
                >
                  <span className="cv-num">{Number(iso.slice(8))}</span>
                  {tab === 'food' && e?.cheatDay && <span className="cv-flag"><Icon name="cake" size={12} /></span>}
                  <span className="cv-meta">
                    {per && <i className="cv-blood" />}
                    {e?.pain != null && e.pain > 0 && <b className="cv-pain" style={{ ['--p' as string]: e.pain }}>{e.pain}</b>}
                  </span>
                </button>
              )
            })}
          </div>
          <Legend tab={tab} />
        </section>

        <PainCompareCard cmp={cmp} withLabel={c.with} withoutLabel={c.without} />

        <section className="card">
          <div className="card-head">
            <h2>{monthName(m0)} in Zahlen</h2>
          </div>
          <MonthNumbers tab={tab} sum={sum} />
        </section>

        {tab === 'food' && <FoodDiary days={monthDays} onPickDay={onPickDay} />}
      </div>
    </div>
  )
}

function Legend({ tab }: { tab: CareTab }) {
  return (
    <div className="legend">
      {tab === 'food' && (
        <>
          <span><i className="lg m-good" />mediterran (≥ 3 gute)</span>
          <span><i className="lg m-less" />Cheat Day / ungünstig</span>
          <span><i className="lg m-some" />eingetragen</span>
        </>
      )}
      {tab === 'move' && (
        <>
          <span><i className="lg m-good" />≥ {MOVEMENT_GOAL_MIN} min</span>
          <span><i className="lg m-some" />etwas Bewegung</span>
        </>
      )}
      {tab === 'relax' && <span><i className="lg m-relax" />Entspannung</span>}
      {tab === 'aids' && <span><i className="lg m-warm" />Hilfsmittel genutzt</span>}
      <span><b className="cv-pain lg-pain" style={{ ['--p' as string]: 6 }}>6</b>Schmerz</span>
      <span><i className="lg-dot cv-blood" />Blutung</span>
    </div>
  )
}

const fmt = (v: number | null) => (v === null ? '–' : String(v).replace('.', ','))

export function PainCompareCard({ cmp, withLabel, withoutLabel, title = 'Zusammenhang mit Schmerz' }: { cmp: PainCompare; withLabel: string; withoutLabel: string; title?: string }) {
  const ok = comparable(cmp)
  const max = 10
  return (
    <section className="card">
      <div className="card-head">
        <h2>{title}</h2>
        <small className="muted">letzte 90 Tage</small>
      </div>
      {ok ? (
        <>
          <div className="cmp">
            <div className="cmp-row">
              <span className="cmp-label">{withLabel}<small>{cmp.withN} Tage</small></span>
              <span className="cmp-bar"><i className="with" style={{ width: `${((cmp.withAvg ?? 0) / max) * 100}%` }} /></span>
              <b>{fmt(cmp.withAvg)}</b>
            </div>
            <div className="cmp-row">
              <span className="cmp-label">{withoutLabel}<small>{cmp.withoutN} Tage</small></span>
              <span className="cmp-bar"><i style={{ width: `${((cmp.withoutAvg ?? 0) / max) * 100}%` }} /></span>
              <b>{fmt(cmp.withoutAvg)}</b>
            </div>
          </div>
          <p className="hint">
            Ø Schmerz (0–10) an Tagen mit Schmerzeintrag.{' '}
            {Math.abs((cmp.withAvg ?? 0) - (cmp.withoutAvg ?? 0)) >= 1
              ? (cmp.withAvg ?? 0) > (cmp.withoutAvg ?? 0)
                ? 'Bei Ihnen war der Schmerz dabei spürbar höher.'
                : 'Bei Ihnen war der Schmerz dabei spürbar niedriger.'
              : 'Bisher kaum Unterschied.'}{' '}
            Ein Hinweis, kein Beweis: Zyklus und andere Einflüsse spielen mit.
          </p>
        </>
      ) : (
        <p className="hint">Erscheint, sobald es je mindestens 3 Tage mit und ohne Eintrag gibt, an denen Sie auch den Schmerz erfasst haben.</p>
      )}
    </section>
  )
}

function Top({ list, empty }: { list: [string, number][]; empty: string }) {
  if (!list.length) return <p className="hint">{empty}</p>
  const max = list[0][1]
  return (
    <div className="top">
      {list.slice(0, 8).map(([k, v]) => (
        <div key={k} className="top-row">
          <span>{k}</span>
          <span className="cmp-bar"><i style={{ width: `${(v / max) * 100}%` }} /></span>
          <b>{v}×</b>
        </div>
      ))}
    </div>
  )
}

function MonthNumbers({ tab, sum }: { tab: CareTab; sum: ReturnType<typeof careSummary> }) {
  if (tab === 'food')
    return (
      <>
        <div className="kpis three flat">
          <div className="kpi small"><small>Tage im Tagebuch</small><b>{sum.foodDays}</b></div>
          <div className="kpi small"><small>Cheat Days</small><b>{sum.cheatDays}</b></div>
          <div className="kpi small"><small>ungünstig</small><b>{sum.unhealthyDays}</b></div>
        </div>
        <h3>Am häufigsten</h3>
        <Top list={sum.food} empty="Noch keine Lebensmittel eingetragen." />
        {sum.supplements.length > 0 && (
          <>
            <h3>Ergänzungen</h3>
            <Top list={sum.supplements} empty="" />
          </>
        )}
        {sum.reactions.length > 0 && (
          <>
            <h3>Verträglichkeit</h3>
            <Top list={sum.reactions} empty="" />
          </>
        )}
      </>
    )
  if (tab === 'move')
    return (
      <>
        <div className="kpis three flat">
          <div className="kpi small"><small>Tage ≥ {MOVEMENT_GOAL_MIN} min</small><b>{sum.moveDays}</b></div>
          <div className="kpi small"><small>Ø pro Woche</small><b>{fmt(sum.movePerWeek)}</b></div>
          <div className="kpi small"><small>Ziel/Woche</small><b>3–5</b></div>
        </div>
        <Top list={sum.movement} empty="Noch keine Bewegungsart eingetragen." />
      </>
    )
  if (tab === 'relax')
    return (
      <>
        <div className="kpis three flat">
          <div className="kpi small"><small>Tage mit Übung</small><b>{sum.relaxDays}</b></div>
          <div className="kpi small"><small>Ø Stress</small><b>{fmt(sum.avgStress)}</b></div>
          <div className="kpi small"><small>Tage</small><b>{sum.span}</b></div>
        </div>
        <Top list={sum.relax} empty="Noch keine Übung eingetragen." />
      </>
    )
  return (
    <>
      <div className="kpis three flat">
        <div className="kpi small"><small>Tage mit Hilfsmittel</small><b>{sum.aidDays}</b></div>
        <div className="kpi small"><small>Anwendungen</small><b>{sum.aids.reduce((s, [, v]) => s + v, 0)}</b></div>
        <div className="kpi small"><small>Tage</small><b>{sum.span}</b></div>
      </div>
      <Top list={sum.aids} empty="Noch keine Hilfsmittel eingetragen." />
    </>
  )
}

function FoodDiary({ days, onPickDay }: { days: DayEntry[]; onPickDay: (d: ISODate) => void }) {
  const list = days.filter(hasFood).reverse()
  return (
    <section className="card">
      <div className="card-head">
        <h2>Ernährungstagebuch</h2>
        <small className="muted">{list.length} Tage</small>
      </div>
      {list.length === 0 && <p className="hint">Tragen Sie in der Tagesansicht unter „Ernährung“ ein, was Sie gegessen haben.</p>}
      {list.map((d) => (
        <button key={d.date} className="diary" onClick={() => onPickDay(d.date)}>
          <span className="diary-date">
            <b>{Number(d.date.slice(8))}.</b>
            <small>{weekdayShort(d.date)}</small>
          </span>
          <span className="diary-main">
            <span className="diary-tags">
              {d.cheatDay && <em className="tag less">Cheat Day</em>}
              {d.pain != null && d.pain > 0 && <em className="tag pain" style={{ ['--p' as string]: d.pain }}>Schmerz {d.pain}</em>}
              {d.food.map((f) => <em key={f} className="tag">{f}</em>)}
              {d.supplements.map((f) => <em key={f} className="tag supp">{f}</em>)}
            </span>
            {MEAL_SLOTS.filter((m) => d.meals[m.id]?.trim()).map((m) => (
              <small key={m.id}><b>{m.label}:</b> {d.meals[m.id]}</small>
            ))}
            {(d.water !== null || d.foodReaction.length > 0) && (
              <small className="muted">{[d.water !== null ? `${d.water} Gläser getrunken` : '', d.foodReaction.join(', ')].filter(Boolean).join(' · ')}</small>
            )}
          </span>
          <Icon name="chevron" className="lr-chev" />
        </button>
      ))}
      {list.length > 0 && <p className="hint">Stand {formatDE(todayISO())}. Tippen öffnet den Tag zum Bearbeiten.</p>}
    </section>
  )
}
