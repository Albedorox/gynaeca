import { useState } from 'react'
import Sheet, { Chip } from './Sheet'
import { updateDay } from '../lib/db'
import { formatDE, weekdayShort, type ISODate } from '../lib/dates'
import type { AppData } from '../lib/useData'
import type { MedIntake } from '../lib/model'

export default function PainSheet({ data, date, onClose, onSymptoms }: { data: AppData; date: ISODate; onClose: () => void; onSymptoms?: () => void }) {
  const d = data.days.get(date)
  const pain = d?.pain ?? null
  const meds = d?.meds ?? []
  const [free, setFree] = useState('')

  const setMeds = (next: MedIntake[]) => updateDay(date, { meds: next })
  const patchMed = (i: number, p: Partial<MedIntake>) => setMeds(meds.map((m, j) => (j === i ? { ...m, ...p } : m)))
  const addMed = (name: string, doseMg: number | null) => {
    const existing = meds.findIndex((m) => m.name === name && m.doseMg === doseMg)
    if (existing >= 0) patchMed(existing, { count: meds[existing].count + 1 })
    else setMeds([...meds, { name, doseMg, count: 1 }])
  }
  const favFor = (name: string) => data.settings.medFavorites.find((f) => f.name === name)

  return (
    <Sheet title="Unterbauchschmerz" subtitle={`${weekdayShort(date)}, ${formatDE(date)}`} onClose={onClose}>
      <div className="pain-grid" role="radiogroup" aria-label="Schmerzstärke 0 bis 10">
        {Array.from({ length: 11 }, (_, i) => (
          <button
            key={i}
            role="radio"
            aria-checked={pain === i}
            className={`pain-btn${pain === i ? ' on' : ''}`}
            style={{ ['--p' as string]: i }}
            onClick={() => updateDay(date, { pain: pain === i ? null : i })}
          >
            {i}
          </button>
        ))}
      </div>
      <p className="hint">0 = kein Schmerz, 10 = stärkster vorstellbarer Schmerz. Nochmal tippen entfernt den Wert.</p>
      <div className="chips">
        <Chip on={d?.spotting} onClick={() => updateDay(date, { spotting: !d?.spotting })}>Schmierblutung</Chip>
        {onSymptoms && <Chip onClick={onSymptoms}>Weitere Symptome …</Chip>}
      </div>

      <h3>Schmerzmittel</h3>
      {meds.length === 0 && <p className="muted">Noch nichts eingetragen.</p>}
      {meds.map((m, i) => {
        const fav = favFor(m.name)
        return (
          <div key={i} className="med-row">
            <div className="med-main">
              <b>{m.name}</b>
              <div className="chips small">
                {(fav?.doses ?? []).map((dose) => (
                  <Chip key={dose} on={m.doseMg === dose} onClick={() => patchMed(i, { doseMg: m.doseMg === dose ? null : dose })}>
                    {dose} mg
                  </Chip>
                ))}
                <input
                  className="dose-input"
                  inputMode="numeric"
                  placeholder="mg"
                  aria-label="Dosis in mg"
                  value={m.doseMg != null && !(fav?.doses ?? []).includes(m.doseMg) ? m.doseMg : ''}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10)
                    patchMed(i, { doseMg: Number.isFinite(v) ? v : null })
                  }}
                />
              </div>
            </div>
            <div className="stepper" aria-label="Einnahmen pro Tag">
              <button onClick={() => (m.count <= 1 ? setMeds(meds.filter((_, j) => j !== i)) : patchMed(i, { count: m.count - 1 }))} aria-label="Weniger">
                −
              </button>
              <span>{m.count}×</span>
              <button onClick={() => patchMed(i, { count: m.count + 1 })} aria-label="Mehr">
                +
              </button>
            </div>
          </div>
        )
      })}

      <div className="chips">
        {data.settings.medFavorites.map((f) => (
          <Chip key={f.name} onClick={() => addMed(f.name, f.doses[0] ?? null)}>
            + {f.name}
          </Chip>
        ))}
      </div>
      <form
        className="inline-form"
        onSubmit={(e) => {
          e.preventDefault()
          const name = free.trim()
          if (name) addMed(name, null)
          setFree('')
        }}
      >
        <input value={free} onChange={(e) => setFree(e.target.value)} placeholder="Anderes Präparat / Wirkstoff" aria-label="Freie Eingabe Präparat" />
        <button className="btn" type="submit">Hinzufügen</button>
      </form>
    </Sheet>
  )
}
