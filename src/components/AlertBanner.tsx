import { useState } from 'react'
import type { AppData } from '../lib/useData'
import type { SheetKind } from '../App'
import type { ISODate } from '../lib/dates'

const KEY = 'zyklusblatt-hidden-alerts'

function readHidden(): string[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}

/** Hinweise zum Zyklus (Lebensphase, lange Pausen). Ausblendbar, kommt bei neuer Lage wieder. */
export default function AlertBanner({ data }: { data: AppData; openSheet?: (k: SheetKind, d: ISODate) => void }) {
  const [hidden, setHidden] = useState<string[]>(readHidden)
  const [open, setOpen] = useState(false)
  // Schlüssel mit Zyklusbeginn, damit ein ausgeblendeter Hinweis im nächsten Zyklus wieder erscheint
  const cur = data.cycles[data.cycles.length - 1]?.start ?? ''
  const visible = data.alerts.filter((a) => !hidden.includes(`${a.id}@${cur}`))
  if (visible.length === 0) return null
  const a = visible[0]
  const hide = () => {
    const next = [...hidden, `${a.id}@${cur}`]
    setHidden(next)
    try {
      localStorage.setItem(KEY, JSON.stringify(next))
    } catch {
      /* ohne Speicher nur für diese Sitzung */
    }
  }
  return (
    <div className={`alert alert-${a.level}`} role="status">
      <button className="alert-main" onClick={() => setOpen(!open)} aria-expanded={open}>
        <b>{a.title}</b>
        {visible.length > 1 && <small> +{visible.length - 1} weitere</small>}
        {open && <span className="alert-text">{a.text}</span>}
      </button>
      <button className="alert-x" onClick={hide} aria-label="Hinweis ausblenden">✕</button>
    </div>
  )
}
