import { useEffect, useRef, useState } from 'react'
import type { AppData } from '../lib/useData'
import { courseOn } from '../lib/useData'
import { addDays, diffDays, daysInMonth, formatDE, monthShort, parseISO, shiftMonth, toISO, todayISO } from '../lib/dates'
import { cycleLabel, cycleStats } from '../lib/cycles'
import { medCount, type DayEntry } from '../lib/model'

function bleedStyle(d: DayEntry | undefined) {
  if (!d || d.bleeding === 0) return undefined
  return { background: `color-mix(in srgb, var(--blood) ${20 + d.bleeding * 16}%, transparent)` }
}

export default function Overview({ data, onBack, onPickMonth }: { data: AppData; onBack: () => void; onPickMonth: (y: number, m0: number) => void }) {
  const [tab, setTab] = useState<'months' | 'cycles'>('months')
  return (
    <div className="page overview">
      <header className="page-head">
        <button className="icon-btn" onClick={onBack} aria-label="Zurück">‹</button>
        <h1>Übersicht</h1>
        <span className="spacer" />
        <div className="seg">
          <button className={tab === 'months' ? 'on' : ''} onClick={() => setTab('months')}>Monate</button>
          <button className={tab === 'cycles' ? 'on' : ''} onClick={() => setTab('cycles')}>Zyklen</button>
        </div>
      </header>
      {tab === 'months' ? <MonthsZoom data={data} onPickMonth={onPickMonth} /> : <CycleList data={data} />}
    </div>
  )
}

function MonthsZoom({ data, onPickMonth }: { data: AppData; onPickMonth: (y: number, m0: number) => void }) {
  const t = parseISO(todayISO())
  const firstData = data.dayList[0]?.date
  let start = shiftMonth(t.y, t.m0, -11)
  if (firstData && firstData < toISO(start.y, start.m0, 1)) {
    const f = parseISO(firstData)
    start = { y: f.y, m0: f.m0 }
  }
  const months: { y: number; m0: number }[] = []
  for (let cur = start; cur.y * 12 + cur.m0 <= t.y * 12 + t.m0; cur = shiftMonth(cur.y, cur.m0, 1)) months.push(cur)

  const scroller = useRef<HTMLDivElement>(null)
  useEffect(() => {
    scroller.current?.scrollTo({ left: scroller.current.scrollWidth })
  }, [])

  return (
    <div className="zoom" ref={scroller}>
      <div className="zoom-axis">
        <span className="zoom-mh" />
        {Array.from({ length: 31 }, (_, i) => (
          <span key={i}>{(i + 1) % 5 === 0 || i === 0 ? i + 1 : ''}</span>
        ))}
      </div>
      {months.map(({ y, m0 }) => {
        const n = daysInMonth(y, m0)
        return (
          <button key={`${y}-${m0}`} className="zoom-month" onClick={() => onPickMonth(y, m0)}>
            <span className="zoom-mh">
              {monthShort(m0)}
              <small>{String(y).slice(2)}</small>
            </span>
            {Array.from({ length: 31 }, (_, i) => {
              if (i >= n) return <span key={i} className="zc void" />
              const iso = toISO(y, m0, i + 1)
              const d = data.days.get(iso)
              const start = data.cycles.find((c) => c.start === iso)
              const onPill = data.settings.modules.contraception && courseOn(data.courses, iso)
              return (
                <span key={i} className={`zc${start ? ' cs' : ''}${onPill ? ' onpill' : ''}`} style={bleedStyle(d)}>
                  {d?.spotting && <i className="zs" />}
                  {d?.pain != null && d.pain > 0 && <i className="zp" style={{ ['--p' as string]: d.pain }} />}
                  {medCount(d) > 0 && <i className="zm" />}
                  {start && <em>{cycleLabel(start)}</em>}
                </span>
              )
            })}
          </button>
        )
      })}
    </div>
  )
}

function CycleList({ data }: { data: AppData }) {
  const stats = cycleStats(data.cycles)
  const list = [...data.cycles].reverse()
  const fmt = (n: number | null) => (n === null ? '–' : String(n).replace('.', ','))
  return (
    <div className="cycles">
      <div className="stat-row">
        <div className="stat"><b>{stats.count}</b><small>Zyklen</small></div>
        <div className="stat"><b>{fmt(stats.avgBleed)}/{fmt(stats.avgLength)}</b><small>Ø Blutung/Länge</small></div>
        <div className="stat"><b>{fmt(stats.minLength)}–{fmt(stats.maxLength)}</b><small>Spanne Tage</small></div>
      </div>
      {list.length === 0 && <p className="muted pad">Sobald eine Blutung erfasst ist, erscheinen hier die Zyklen.</p>}
      {list.map((c) => {
        const len = c.length ?? Math.max(1, diffDays(c.start, todayISO()) + 1)
        let meds = 0
        let maxPain = 0
        const cells = Array.from({ length: len }, (_, i) => {
          const iso = addDays(c.start, i)
          const d = data.days.get(iso)
          meds += medCount(d)
          maxPain = Math.max(maxPain, d?.pain ?? 0)
          return (
            <span key={i} className="cc" style={bleedStyle(d)} title={`ZT ${i + 1}`}>
              {d?.spotting && <i className="zs" />}
              {d?.pain != null && d.pain > 0 && <i className="zp" style={{ ['--p' as string]: d.pain }} />}
              {d?.lh === 'peak' && <i className="zl" />}
            </span>
          )
        })
        return (
          <div key={c.start} className="cycle-row">
            <div className="cycle-meta">
              <b className="xy">{cycleLabel(c)}</b>
              <small>{formatDE(c.start)}{c.length === null ? ' · läuft' : ''}</small>
              <small className="muted">max. Schmerz {maxPain} · {meds}× Schmerzmittel</small>
            </div>
            <div className="cycle-strip">{cells}</div>
          </div>
        )
      })}
    </div>
  )
}
