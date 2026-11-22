import { useEffect } from 'react'
import { formatDE, type ISODate } from '../lib/dates'

export interface MenuItem {
  label: string
  hint?: string
  onClick: () => void
  active?: boolean
}

/** Seitliches Menü (von links), schließt bei Tipp außerhalb oder Escape. */
export default function Menu({ focus, items, onClose }: { focus: ISODate; items: (MenuItem | 'sep')[]; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="menu-backdrop" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <nav className="menu" aria-label="Menü">
        <div className="menu-head">
          <b>Zyklusblatt</b>
          <small className="muted">Ausgewählter Tag: {formatDE(focus)}</small>
        </div>
        {items.map((it, i) =>
          it === 'sep' ? (
            <hr key={i} />
          ) : (
            <button
              key={it.label}
              className={`menu-item${it.active ? ' on' : ''}`}
              onClick={() => {
                onClose()
                it.onClick()
              }}
            >
              {it.label}
              {it.hint && <small>{it.hint}</small>}
            </button>
          ),
        )}
      </nav>
    </div>
  )
}
