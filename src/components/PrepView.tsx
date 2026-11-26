import { useMemo, useState } from 'react'
import { Icon } from './Icons'
import type { AppData } from '../lib/useData'
import { parseISO, todayISO, type ISODate } from '../lib/dates'
import type { ContraceptionCourse } from '../lib/model'
import type { SheetKind } from '../App'
import {
  BREAKTHROUGH,
  byStartDesc,
  durationLabel,
  effectiveEnd,
  formLabel,
  formOf,
  hormonePauses,
  isHormonal,
  monthYear,
  periodLabel,
  PREP_FORMS,
  prepStats,
  RATINGS,
  type Pause,
} from '../lib/preparations'

interface Props {
  data: AppData
  onBack: () => void
  onReport: () => void
  openSheet: (k: SheetKind, d: ISODate, id?: number) => void
}

type Filter = 'all' | 'contra' | 'gyn'
type Item = { kind: 'course'; c: ContraceptionCourse } | { kind: 'pause'; p: Pause }

/** Präparate-Verlauf: alle hormonellen Präparate und Dauermedikamente über die ganze Nutzungszeit. */
export default function PrepView({ data, onBack, onReport, openSheet }: Props) {
  const today = todayISO()
  const [filter, setFilter] = useState<Filter>('all')
  const courses = useMemo(() => [...data.courses].sort(byStartDesc), [data.courses])
  const pauses = useMemo(() => hormonePauses(data.courses, today), [data.courses, today])
  const hasGyn = courses.some((c) => !isHormonal(c))
  const hasContra = courses.some(isHormonal)
  const current = courses.find((c) => isHormonal(c) && c.start <= today && (c.end === null || c.end >= today))
  const first = courses.length ? courses[courses.length - 1].start : null

  const items: Item[] = useMemo(() => {
    const list: Item[] = courses
      .filter((c) => filter === 'all' || (filter === 'gyn') === !isHormonal(c))
      .map((c) => ({ kind: 'course', c }))
    if (filter !== 'gyn') for (const p of pauses) list.push({ kind: 'pause', p })
    const start = (i: Item) => (i.kind === 'course' ? i.c.start : i.p.start)
    return list.sort((a, b) => (start(a) < start(b) ? 1 : start(a) > start(b) ? -1 : 0))
  }, [courses, pauses, filter])

  const add = () => openSheet('prep', today)

  return (
    <div className="page preps">
      <header className="page-head">
        <button className="icon-btn" onClick={onBack} aria-label="Zurück"><Icon name="back" /></button>
        <h1>Präparate</h1>
        <span className="spacer" />
        <button className="icon-btn prep-add" onClick={add} aria-label="Präparat hinzufügen"><Icon name="plus" /></button>
      </header>
      <div className="page-body">
        {courses.length === 0 ? (
          <section className="prep-empty">
            <span className="prep-empty-icon"><Icon name="pill" size={30} /></span>
            <h2>Ihr Präparate-Verlauf</h2>
            <p>Tragen Sie hier Pillen, Hormonspiralen und andere hormonelle Präparate ein, auch frühere. Gynaeca wertet aus, wie Sie sie vertragen haben, und nimmt alles in den Arztbericht auf.</p>
            <button className="btn primary" onClick={add}>Erstes Präparat hinzufügen</button>
          </section>
        ) : (
          <>
            <div className="prep-sum" aria-label="Überblick">
              <div className={current ? 'cur' : ''}>
                <small>Aktuell</small>
                {current ? (
                  <b>
                    <i style={{ background: formColor(current) }} />
                    {current.name} <span>seit {monthYear(current.start)}</span>
                  </b>
                ) : (
                  <b className="none">kein hormonelles Präparat</b>
                )}
              </div>
              <div><small>Präparate</small><b className="num">{courses.length}</b></div>
              <div><small>Erfasst seit</small><b className="num">{first ? monthYear(first) : '–'}</b></div>
            </div>

            <Timeline courses={courses} pauses={pauses} today={today} hasGyn={hasGyn} onPick={(id) => openSheet('prepInfo', today, id)} />

            {hasGyn && hasContra && (
              <div className="prep-filters" role="group" aria-label="Filter">
                {(
                  [
                    ['all', 'Alle'],
                    ['contra', 'Verhütung'],
                    ['gyn', 'Dauermedikation'],
                  ] as const
                ).map(([k, l]) => (
                  <button key={k} type="button" className={`chip small${filter === k ? ' on' : ''}`} aria-pressed={filter === k} onClick={() => setFilter(k)}>
                    {l}
                  </button>
                ))}
              </div>
            )}

            <div className="prep-list">
              {items.map((it) =>
                it.kind === 'course' ? (
                  <PrepCard key={it.c.id} c={it.c} data={data} today={today} onOpen={() => openSheet('prepInfo', today, it.c.id)} />
                ) : (
                  <PauseCard key={`p-${it.p.start}`} p={it.p} data={data} today={today} />
                ),
              )}
            </div>

            <button className="prep-report" onClick={onReport}>
              <Icon name="doc" size={20} />
              Im Arztbericht ansehen
            </button>
          </>
        )}
      </div>
    </div>
  )
}

/** Farbe je Form, als CSS-Variable aus styles.css */
export function formColor(c: ContraceptionCourse): string {
  return `var(--f-${formOf(c) ?? 'pille'})`
}

function shortName(n: string): string {
  return n.replace('Schmierblutung', BREAKTHROUGH)
}

