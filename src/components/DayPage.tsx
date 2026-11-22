import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { AppData } from '../lib/useData'
import { courseOn } from '../lib/useData'
import { addDays, diffDays, monthName, parseISO, todayISO, weekdayShort, type ISODate } from '../lib/dates'
import { cycleFor, predictNext } from '../lib/cycles'
import { SYMPTOM_CATALOG, type DayEntry } from '../lib/model'
import { updateDay } from '../lib/db'
import { bleedingLevel, MED_PROMPT_FROM, painCategory } from '../lib/knowledge'
import { dayStatus, isOvulationDay, STATUS_LABEL } from '../lib/nfp'
import type { SheetKind } from '../App'
import { Icon, SYMPTOM_ICON } from './Icons'
import NoteField from './NoteField'
import { MUCUS } from './NfpSheet'

interface Props {
  data: AppData
  date: ISODate
  setDate: (d: ISODate) => void
  onClose: () => void
  openSheet: (k: SheetKind, d: ISODate) => void
}

const fmt = (v: number) => String(v).replace('.', ',')
const QUICK_SYMPTOMS = ['Kopfschmerzen', 'Brustspannen', 'Blähungen', 'Übelkeit', 'Rückenschmerz', 'Erschöpfung', 'Unreine Haut', 'Schlafprobleme']
const MOODS = SYMPTOM_CATALOG.find((g) => g.group === 'Stimmung')!.items
const PAIN_WORD = { kein: 'kein Schmerz', leicht: 'leicht', mittel: 'mittel', stark: 'stark' }

