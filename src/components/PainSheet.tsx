import { useState } from 'react'
import Sheet, { Chip } from './Sheet'
import { updateDay } from '../lib/db'
import { formatDE, weekdayShort, type ISODate } from '../lib/dates'
import type { AppData } from '../lib/useData'
import type { MedIntake } from '../lib/model'
import {
  BACK_LOCATIONS,
  EXERCISE_TIP,
  IMPAIRMENTS,
  MED_PROMPT_FROM,
  PAIN_CHARACTERS,
  PAIN_TYPES,
  SELFCARE,
  painCategory,
  type BackLocation,
  type PainCharacter,
  type PainType,
} from '../lib/knowledge'

const CATEGORY_TEXT = { kein: 'kein Schmerz', leicht: 'leichter Schmerz', mittel: 'mittelstarker Schmerz', stark: 'starker Schmerz' }

function toggle<T>(list: T[], v: T): T[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v]
}

function Scale({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="scale-row">
      <input type="range" min={0} max={10} step={1} value={value} onChange={(e) => onChange(Number(e.target.value))} aria-label={label} style={{ ['--p' as string]: value }} />
      <b className="scale-val" style={{ ['--p' as string]: value }}>{value}</b>
    </div>
  )
}

export default function PainSheet({ data, date, onClose, onSymptoms }: { data: AppData; date: ISODate; onClose: () => void; onSymptoms?: () => void }) {
  const d = data.days.get(date)
  const pain = d?.pain ?? null
  const meds = d?.meds ?? []
  const [free, setFree] = useState('')
  const painTypes = d?.painTypes ?? {}
  const backLocations = d?.backLocations ?? []
  const character = d?.painCharacter ?? []
  const setType = (t: PainType, v: number | undefined) => {
    const next = { ...painTypes }
    if (v === undefined) delete next[t]
    else next[t] = v
    updateDay(date, { painTypes: next, ...(t === 'ruecken' && v === undefined ? { backLocations: [] } : {}) })
  }

  const setMeds = (next: MedIntake[]) => updateDay(date, { meds: next })
  const patchMed = (i: number, p: Partial<MedIntake>) => setMeds(meds.map((m, j) => (j === i ? { ...m, ...p } : m)))
  const addMed = (name: string, doseMg: number | null) => {
    const existing = meds.findIndex((m) => m.name === name && m.doseMg === doseMg)
    if (existing >= 0) patchMed(existing, { count: meds[existing].count + 1 })
    else setMeds([...meds, { name, doseMg, count: 1 }])
  }
  const favFor = (name: string) => data.settings.medFavorites.find((f) => f.name === name)

  return (
    <Sheet title="Schmerzen" subtitle={`${weekdayShort(date)}, ${formatDE(date)}`} onClose={onClose}>
      <h3 className="first">Stärkster Schmerz heute</h3>
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
      <p className="hint">
        {pain !== null ? <b className="pain-cat">{pain}: {CATEGORY_TEXT[painCategory(pain)]}. </b> : null}
        Skala 0–10 (NRS): 1–3 leicht, 4–6 mittel, 7–10 stark. 0 = kein Schmerz, 10 = stärkster vorstellbarer Schmerz. Nochmal tippen entfernt den Wert.
      </p>
      {pain !== null && pain >= MED_PROMPT_FROM && meds.length === 0 && (
        <div className="callout">
          <b>Haben Sie heute ein Schmerzmittel genommen?</b>
          <span>Ab Stärke {MED_PROMPT_FROM} fragt die App nach. Tippen Sie unten auf das Präparat, damit es im Bericht erscheint.</span>
        </div>
      )}
      <div className="chips">
        <Chip on={d?.spotting} onClick={() => updateDay(date, { spotting: !d?.spotting })}>Schmierblutung</Chip>
        {onSymptoms && <Chip onClick={onSymptoms}>Weitere Symptome …</Chip>}
      </div>

      {data.settings.modules.endo && (
        <>
          <h3>Wo und wann tut es weh?</h3>
          {PAIN_TYPES.map((t) => {
            const v = painTypes[t.id]
            const on = v !== undefined
            return (
              <div key={t.id} className={`ptype${on ? ' on' : ''}`}>
                <Chip on={on} onClick={() => setType(t.id, on ? undefined : (pain ?? 3))}>
                  {t.label}
                </Chip>
                {t.hint && !on && <small className="muted">{t.hint}</small>}
                {on && <Scale value={v} onChange={(n) => setType(t.id, n)} label={`${t.label}, Stärke 0 bis 10`} />}
              </div>
            )
          })}
          {painTypes.ruecken !== undefined && (
            <>
              <p className="hint">Wo am Rücken?</p>
              <div className="chips small">
                {BACK_LOCATIONS.map((b) => (
                  <Chip key={b.id} on={backLocations.includes(b.id)} onClick={() => updateDay(date, { backLocations: toggle<BackLocation>(backLocations, b.id) })}>
                    {b.label}
                  </Chip>
                ))}
              </div>
            </>
          )}
          <p className="hint">Wie fühlt sich der Schmerz an?</p>
          <div className="chips small">
            {PAIN_CHARACTERS.map((c) => (
              <Chip key={c.id} on={character.includes(c.id)} onClick={() => updateDay(date, { painCharacter: toggle<PainCharacter>(character, c.id) })}>
                {c.label}
              </Chip>
            ))}
          </div>

          <h3>Alltag</h3>
          <div className="chips small">
            {IMPAIRMENTS.map((x) => (
              <Chip key={x} on={(d?.impairments ?? []).includes(x)} onClick={() => updateDay(date, { impairments: toggle(d?.impairments ?? [], x) })}>
                {x}
              </Chip>
            ))}
          </div>
          <p className="hint">Stress heute (0 = keiner, 10 = extrem)</p>
          {d?.stress == null ? (
            <div className="chips small">
              <Chip onClick={() => updateDay(date, { stress: 3 })}>Stress eintragen</Chip>
            </div>
          ) : (
            <div className="stress-row">
              <Scale value={d.stress} onChange={(n) => updateDay(date, { stress: n })} label="Stress 0 bis 10" />
              <button className="btn ghost small" onClick={() => updateDay(date, { stress: null })}>Entfernen</button>
            </div>
          )}
          <h3>Was hat gutgetan?</h3>
          <div className="chips small">
            {SELFCARE.map((x) => (
              <Chip key={x} on={(d?.selfcare ?? []).includes(x)} onClick={() => updateDay(date, { selfcare: toggle(d?.selfcare ?? [], x) })}>
                {x}
              </Chip>
            ))}
          </div>
          <p className="hint tip">{EXERCISE_TIP}</p>
        </>
      )}

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
