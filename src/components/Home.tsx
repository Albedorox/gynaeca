import { useRef, useState, type ReactNode } from 'react'
import type { AppData } from '../lib/useData'
import { addDays, diffDays, daysInMonth, monthName, parseISO, shiftMonth, toISO, todayISO, type ISODate } from '../lib/dates'
import { cycleFor, predictNext, type Prediction } from '../lib/cycles'
import { medCount } from '../lib/model'
import { bleedingLevel } from '../lib/knowledge'
import { dayStatus, isOvulationDay, STATUS_LABEL } from '../lib/nfp'
import { Icon } from './Icons'
import AlertBanner from './AlertBanner'
import { loadDemo } from '../lib/demo'

interface Props {
  data: AppData
  ym: { y: number; m0: number }
  setYm: (v: { y: number; m0: number }) => void
  onOpenDay: (d: ISODate) => void
  onFertility: () => void
}

/** Startseite: Zyklusring mit dem Wichtigsten von heute, darunter der Monatskalender. */
export default function Home({ data, ym, setYm, onOpenDay, onFertility }: Props) {
  const today = todayISO()
  const prediction = predictNext(data.cycles, today)
  return (
    <div className="home">
      <header className="home-head">
        <span className="wordmark">Gynaeca</span>
      </header>
      <CycleRing data={data} today={today} prediction={prediction} onOpenDay={onOpenDay} onFertility={onFertility} />
      <AlertBanner data={data} />
      {data.dayList.length === 0 && (
        <div className="alert alert-info">
          <span className="alert-main">
            <b>Noch keine Einträge</b>
            <span className="alert-text">Tippen Sie auf einen Tag im Kalender oder auf das Plus, um die Blutung einzutragen. Zum Ausprobieren gibt es Beispielzyklen.</span>
          </span>
          <button className="btn small" onClick={() => loadDemo()}>Beispiel laden</button>
        </div>
      )}
      <Calendar data={data} ym={ym} setYm={setYm} today={today} prediction={prediction} onOpenDay={onOpenDay} />
    </div>
  )
}

/* ---------------- Zyklusring ---------------- */

