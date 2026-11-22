import { useRef, useState } from 'react'
import type { AppData } from '../lib/useData'
import { courseOn } from '../lib/useData'
import { addDays, diffDays, monthName, parseISO, todayISO, weekdayShort, type ISODate } from '../lib/dates'
import { cycleDay } from '../lib/cycles'
import { medCount } from '../lib/model'
import { updateDay } from '../lib/db'
import type { SheetKind } from '../App'

const RANGE = 3 // Tage vor und nach dem Fokus-Tag
const LONG_PRESS_MS = 320
const MOVE_TOLERANCE = 10

interface Props {
  data: AppData
  focus: ISODate
  setFocus: (d: ISODate) => void
  openSheet: (k: SheetKind, d: ISODate) => void
  openMenu: () => void
}

/**
 * Hauptansicht: der Fokus-Tag (standardmäßig heute) mit 3 Tagen davor und danach.
 * Tippen auf einen Tag öffnet Schmerz/Medikation, Halten und seitlich Ziehen stellt die Blutung ein.
 * Senkrecht wischen blättert tageweise.
 */
export default function DayView({ data, focus, setFocus, openSheet, openMenu }: Props) {
  const today = todayISO()
  const days = Array.from({ length: RANGE * 2 + 1 }, (_, i) => addDays(focus, i - RANGE))
  const { m0, y } = parseISO(focus)
  const swipe = useRef<{ y: number; t: number } | null>(null)

  return (
    <div className="dayview">
      <header className="month-head">
        <button className="icon-btn" onClick={openMenu} aria-label="Menü">☰</button>
        <h1 className="dv-title">
          {monthName(m0)} <span className="muted">{y}</span>
        </h1>
        <span className="spacer" />
        {focus !== today && (
          <button className="btn ghost small" onClick={() => setFocus(today)}>Heute</button>
        )}
      </header>

      <div
        className="dv-list"
        onPointerDown={(e) => (swipe.current = { y: e.clientY, t: Date.now() })}
        onPointerUp={(e) => {
          const s = swipe.current
          swipe.current = null
          if (!s) return
          const dy = e.clientY - s.y
          if (Math.abs(dy) > 50 && Date.now() - s.t < 600) {
            // nach oben wischen = spätere Tage, nach unten = frühere
            const steps = Math.max(1, Math.round(Math.abs(dy) / 90))
            setFocus(addDays(focus, dy < 0 ? steps : -steps))
          }
        }}
        onPointerCancel={() => (swipe.current = null)}
      >
        <button className="dv-nav" onClick={() => setFocus(addDays(focus, -1))} aria-label="Einen Tag zurück">︿</button>
        {data.settings.modules.contraception && <ContraRail data={data} days={days} openSheet={openSheet} />}
        {days.map((iso) => (
          <DayCard key={iso} iso={iso} data={data} isFocus={iso === focus} isToday={iso === today} onTap={() => openSheet('pain', iso)} />
        ))}
        <button className="dv-nav" onClick={() => setFocus(addDays(focus, 1))} aria-label="Einen Tag vor">﹀</button>
      </div>
    </div>
  )
}

function ContraRail({ data, days, openSheet }: { data: AppData; days: ISODate[]; openSheet: Props['openSheet'] }) {
  return (
    <div className="dv-rail" aria-label="Hormonelle Verhütung">
      {days.map((iso) => {
        const c = courseOn(data.courses, iso)
        return (
          <button
            key={iso}
            className={`rail-seg${c ? ' on' : ''}${c?.start === iso ? ' s' : ''}${c?.end === iso ? ' e' : ''}`}
            onClick={() => openSheet('contra', iso)}
            aria-label={c ? `${c.name}: tippen zum Beenden` : 'Präparat ab diesem Tag starten'}
          >
            {c && (c.start === iso || iso === days[0]) && <span className="rail-label">{c.name}</span>}
          </button>
        )
      })}
    </div>
  )
}

function Drops({ value }: { value: number }) {
  return (
    <span className="dv-drops" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, value - i))
        return (
          <span key={i} className={`dv-drop${fill === 0.5 ? ' half' : fill === 1 ? ' full' : ''}`} />
        )
      })}
    </span>
  )
}

