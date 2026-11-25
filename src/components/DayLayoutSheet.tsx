import { useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import Sheet from './Sheet'
import { Icon } from './Icons'
import { saveSettings } from '../lib/db'
import type { AppData } from '../lib/useData'
import type { DayLayout } from '../lib/model'
import { DEFAULT_LAYOUT, SECTION_BY_ID, hideSection, moveSection, resolveLayout, showSection } from '../lib/dayLayout'

/**
 * Tagesansicht anpassen: oben die sichtbaren Abschnitte (am Griff sortierbar),
 * darunter „Ausgeblendet“ und die in den Einstellungen abgeschalteten Funktionen.
 */
export default function DayLayoutSheet({ data, onClose, onSettings }: { data: AppData; onClose: () => void; onSettings: () => void }) {
  const layout = data.settings.dayLayout
  const modules = data.settings.modules
  const { visible, hidden, off } = resolveLayout(layout, modules)
  const save = (l: DayLayout) => saveSettings({ dayLayout: l })

  // Gleiten an den neuen Platz nach Ein-/Ausblenden (FLIP)
  const bodyRef = useRef<HTMLDivElement>(null)
  const before = useRef<Map<string, number> | null>(null)
  const remember = () => {
    const m = new Map<string, number>()
    bodyRef.current?.querySelectorAll<HTMLElement>('[data-sec]').forEach((el) => m.set(el.dataset.sec!, el.getBoundingClientRect().top))
    before.current = m
  }
  useLayoutEffect(() => {
    const m = before.current
    if (!m || !bodyRef.current) return
    before.current = null
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    bodyRef.current.querySelectorAll<HTMLElement>('[data-sec]').forEach((el) => {
      const t0 = m.get(el.dataset.sec!)
      if (t0 === undefined) return
      const dy = t0 - el.getBoundingClientRect().top
      if (!dy) return
      el.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.2,.8,.2,1)' })
    })
  }, [layout])

  const toggle = (id: string, on: boolean) => {
    remember()
    save(on ? showSection(layout, modules, id) : hideSection(layout, id))
  }

  // Ziehen am Griff: alle Zeilen gleich hoch, Ziel aus der Verschiebung
  const [drag, setDrag] = useState<{ from: number; to: number; dy: number } | null>(null)
  const dragRef = useRef<{ from: number; y0: number; step: number } | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const onGripDown = (e: PointerEvent<HTMLButtonElement>, i: number) => {
    const rows = listRef.current?.querySelectorAll<HTMLElement>(':scope > .lay-row')
    if (!rows?.length) return
    const step = rows.length > 1 ? rows[1].offsetTop - rows[0].offsetTop : rows[0].offsetHeight
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      /* egal */
    }
    dragRef.current = { from: i, y0: e.clientY, step }
    setDrag({ from: i, to: i, dy: 0 })
    navigator.vibrate?.(8)
  }
  const onGripMove = (e: PointerEvent<HTMLButtonElement>) => {
    const s = dragRef.current
    if (!s) return
    const n = visible.length
    const dy = Math.max(-s.from * s.step - 8, Math.min((n - 1 - s.from) * s.step + 8, e.clientY - s.y0))
    const to = Math.max(0, Math.min(n - 1, Math.round(s.from + dy / s.step)))
    setDrag((d) => {
      if (d && d.to !== to) navigator.vibrate?.(4)
      return { from: s.from, to, dy }
    })
  }
  const onGripUp = () => {
    const s = dragRef.current
    dragRef.current = null
    if (drag && s && drag.to !== s.from) save(moveSection(layout, modules, s.from, drag.to))
    setDrag(null)
  }
  const onGripKey = (e: KeyboardEvent, i: number) => {
    const d = e.key === 'ArrowUp' ? -1 : e.key === 'ArrowDown' ? 1 : 0
    if (!d) return
    e.preventDefault()
    const to = i + d
    if (to < 0 || to >= visible.length) return
    save(moveSection(layout, modules, i, to))
    // Fokus bleibt auf dem Griff des verschobenen Abschnitts
    const id = visible[i]
    requestAnimationFrame(() => listRef.current?.querySelector<HTMLElement>(`[data-sec="${id}"] .lay-grip`)?.focus())
  }
  const shift = (j: number) => {
    if (!drag) return undefined
    if (j === drag.from) return { transform: `translateY(${drag.dy}px)`, transition: 'none', zIndex: 2 }
    if (drag.from < drag.to && j > drag.from && j <= drag.to) return { transform: 'translateY(calc(-1 * var(--lay-step)))' }
    if (drag.from > drag.to && j < drag.from && j >= drag.to) return { transform: 'translateY(var(--lay-step))' }
    return undefined
  }

  return (
    <Sheet title="Tagesansicht anpassen" subtitle="Am Griff ziehen zum Sortieren. Ausgeblendetes bleibt in Statistik und Bericht." onClose={onClose}>
      <div className="lay" ref={bodyRef}>
        <div className="lay-fixed">
          <span className="lr-icon"><Icon name="drop" /></span>
          <span className="lay-name">Mein Zyklus</span>
          <small>immer oben</small>
          <Icon name="lock" size={16} />
        </div>

        <div className="lay-list" ref={listRef} role="list">
          {visible.map((id, j) => {
            const s = SECTION_BY_ID[id]
            return (
              <div key={id} data-sec={id} role="listitem" className={`lay-row${drag?.from === j ? ' dragging' : ''}`} style={shift(j)}>
                <button
                  type="button"
                  className="lay-grip"
                  aria-label={`${s.title} verschieben, Position ${j + 1} von ${visible.length}. Pfeiltasten hoch und runter.`}
                  onPointerDown={(e) => onGripDown(e, j)}
                  onPointerMove={onGripMove}
                  onPointerUp={onGripUp}
                  onPointerCancel={onGripUp}
                  onKeyDown={(e) => onGripKey(e, j)}
                >
                  <Icon name="grip" size={18} />
                </button>
                <span className="lr-icon"><Icon name={s.icon} /></span>
                <span className="lay-name">{s.title}</span>
                <button type="button" className="lay-switch" role="switch" aria-checked="true" aria-label={`${s.title} in der Tagesansicht zeigen`} onClick={() => toggle(id, false)} />
              </div>
            )
          })}
        </div>

        <h3 className="lay-h">Ausgeblendet{hidden.length > 0 && <span> {hidden.length}</span>}</h3>
        {hidden.length === 0 && <p className="lay-empty">Schalter ausschalten, dann landet der Abschnitt hier.</p>}
        {hidden.map((id) => {
          const s = SECTION_BY_ID[id]
          return (
            <div key={id} data-sec={id} className="lay-row off">
              <span className="lay-grip" aria-hidden="true" />
              <span className="lr-icon"><Icon name={s.icon} /></span>
              <span className="lay-name">{s.title}<small>ausgeblendet</small></span>
              <button type="button" className="lay-switch" role="switch" aria-checked="false" aria-label={`${s.title} in der Tagesansicht zeigen`} onClick={() => toggle(id, true)} />
            </div>
          )
        })}

        {off.length > 0 && (
          <>
            <h3 className="lay-h">Funktion in den Einstellungen aus</h3>
            {off.map((id) => {
              const s = SECTION_BY_ID[id]
              return (
                <button key={id} type="button" className="lay-row disabled" onClick={onSettings}>
                  <span className="lr-icon"><Icon name={s.icon} /></span>
                  <span className="lay-name">{s.title}</span>
                  <span className="link">Einschalten <Icon name="chevron" size={16} /></span>
                </button>
              )
            })}
          </>
        )}

        <button type="button" className="btn ghost lay-reset" onClick={() => { remember(); save(DEFAULT_LAYOUT) }}>
          Standard wiederherstellen
        </button>
      </div>
    </Sheet>
  )
}
