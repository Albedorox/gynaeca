import { useRef } from 'react'
import type { AppData } from '../lib/useData'
import { courseOn } from '../lib/useData'
import { diffDays, daysInMonth, formatDE, isWeekend, monthName, shiftMonth, toISO, todayISO, weekdayShort, type ISODate } from '../lib/dates'
import { cycleDay, cycleLabel } from '../lib/cycles'
import { medCount, type DayEntry } from '../lib/model'
import { updateDay } from '../lib/db'
import BleedingCell from './BleedingCell'
import type { SheetKind } from '../App'

interface Props {
  data: AppData
  ym: { y: number; m0: number }
  setYm: (v: { y: number; m0: number }) => void
  openSheet: (k: SheetKind, d: ISODate) => void
  openMenu: () => void
  onPickDay: (d: ISODate) => void
}

type Col = 'contra' | 'day' | 'zt' | 'bleed' | 'pain' | 'sym' | 'temp' | 'mucus' | 'cervix' | 'lh'

const COL_WIDTH: Record<Col, string> = {
  contra: '16px',
  day: '38px',
  zt: '24px',
  bleed: 'minmax(84px, 1fr)',
  pain: '42px',
  sym: '34px',
  temp: '42px',
  mucus: '28px',
  cervix: '30px',
  lh: '26px',
}
const COL_LABEL: Record<Col, string> = {
  contra: '',
  day: 'Tag',
  zt: 'ZT',
  bleed: 'Blutung',
  pain: 'Schm.',
  sym: 'Sym.',
  temp: '°C',
  mucus: 'ZS',
  cervix: 'MM',
  lh: 'LH',
}

const LH_SYMBOL = { neg: '–', pos: '+', peak: '★' } as const
const LH_NEXT = { none: 'neg', neg: 'pos', pos: 'peak', peak: null } as const
const CERVIX_OPEN = { geschlossen: '●', leicht: '◐', offen: '○' } as const
const CERVIX_FIRM = { hart: 'h', mittel: 'm', weich: 'w' } as const
const CERVIX_POS = { tief: '↓', mittel: '→', hoch: '↑' } as const