function DayCard({ iso, data, isFocus, isToday, onTap }: { iso: ISODate; data: AppData; isFocus: boolean; isToday: boolean; onTap: () => void }) {
  const d = data.days.get(iso)
  const bleeding = d?.bleeding ?? 0
  const [draft, setDraft] = useState<number | null>(null)
  const st = useRef<{ x: number; y: number; timer: number; dragging: boolean; start: number; step: number; last: number; moved: boolean } | null>(null)
  const value = draft ?? bleeding
  const zt = cycleDay(data.cycles, iso)
  const mc = medCount(d)
  const symptoms = d?.symptoms.length ?? 0
  const isEmpty = bleeding === 0 && !d?.spotting && d?.pain == null && mc === 0 && symptoms === 0
  const future = diffDays(todayISO(), iso) > 0

  const end = () => {
    const s = st.current
    if (s) window.clearTimeout(s.timer)
    st.current = null
    return s
  }

  return (
    <div
      className={`dv-card${isFocus ? ' focus' : ''}${isToday ? ' today' : ''}${draft !== null ? ' dragging' : ''}${future ? ' future' : ''}`}
      role="button"
      tabIndex={0}
      aria-label={`${weekdayShort(iso)} ${Number(iso.slice(8))}. Tippen: Schmerz. Halten und ziehen: Blutung.`}
      onContextMenu={(e) => e.preventDefault()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onTap()
        else if (e.key === 'ArrowRight') updateDay(iso, { bleeding: Math.min(5, bleeding + 0.5) })
        else if (e.key === 'ArrowLeft') updateDay(iso, { bleeding: Math.max(0, bleeding - 0.5) })
        else return
        e.preventDefault()
      }}
      onPointerDown={(e) => {
        const el = e.currentTarget
        // Pointer sofort einfangen, damit Bewegung und Loslassen auch außerhalb der Karte ankommen
        try {
          el.setPointerCapture(e.pointerId)
        } catch {
          /* ignorieren */
        }
        const width = el.getBoundingClientRect().width
        const s = {
          x: e.clientX,
          y: e.clientY,
          dragging: false,
          moved: false,
          start: bleeding,
          last: bleeding,
          step: Math.max(18, (width * 0.8) / 10),
          timer: 0,
        }
        s.timer = window.setTimeout(() => {
          if (st.current !== s || s.moved) return
          s.dragging = true
          navigator.vibrate?.(15)
          setDraft(s.start)
        }, LONG_PRESS_MS)
        st.current = s
      }}
      onPointerMove={(e) => {
        const s = st.current
        if (!s) return
        if (!s.dragging) {
          if (Math.abs(e.clientX - s.x) > MOVE_TOLERANCE || Math.abs(e.clientY - s.y) > MOVE_TOLERANCE) {
            s.moved = true
            window.clearTimeout(s.timer)
          }
          return
        }
        e.stopPropagation()
        const v = Math.max(0, Math.min(5, s.start + Math.round((e.clientX - s.x) / s.step) * 0.5))
        if (v !== s.last) {
          s.last = v
          navigator.vibrate?.(5)
          setDraft(v)
        }
      }}
      onPointerUp={(e) => {
        const s = end()
        if (!s) return
        if (s.dragging) {
          e.stopPropagation()
          setDraft(null)
          if (s.last !== bleeding) updateDay(iso, { bleeding: s.last })
        } else if (!s.moved) {
          onTap()
        }
      }}
      onPointerCancel={() => {
        end()
        setDraft(null)
      }}
    >
      <span className="dv-day">
        <b>{Number(iso.slice(8))}</b>
        <small>{weekdayShort(iso)}</small>
      </span>

      <span className="dv-body">
        {draft !== null ? (
          <>
            <Drops value={value} />
            <span className="dv-big">{String(value).replace('.', ',')}</span>
          </>
        ) : isEmpty ? (
          isFocus && <span className="dv-hint">Tippen: Schmerzen · Halten &amp; ziehen: Blutung</span>
        ) : (
          <>
            {(bleeding > 0 || d?.spotting) && <Drops value={bleeding} />}
            {d?.spotting && <span className="dv-tag spot-tag">Schmier</span>}
            {d?.pain != null && (
              <span className="dv-tag pain-tag" style={{ ['--p' as string]: d.pain }}>
                Schmerz {d.pain}
              </span>
            )}
            {mc > 0 && (
              <span className="dv-tag med-tag" title={d!.meds.map((m) => m.name).join(', ')}>
                <i className="pill" /> {mc}×
              </span>
            )}
            {symptoms > 0 && <span className="dv-tag">+{symptoms} Sympt.</span>}
          </>
        )}
      </span>
      {zt && <span className="dv-zt">ZT {zt}</span>}
    </div>
  )
}
