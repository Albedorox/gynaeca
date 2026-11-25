import { Fragment, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import type { AppData } from '../lib/useData'
import { courseOn } from '../lib/useData'
import { addDays, diffDays, monthName, parseISO, todayISO, weekdayShort, type ISODate } from '../lib/dates'
import { cycleFor, predictNext } from '../lib/cycles'
import { SYMPTOM_CATALOG, type DayEntry } from '../lib/model'
import { saveSettings, updateDay } from '../lib/db'
import { resolveLayout, SECTION_BY_ID, showSection } from '../lib/dayLayout'
import { bleedingLevel, MED_PROMPT_FROM, painCategory } from '../lib/knowledge'
import { dayStatus, isOvulationDay, STATUS_LABEL } from '../lib/nfp'
import type { SheetKind } from '../App'
import { Icon } from './Icons'
import { IconGrid, Section } from './DaySection'
import { type CareTab, AidsSection, FoodSection, GynMedSection, MovementSection, RelaxSection, SexSection } from './CareSections'
import NoteField from './NoteField'
import { MUCUS } from './NfpSheet'

interface Props {
  data: AppData
  date: ISODate
  setDate: (d: ISODate) => void
  onClose: () => void
  openSheet: (k: SheetKind, d: ISODate, id?: number) => void
  onDiary: (t: CareTab) => void
}

const fmt = (v: number) => String(v).replace('.', ',')
const QUICK_SYMPTOMS = ['Kopfschmerzen', 'Brustspannen', 'Blähungen', 'Übelkeit', 'Rückenschmerz', 'Erschöpfung', 'Unreine Haut', 'Schlafprobleme']
const MOODS = SYMPTOM_CATALOG.find((g) => g.group === 'Stimmung')!.items
/** Schnellauswahl: feste Symptome, dann alle eigenen (auch wenn heute nicht gewählt), dann übrige gewählte. */
function symptomItems(custom: string[], selected: string[]): string[] {
  const out = [...QUICK_SYMPTOMS]
  for (const s of [...custom, ...selected]) if (!out.includes(s) && !MOODS.includes(s)) out.push(s)
  return out
}
const PAIN_WORD = { kein: 'kein Schmerz', leicht: 'leicht', mittel: 'mittel', stark: 'stark' }

/** Tagesansicht: Wochenstreifen oben, darunter alle Eingaben des Tages in klaren Abschnitten. */
export default function DayPage({ data, date, setDate, onClose, openSheet, onDiary }: Props) {
  const today = todayISO()
  const d = data.days.get(date)
  const m = data.settings.modules
  const layout = resolveLayout(data.settings.dayLayout, m)
  const { m0, y } = parseISO(date)
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const toggleSym = (s: string) =>
    updateDay(date, (cur) => ({ symptoms: cur.symptoms.includes(s) ? cur.symptoms.filter((x) => x !== s) : [...cur.symptoms, s] }))

  /** Inhalt je Abschnitt; Reihenfolge und Sichtbarkeit kommen aus den Einstellungen (dayLayout). */
  const renderSection = (id: string): ReactNode => {
    switch (id) {
      case 'pain':
        return (
          <Section title="Schmerz" action={m.endo ? 'Details' : 'Mehr'} onAction={() => openSheet('pain', date)}>
            <div className="nrs" role="radiogroup" aria-label="Stärkster Schmerz heute, 0 bis 10">
              {Array.from({ length: 11 }, (_, i) => (
                <button
                  key={i}
                  role="radio"
                  aria-checked={d?.pain === i}
                  className={`nrs-btn${d?.pain === i ? ' on' : ''}`}
                  style={{ ['--p' as string]: i }}
                  onClick={() => updateDay(date, { pain: d?.pain === i ? null : i })}
                >
                  {i}
                </button>
              ))}
            </div>
            <p className="hint">
              {d?.pain != null ? <b className="ink">{d.pain} = {PAIN_WORD[painCategory(d.pain)]}. </b> : 'Stärkster Schmerz heute. '}
              0 kein Schmerz, 10 stärkster vorstellbarer.
            </p>
            {d?.pain != null && d.pain >= MED_PROMPT_FROM && (d.meds.length === 0) && (
              <div className="callout">
                <b>Schmerzmittel genommen?</b>
                <span>Tippen Sie unten auf das Präparat, dann steht es im Arztbericht.</span>
              </div>
            )}
          </Section>
        )
      case 'meds':
        return (
          <Section title="Schmerzmittel" action="Dosis & mehr" onAction={() => openSheet('pain', date)}>
            <div className="icon-grid">
              {data.settings.medFavorites.map((f) => {
                const taken = (d?.meds ?? []).filter((x) => x.name === f.name).reduce((s, x) => s + x.count, 0)
                return (
                  <button
                    key={f.name}
                    className={`ig-item${taken ? ' on' : ''}`}
                    onClick={() =>
                      updateDay(date, (cur) => {
                        const i = cur.meds.findIndex((x) => x.name === f.name)
                        if (i >= 0) return { meds: cur.meds.map((x, j) => (j === i ? { ...x, count: x.count + 1 } : x)) }
                        return { meds: [...cur.meds, { name: f.name, doseMg: f.doses[0] ?? null, count: 1 }] }
                      })
                    }
                    aria-label={`${f.name} einnehmen${taken ? `, bisher ${taken}×` : ''}`}
                  >
                    <span className="ig-icon tone-med">
                      <Icon name="pill" />
                      {taken > 0 && <em className="ig-badge">{taken}×</em>}
                    </span>
                    <span className="ig-label">{f.name}</span>
                  </button>
                )
              })}
            </div>
            {/* Zusammenfassung immer mit fester Höhe, damit beim Zurücksetzen nichts springt */}
            <div className="med-sum">
              <span className="med-sum-text">
                {(d?.meds.length ?? 0) > 0
                  ? d!.meds.map((x) => `${x.name}${x.doseMg ? ` ${x.doseMg} mg` : ''} ${x.count}×`).join(' · ')
                  : 'Antippen zählt eine Einnahme.'}
              </span>
              <button
                type="button"
                className="btn-reset"
                hidden={(d?.meds.length ?? 0) === 0}
                onClick={() => updateDay(date, { meds: [] })}
              >
                <Icon name="close" size={16} /> Zurücksetzen
              </button>
            </div>
          </Section>
        )
      case 'gyn':
        return (
          <GynMedSection data={data} date={date} openSheet={openSheet} />
        )
      case 'symptoms':
        return (
          <Section title="Symptome" action="Alle anzeigen" onAction={() => openSheet('symptoms', date)}>
            <IconGrid items={symptomItems(data.settings.customSymptoms, d?.symptoms ?? [])} on={d?.symptoms ?? []} onToggle={toggleSym} tone="sym" />
            {data.settings.customSymptoms.length > 0 && (
              <button type="button" className="link sym-edit" onClick={() => openSheet('symptomsEdit', date)}>
                Eigene Symptome bearbeiten <Icon name="chevron" size={16} />
              </button>
            )}
          </Section>
        )
      case 'mood':
        return (
          <Section title="Stimmung">
            <IconGrid items={MOODS} on={d?.symptoms ?? []} onToggle={toggleSym} tone="mood" />
          </Section>
        )
      case 'movement':
        return (
          <MovementSection data={data} date={date} onDiary={onDiary} />
        )
      case 'relax':
        return (
          <RelaxSection data={data} date={date} openSheet={openSheet} />
        )
      case 'aids':
        return (
          <AidsSection data={data} date={date} />
        )
      case 'food':
        return (
          <FoodSection data={data} date={date} onDiary={onDiary} />
        )
      case 'contra':
        return (
          <ContraSection data={data} date={date} openSheet={openSheet} />
        )
      case 'nfp':
        return (
          <Section title="Fruchtbarkeit" action="Eintragen" onAction={() => openSheet('nfp', date)}>
            <button className="list-row" onClick={() => openSheet('nfp', date)}>
              <span className="lr-icon"><Icon name="thermo" /></span>
              <span className="lr-main">
                Temperatur
                <small>{d?.temp != null ? `${d.temp.toFixed(2).replace('.', ',')} °C${d.tempDisturbed ? ' (gestört)' : ''}` : 'noch nicht eingetragen'}</small>
              </span>
              <Icon name="chevron" className="lr-chev" />
            </button>
            {m.nfpMucus && (
              <button className="list-row" onClick={() => openSheet('nfp', date)}>
                <span className="lr-icon"><Icon name="wave" /></span>
                <span className="lr-main">
                  Zervixschleim
                  <small>{d?.mucus ? `${d.mucus} · ${MUCUS.find((x) => x.code === d.mucus)?.label}` : 'noch nicht eingetragen'}</small>
                </span>
                <Icon name="chevron" className="lr-chev" />
              </button>
            )}
          </Section>
        )
      case 'sex':
        return (
          <SexSection data={data} date={date} />
        )
      case 'note':
        return (
          <Section title="Notiz">
            <NoteField key={date} date={date} initial={d?.note ?? ''} />
          </Section>
        )
      default:
        return null
    }
  }

  return (
    <div className="daypage" role="dialog" aria-modal="true" aria-label={`Tag ${Number(date.slice(8))}. ${monthName(m0)}`}>
      <header className="dp-head">
        <button className="icon-btn" onClick={onClose} aria-label="Schließen"><Icon name="close" /></button>
        <h1 className="dp-title">
          {Number(date.slice(8))}. {monthName(m0)}
          {y !== parseISO(today).y && <span className="muted"> {y}</span>}
        </h1>
        <div className="dp-head-btns">
          <button className="icon-btn" onClick={() => openSheet('layout', date)} aria-label="Abschnitte anpassen"><Icon name="sliders" /></button>
          <button className="icon-btn" onClick={() => setDate(today)} aria-label="Zu heute" disabled={date === today}><Icon name="today" /></button>
        </div>
      </header>
      <WeekStrip data={data} date={date} setDate={setDate} today={today} />

      <div className="dp-body">
        <CycleCard data={data} date={date} d={d} today={today} openSheet={openSheet} />

        {layout.visible.map((id) => (
          <Fragment key={id}>{renderSection(id)}</Fragment>
        ))}

        {layout.hidden.length > 0 && (
          <div className="dp-hidden">
            <h3>Ausgeblendet ({layout.hidden.length})</h3>
            <div className="chips">
              {layout.hidden.map((id) => (
                <button key={id} type="button" className="chip" onClick={() => saveSettings({ dayLayout: showSection(data.settings.dayLayout, m, id) })} aria-label={`${SECTION_BY_ID[id].title} wieder anzeigen`}>
                  <Icon name="plus" size={14} /> {SECTION_BY_ID[id].title}
                </button>
              ))}
            </div>
          </div>
        )}

        <button className="list-row plain" onClick={() => openSheet('layout', date)}>
          <span className="lr-icon"><Icon name="sliders" /></span>
          <span className="lr-main">
            Abschnitte anpassen
            <small>{layout.hidden.length > 0 ? `${layout.hidden.length} ausgeblendet · ` : ''}Reihenfolge und Sichtbarkeit</small>
          </span>
          <Icon name="chevron" className="lr-chev" />
        </button>

        <button className="list-row plain" onClick={() => openSheet('day', date)}>
          <span className="lr-icon"><Icon name="flag" /></span>
          <span className="lr-main">
            Zyklusbeginn
            <small>{d?.cycleStart === true ? 'Hier beginnt ein Zyklus (manuell)' : d?.cycleStart === false ? 'Kein Zyklusbeginn (manuell)' : 'Automatisch aus der Blutung'}</small>
          </span>
          <Icon name="chevron" className="lr-chev" />
        </button>
        <button className="list-row plain" onClick={() => openSheet('scales', date)}>
          <span className="lr-icon"><Icon name="info" /></span>
          <span className="lr-main">Skalen erklärt<small>Blutungsstärke 0–5 und Schmerz 0–10</small></span>
          <Icon name="chevron" className="lr-chev" />
        </button>
        <div className="dp-end" />
      </div>
    </div>
  )
}

/* ---------- Wochenstreifen ---------- */

function WeekStrip({ data, date, setDate, today }: { data: AppData; date: ISODate; setDate: (d: ISODate) => void; today: ISODate }) {
  const { y, m0, d } = parseISO(date)
  const wd = (new Date(Date.UTC(y, m0, d)).getUTCDay() + 6) % 7
  const monday = addDays(date, -wd)
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i))
  const swipe = useRef<number | null>(null)
  return (
    <div
      className="wk"
      onPointerDown={(e) => (swipe.current = e.clientX)}
      onPointerUp={(e) => {
        if (swipe.current !== null && Math.abs(e.clientX - swipe.current) > 50) setDate(addDays(date, e.clientX < swipe.current ? 7 : -7))
        swipe.current = null
      }}
    >
      <button className="wk-nav" onClick={() => setDate(addDays(date, -7))} aria-label="Vorherige Woche"><Icon name="back" size={18} /></button>
      {days.map((iso) => {
        const e = data.days.get(iso)
        return (
          <button key={iso} className={`wk-day${iso === date ? ' on' : ''}${iso === today ? ' today' : ''}`} onClick={() => setDate(iso)} aria-current={iso === date ? 'date' : undefined}>
            <small>{weekdayShort(iso)}</small>
            <b>{Number(iso.slice(8))}</b>
            <i className={(e?.bleeding ?? 0) > 0 ? 'wk-bleed' : e?.spotting ? 'wk-spot' : e && e.updatedAt ? 'wk-any' : ''} />
          </button>
        )
      })}
      <button className="wk-nav" onClick={() => setDate(addDays(date, 7))} aria-label="Nächste Woche"><Icon name="chevron" size={18} /></button>
    </div>
  )
}

