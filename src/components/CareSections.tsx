import { useEffect, useRef, useState } from 'react'
import type { AppData } from '../lib/useData'
import { gynMedsOn } from '../lib/useData'
import { formatDE, todayISO, weekdayShort, type ISODate } from '../lib/dates'
import { updateDay } from '../lib/db'
import type { MealSlot, SexEntry } from '../lib/model'
import {
  AID_TIP,
  AID_TYPES,
  EXERCISE_TIP,
  FOOD_GOOD,
  FOOD_LESS,
  FOOD_REACTIONS,
  FOOD_TIP,
  MEAL_SLOTS,
  MOVEMENT_GOAL_MIN,
  MOVEMENT_STEPS,
  MOVEMENT_TYPES,
  MOVEMENT_WEEK_GOAL,
  RELAX_TIP,
  RELAX_TYPES,
  SEX_OPTIONS,
  SUPPLEMENTS,
  WATER_GOAL,
} from '../lib/knowledge'
import { movementWeek } from '../lib/care'
import { dayStatus } from '../lib/nfp'
import type { SheetKind } from '../App'
import { Icon } from './Icons'
import { IconGrid, Section } from './DaySection'
import { Chip } from './Sheet'

export type CareTab = 'food' | 'move' | 'relax' | 'aids'

interface Props {
  data: AppData
  date: ISODate
}

type ListField = 'movement' | 'relax' | 'aids' | 'food' | 'supplements' | 'foodReaction'
const toggleIn = (date: ISODate, field: ListField, v: string) =>
  updateDay(date, (cur) => ({ [field]: cur[field].includes(v) ? cur[field].filter((x) => x !== v) : [...cur[field], v] }))

const labels = (l: { label: string }[]) => l.map((x) => x.label)

/* ---------- Bewegung ---------- */

export function MovementSection({ data, date, onDiary }: Props & { onDiary: (t: CareTab) => void }) {
  const d = data.days.get(date)
  const min = d?.movementMin ?? null
  const week = movementWeek(data.days, date)
  const ok = week.filter((w) => w.ok).length
  const today = todayISO()
  return (
    <Section title="Bewegung" action="Verlauf" onAction={() => onDiary('move')}>
      <div className="mins" role="radiogroup" aria-label="Bewegung an diesem Tag in Minuten">
        {[0, ...MOVEMENT_STEPS].map((v) => (
          <button
            key={v}
            role="radio"
            aria-checked={min === v}
            className={`min-btn${min === v ? ' on' : ''}${v >= MOVEMENT_GOAL_MIN ? ' goal' : ''}`}
            onClick={() => updateDay(date, { movementMin: min === v ? null : v })}
          >
            {v === 0 ? 'keine' : v === 90 ? '90+' : v}
            {v > 0 && <small>min</small>}
          </button>
        ))}
      </div>
      <p className="hint">
        {min === null ? 'Wie lange haben Sie sich bewegt? ' : min >= MOVEMENT_GOAL_MIN ? <b className="ok-text">Ausreichend bewegt. </b> : <b className="ink">Noch unter {MOVEMENT_GOAL_MIN} Minuten. </b>}
        Ausreichend ab {MOVEMENT_GOAL_MIN} Minuten moderater Bewegung.
      </p>
      <div className="week-goal" aria-label={`Diese Woche an ${ok} Tagen ausreichend bewegt, Ziel ${MOVEMENT_WEEK_GOAL[0]} bis ${MOVEMENT_WEEK_GOAL[1]}`}>
        <div className="wg-days" aria-hidden="true">
          {week.map((w) => (
            <span key={w.date} className={`wg-day${w.ok ? ' ok' : w.some ? ' some' : ''}${w.date === date ? ' sel' : ''}${w.date > today ? ' future' : ''}`}>
              <i>{w.ok ? '✓' : ''}</i>
              <small>{weekdayShort(w.date).slice(0, 2)}</small>
            </span>
          ))}
        </div>
        <span className="wg-text">
          <b>{ok}</b> von {MOVEMENT_WEEK_GOAL[0]}–{MOVEMENT_WEEK_GOAL[1]} Tagen
          <small>{ok >= MOVEMENT_WEEK_GOAL[0] ? 'Wochenziel erreicht' : 'diese Woche'}</small>
        </span>
      </div>
      <IconGrid items={labels(MOVEMENT_TYPES)} on={d?.movement ?? []} onToggle={(s) => toggleIn(date, 'movement', s)} tone="move" />
      {ok < MOVEMENT_WEEK_GOAL[0] && <p className="hint tip">{EXERCISE_TIP}</p>}
    </Section>
  )
}

/* ---------- Entspannung ---------- */