export default function MonthView({ data, ym, setYm, openSheet, openMenu, onPickDay }: Props) {
  const { settings, days, cycles } = data
  const { y, m0 } = ym
  const n = daysInMonth(y, m0)
  const today = todayISO()
  const first = toISO(y, m0, 1)
  const last = toISO(y, m0, n)

  const cols: Col[] = []
  if (settings.modules.contraception) cols.push('contra')
  cols.push('day', 'zt', 'bleed', 'pain')
  if (settings.modules.symptoms) cols.push('sym')
  if (settings.modules.nfp) {
    cols.push('temp')
    if (settings.modules.nfpMucus) cols.push('mucus')
    if (settings.modules.nfpCervix) cols.push('cervix')
    if (settings.modules.lh) cols.push('lh')
  }
  const template = cols.map((c) => COL_WIDTH[c]).join(' ')

  const go = (delta: number) => setYm(shiftMonth(y, m0, delta))

  // Zyklen, die diesen Monat berühren
  const monthCycles = cycles.filter((c) => c.start <= last && (c.end === null || c.end >= first))

  // Wisch-Geste auf der Kopfzeile wechselt den Monat
  const swipe = useRef<number | null>(null)

  const rows = Array.from({ length: n }, (_, i) => toISO(y, m0, i + 1))

  return (
    <div className="month" style={{ ['--rows' as string]: n }}>
      <header
        className="month-head"
        onPointerDown={(e) => (swipe.current = e.clientX)}
        onPointerUp={(e) => {
          if (swipe.current !== null && Math.abs(e.clientX - swipe.current) > 60) go(e.clientX < swipe.current ? 1 : -1)
          swipe.current = null
        }}
      >
        <button className="icon-btn" onClick={openMenu} aria-label="Menü">☰</button>
        <button className="icon-btn" onClick={() => go(-1)} aria-label="Vorheriger Monat">‹</button>
        <button className="month-title" onClick={() => setYm({ y: Number(today.slice(0, 4)), m0: Number(today.slice(5, 7)) - 1 })} title="Zum heutigen Monat">
          {monthName(m0)} <span className="muted">{y}</span>
        </button>
        <button className="icon-btn" onClick={() => go(1)} aria-label="Nächster Monat">›</button>
        <span className="spacer" />
      </header>

      <div className="stats-strip">
        {monthCycles.length === 0 ? (
          <span className="muted">Noch kein Zyklus in diesem Monat. Blutung im Feld wischen.</span>
        ) : (
          monthCycles.map((c) => (
            <span key={c.start} className={`cycle-chip${c.length === null ? ' running' : ''}`} title={`Zyklus ab ${formatDE(c.start)}`}>
              <b>{cycleLabel(c)}</b>
              <small>ab {c.start.slice(8, 10)}.{c.start.slice(5, 7)}.</small>
            </span>
          ))
        )}
      </div>

      <div className="grid-head" style={{ gridTemplateColumns: template }}>
        {cols.map((c) => (
          <span key={c} className={`gh gh-${c}`}>{COL_LABEL[c]}</span>
        ))}
      </div>

      <div className="grid">
        {rows.map((iso) => {
          const d = days.get(iso)
          const isStart = cycles.some((c) => c.start === iso)
          return (
            <div
              key={iso}
              className={`row${iso === today ? ' today' : ''}${isWeekend(iso) ? ' weekend' : ''}${isStart ? ' cycle-start' : ''}${iso > today ? ' future' : ''}`}
              style={{ gridTemplateColumns: template }}
            >
              {cols.map((c) => (
                <Cell key={c} col={c} iso={iso} d={d} data={data} first={first} last={last} openSheet={openSheet} onPickDay={onPickDay} />
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface CellProps {
  col: Col
  iso: ISODate
  d: DayEntry | undefined
  data: AppData
  first: ISODate
  last: ISODate
  openSheet: Props['openSheet']
  onPickDay: (d: ISODate) => void
}

function Cell({ col, iso, d, data, first, last, openSheet, onPickDay }: CellProps) {
  const { courses, cycles } = data
    switch (col) {
      case 'contra': {
        const c = courseOn(courses, iso)
        const isStartDay = !!c && (c.start === iso || iso === first)
        const isEndDay = !!c && c.end === iso
        let span = 0
        if (c && isStartDay) {
          const endInMonth = c.end === null || c.end > last ? last : c.end
          span = diffDays(iso, endInMonth) + 1
        }
        return (
          <button className="cell contra" onClick={() => openSheet('contra', iso)} aria-label={c ? `${c.name}, tippen zum Beenden` : 'Präparat starten'}>
            {c && <span className={`contra-bar${c.start === iso ? ' s' : ''}${isEndDay ? ' e' : ''}`} />}
            {c && isStartDay && (
              <span className="contra-label" style={{ height: `calc(${span} * 100%)` }}>
                {c.name}
              </span>
            )}
          </button>
        )
      }
      case 'day':
        return (
          <button className="cell day" onClick={() => onPickDay(iso)} aria-label="In der Tagesansicht öffnen">
            <b>{Number(iso.slice(8, 10))}</b>
            <small>{weekdayShort(iso)}</small>
            {d?.note && <i className="note-dot" />}
          </button>
        )
      case 'zt': {
        const z = cycleDay(cycles, iso)
        return <span className="cell zt">{z ?? ''}</span>
      }
      case 'bleed':
        return <BleedingCell date={iso} bleeding={d?.bleeding ?? 0} spotting={d?.spotting ?? false} />
      case 'pain': {
        const mc = medCount(d)
        return (
          <button className="cell pain" onClick={() => openSheet('pain', iso)} aria-label="Schmerz und Medikation">
            {d?.pain != null && <span className="pain-val" style={{ ['--p' as string]: d.pain }}>{d.pain}</span>}
            {mc > 0 && (
              <span className="med-ind" title={d!.meds.map((m) => m.name).join(', ')}>
                <i className="pill" />
                {mc}
              </span>
            )}
          </button>
        )
      }
      case 'sym': {
        const k = d?.symptoms.length ?? 0
        return (
          <button className="cell sym" onClick={() => openSheet('symptoms', iso)} aria-label="Symptome">
            {k > 0 && <span className="sym-badge" title={d!.symptoms.join(', ')}>{k}</span>}
          </button>
        )
      }
      case 'temp':
        return (
          <button className={`cell temp${d?.tempDisturbed ? ' disturbed' : ''}`} onClick={() => openSheet('nfp', iso)}>
            {d?.temp != null ? d.temp.toFixed(2).replace('.', ',') : ''}
          </button>
        )
      case 'mucus':
        return (
          <button className="cell mucus" onClick={() => openSheet('nfp', iso)}>
            {d?.mucus ?? ''}
          </button>
        )
      case 'cervix':
        return (
          <button className="cell cervix" onClick={() => openSheet('nfp', iso)}>
            {d?.cervixOpening ? CERVIX_OPEN[d.cervixOpening] : ''}
            {d?.cervixFirmness ? CERVIX_FIRM[d.cervixFirmness] : ''}
            {d?.cervixPosition ? CERVIX_POS[d.cervixPosition] : ''}
          </button>
        )
      case 'lh': {
        const cur = d?.lh ?? null
        return <LhButton iso={iso} cur={cur} />
      }
    }
  }

function LhButton({ iso, cur }: { iso: ISODate; cur: 'neg' | 'pos' | 'peak' | null }) {
  return (
    <button
      className={`cell lh${cur ? ` lh-${cur}` : ''}`}
      onClick={() => updateDay(iso, { lh: LH_NEXT[cur ?? 'none'] })}
      aria-label={`LH-Test: ${cur ?? 'nicht erfasst'}. Tippen zum Wechseln`}
    >
      {cur ? LH_SYMBOL[cur] : ''}
    </button>
  )
}