/* ---------- Zykluskarte mit Blutung ---------- */

function CycleCard({ data, date, d, today, openSheet }: { data: AppData; date: ISODate; d: DayEntry | undefined; today: ISODate; openSheet: Props['openSheet'] }) {
  const bleeding = d?.bleeding ?? 0
  const c = cycleFor(data.cycles, date)
  const zt = c ? diffDays(c.start, date) + 1 : null
  const inPeriod = !!c && date <= c.periodEnd
  const pred = date >= today ? predictNext(data.cycles, today) : null
  const toNext = pred ? diffDays(date, pred.start) : null
  const nfpOn = data.settings.modules.nfp
  const st = nfpOn ? dayStatus(data.nfp, date, today) : null
  const ovu = nfpOn && isOvulationDay(data.nfp, date)
  const lv = bleedingLevel(bleeding)

  return (
    <section className="cycle-card">
      <div className="cc-head">
        <h2>Mein Zyklus</h2>
        <button className={`chip small${d?.spotting ? ' on' : ''}`} onClick={() => updateDay(date, { spotting: !d?.spotting })} aria-pressed={!!d?.spotting}>
          Schmierblutung
        </button>
      </div>
      {/* Feste Bereiche: Zeile mit Tropfen bleibt stehen, Stufe und Kriterium haben reservierte Höhe */}
      <div className="cc-bleed">
        <div className="cc-bleed-row">
          <span className="cc-label">Blutung</span>
          <DropScale date={date} value={bleeding} />
        </div>
        <div className="cc-bleed-info" aria-live="polite">
          <b className={`cc-level${bleeding > 0 ? '' : ' none'}`}>{bleeding > 0 ? `${fmt(bleeding)} · ${lv.label}` : 'keine Blutung'}</b>
          <small className="cc-crit">{bleeding > 0 ? lv.criterion : 'Tropfen antippen, nochmal tippen ergibt einen halben Schritt. Halten und ziehen geht auch.'}</small>
        </div>
      </div>
      {(zt !== null || pred || st) && (
        <ul className="cc-facts">
          {zt !== null && <li>{inPeriod ? `${diffDays(c!.start, date) + 1}. Periodentag` : `${zt}. Zyklustag`}</li>}
          {inPeriod && zt !== null && <li>{zt}. Zyklustag</li>}
          {toNext !== null && toNext > 0 && <li>{toNext === 1 ? 'Periode voraussichtlich morgen' : `Periode in ca. ${toNext} Tagen`}</li>}
          {st && <li className={`fert-${st}`}>{ovu ? 'Eisprung wahrscheinlich' : STATUS_LABEL[st]} (NFP)</li>}
        </ul>
      )}
      {zt === null && bleeding === 0 && <button className="link" onClick={() => openSheet('scales', date)}>Wie stark ist welche Stufe?</button>}
    </section>
  )
}

