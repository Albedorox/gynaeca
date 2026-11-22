import { useState } from 'react'
import Sheet, { Chip } from './Sheet'
import { db, saveSettings } from '../lib/db'
import { addDays, formatDE, weekdayShort, type ISODate } from '../lib/dates'
import { courseOn, type AppData } from '../lib/useData'

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
              await db.courses.update(id, { end: date })
              onClose()
            }}
          >
            An diesem Tag zum letzten Mal genommen
          </button>
          <button
            className="btn"
            onClick={async () => {
              if (date === active.start) await db.courses.delete(id)
              else await db.courses.update(id, { end: addDays(date, -1) })
              onClose()
            }}
          >
            Ab diesem Tag abgesetzt / Pause
          </button>
          {active.end && (
            <button
              className="btn"
              onClick={async () => {
                await db.courses.update(id, { end: null })
                onClose()
              }}
            >
              Ende entfernen (läuft weiter)
            </button>
          )}
          <button
            className="btn danger"
            onClick={async () => {
              await db.courses.delete(id)
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
    await db.courses.add({ name: n, start: date, end: next ? addDays(next.start, -1) : null })
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
