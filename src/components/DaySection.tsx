import type { ReactNode } from 'react'
import { CARE_ICON, Icon, SYMPTOM_ICON } from './Icons'

/** Abschnitt der Tagesansicht mit Überschrift und optionalem Link rechts. */
export function Section({ title, action, onAction, children, id }: { title: string; action?: string; onAction?: () => void; children: ReactNode; id?: string }) {
  return (
    <section className="dp-sec" id={id}>
      <div className="dp-sec-head">
        <h2>{title}</h2>
        {action && onAction && (
          <button className="link" onClick={onAction}>
            {action} <Icon name="chevron" size={16} />
          </button>
        )}
      </div>
      {children}
    </section>
  )
}

/** Raster runder Icon-Schalter, ein Tipp schaltet an oder aus. */
export function IconGrid({ items, on, onToggle, tone }: { items: string[]; on: string[]; onToggle: (s: string) => void; tone: string }) {
  return (
    <div className="icon-grid">
      {items.map((s) => (
        <button key={s} className={`ig-item${on.includes(s) ? ' on' : ''}`} onClick={() => onToggle(s)} aria-pressed={on.includes(s)}>
          <span className={`ig-icon tone-${tone}`}>
            <Icon name={SYMPTOM_ICON[s] ?? CARE_ICON[s] ?? 'sparkle'} />
          </span>
          <span className="ig-label">{s}</span>
        </button>
      ))}
    </div>
  )
}