/**
 * Blutung 0–5 in 0,5er-Schritten: Tropfen antippen (nochmal = halber Schritt weniger)
 * oder halten und ziehen wie ein Regler. Beim Halten/Ziehen zeigt eine Blase Stufe und Kriterium.
 */
const DROP = 'M12 2.5s-6.5 7.3-6.5 12a6.5 6.5 0 0 0 13 0c0-4.7-6.5-12-6.5-12z'
const HOLD_MS = 280

function DropScale({ date, value }: { date: ISODate; value: number }) {
  const [draft, setDraft] = useState<number | null>(null)
  const [tipX, setTipX] = useState<number | null>(null)
  const st = useRef<{ x: number; rect: DOMRect; dragging: boolean; last: number; timer: number } | null>(null)
  const tipRef = useRef<HTMLSpanElement>(null)
  const v = draft ?? value
  // Blase am Finger ausrichten, aber nie über den rechten Rand der Skala hinaus
  useLayoutEffect(() => {
    const el = tipRef.current
    const s = st.current
    if (!el || tipX === null || !s) return
    const w = el.offsetWidth
    const left = Math.min(tipX - w / 2, s.rect.width - w)
    el.style.left = `${left}px`
    el.style.setProperty('--ax', `${tipX - left}px`)
  }, [tipX, v])
  useEffect(() => () => {
    if (st.current) clearTimeout(st.current.timer)
  }, [])
  const at = (clientX: number, rect: DOMRect) => {
    const rel = (clientX - rect.left) / rect.width
    return Math.max(0, Math.min(5, Math.round(rel * 10) / 2))
  }
  const tapValue = (i: number) => {
    // Tropfen i (1–5): leer → voll, voll → halb, halb → leer
    if (value === i) return i - 0.5
    if (value === i - 0.5) return i - 1
    return i
  }
  const startDrag = (clientX: number) => {
    const s = st.current
    if (!s) return
    s.dragging = true
    clearTimeout(s.timer)
    navigator.vibrate?.(8)
    move(clientX)
  }
  const move = (clientX: number) => {
    const s = st.current
    if (!s) return
    const n = at(clientX, s.rect)
    if (n !== s.last) {
      s.last = n
      navigator.vibrate?.(4)
    }
    setDraft(n)
    setTipX(Math.max(0, Math.min(s.rect.width, clientX - s.rect.left)))
  }
  const end = () => {
    const s = st.current
    if (s) clearTimeout(s.timer)
    st.current = null
    setDraft(null)
    setTipX(null)
    return s
  }
  const lv = bleedingLevel(v)
  return (
    <div
      className={`dropscale${tipX !== null ? ' dragging' : ''}`}
      role="slider"
      tabIndex={0}
      aria-label="Blutungsstärke 0 bis 5"
      aria-valuemin={0}
      aria-valuemax={5}
      aria-valuenow={v}
      aria-valuetext={`${fmt(v)}, ${lv.label}`}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') updateDay(date, { bleeding: Math.min(5, value + 0.5) })
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') updateDay(date, { bleeding: Math.max(0, value - 0.5) })
        else return
        e.preventDefault()
      }}
      onContextMenu={(e) => e.preventDefault()}
      onPointerDown={(e) => {
        const el = e.currentTarget
        try {
          el.setPointerCapture(e.pointerId)
        } catch {
          /* egal */
        }
        const x = e.clientX
        const timer = window.setTimeout(() => startDrag(st.current?.x ?? x), HOLD_MS)
        st.current = { x, rect: el.getBoundingClientRect(), dragging: false, last: value, timer }
      }}
      onPointerMove={(e) => {
        const s = st.current
        if (!s) return
        if (!s.dragging) {
          if (Math.abs(e.clientX - s.x) > 8) startDrag(e.clientX)
          else s.x = e.clientX
          return
        }
        move(e.clientX)
      }}
      onPointerUp={(e) => {
        const s = end()
        if (!s) return
        if (s.dragging) {
          if (s.last !== value) updateDay(date, { bleeding: s.last })
        } else {
          const i = Math.min(5, Math.max(1, Math.ceil(((e.clientX - s.rect.left) / s.rect.width) * 5)))
          updateDay(date, { bleeding: tapValue(i) })
        }
      }}
      onPointerCancel={() => {
        end()
      }}
    >
      {tipX !== null && (
        <span ref={tipRef} className="ds-tip" role="status">
          <b>{v > 0 ? `${fmt(v)} · ${lv.label}` : 'keine Blutung'}</b>
          {v > 0 && <small>{lv.criterion}</small>}
        </span>
      )}
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, v - (i - 1)))
        return (
          <span key={i} className={`ds-drop${fill === 1 ? ' is-full' : fill > 0 ? ' is-half' : ''}`}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <defs>
                <clipPath id={`half-${i}`}>
                  <rect x="0" y="12" width="24" height="12" />
                </clipPath>
              </defs>
              {fill > 0 && <path d={DROP} className="ds-fill" clipPath={fill < 1 ? `url(#half-${i})` : undefined} />}
              <path d={DROP} className="ds-out" />
            </svg>
          </span>
        )
      })}
    </div>
  )
}

/* ---------- Verhütung ---------- */

function ContraSection({ data, date, openSheet }: { data: AppData; date: ISODate; openSheet: Props['openSheet'] }) {
  const c = courseOn(data.courses, date)
  return (
    <Section title="Verhütung" action={c ? 'Bearbeiten' : 'Starten'} onAction={() => openSheet('contra', date)}>
      <button className="list-row" onClick={() => openSheet('contra', date)}>
        <span className="lr-icon tone-med"><Icon name="pill" /></span>
        <span className="lr-main">
          {c ? c.name : 'Kein Präparat an diesem Tag'}
          <small>{c ? `seit ${Number(c.start.slice(8))}. ${monthName(parseISO(c.start).m0)}${c.end ? `, bis ${Number(c.end.slice(8))}. ${monthName(parseISO(c.end).m0)}` : ', läuft'}` : 'Tippen, um ein Präparat ab diesem Tag zu starten'}</small>
        </span>
        <Icon name="chevron" className="lr-chev" />
      </button>
    </Section>
  )
}
