import { useRef, useState } from 'react'
import { updateDay } from '../lib/db'
import type { ISODate } from '../lib/dates'

const DRAG_THRESHOLD = 6

/**
 * Blutungsstärke: horizontal wischen setzt 0–5 in 0,5er-Schritten (Balken folgt dem Finger),
 * einmal tippen schaltet Schmierblutung an/aus.
 */
export default function BleedingCell({ date, bleeding, spotting }: { date: ISODate; bleeding: number; spotting: boolean }) {
  const [draft, setDraft] = useState<number | null>(null)
  const st = useRef<{ x: number; y: number; dragging: boolean; rect: DOMRect; last: number } | null>(null)
  const value = draft ?? bleeding

  const valueAt = (clientX: number, rect: DOMRect) => {
    const pad = 4
    const rel = (clientX - rect.left - pad) / (rect.width - pad * 2)
    return Math.max(0, Math.min(5, Math.round(rel * 10) / 2))
  }

  return (
    <div
      className="cell bleed"
      role="slider"
      aria-label="Blutungsstärke"
      aria-valuemin={0}
      aria-valuemax={5}
      aria-valuenow={value}
      aria-valuetext={`${String(value).replace('.', ',')}${spotting ? ', Schmierblutung' : ''}`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') updateDay(date, { bleeding: Math.min(5, bleeding + 0.5) })
        else if (e.key === 'ArrowLeft') updateDay(date, { bleeding: Math.max(0, bleeding - 0.5) })
        else if (e.key === ' ' || e.key === 'Enter') updateDay(date, { spotting: !spotting })
        else return
        e.preventDefault()
      }}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        st.current = { x: e.clientX, y: e.clientY, dragging: false, rect: e.currentTarget.getBoundingClientRect(), last: bleeding }
      }}
      onPointerMove={(e) => {
        const s = st.current
        if (!s) return
        if (!s.dragging && Math.abs(e.clientX - s.x) > DRAG_THRESHOLD) s.dragging = true
        if (s.dragging) {
          const v = valueAt(e.clientX, s.rect)
          if (v !== s.last) {
            s.last = v
            navigator.vibrate?.(4)
          }
          setDraft(v)
        }
      }}
      onPointerUp={() => {
        const s = st.current
        st.current = null
        if (!s) return
        if (s.dragging) {
          const v = s.last
          setDraft(null)
          if (v !== bleeding) updateDay(date, { bleeding: v })
        } else {
          updateDay(date, { spotting: !spotting })
        }
      }}
      onPointerCancel={() => {
        st.current = null
        setDraft(null)
      }}
    >
      <span className={`spot${spotting ? ' on' : ''}`} aria-hidden="true" />
      <span className="drops" aria-hidden="true">
        {[0, 1, 2, 3, 4].map((i) => {
          const fill = Math.max(0, Math.min(1, value - i))
          return (
            <span key={i} className="drop">
              <span className="drop-fill" style={{ width: `${fill * 100}%`, opacity: 0.45 + value * 0.11 }} />
            </span>
          )
        })}
      </span>
      {draft !== null && <span className="bleed-val">{String(draft).replace('.', ',')}</span>}
    </div>
  )
}
