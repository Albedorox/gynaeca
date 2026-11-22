import { useState } from 'react'
import { useAppData } from './lib/useData'
import { parseISO, todayISO, type ISODate } from './lib/dates'
import DayView from './components/DayView'
import MonthView from './components/MonthView'
import Overview from './components/Overview'
import SettingsView from './components/SettingsView'
import Report from './components/Report'
import PainSheet from './components/PainSheet'
import SymptomSheet from './components/SymptomSheet'
import NfpSheet from './components/NfpSheet'
import ContraceptionSheet from './components/ContraceptionSheet'
import DaySheet from './components/DaySheet'
import Menu, { type MenuItem } from './components/Menu'
import FertilityView from './components/FertilityView'
import ScalesSheet from './components/ScalesSheet'

export type View = 'day' | 'month' | 'overview' | 'settings' | 'report' | 'fertility'
export type SheetKind = 'pain' | 'symptoms' | 'nfp' | 'contra' | 'day' | 'scales'

export default function App() {
  const data = useAppData()
  const [focus, setFocusRaw] = useState<ISODate>(todayISO())
  const t = parseISO(focus)
  const [ym, setYm] = useState({ y: t.y, m0: t.m0 })
  const [view, setView] = useState<View>('day')
  const [menu, setMenu] = useState(false)
  const [sheet, setSheet] = useState<{ kind: SheetKind; date: ISODate } | null>(null)

  if (!data.ready) return <div className="loading">Lade …</div>

  const setFocus = (d: ISODate) => {
    setFocusRaw(d)
    const p = parseISO(d)
    setYm({ y: p.y, m0: p.m0 })
  }
  const close = () => setSheet(null)
  const open = (kind: SheetKind, date: ISODate) => setSheet({ kind, date })
  const back = () => setView('day')
  const m = data.settings.modules

  const items: (MenuItem | 'sep')[] = [
    { label: 'Tagesansicht', hint: 'Heute und 3 Tage davor und danach', active: view === 'day', onClick: () => setView('day') },
    { label: 'Monatsansicht', hint: 'Ganzer Monat als Zyklusblatt', active: view === 'month', onClick: () => setView('month') },
    { label: 'Übersicht & Zyklen', hint: 'Mehrere Monate, X/Y-Kennzahlen', active: view === 'overview', onClick: () => setView('overview') },
    ...(m.nfp ? [{ label: 'Fruchtbarkeit', hint: 'Auswertung, Kurve, Anleitung', active: view === 'fertility', onClick: () => setView('fertility') }] : []),
    'sep',
    ...(m.pain ? [{ label: 'Schmerzen & Medikamente', hint: 'Für den ausgewählten Tag', onClick: () => open('pain', focus) }] : []),
    ...(m.symptoms ? [{ label: 'Symptome hinzufügen', hint: 'Für den ausgewählten Tag', onClick: () => open('symptoms', focus) }] : []),
    ...(m.nfp ? [{ label: 'Fruchtbarkeit eintragen', hint: 'Temperatur, Schleim' + (m.nfpCervix ? ', Muttermund' : '') + (m.lh ? ', LH-Test' : ''), onClick: () => open('nfp', focus) }] : []),
    { label: 'Notiz & Zyklusbeginn', hint: 'Für den ausgewählten Tag', onClick: () => open('day', focus) },
    'sep',
    { label: 'Skalen erklärt', hint: 'Blutungsstärke und Schmerz', onClick: () => open('scales', focus) },
    { label: 'Arztbericht / PDF', onClick: () => setView('report') },
    { label: 'Einstellungen & Export', hint: 'Module, Backup, CSV', active: view === 'settings', onClick: () => setView('settings') },
  ]

  return (
    <div className="app">
      {view === 'day' && <DayView data={data} focus={focus} setFocus={setFocus} openSheet={open} openMenu={() => setMenu(true)} />}
      {view === 'month' && (
        <MonthView
          data={data}
          ym={ym}
          setYm={setYm}
          openSheet={open}
          openMenu={() => setMenu(true)}
          onPickDay={(d) => {
            setFocus(d)
            setView('day')
          }}
        />
      )}
      {view === 'overview' && (
        <Overview
          data={data}
          onBack={back}
          onPickMonth={(y, m0) => {
            setYm({ y, m0 })
            setView('month')
          }}
        />
      )}
      {view === 'settings' && <SettingsView data={data} onBack={back} onReport={() => setView('report')} />}
      {view === 'report' && <Report data={data} onBack={back} />}
      {view === 'fertility' && <FertilityView data={data} onBack={back} openSheet={open} />}

      {menu && <Menu focus={focus} items={items} onClose={() => setMenu(false)} />}

      {sheet?.kind === 'pain' && <PainSheet data={data} date={sheet.date} onClose={close} onSymptoms={() => open('symptoms', sheet.date)} />}
      {sheet?.kind === 'symptoms' && <SymptomSheet data={data} date={sheet.date} onClose={close} />}
      {sheet?.kind === 'nfp' && <NfpSheet data={data} date={sheet.date} onClose={close} />}
      {sheet?.kind === 'contra' && <ContraceptionSheet data={data} date={sheet.date} onClose={close} />}
      {sheet?.kind === 'scales' && <ScalesSheet onClose={close} />}
      {sheet?.kind === 'day' && <DaySheet data={data} date={sheet.date} onClose={close} />}
    </div>
  )
}
