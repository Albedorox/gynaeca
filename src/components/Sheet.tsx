import { useEffect, useId, useRef, type ReactNode } from 'react'
import { useDialogFocus } from '../lib/useDialogFocus'

/** Bottom-Sheet: unten am Bildschirm, gut mit dem Daumen erreichbar. */
export default function Sheet({ title, subtitle, onClose, children }: { title: string; subtitle?: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const titleId = useId()
  useDialogFocus(ref, onClose)
  useEffect(() => {
    // Hintergrund nicht mitscrollen lassen, solange das Sheet offen ist
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  return (
    <div className="sheet-backdrop" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={ref} tabIndex={-1}>
        <div className="sheet-head">
          <div>
            <div className="sheet-title" id={titleId}>{title}</div>
            {subtitle && <div className="sheet-sub">{subtitle}</div>}
          </div>
          <button className="btn ghost" onClick={onClose} aria-label="Fertig, schließen">
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
