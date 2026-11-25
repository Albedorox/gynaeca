import { useEffect, useRef, useState } from 'react'
import Sheet, { Chip } from './Sheet'
import { saveSettings, updateDay } from '../lib/db'
import { formatDE, weekdayShort, type ISODate } from '../lib/dates'
import type { AppData } from '../lib/useData'
import { SYMPTOM_CATALOG } from '../lib/model'
import NoteField from './NoteField'
import { Icon } from './Icons'

export default function SymptomSheet({ data, date, onClose, editCustom = false }: { data: AppData; date: ISODate; onClose: () => void; editCustom?: boolean }) {
  const d = data.days.get(date)
  const symptoms = d?.symptoms ?? []
  const [custom, setCustom] = useState('')
  const [editing, setEditing] = useState(editCustom)
  const [removed, setRemoved] = useState<{ name: string; index: number } | null>(null)
  const customList = data.settings.customSymptoms
  const customRef = useRef<HTMLElement>(null)
  useEffect(() => {
    if (editCustom) customRef.current?.scrollIntoView({ block: 'start' })
  }, [editCustom])

  // Löschen entfernt das Symptom aus der Auswahl. Schon eingetragene Tage behalten es.
  const remove = (s: string) => {
    setRemoved({ name: s, index: customList.indexOf(s) })
    saveSettings({ customSymptoms: customList.filter((x) => x !== s) })
  }
  const undo = () => {
    if (!removed) return
    const next = customList.filter((x) => x !== removed.name)
    next.splice(Math.min(removed.index, next.length), 0, removed.name)
    saveSettings({ customSymptoms: next })
    setRemoved(null)
  }

  const toggle = (s: string) =>
    updateDay(date, (cur) => ({ symptoms: cur.symptoms.includes(s) ? cur.symptoms.filter((x) => x !== s) : [...cur.symptoms, s] }))

  const groups = SYMPTOM_CATALOG
  // Symptome, die nicht (mehr) im Katalog stehen, trotzdem anzeigen
  const known = new Set([...groups.flatMap((g) => g.items), ...customList])
  const orphan = symptoms.filter((s) => !known.has(s))

  return (
    <Sheet title="Begleitsymptome" subtitle={`${weekdayShort(date)}, ${formatDE(date)}`} onClose={onClose}>
      {groups.map((g) => (
        <section key={g.group}>
          <h3>{g.group}</h3>
          <div className="chips">
            {g.items.map((s) => (
              <Chip key={s} on={symptoms.includes(s)} onClick={() => toggle(s)}>
                {s}
              </Chip>
            ))}
          </div>
        </section>
      ))}
      {(customList.length > 0 || removed) && (
        <section className="custom-sym" ref={customRef}>
          <div className="custom-sym-head">
            <h3>Eigene</h3>
            {customList.length > 0 && (
              <button type="button" className="link" onClick={() => setEditing((v) => !v)} aria-pressed={editing}>
                {editing ? 'Fertig' : 'Bearbeiten'}
              </button>
            )}
          </div>
          {editing && <p className="hint">Tippen Sie auf ✕, um ein eigenes Symptom zu löschen. Schon eingetragene Tage behalten es.</p>}
          <div className="chips">
            {customList.map((s) =>
              editing ? (
                <button key={s} type="button" className="chip chip-del" onClick={() => remove(s)} aria-label={`${s} löschen`}>
                  {s} <Icon name="close" size={14} />
                </button>
              ) : (
                <Chip key={s} on={symptoms.includes(s)} onClick={() => toggle(s)}>
                  {s}
                </Chip>
              ),
            )}
          </div>
          {removed && (
            <p className="undo-line" role="status">
              „{removed.name}“ gelöscht.{' '}
              <button type="button" className="link" onClick={undo}>
                Rückgängig
              </button>
            </p>
          )}
        </section>
      )}
      {orphan.length > 0 && (
        <div className="chips">
          {orphan.map((s) => (
            <Chip key={s} on onClick={() => toggle(s)}>
              {s}
            </Chip>
          ))}
        </div>
      )}
      <form
        className="inline-form"
        onSubmit={async (e) => {
          e.preventDefault()
          const s = custom.trim()
          if (!s) return
          if (!known.has(s)) await saveSettings({ customSymptoms: [...customList, s] })
          setRemoved(null)
          if (!symptoms.includes(s)) await toggle(s)
          setCustom('')
        }}
      >
        <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Eigenes Symptom / Tag" aria-label="Eigenes Symptom" />
        <button className="btn" type="submit">Hinzufügen</button>
      </form>
      <h3>Notiz</h3>
      <NoteField date={date} initial={d?.note ?? ''} />
    </Sheet>
  )
}
