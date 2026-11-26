import { useEffect, useMemo, useRef, useState } from 'react'
import Sheet from './Sheet'
import { Icon } from './Icons'
import type { AppData } from '../lib/useData'
import { addCourse, deleteCourse, saveSettings, updateCourse } from '../lib/db'
import { addDays, formatDE, todayISO, type ISODate } from '../lib/dates'
import type { ContraceptionCourse, PrepForm, PrepRating } from '../lib/model'
import {
  durationLabel,
  effectiveEnd,
  formLabel,
  formOf,
  monthEnd,
  monthStart,
  overlapping,
  PREP_FORMS,
  prepStats,
  RATINGS,
  schedulesFor,
  searchCatalog,
  STOP_REASONS,
  type CatalogEntry,
} from '../lib/preparations'

const dec = (n: number | null) => (n === null ? '–' : String(n).replace('.', ','))

// ---------------------------------------------------------------------------
// Detailblatt
// ---------------------------------------------------------------------------

export function PrepInfoSheet({ data, id, onClose, onEdit }: { data: AppData; id: number; onClose: () => void; onEdit: () => void }) {
  const today = todayISO()
  const c = data.courses.find((x) => x.id === id)
  const st = useMemo(() => (c ? prepStats(c, data.dayList, data.cycles, data.courses, today) : null), [c, data.dayList, data.cycles, data.courses, today])
  const [confirmDel, setConfirmDel] = useState(false)
  if (!c) return null
  const running = c.end === null || c.end >= today
  const reasons = c.reasons ?? []
  const shown = st?.symptoms.slice(0, 8) ?? []
  const max = Math.max(25, ...shown.map((s) => Math.max(s.pct, s.basePct ?? 0)))
  const setRating = (r: PrepRating) => updateCourse(id, { rating: c.rating === r ? undefined : r })
  const toggleReason = (r: string) => updateCourse(id, { reasons: reasons.includes(r) ? reasons.filter((x) => x !== r) : [...reasons, r] })
  const fmt = (iso: ISODate) => (c.approx ? `${iso.slice(5, 7)}/${iso.slice(0, 4)}` : formatDE(iso))

  return (
    <Sheet title={c.name} subtitle={[c.substance && `(${c.substance})`, formLabel(formOf(c))].filter(Boolean).join(' · ')} onClose={onClose}>
      <dl className="prep-kv num">
        <dt>Dosierung</dt>
        <dd>{c.dose || '–'}</dd>
        <dt>Schema</dt>
        <dd>{c.schedule || '–'}</dd>
        <dt>Zeitraum</dt>
        <dd>
          {c.approx ? 'ca. ' : ''}
          {fmt(c.start)} – {running ? 'läuft' : fmt(c.end!)}
        </dd>
        <dt>Dauer</dt>
        <dd>{durationLabel(c.start, effectiveEnd(c, today))}</dd>
      </dl>

      <h3 className="prep-h">Wie vertragen?</h3>
      <div className="prep-rate" role="group" aria-label="Eigene Bewertung">
        {RATINGS.map((r) => (
          <button key={r.id} type="button" className={`rate-${r.id}`} aria-pressed={c.rating === r.id} onClick={() => setRating(r.id)}>
            {r.label}
          </button>
        ))}
      </div>

      <h3 className="prep-h">Aus Ihren Einträgen{st ? ` · ${st.trackedDays.toLocaleString('de-DE')} Tage` : ''}</h3>
      {!st ? (
        <p className="hint">
          {c.approx
            ? 'Nachgetragen mit Monat und Jahr. Für diese Zeit gibt es keine Tageseinträge.'
            : 'Noch zu wenige Einträge für eine Auswertung. Ab 14 eingetragenen Tagen sehen Sie hier, welche Beschwerden häufiger waren.'}
        </p>
      ) : shown.length === 0 ? (
        <p className="hint">Keine Beschwerden eingetragen.</p>
      ) : (
        <>
          <div className="prep-cmp">
            {shown.map((s) => (
              <div key={s.name} className={`cmp-row${s.notable ? '' : ' ok'}`}>
                <b>{s.name}</b>
                <span className="num">
                  {s.pct} %{s.basePct !== null ? ` · ohne ${s.basePct} %` : ''}
                </span>
                <div className="cmp-bars">
                  <i style={{ width: `${(s.pct / max) * 100}%` }} />
                  {s.basePct !== null && <i className="base" style={{ left: `${(s.basePct / max) * 100}%` }} />}
                </div>
              </div>
            ))}
          </div>
          <p className="hint">
            {st.baseDays > 0
              ? `Balken: Anteil der Tage während der Einnahme. Strich: Zeiten ohne ${c.kind === 'gyn' ? 'dieses Mittel' : 'hormonelles Präparat'} (${st.baseDays.toLocaleString('de-DE')} Tage).`
              : 'Anteil der Tage während der Einnahme. Für einen Vergleich fehlen Einträge aus Zeiten ohne Präparat.'}{' '}
            Zwischenblutung = Blutung außerhalb der Periode.
          </p>
        </>
      )}

      {st && (
        <>
          <h3 className="prep-h">Zyklus währenddessen</h3>
          <div className="prep-mini num">
            <div><b>{dec(st.avgBleed)}</b><small>Ø Blutungstage</small></div>
            <div><b>{dec(st.avgCycle)}</b><small>Ø Zykluslänge</small></div>
            <div><b>{dec(st.avgPain)}</b><small>Ø Schmerz (0–10)</small></div>
          </div>
        </>
      )}

      <h3 className="prep-h">{running ? 'Falls Sie absetzen: Grund' : 'Abgesetzt wegen'}</h3>
      <div className="chips">
        {[...STOP_REASONS, ...reasons.filter((r) => !STOP_REASONS.includes(r))].map((r) => (
          <button key={r} type="button" className={`chip small${reasons.includes(r) ? ' on' : ''}`} aria-pressed={reasons.includes(r)} onClick={() => toggleReason(r)}>
            {r}
          </button>
        ))}
      </div>

      <div className="stack prep-actions">
        <button className="btn" onClick={onEdit}>Angaben bearbeiten</button>
        {confirmDel ? (
          <div className="prep-confirm">
            <span>Diesen Eintrag wirklich löschen?</span>
            <button className="btn small" onClick={() => setConfirmDel(false)}>Behalten</button>
            <button
              className="btn small danger"
              onClick={async () => {
                await deleteCourse(id)
                onClose()
              }}
            >
              Löschen
            </button>
          </div>
        ) : (
          <button className="btn danger" onClick={() => setConfirmDel(true)}>Eintrag löschen</button>
        )}
      </div>
    </Sheet>
  )
}

