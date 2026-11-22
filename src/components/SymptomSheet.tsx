import { useState } from 'react'
import Sheet, { Chip } from './Sheet'
import { saveSettings, updateDay } from '../lib/db'
import { formatDE, weekdayShort, type ISODate } from '../lib/dates'
import type { AppData } from '../lib/useData'
import { SYMPTOM_CATALOG } from '../lib/model'
import NoteField from './NoteField'

export default function SymptomSheet({ data, date, onClose }: { data: AppData; date: ISODate; onClose: () => void }) {
  const d = data.days.get(date)
  const symptoms = d?.symptoms ?? []
  const [custom, setCustom] = useState('')

  const toggle = (s: string) =>
    updateDay(date, (cur) => ({ symptoms: cur.symptoms.includes(s) ? cur.symptoms.filter((x) => x !== s) : [...cur.symptoms, s] }))

  const groups = [...SYMPTOM_CATALOG, ...(data.settings.customSymptoms.length ? [{ group: 'Eigene', items: data.settings.customSymptoms }] : [])]
  // Symptome, die nicht (mehr) im Katalog stehen, trotzdem anzeigen
  const known = new Set(groups.flatMap((g) => g.items))
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
          if (!known.has(s)) await saveSettings({ customSymptoms: [...data.settings.customSymptoms, s] })
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