/** Tagesansicht: Wochenstreifen oben, darunter alle Eingaben des Tages in klaren Abschnitten. */
export default function DayPage({ data, date, setDate, onClose, openSheet }: Props) {
  const today = todayISO()
  const d = data.days.get(date)
  const m = data.settings.modules
  const { m0, y } = parseISO(date)
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const toggleSym = (s: string) =>
    updateDay(date, (cur) => ({ symptoms: cur.symptoms.includes(s) ? cur.symptoms.filter((x) => x !== s) : [...cur.symptoms, s] }))

  return (
    <div className="daypage" role="dialog" aria-modal="true" aria-label={`Tag ${Number(date.slice(8))}. ${monthName(m0)}`}>
      <header className="dp-head">
        <button className="icon-btn" onClick={onClose} aria-label="Schließen"><Icon name="close" /></button>
        <h1 className="dp-title">
          {Number(date.slice(8))}. {monthName(m0)}
          {y !== parseISO(today).y && <span className="muted"> {y}</span>}
        </h1>
        <button className="icon-btn" onClick={() => setDate(today)} aria-label="Zu heute" disabled={date === today}><Icon name="today" /></button>
      </header>
      <WeekStrip data={data} date={date} setDate={setDate} today={today} />

      <div className="dp-body">
        <CycleCard data={data} date={date} d={d} today={today} openSheet={openSheet} />

        {m.pain && (
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
        )}

        {m.pain && (
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
            {(d?.meds.length ?? 0) > 0 && (
              <p className="hint">
                {d!.meds.map((x) => `${x.name}${x.doseMg ? ` ${x.doseMg} mg` : ''} ${x.count}×`).join(' · ')}{' '}
                <button className="link inline" onClick={() => updateDay(date, { meds: [] })}>zurücksetzen</button>
              </p>
            )}
          </Section>
        )}

        {m.symptoms && (
          <Section title="Symptome" action="Alle anzeigen" onAction={() => openSheet('symptoms', date)}>
            <IconGrid items={[...QUICK_SYMPTOMS, ...(d?.symptoms ?? []).filter((s) => !QUICK_SYMPTOMS.includes(s) && !MOODS.includes(s))]} on={d?.symptoms ?? []} onToggle={toggleSym} tone="sym" />
          </Section>
        )}

        {m.symptoms && (
          <Section title="Stimmung">
            <IconGrid items={MOODS} on={d?.symptoms ?? []} onToggle={toggleSym} tone="mood" />
          </Section>
        )}

        {m.contraception && <ContraSection data={data} date={date} openSheet={openSheet} />}

        {m.nfp && (
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
        )}

        <Section title="Notiz">
          <NoteField key={date} date={date} initial={d?.note ?? ''} />
        </Section>

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

function Section({ title, action, onAction, children }: { title: string; action?: string; onAction?: () => void; children: ReactNode }) {
  return (
    <section className="dp-sec">
      <div className="dp-sec-head">
        <h2>{title}</h2>
        {action && onAction && (
          <button className="link" onClick={onAction}>
            {action} <Icon name="chevron" size={16} />
          </button>
        )}
      </div>
      {children}
    </section>
  )
}

function IconGrid({ items, on, onToggle, tone }: { items: string[]; on: string[]; onToggle: (s: string) => void; tone: string }) {
  return (
    <div className="icon-grid">
      {items.map((s) => (
        <button key={s} className={`ig-item${on.includes(s) ? ' on' : ''}`} onClick={() => onToggle(s)} aria-pressed={on.includes(s)}>
          <span className={`ig-icon tone-${tone}`}>
            <Icon name={SYMPTOM_ICON[s] ?? 'sparkle'} />
          </span>
          <span className="ig-label">{s}</span>
        </button>
      ))}
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
      <div className="cc-bleed">
        <span className="cc-label">
          Blutung
          <b className={bleeding > 0 ? '' : 'none'}>{bleeding > 0 ? `${fmt(bleeding)} · ${lv.label}` : 'keine'}</b>
        </span>
        <DropScale date={date} value={bleeding} />
      </div>
      <p className="hint cc-crit">{bleeding > 0 ? lv.criterion : 'Tippen Sie auf einen Tropfen. Nochmal tippen ergibt einen halben Schritt.'}</p>
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
 * oder mit dem Finger über die Tropfen ziehen.
 */
function DropScale({ date, value }: { date: ISODate; value: number }) {
  const [draft, setDraft] = useState<number | null>(null)
  const st = useRef<{ x: number; rect: DOMRect; dragging: boolean; last: number } | null>(null)
  const v = draft ?? value
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
  return (
    <div
      className="dropscale"
      role="slider"
      tabIndex={0}
      aria-label="Blutungsstärke 0 bis 5"
      aria-valuemin={0}
      aria-valuemax={5}
      aria-valuenow={v}
      aria-valuetext={`${fmt(v)}, ${bleedingLevel(v).label}`}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') updateDay(date, { bleeding: Math.min(5, value + 0.5) })
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') updateDay(date, { bleeding: Math.max(0, value - 0.5) })
        else return
        e.preventDefault()
      }}
      onPointerDown={(e) => {
        const el = e.currentTarget
        try {
          el.setPointerCapture(e.pointerId)
        } catch {
          /* egal */
        }
        st.current = { x: e.clientX, rect: el.getBoundingClientRect(), dragging: false, last: value }
      }}
      onPointerMove={(e) => {
        const s = st.current
        if (!s) return
        if (!s.dragging && Math.abs(e.clientX - s.x) > 8) s.dragging = true
        if (s.dragging) {
          const n = at(e.clientX, s.rect)
          if (n !== s.last) {
            s.last = n
            navigator.vibrate?.(4)
          }
          setDraft(n)
        }
      }}
      onPointerUp={(e) => {
        const s = st.current
        st.current = null
        if (!s) return
        setDraft(null)
        if (s.dragging) {
          if (s.last !== value) updateDay(date, { bleeding: s.last })
        } else {
          const i = Math.min(5, Math.max(1, Math.ceil(((e.clientX - s.rect.left) / s.rect.width) * 5)))
          updateDay(date, { bleeding: tapValue(i) })
        }
      }}
      onPointerCancel={() => {
        st.current = null
        setDraft(null)
      }}
    >
      {[1, 2, 3, 4, 5].map((i) => {
        const fill = Math.max(0, Math.min(1, v - (i - 1)))
        return (
          <span key={i} className={`ds-drop${fill === 1 ? ' full' : fill > 0 ? ' half' : ''}`}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <defs>
                <clipPath id={`half-${i}`}>
                  <rect x="0" y="12" width="24" height="12" />
                </clipPath>
              </defs>
              <path d="M12 2.5s-6.5 7.3-6.5 12a6.5 6.5 0 0 0 13 0c0-4.7-6.5-12-6.5-12z" className="ds-out" />
              {fill > 0 && <path d="M12 2.5s-6.5 7.3-6.5 12a6.5 6.5 0 0 0 13 0c0-4.7-6.5-12-6.5-12z" className="ds-fill" clipPath={fill < 1 ? `url(#half-${i})` : undefined} />}
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