// ---------------------------------------------------------------------------
// Hinzufügen und Bearbeiten
// ---------------------------------------------------------------------------

type Mode = 'now' | 'past'
const ym = (iso: ISODate) => iso.slice(0, 7)

export function PrepSheet({ data, id, onClose, onSaved }: { data: AppData; id?: number; onClose: () => void; onSaved: (id: number) => void }) {
  const today = todayISO()
  const edit = id !== undefined ? data.courses.find((c) => c.id === id) : undefined
  const [mode, setMode] = useState<Mode>(edit ? (edit.end === null ? 'now' : 'past') : 'past')
  const [name, setName] = useState(edit?.name ?? '')
  const [form, setForm] = useState<PrepForm>((edit && formOf(edit)) ?? 'pille')
  const [formAuto, setFormAuto] = useState(false)
  const [substance, setSubstance] = useState(edit?.substance ?? '')
  const [dose, setDose] = useState(edit?.dose ?? '')
  const [schedule, setSchedule] = useState(edit?.schedule ?? '21+7')
  const [fromCatalog, setFromCatalog] = useState(false)
  const [approx, setApprox] = useState(edit?.approx ?? false)
  // Nachtragen beginnt leer, damit niemand aus Versehen das heutige Datum speichert
  const [start, setStart] = useState(edit ? (edit.approx ? ym(edit.start) : edit.start) : '')
  const [end, setEnd] = useState(edit?.end ? (edit.approx ? ym(edit.end) : edit.end) : '')
  const [suggest, setSuggest] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const errRef = useRef<HTMLParagraphElement>(null)
  useEffect(() => {
    if (error) errRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [error])

  const hits = useMemo(() => (suggest ? searchCatalog(name) : []), [name, suggest])
  const schedules = schedulesFor(form)
  const isPast = mode === 'past'

  const pick = (e: CatalogEntry) => {
    setName(e.name)
    setForm(e.form)
    setFormAuto(true)
    setSubstance(e.substance)
    setDose(e.dose)
    setSchedule(e.schedule)
    setFromCatalog(true)
    setSuggest(false)
  }

  const switchApprox = (on: boolean) => {
    setApprox(on)
    if (on) {
      setStart((s) => (s ? s.slice(0, 7) : s))
      setEnd((s) => (s ? s.slice(0, 7) : s))
    } else {
      setStart((s) => (s.length === 7 ? monthStart(s) : s))
      setEnd((s) => (s.length === 7 ? monthEnd(s) : s))
    }
  }

  const switchMode = (m: Mode) => {
    setMode(m)
    setError(null)
    if (m === 'now') {
      setApprox(false)
      setEnd('')
      if (!start || start.length === 7 || start > today) setStart(today)
    } else if (!edit && start === today) {
      setStart('')
    }
  }

  // Zeitraum als ISO-Tage
  const range = (): { s: ISODate; e: ISODate | null } | string => {
    const useApprox = isPast && approx
    if (!start) return 'Bitte geben Sie an, wann Sie begonnen haben.'
    const s = useApprox ? monthStart(start) : start
    if (s > today) return 'Der Beginn liegt in der Zukunft.'
    if (!isPast) return { s, e: null }
    if (!end) return 'Bitte geben Sie an, wann Sie aufgehört haben, oder wählen Sie „Nehme ich gerade“.'
    let e = useApprox ? monthEnd(end) : end
    if (e < s) return 'Das Ende liegt vor dem Beginn.'
    if (e > today) {
      if (useApprox && ym(e) === ym(today)) e = today
      else return 'Das Ende liegt in der Zukunft. Wählen Sie „Nehme ich gerade“, wenn Sie es noch nehmen.'
    }
    return { s, e }
  }

  // Läuft gerade ein anderes hormonelles Präparat, endet es am Vortag des neuen Beginns.
  const r = range()
  const hormonal = form !== 'dauer'
  const clash = typeof r === 'string' || !hormonal ? undefined : overlapping(data.courses, r.s, r.e, id)
  const autoEnd = clash && clash.end === null && typeof r !== 'string' && clash.start < r.s && r.e === null ? clash : undefined

  const save = async () => {
    const n = name.trim()
    if (!n) return setError('Bitte geben Sie den Namen des Präparats ein.')
    if (typeof r === 'string') return setError(r)
    if (clash && !autoEnd) {
      return setError(`Überschneidet sich mit ${clash.name} (${formatDE(clash.start)} bis ${clash.end ? formatDE(clash.end) : 'heute'}). Es kann nur ein hormonelles Präparat zur selben Zeit eingetragen sein.`)
    }
    const patch: Omit<ContraceptionCourse, 'id' | 'uid' | 'updatedAt'> = {
      name: n,
      start: r.s,
      end: r.e,
      kind: hormonal ? undefined : 'gyn',
      form: hormonal ? form : undefined,
      substance: substance.trim() || undefined,
      dose: dose.trim() || undefined,
      schedule: schedule.trim() || undefined,
      approx: isPast && approx ? true : undefined,
      rating: edit?.rating,
      reasons: edit?.reasons,
    }
    if (autoEnd) await updateCourse(autoEnd.id!, { end: addDays(r.s, -1) })
    let newId = id
    if (edit && id !== undefined) await updateCourse(id, patch)
    else newId = await addCourse(patch)
    // Laufende Präparate erscheinen in der Tagesansicht: Bereich einschalten, Namen merken
    if (r.e === null) {
      const s = data.settings
      if (hormonal) {
        await saveSettings({
          modules: { ...s.modules, contraception: true },
          contraceptionFavorites: s.contraceptionFavorites.includes(n) ? s.contraceptionFavorites : [...s.contraceptionFavorites, n],
        })
      } else {
        await saveSettings({ modules: { ...s.modules, gynMeds: true }, gynMedFavorites: s.gynMedFavorites.includes(n) ? s.gynMedFavorites : [...s.gynMedFavorites, n] })
      }
    }
    onSaved(newId!)
  }

  const dateType = isPast && approx ? 'month' : 'date'
  const maxVal = dateType === 'month' ? ym(today) : today

  return (
    <Sheet title={edit ? 'Präparat bearbeiten' : 'Präparat hinzufügen'} onClose={onClose}>
      <div className="prep-mode" role="radiogroup" aria-label="Wann genommen">
        <button type="button" role="radio" aria-checked={!isPast} onClick={() => switchMode('now')}>
          <b>Nehme ich gerade</b>
          <small>ab einem Startdatum</small>
        </button>
        <button type="button" role="radio" aria-checked={isPast} onClick={() => switchMode('past')}>
          <b>Früher genommen</b>
          <small>nachtragen</small>
        </button>
      </div>

      <div className="prep-step">
        <h3 className="step-h"><span className="sn">1</span>Welches Präparat?</h3>
        <p className="step-hint">Name von der Packung oder dem Rezept eingeben und einen Vorschlag wählen.</p>
        <div className="prep-search">
          <Icon name="search" size={18} />
          <input
            type="text"
            value={name}
            placeholder="z. B. Maxim, Yasmin, Kyleena"
            aria-label="Handelsname"
            aria-autocomplete="list"
            aria-expanded={hits.length > 0}
            aria-controls="prep-sugg"
            onChange={(e) => {
              setName(e.target.value)
              setSuggest(true)
              setFromCatalog(false)
              setError(null)
            }}
            onFocus={() => setSuggest(true)}
            onBlur={() => setTimeout(() => setSuggest(false), 150)}
            onKeyDown={(e) => e.key === 'Escape' && setSuggest(false)}
          />
          {hits.length > 0 && (
            <div className="prep-sugg" id="prep-sugg" role="listbox">
              {hits.map((h) => (
                <button key={h.name} type="button" role="option" aria-selected={false} onPointerDown={(e) => e.preventDefault()} onClick={() => pick(h)}>
                  {h.name}
                  <small>
                    {h.substance}
                    {h.dose ? ` · ${h.dose}` : ''}
                  </small>
                </button>
              ))}
              {hits.length > 3 && <div className="sugg-count">{hits.length} Treffer · in der Liste wischen für mehr</div>}
            </div>
          )}
        </div>
      </div>

      <div className="prep-step">
        <h3 className="step-h"><span className="sn">2</span>Welche Form?</h3>
        <p className="step-hint">{formAuto ? `Erkannt: ${formLabel(form)}. Bei Bedarf ändern.` : 'Bei bekannten Präparaten wird die Form automatisch gewählt. Sonst bitte antippen.'}</p>
        <div className="prep-forms">
          {PREP_FORMS.map((f) => (
            <button
              key={f.id}
              type="button"
              className="pf"
              aria-pressed={form === f.id}
              onClick={() => {
                setForm(f.id)
                setFormAuto(false)
                if (!schedulesFor(f.id).includes(schedule)) setSchedule(schedulesFor(f.id)[0])
              }}
            >
              <span className="pf-ic"><Icon name={f.icon} size={22} /></span>
              <small>{f.label}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="prep-step">
        <h3 className="step-h"><span className="sn">3</span>Wirkstoff und Dosierung</h3>
        <p className="step-hint">Steht auf der Packung. Wird bei bekannten Präparaten ergänzt.</p>
        <div className="prep-two">
          <label className="field">
            Wirkstoff
            <input type="text" className={fromCatalog ? 'filled' : ''} value={substance} placeholder="z. B. Dienogest" onChange={(e) => setSubstance(e.target.value)} />
          </label>
          <label className="field">
            Dosierung
            <input type="text" className={fromCatalog ? 'filled' : ''} value={dose} placeholder="z. B. 2 mg" onChange={(e) => setDose(e.target.value)} />
          </label>
        </div>
        {fromCatalog && (
          <p className="prep-src">
            <Icon name="check" size={14} />
            Aus der Präparateliste ergänzt. Bitte mit der Packung vergleichen.
          </p>
        )}
      </div>

      <div className="prep-step">
        <h3 className="step-h"><span className="sn">4</span>Wie und wann genommen?</h3>
        <p className="step-hint">Einnahmeschema wählen, dann {isPast ? 'Beginn und Ende' : 'den ersten Tag'}.</p>
        <div className="chips">
          {[...schedules, ...(schedule && !schedules.includes(schedule) ? [schedule] : [])].map((s) => (
            <button key={s} type="button" className={`chip small${schedule === s ? ' on' : ''}`} aria-pressed={schedule === s} onClick={() => setSchedule(s)}>
              {s}
            </button>
          ))}
        </div>
        <div className="prep-two">
          <label className="field">
            Begonnen
            <input type={dateType} value={start} max={maxVal} onChange={(e) => { setStart(e.target.value); setError(null) }} />
          </label>
          {isPast && (
            <label className="field">
              Beendet
              <input type={dateType} value={end} max={maxVal} onChange={(e) => { setEnd(e.target.value); setError(null) }} />
            </label>
          )}
        </div>
        {isPast && (
          <label className="toggle">
            <span>
              Nur Monat und Jahr
              <small>Wenn Sie den genauen Tag nicht mehr wissen</small>
            </span>
            <input type="checkbox" checked={approx} onChange={(e) => switchApprox(e.target.checked)} />
            <i />
          </label>
        )}
        {autoEnd && <p className="hint tip">{autoEnd.name} wird am {formatDE(addDays((r as { s: ISODate }).s, -1))} als beendet eingetragen.</p>}
      </div>

      {error && <p className="prep-error" role="alert" ref={errRef}>{error}</p>}
      <button className="btn primary full prep-save" onClick={save} disabled={!name.trim()}>
        {edit ? 'Änderungen speichern' : 'Speichern'}
      </button>
    </Sheet>
  )
}
