import { useState } from 'react'
import Sheet, { Chip } from './Sheet'
import { addCourse, deleteCourse, saveSettings, updateCourse } from '../lib/db'
import { addDays, formatDE, weekdayShort, type ISODate } from '../lib/dates'
import { courseOn, type AppData } from '../lib/useData'
import { catalogEntry } from '../lib/preparations'

export default function ContraceptionSheet({ data, date, onClose }: { data: AppData; date: ISODate; onClose: () => void }) {
  const active = courseOn(data.courses, date)
  const [name, setName] = useState(data.settings.contraceptionFavorites[0] ?? '')
  const sub = `${weekdayShort(date)}, ${formatDE(date)}`

  if (active) {
    const id = active.id!
    return (
      <Sheet title={active.name} subtitle={`Seit ${formatDE(active.start)}${active.end ? ` bis ${formatDE(active.end)}` : ' · läuft'}`} onClose={onClose}>
        <p className="muted">Ausgewählter Tag: {sub}</p>
        <div className="stack">
          <button
            className="btn primary"
            onClick={async () => {
              await updateCourse(id, { end: date })
              onClose()
            }}
          >
            An diesem Tag zum letzten Mal genommen
          </button>
          <button
            className="btn"
            onClick={async () => {
              if (date === active.start) await deleteCourse(id)
              else await updateCourse(id, { end: addDays(date, -1) })
              onClose()
            }}
          >
            Ab diesem Tag abgesetzt / Pause
          </button>
          {active.end && (
            <button
              className="btn"
              onClick={async () => {
                await updateCourse(id, { end: null })
                onClose()
              }}
            >
              Ende entfernen (läuft weiter)
            </button>
          )}
          <button
            className="btn danger"
            onClick={async () => {
              await deleteCourse(id)
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
    // Beginnt später schon ein anderer Zeitraum, endet dieser davor.
    const next = data.courses.find((c) => !c.kind && c.start > date)
    // Bekannte Präparate: Form, Wirkstoff und Dosierung für den Präparate-Verlauf gleich mitspeichern
    const cat = catalogEntry(n)
    const extra = cat && cat.form !== 'dauer' ? { form: cat.form, substance: cat.substance, dose: cat.dose || undefined, schedule: cat.schedule } : {}
    await addCourse({ name: n, start: date, end: next ? addDays(next.start, -1) : null, ...extra })
    if (!data.settings.contraceptionFavorites.includes(n)) {
      await saveSettings({ contraceptionFavorites: [...data.settings.contraceptionFavorites, n] })
    }
    onClose()
  }

  return (
    <Sheet title="Präparat starten" subtitle={sub} onClose={onClose}>
      <div className="chips">
        {data.settings.contraceptionFavorites.map((f) => (
          <Chip key={f} on={name === f} onClick={() => setName(f)}>
            {f}
          </Chip>
        ))}
      </div>
      <input className="full" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name des Präparats, z. B. Maxim" aria-label="Präparatname" />
      <button className="btn primary full" onClick={start} disabled={!name.trim()}>
        Ab diesem Tag begonnen
      </button>
    </Sheet>
  )
}
