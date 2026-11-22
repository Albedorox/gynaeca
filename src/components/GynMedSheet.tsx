import { useState } from 'react'
import Sheet, { Chip } from './Sheet'
import { addCourse, deleteCourse, saveSettings, updateCourse } from '../lib/db'
import { addDays, formatDE, weekdayShort, type ISODate } from '../lib/dates'
import type { AppData } from '../lib/useData'

/**
 * Regelmäßig eingenommene gynäkologische Medikamente (z. B. Agnus castus, Dienogest).
 * Wie bei der Verhütung ein Einnahmezeitraum, aber mehrere können gleichzeitig laufen.
 */
export default function GynMedSheet({ data, date, id, onClose }: { data: AppData; date: ISODate; id?: number; onClose: () => void }) {
  const course = id !== undefined ? data.courses.find((c) => c.id === id && c.kind === 'gyn') : undefined
  const favs = data.settings.gynMedFavorites
  const [name, setName] = useState('')
  const [dose, setDose] = useState(course?.dose ?? '')
  const sub = `${weekdayShort(date)}, ${formatDE(date)}`

  if (course) {
    const cid = course.id!
    return (
      <Sheet title={course.name} subtitle={`Seit ${formatDE(course.start)}${course.end ? ` bis ${formatDE(course.end)}` : ' · läuft'}`} onClose={onClose}>
        <label className="field">
          <span>Dosis / Einnahme</span>
          <input
            type="text"
            value={dose}
            placeholder="z. B. 1 Tablette morgens"
            onChange={(e) => setDose(e.target.value)}
            onBlur={() => updateCourse(cid, { dose: dose.trim() || undefined })}
          />
        </label>
        <p className="muted">Ausgewählter Tag: {sub}</p>
        <div className="stack">
          <button
            className="btn primary"
            onClick={async () => {
              await updateCourse(cid, { end: date, dose: dose.trim() || undefined })
              onClose()
            }}
          >
            An diesem Tag zum letzten Mal genommen
          </button>
          {course.end && (
            <button
              className="btn"
              onClick={async () => {
                await updateCourse(cid, { end: null })
                onClose()
              }}
            >
              Ende entfernen (läuft weiter)
            </button>
          )}
          <button
            className="btn danger"
            onClick={async () => {
              await deleteCourse(cid)
              onClose()
            }}
          >
            Diesen Einnahmezeitraum löschen
          </button>
        </div>
      </Sheet>
    )
  }

  const start = async () => {
    const n = name.trim()
    if (!n) return
    // Gleiches Mittel, das später neu beginnt: dieser Zeitraum endet davor.
    const next = data.courses.find((c) => c.kind === 'gyn' && c.name === n && c.start > date)
    await addCourse({ kind: 'gyn', name: n, start: date, end: next ? addDays(next.start, -1) : null, dose: dose.trim() || undefined })
    if (!favs.includes(n)) await saveSettings({ gynMedFavorites: [...favs, n] })
    onClose()
  }

  return (
    <Sheet title="Regelmäßiges Medikament" subtitle={sub} onClose={onClose}>
      <p className="hint first">Für Mittel, die Sie über Wochen nehmen, etwa zur Zyklusregulierung oder bei Endometriose. Schmerzmittel tragen Sie bitte direkt am Tag ein.</p>
      <div className="chips">
        {favs.map((f) => (
          <Chip key={f} on={name === f} onClick={() => setName(f)}>
            {f}
          </Chip>
        ))}
      </div>
      <input className="full" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name, z. B. Agnucaston" aria-label="Name des Medikaments" />
      <input className="full" value={dose} onChange={(e) => setDose(e.target.value)} placeholder="Dosis, z. B. 1 Tablette morgens (optional)" aria-label="Dosis" />
      <button className="btn primary full" onClick={start} disabled={!name.trim()}>
        Ab diesem Tag eingenommen
      </button>
    </Sheet>
  )
}
