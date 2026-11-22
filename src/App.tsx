import { useState } from 'react'
import { useAppData } from './lib/useData'
import { parseISO, todayISO, type ISODate } from './lib/dates'
import MonthView from './components/MonthView'
import Overview from './components/Overview'
import SettingsView from './components/SettingsView'
import Report from './components/Report'
import PainSheet from './components/PainSheet'
import SymptomSheet from './components/SymptomSheet'
import NfpSheet from './components/NfpSheet'
import ContraceptionSheet from './components/ContraceptionSheet'
import DaySheet from './components/DaySheet'

export type View = 'month' | 'overview' | 'settings' | 'report'
export type SheetKind = 'pain' | 'symptoms' | 'nfp' | 'contra' | 'day'

export default function App() {
  const data = useAppData()
  const t = parseISO(todayISO())
  const [ym, setYm] = useState({ y: t.y, m0: t.m0 })
  const [view, setView] = useState<View>('month')
  const [sheet, setSheet] = useState<{ kind: SheetKind; date: ISODate } | null>(null)

  if (!data.ready) return <div className="loading">Lade …</div>

  const close = () => setSheet(null)
  const open = (kind: SheetKind, date: ISODate) => setSheet({ kind, date })

  return (
    <div className="app">
      {view === 'month' && <MonthView data={data} ym={ym} setYm={setYm} openSheet={open} setView={setView} />}
      {view === 'overview' && (
        <Overview
          data={data}
          onBack={() => setView('month')}
          onPickMonth={(y, m0) => {
            setYm({ y, m0 })
            setView('month')
          }}
        />
      )}
      {view === 'settings' && <SettingsView data={data} onBack={() => setView('month')} onReport={() => setView('report')} />}
      {view === 'report' && <Report data={data} onBack={() => setView('settings')} />}

      {sheet?.kind === 'pain' && <PainSheet data={data} date={sheet.date} onClose={close} />}
      {sheet?.kind === 'symptoms' && <SymptomSheet data={data} date={sheet.date} onClose={close} />}
      {sheet?.kind === 'nfp' && <NfpSheet data={data} date={sheet.date} onClose={close} />}
      {sheet?.kind === 'contra' && <ContraceptionSheet data={data} date={sheet.date} onClose={close} />}
      {sheet?.kind === 'day' && <DaySheet data={data} date={sheet.date} onClose={close} />}
    </div>
  )
}
