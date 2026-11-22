import { useEffect, type ReactNode } from 'react'

/** Bottom-Sheet: unten am Bildschirm, gut mit dem Daumen erreichbar. */
export default function Sheet({ title, subtitle, onClose, children }: { title: string; subtitle?: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="sheet-backdrop" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="sheet-head">
          <div>
            <div className="sheet-title">{title}</div>
            {subtitle && <div className="sheet-sub">{subtitle}</div>}
          </div>
          <button className="btn ghost" onClick={onClose} aria-label="Schließen">
            Fertig
          </button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  )
}

export function Chip({ on, onClick, children, title }: { on?: boolean; onClick: () => void; children: ReactNode; title?: string }) {
  return (
    <button type="button" className={`chip${on ? ' on' : ''}`} onClick={onClick} title={title} aria-pressed={!!on}>
      {children}
    </button>
  )
}