export function RelaxSection({ data, date, openSheet }: Props & { openSheet: (k: SheetKind, d: ISODate) => void }) {
  const d = data.days.get(date)
  const stress = d?.stress ?? null
  return (
    <Section title="Entspannung & Achtsamkeit" action="Üben" onAction={() => openSheet('breath', date)}>
      <IconGrid items={labels(RELAX_TYPES)} on={d?.relax ?? []} onToggle={(s) => toggleIn(date, 'relax', s)} tone="relax" />
      <h3 className="dp-sub">Stress heute</h3>
      <div className="nrs stress" role="radiogroup" aria-label="Stress 0 bis 10">
        {Array.from({ length: 11 }, (_, i) => (
          <button
            key={i}
            role="radio"
            aria-checked={stress === i}
            className={`nrs-btn${stress === i ? ' on' : ''}`}
            style={{ ['--p' as string]: i }}
            onClick={() => updateDay(date, { stress: stress === i ? null : i })}
          >
            {i}
          </button>
        ))}
      </div>
      <p className="hint">0 = entspannt, 10 = extrem gestresst.</p>
      <button className="breath-cta" onClick={() => openSheet('breath', date)}>
        <span className="bc-icon"><Icon name="breath" /></span>
        <span>
          <b>Atemübung, 3 Minuten</b>
          <small>Ruhig atmen senkt das Stresshormon Cortisol</small>
        </span>
        <Icon name="chevron" className="lr-chev" />
      </button>
      <p className="hint tip">{RELAX_TIP}</p>
    </Section>
  )
}

/* ---------- Hilfsmittel ---------- */

export function AidsSection({ data, date }: Props) {
  const d = data.days.get(date)
  return (
    <Section title="Hilfsmittel">
      <IconGrid items={labels(AID_TYPES)} on={d?.aids ?? []} onToggle={(s) => toggleIn(date, 'aids', s)} tone="warm" />
      <p className="hint">{AID_TIP}</p>
    </Section>
  )
}

/* ---------- Ernährung ---------- */

export function FoodSection({ data, date, onDiary }: Props & { onDiary: (t: CareTab) => void }) {
  const d = data.days.get(date)
  const water = d?.water ?? null
  return (
    <Section title="Ernährung" action="Tagebuch" onAction={() => onDiary('food')}>
      <button className={`cheat${d?.cheatDay ? ' on' : ''}`} onClick={() => updateDay(date, { cheatDay: !d?.cheatDay })} aria-pressed={!!d?.cheatDay}>
        <span className="cheat-icon"><Icon name="cake" /></span>
        <span className="cheat-main">
          <b>{d?.cheatDay ? 'Cheat Day eingetragen' : 'Heute war Cheat Day'}</b>
          <small>{d?.cheatDay ? 'Die App vergleicht das mit Ihrem Schmerz heute und morgen.' : 'Viel Kuchen, Süßes, Fast Food oder Alkohol'}</small>
        </span>
        <span className="cheat-check" aria-hidden="true">{d?.cheatDay ? '✓' : ''}</span>
      </button>

      <h3 className="dp-sub">Gut bei Endometriose (mediterran)</h3>
      <IconGrid items={labels(FOOD_GOOD)} on={d?.food ?? []} onToggle={(s) => toggleIn(date, 'food', s)} tone="good" />
      <h3 className="dp-sub">Eher meiden</h3>
      <IconGrid items={labels(FOOD_LESS)} on={d?.food ?? []} onToggle={(s) => toggleIn(date, 'food', s)} tone="less" />
      <h3 className="dp-sub">Entzündungshemmende Ergänzungen</h3>
      <IconGrid items={labels(SUPPLEMENTS)} on={d?.supplements ?? []} onToggle={(s) => toggleIn(date, 'supplements', s)} tone="supp" />

      <div className="water">
        <span className="lr-icon tone-water"><Icon name="glass" /></span>
        <span className="lr-main">
          Getrunken
          <small>{water === null ? `Ziel ca. ${WATER_GOAL} Gläser (1,5 l)` : `${water} ${water === 1 ? 'Glas' : 'Gläser'} à 250 ml${water >= WATER_GOAL ? ' · Ziel erreicht' : ''}`}</small>
        </span>
        <div className="stepper" aria-label="Gläser Wasser oder Tee">
          <button onClick={() => updateDay(date, { water: water === null || water <= 0 ? null : water - 1 })} aria-label="Ein Glas weniger" disabled={water === null}>−</button>
          <span>{water ?? '–'}</span>
          <button onClick={() => updateDay(date, { water: (water ?? 0) + 1 })} aria-label="Ein Glas mehr">+</button>
        </div>
      </div>

      <h3 className="dp-sub">Mahlzeiten</h3>
      <div className="meals">
        {MEAL_SLOTS.map((m) => (
          <MealField key={`${date}-${m.id}`} date={date} slot={m.id} label={m.label} placeholder={m.placeholder} initial={d?.meals[m.id] ?? ''} />
        ))}
      </div>

      <h3 className="dp-sub">Wie vertragen?</h3>
      <div className="chips small">
        {FOOD_REACTIONS.map((r) => (
          <Chip key={r} on={(d?.foodReaction ?? []).includes(r)} onClick={() => toggleIn(date, 'foodReaction', r)}>
            {r}
          </Chip>
        ))}
      </div>
      <p className="hint tip">{FOOD_TIP}</p>
    </Section>
  )
}

