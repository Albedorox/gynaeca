import { useState, type ReactNode } from 'react'
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

/** Raster runder Icon-Schalter, ein Tipp schaltet an oder aus. Mit `removable` im Löschmodus: diese Kacheln tragen ein ×, ein Tipp entfernt sie. */
export function IconGrid({ items, on, onToggle, tone, removable, onRemove }: { items: string[]; on: string[]; onToggle: (s: string) => void; tone: string; removable?: string[]; onRemove?: (s: string) => void }) {
  const editing = !!removable && !!onRemove
  return (
    <div className={`icon-grid${editing ? ' editing' : ''}`}>
      {items.map((s) => {
        const canRemove = editing && removable!.includes(s)
        if (editing)
          return (
            <button key={s} className={`ig-item${canRemove ? ' removable' : ''}`} disabled={!canRemove} onClick={() => onRemove!(s)} aria-label={canRemove ? `${s} löschen` : s}>
              <span className={`ig-icon tone-${tone}`}>
                <Icon name={SYMPTOM_ICON[s] ?? CARE_ICON[s] ?? 'sparkle'} />
                {canRemove && <i className="ig-remove" aria-hidden="true"><Icon name="close" size={12} /></i>}
              </span>
              <span className="ig-label">{s}</span>
            </button>
          )
        return (
          <button key={s} className={`ig-item${on.includes(s) ? ' on' : ''}`} onClick={() => onToggle(s)} aria-pressed={on.includes(s)}>
            <span className={`ig-icon tone-${tone}`}>
              <Icon name={SYMPTOM_ICON[s] ?? CARE_ICON[s] ?? 'sparkle'} />
            </span>
            <span className="ig-label">{s}</span>
          </button>
        )
      })}
    </div>
  )
}

/** Symptom-Raster mit „Eigene bearbeiten“: eigene Symptome lassen sich direkt hier löschen. */
export function SymptomGrid({ items, on, onToggle, custom, onRemove }: { items: string[]; on: string[]; onToggle: (s: string) => void; custom: string[]; onRemove: (s: string) => void }) {
  const [editing, setEditing] = useState(false)
  const active = editing && custom.length > 0
  return (
    <>
      <IconGrid items={items} on={on} onToggle={onToggle} tone="sym" removable={active ? custom : undefined} onRemove={active ? onRemove : undefined} />
      {custom.length > 0 && (
        <div className="ig-edit-row">
          {active && <span className="hint">Tippen Sie auf ein eigenes Symptom, um es zu löschen. Frühere Einträge bleiben erhalten.</span>}
          <button type="button" className="btn-reset" onClick={() => setEditing(!active)} aria-pressed={active}>
            {active ? 'Fertig' : 'Eigene bearbeiten'}
          </button>
        </div>
      )}
    </>
  )
}