function polar(cx: number, cy: number, r: number, frac: number) {
  const a = frac * Math.PI * 2 - Math.PI / 2
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)]
}
function arc(cx: number, cy: number, r: number, f0: number, f1: number) {
  const [x0, y0] = polar(cx, cy, r, f0)
  const [x1, y1] = polar(cx, cy, r, f1)
  return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${r} ${r} 0 ${f1 - f0 > 0.5 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`
}

function CycleRing({ data, today, prediction, onOpenDay, onFertility }: { data: AppData; today: ISODate; prediction: Prediction | null; onOpenDay: (d: ISODate) => void; onFertility: () => void }) {
  const [slide, setSlide] = useState(0)
  const track = useRef<HTMLDivElement>(null)
  const cur = cycleFor(data.cycles, today)
  const zt = cur ? diffDays(cur.start, today) + 1 : null
  const nfpOn = data.settings.modules.nfp
  const L = Math.max(zt ?? 0, prediction?.length ?? 28)
  const todayEntry = data.days.get(today)

  // Segmente des Rings: ein Bogen pro Zyklustag
  const segs = cur
    ? Array.from({ length: L }, (_, i) => {
        const iso = addDays(cur.start, i)
        const e = data.days.get(iso)
        let kind = iso <= today ? 'past' : 'future'
        if ((e?.bleeding ?? 0) > 0 || (iso >= cur.start && iso <= cur.periodEnd)) kind = 'period'
        else if (e?.spotting) kind = 'spot'
        else if (nfpOn) {
          if (isOvulationDay(data.nfp, iso)) kind = 'ovu'
          else if (dayStatus(data.nfp, iso, today) === 'fruchtbar') kind = 'fert'
        }
        return { i, kind }
      })
    : []
  const gap = L > 40 ? 0.002 : 0.004
  const C = 130
  const R = 116
  const [mx, my] = zt ? polar(C, C, R, (Math.min(zt, L) - 0.5) / L) : [0, 0]

  // Inhalt der ersten Karte
  const periodLen = cur ? diffDays(cur.start, cur.periodEnd) + 1 : 0
  const inPeriod = !!cur && zt !== null && ((todayEntry?.bleeding ?? 0) > 0 || (zt <= periodLen + 1 && zt <= 10 && cur.periodEnd >= addDays(today, -1)))
  const daysToNext = prediction ? diffDays(today, prediction.start) : null
  const usual = data.cycles.filter((c) => c.length !== null).slice(-6)
  const usualLen = usual.length ? Math.round(usual.reduce((s, c) => s + (c.length as number), 0) / usual.length) : null
  const late = !prediction && usualLen !== null && zt !== null && zt > usualLen ? zt - usualLen : null

  const slides: { key: string; node: ReactNode }[] = []
  if (!cur) {
    slides.push({
      key: 'start',
      node: (
        <>
          <span className="ring-kicker">Willkommen</span>
          <b className="ring-title">Ihr Zyklus auf einen Blick</b>
          <span className="ring-sub">Tragen Sie den ersten Tag Ihrer letzten Periode ein.</span>
          <button className="btn primary btn-pill" onClick={() => onOpenDay(today)}>Periode eintragen</button>
        </>
      ),
    })
  } else {
    slides.push({
      key: 'cycle',
      node: (
        <>
          <b className="ring-num">{zt}<small>.</small></b>
          <span className="ring-label">{inPeriod ? 'Periodentag' : 'Zyklustag'}</span>
          <span className="ring-sub">
            {inPeriod && todayEntry && todayEntry.bleeding > 0
              ? `Heute: ${bleedingLevel(todayEntry.bleeding).label}`
              : daysToNext !== null
                ? daysToNext === 1
                  ? 'Periode voraussichtlich morgen'
                  : `Periode in ca. ${daysToNext} Tagen`
                : late !== null
                  ? `${late} ${late === 1 ? 'Tag' : 'Tage'} länger als üblich`
                  : inPeriod
                    ? 'Wie stark ist die Blutung heute?'
                    : ' '}
          </span>
          <button className="btn primary btn-pill" onClick={() => onOpenDay(today)}>
            {inPeriod ? (todayEntry?.bleeding ? 'Heute bearbeiten' : 'Blutung von heute') : 'Periode hat begonnen'}
          </button>
        </>
      ),
    })
    const d = todayEntry
    const mc = medCount(d)
    slides.push({
      key: 'today',
      node: (
        <>
          <span className="ring-kicker">Heute</span>
          <div className="ring-facts">
            <span><b>{d?.pain ?? '–'}</b><small>Schmerz</small></span>
            <span><b>{mc || '–'}</b><small>Mittel</small></span>
            <span><b>{d?.symptoms.length || '–'}</b><small>Symptome</small></span>
          </div>
          <button className="btn primary btn-pill" onClick={() => onOpenDay(today)}>Tag eintragen</button>
        </>
      ),
    })
    if (nfpOn) {
      const st = dayStatus(data.nfp, today, today)
      const ovu = isOvulationDay(data.nfp, today)
      slides.push({
        key: 'nfp',
        node: (
          <>
            <span className="ring-kicker">Fruchtbarkeit</span>
            <b className={`ring-title fert-${st ?? 'none'}`}>{ovu ? 'Eisprung wahrscheinlich' : st ? STATUS_LABEL[st] : 'Keine Auswertung'}</b>
            <span className="ring-sub">nach Ihren Einträgen (NFP)</span>
            <button className="btn primary btn-pill" onClick={onFertility}>Auswertung</button>
          </>
        ),
      })
    }
  }

  const go = (i: number) => {
    const el = track.current
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
  }

  return (
    <section className="ring-wrap" aria-label="Zyklus heute">
      <div className="ring-deco" aria-hidden="true" />
      <div className="ring">
        <svg viewBox="0 0 260 260" className="ring-svg" aria-hidden="true">
          <circle cx={C} cy={C} r={R} className="ring-track" />
          {segs.map((s) => (
            <path key={s.i} d={arc(C, C, R, s.i / L + gap, (s.i + 1) / L - gap)} className={`rs rs-${s.kind}`} />
          ))}
          {zt !== null && <circle cx={mx} cy={my} r="11" className="ring-marker" />}
        </svg>
        <div
          className="ring-slides"
          ref={track}
          onScroll={(e) => {
            const el = e.currentTarget
            setSlide(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)))
          }}
        >
          {slides.map((s) => (
            <div key={s.key} className="ring-slide">
              {s.node}
            </div>
          ))}
        </div>
        {slides.length > 1 && (
          <div className="ring-dots" role="tablist" aria-label="Karten">
            {slides.map((s, i) => (
              <button key={s.key} role="tab" aria-selected={i === slide} aria-label={`Karte ${i + 1}`} className={i === slide ? 'on' : ''} onClick={() => go(i)} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

/* ---------------- Monatskalender ---------------- */

type Kind = 'period' | 'spot' | 'pred' | 'fert' | 'none'

function Calendar({ data, ym, setYm, today, prediction, onOpenDay }: { data: AppData; ym: { y: number; m0: number }; setYm: Props['setYm']; today: ISODate; prediction: Prediction | null; onOpenDay: (d: ISODate) => void }) {
  const { y, m0 } = ym
  const n = daysInMonth(y, m0)
  const first = toISO(y, m0, 1)
  const lead = (new Date(Date.UTC(y, m0, 1)).getUTCDay() + 6) % 7 // Montag = 0
  const start = addDays(first, -lead)
  const weeks = Math.ceil((lead + n) / 7)
  const nfpOn = data.settings.modules.nfp
  const swipe = useRef<{ x: number; y: number } | null>(null)

  // Vorhergesagte Perioden (nächste und zwei weitere)
  const pred = new Set<ISODate>()
  if (prediction) {
    for (let k = 0; k < 3; k++) {
      const s = addDays(prediction.start, k * prediction.length)
      for (let i = 0; i < prediction.days; i++) pred.add(addDays(s, i))
    }
  }

  const kindOf = (iso: ISODate): Kind => {
    const e = data.days.get(iso)
    if ((e?.bleeding ?? 0) > 0) return 'period'
    const c = cycleFor(data.cycles, iso)
    if (c && iso <= c.periodEnd) return 'period'
    if (e?.spotting) return 'spot'
    if (pred.has(iso) && iso > today) return 'pred'
    if (nfpOn && dayStatus(data.nfp, iso, today) === 'fruchtbar') return 'fert'
    return 'none'
  }

  const go = (d: number) => setYm(shiftMonth(y, m0, d))
  const isThisMonth = parseISO(today).y === y && parseISO(today).m0 === m0

  return (
    <section
      className="cal"
      onPointerDown={(e) => (swipe.current = { x: e.clientX, y: e.clientY })}
      onPointerUp={(e) => {
        const s = swipe.current
        swipe.current = null
        if (!s) return
        const dx = e.clientX - s.x
        if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(e.clientY - s.y) * 1.5) go(dx < 0 ? 1 : -1)
      }}
    >
      <div className="cal-head">
        <button className="icon-btn" onClick={() => go(-1)} aria-label="Vorheriger Monat"><Icon name="back" /></button>
        <button
          className="cal-title"
          onClick={() => {
            const t = parseISO(today)
            setYm({ y: t.y, m0: t.m0 })
          }}
          title="Zum aktuellen Monat"
        >
          {monthName(m0)} {y}
        </button>
        <button className="icon-btn" onClick={() => go(1)} aria-label="Nächster Monat"><Icon name="chevron" /></button>
      </div>
      {!isThisMonth && (
        <button className="cal-today-link" onClick={() => setYm({ y: parseISO(today).y, m0: parseISO(today).m0 })}>Zurück zu heute</button>
      )}
      <div className="cal-wd" aria-hidden="true">
        {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((w) => <span key={w}>{w}</span>)}
      </div>
      <div className="cal-grid" role="grid" aria-label={`${monthName(m0)} ${y}`}>
        {Array.from({ length: weeks }, (_, w) => {
          const row = Array.from({ length: 7 }, (_, i) => addDays(start, w * 7 + i))
          const kinds = row.map(kindOf)
          return (
            <div key={w} className="cal-row" role="row">
              {row.map((iso, i) => {
                const k = kinds[i]
                const e = data.days.get(iso)
                const out = iso.slice(0, 7) !== first.slice(0, 7)
                const ovu = nfpOn && isOvulationDay(data.nfp, iso)
                const l = i === 0 || kinds[i - 1] !== k
                const r = i === 6 || kinds[i + 1] !== k
                const mc = medCount(e)
                const label = [
                  `${Number(iso.slice(8))}. ${monthName(parseISO(iso).m0)}`,
                  iso === today ? 'heute' : '',
                  k === 'period' ? (e && e.bleeding > 0 ? `Blutung ${bleedingLevel(e.bleeding).label}` : 'Periode') : '',
                  k === 'spot' ? 'Schmierblutung' : '',
                  k === 'pred' ? 'Periode erwartet' : '',
                  k === 'fert' ? 'fruchtbar' : '',
                  ovu ? 'Eisprung' : '',
                  e?.pain ? `Schmerz ${e.pain}` : '',
                  mc ? `${mc} Medikamente` : '',
                ]
                  .filter(Boolean)
                  .join(', ')
                return (
                  <button
                    key={iso}
                    role="gridcell"
                    className={`cal-day k-${k}${l ? ' bl' : ''}${r ? ' br' : ''}${out ? ' out' : ''}${iso === today ? ' today' : ''}${ovu ? ' ovu' : ''}${iso > today ? ' future' : ''}`}
                    onClick={() => onOpenDay(iso)}
                    aria-label={label}
                  >
                    <span className="cd-num">{Number(iso.slice(8))}</span>
                    <span className="cd-dots" aria-hidden="true">
                      {(e?.pain ?? 0) > 0 && <i className="dot-pain" />}
                      {mc > 0 && <i className="dot-med" />}
                      {(e?.symptoms.length ?? 0) > 0 && <i className="dot-sym" />}
                      {data.settings.modules.sex && (e?.sex === 'geschuetzt' || e?.sex === 'ungeschuetzt') && <i className="dot-sex" />}
                    </span>
                  </button>
                )
              })}
            </div>
          )
        })}
      </div>
      <div className="legend" aria-label="Legende">
        <span><i className="lg k-period" />Periode</span>
        {prediction && <span><i className="lg k-pred" />Erwartet</span>}
        {nfpOn && <span><i className="lg k-fert" />Fruchtbar</span>}
        {nfpOn && <span><i className="lg ovu" />Eisprung (Zeitraum)</span>}
        <span><i className="lg-dot dot-pain" />Schmerz</span>
        <span><i className="lg-dot dot-med" />Mittel</span>
        <span><i className="lg-dot dot-sym" />Symptom</span>
        {data.settings.modules.sex && <span><i className="lg-dot dot-sex" />GV</span>}
      </div>
      {prediction && <p className="hint center small">Die Erwartung ist ein Durchschnitt Ihrer letzten Zyklen und kein Verhütungsschutz.</p>}
    </section>
  )
}