/** Eine Mahlzeit als Freitext, wird kurz nach dem Tippen gespeichert. */
function MealField({ date, slot, label, placeholder, initial }: { date: ISODate; slot: MealSlot; label: string; placeholder: string; initial: string }) {
  const [v, setV] = useState(initial)
  const timer = useRef<number | undefined>(undefined)
  const latest = useRef(v)
  latest.current = v
  const save = (text: string) => updateDay(date, (cur) => ({ meals: { ...cur.meals, [slot]: text } }))
  useEffect(
    () => () => {
      window.clearTimeout(timer.current)
      if (latest.current !== initial) save(latest.current)
    },
    // nur beim Schließen speichern
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
  return (
    <label className="meal">
      <span>{label}</span>
      <input
        type="text"
        value={v}
        placeholder={placeholder}
        onChange={(e) => {
          const next = e.target.value
          setV(next)
          window.clearTimeout(timer.current)
          timer.current = window.setTimeout(() => save(next), 400)
        }}
      />
    </label>
  )
}

/* ---------- Regelmäßige gynäkologische Medikamente ---------- */

export function GynMedSection({ data, date, openSheet }: Props & { openSheet: (k: SheetKind, d: ISODate, id?: number) => void }) {
  const list = gynMedsOn(data.courses, date)
  return (
    <Section title="Regelmäßige Medikamente" action="Hinzufügen" onAction={() => openSheet('gyn', date)}>
      {list.map((c) => (
        <button key={c.id} className="list-row" onClick={() => openSheet('gyn', date, c.id)}>
          <span className="lr-icon tone-med"><Icon name="pill" /></span>
          <span className="lr-main">
            {c.name}
            <small>{[c.dose, `seit ${formatDE(c.start)}`, c.end ? `bis ${formatDE(c.end)}` : 'läuft'].filter(Boolean).join(' · ')}</small>
          </span>
          <Icon name="chevron" className="lr-chev" />
        </button>
      ))}
      {list.length === 0 && (
        <button className="list-row" onClick={() => openSheet('gyn', date)}>
          <span className="lr-icon tone-med"><Icon name="plus" /></span>
          <span className="lr-main">
            Keine an diesem Tag
            <small>z. B. Agnus castus, Dienogest, Progesteron, zyklusregulierende Mittel</small>
          </span>
          <Icon name="chevron" className="lr-chev" />
        </button>
      )}
    </Section>
  )
}

/* ---------- Geschlechtsverkehr ---------- */

export function SexSection({ data, date }: Props) {
  const d = data.days.get(date)
  const v = d?.sex ?? null
  const nfp = data.settings.modules.nfp
  const st = nfp ? dayStatus(data.nfp, date, todayISO()) : null
  const set = (x: SexEntry) => updateDay(date, { sex: v === x ? null : x })
  return (
    <Section title="Geschlechtsverkehr">
      <div className="sex-opts" role="radiogroup" aria-label="Geschlechtsverkehr">
        {SEX_OPTIONS.map((o) => (
          <button key={o.id} role="radio" aria-checked={v === o.id} className={`sex-opt${v === o.id ? ' on' : ''} s-${o.id}`} onClick={() => set(o.id)}>
            <Icon name={o.id === 'kein' ? 'close' : o.id === 'geschuetzt' ? 'shield' : 'heart'} />
            {o.label}
          </button>
        ))}
      </div>
      {v === 'ungeschuetzt' && st === 'fruchtbar' && <p className="hint warn-text">Laut NFP-Auswertung ein möglicherweise fruchtbarer Tag.</p>}
      {v !== 'kein' && v !== null && (d?.painTypes.gv ?? null) === null && data.settings.modules.endo && (
        <p className="hint">Schmerzen dabei? Unter Schmerz › Details „Beim Geschlechtsverkehr“ eintragen.</p>
      )}
    </Section>
  )
}