function PrepCard({ c, data, today, onOpen }: { c: ContraceptionCourse; data: AppData; today: ISODate; onOpen: () => void }) {
  const st = useMemo(() => prepStats(c, data.dayList, data.cycles, data.courses, today), [c, data.dayList, data.cycles, data.courses, today])
  const notable = st?.symptoms.filter((s) => s.notable).slice(0, 3) ?? []
  const running = c.end === null || c.end >= today
  const rating = RATINGS.find((r) => r.id === c.rating)
  const sub = [c.substance && `(${c.substance})`, c.dose].filter(Boolean).join(' · ')
  return (
    <button className="prep-card" onClick={onOpen}>
      <span className="pc-bar" style={{ background: formColor(c) }} />
      <span className="pc-name">
        {c.name}
        {sub && <small>{sub}</small>}
      </span>
      <span className={`vt ${rating ? `vt-${rating.id}` : 'vt-open'}`}>{rating ? rating.label : running ? 'läuft' : 'offen'}</span>
      <span className="pc-when num">
        {formLabel(formOf(c))} · {periodLabel(c, today, running)} · {durationLabel(c.start, effectiveEnd(c, today))}
      </span>
      <span className="pc-tags">
        {notable.length > 0 ? (
          notable.map((s) => (
            <span key={s.name} className={`tag${s.basePct === null || s.pct >= s.basePct * 2 ? ' up' : ''}`}>
              {shortName(s.name)} {s.pct} %
            </span>
          ))
        ) : (
          <span className="tag">{c.approx ? 'nachgetragen, ohne Tagesdaten' : st ? 'nichts häufiger als sonst' : 'noch zu wenige Einträge'}</span>
        )}
      </span>
    </button>
  )
}

function PauseCard({ p, data, today }: { p: Pause; data: AppData; today: ISODate }) {
  const end = p.end ?? today
  const inside = data.cycles.filter((c) => c.start >= p.start && (c.end ?? today) <= end)
  const closed = inside.filter((c) => c.length !== null)
  const avg = (a: number[]) => (a.length ? Math.round(a.reduce((s, x) => s + x, 0) / a.length) : null)
  const len = avg(closed.map((c) => c.length as number))
  const bleed = avg(inside.map((c) => c.bleedDays))
  return (
    <div className="prep-card pause" role="note">
      <span className="pc-bar" />
      <span className="pc-name">{p.end ? 'Pause ohne Hormone' : 'Ohne Hormone'}</span>
      <span className="vt vt-open">Pause</span>
      <span className="pc-when num">
        {p.end ? `${monthYear(p.start)} – ${monthYear(p.end)}` : `seit ${monthYear(p.start)}`} · {durationLabel(p.start, end)}
      </span>
      <span className="pc-tags">
        {len !== null && <span className="tag">Eigener Zyklus Ø {len} Tage</span>}
        {bleed !== null && <span className="tag">Blutung Ø {bleed} Tage</span>}
        <span className="tag">Vergleichszeit für die Auswertung</span>
      </span>
    </div>
  )
}

function Timeline({ courses, pauses, today, hasGyn, onPick }: { courses: ContraceptionCourse[]; pauses: Pause[]; today: ISODate; hasGyn: boolean; onPick: (id: number) => void }) {
  const firstYear = parseISO(courses[courses.length - 1].start).y
  const lastYear = parseISO(today).y
  const t0 = Date.UTC(firstYear, 0, 1)
  const t1 = Date.UTC(lastYear + 1, 0, 1)
  const pos = (iso: ISODate) => {
    const { y, m0, d } = parseISO(iso)
    return ((Date.UTC(y, m0, d) - t0) / (t1 - t0)) * 100
  }
  const span = lastYear - firstYear + 1
  const step = Math.max(1, Math.ceil(span / 4))
  const years: number[] = []
  for (let y = firstYear; y <= lastYear; y += step) years.push(y)
  const used = new Set(courses.map((c) => formOf(c) ?? 'pille'))
  const forms = PREP_FORMS.map((f) => f.id).filter((f) => used.has(f))

  const seg = (c: ContraceptionCourse) => {
    const l = pos(c.start)
    const r = pos(effectiveEnd(c, today)) + 100 / (span * 365)
    const run = c.end === null || c.end >= today
    return (
      <button
        key={c.id}
        type="button"
        className={`tl-seg${run ? ' run' : ''}`}
        style={{ left: `${l}%`, width: `${Math.max(1.2, r - l)}%`, background: formColor(c) }}
        aria-label={`${c.name}, ${periodLabel(c, today)}`}
        onClick={() => onPick(c.id!)}
      />
    )
  }

  return (
    <section className="prep-tl" aria-label="Zeitstrahl">
      <h3>
        <span>Zeitstrahl</span>
        <span className="num">{firstYear} – heute</span>
      </h3>
      <div className="tl-track">
        {pauses.map((p) => {
          const l = pos(p.start)
          const r = pos(p.end ?? today)
          return <span key={p.start} className="tl-seg tl-pause" style={{ left: `${l}%`, width: `${Math.max(0.8, r - l)}%` }} />
        })}
        {courses.filter(isHormonal).map(seg)}
      </div>
      {hasGyn && <div className="tl-track gyn">{courses.filter((c) => !isHormonal(c)).map(seg)}</div>}
      <div className="tl-axis num">
        {years.map((y) => (
          <span key={y} style={{ left: `${pos(`${y}-01-01`)}%` }}>{y}</span>
        ))}
      </div>
      <div className="tl-legend">
        {forms.map((f) => (
          <span key={f}>
            <i style={{ background: `var(--f-${f})` }} />
            {formLabel(f)}
          </span>
        ))}
        {pauses.length > 0 && (
          <span>
            <i className="pause" />
            Pause
          </span>
        )}
      </div>
    </section>
  )
}
