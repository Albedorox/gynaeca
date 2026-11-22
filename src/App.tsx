import { useEffect, useState } from 'react'
import { useAppData } from './lib/useData'
import { parseISO, todayISO, type ISODate } from './lib/dates'
import Home from './components/Home'
import DayPage from './components/DayPage'
import Stats from './components/Stats'
import Themes from './components/Themes'
import MonthView from './components/MonthView'
import SettingsView from './components/SettingsView'
import Report from './components/Report'
import PainSheet from './components/PainSheet'
import SymptomSheet from './components/SymptomSheet'
import NfpSheet from './components/NfpSheet'
import ContraceptionSheet from './components/ContraceptionSheet'
import DaySheet from './components/DaySheet'
import FertilityView from './components/FertilityView'
import ScalesSheet from './components/ScalesSheet'
import TabBar, { type Tab } from './components/TabBar'
import { useBackButton } from './lib/useBackButton'
import { applyAppearance } from './lib/theme'

export type SubView = 'report' | 'fertility' | 'month'
export type SheetKind = 'pain' | 'symptoms' | 'nfp' | 'contra' | 'day' | 'scales'

export default function App() {
  const data = useAppData()
  const t = parseISO(todayISO())
  const [ym, setYm] = useState({ y: t.y, m0: t.m0 })
  const [tab, setTab] = useState<Tab>('home')
  const [sub, setSub] = useState<SubView | null>(null)
  const [day, setDay] = useState<ISODate | null>(null)
  const [sheet, setSheet] = useState<{ kind: SheetKind; date: ISODate } | null>(null)

  const { mode, palette } = data.settings.appearance
  useEffect(() => {
    if (data.ready) applyAppearance(mode, palette)
  }, [data.ready, mode, palette])

  const depth = (tab !== 'home' ? 1 : 0) + (sub ? 1 : 0) + (day ? 1 : 0) + (sheet ? 1 : 0)
  useBackButton(depth, () => {
    if (sheet) setSheet(null)
    else if (day) setDay(null)
    else if (sub) setSub(null)
    else if (tab !== 'home') setTab('home')
  })

  if (!data.ready) return <div className="loading">Gynaeca</div>

  const close = () => setSheet(null)
  const open = (kind: SheetKind, date: ISODate) => setSheet({ kind, date })
  const back = () => setSub(null)
  const openDay = (d: ISODate) => {
    setDay(d)
    const p = parseISO(d)
    setYm({ y: p.y, m0: p.m0 })
  }

  return (
    <div className="app">
      <main className="screen">
        {sub === 'report' && <Report data={data} onBack={back} />}
        {sub === 'fertility' && <FertilityView data={data} onBack={back} openSheet={open} />}
        {sub === 'month' && <MonthView data={data} ym={ym} setYm={setYm} openSheet={open} onBack={back} onPickDay={openDay} />}
        {!sub && tab === 'home' && <Home data={data} ym={ym} setYm={setYm} onOpenDay={openDay} onFertility={() => setSub('fertility')} />}
        {!sub && tab === 'stats' && (
          <Stats
            data={data}
            onReport={() => setSub('report')}
            onTable={() => setSub('month')}
            onFertility={() => setSub('fertility')}
            onPickMonth={(y, m0) => {
              setYm({ y, m0 })
              setSub('month')
            }}
          />
        )}
        {!sub && tab === 'themes' && <Themes data={data} />}
        {!sub && tab === 'settings' && <SettingsView data={data} onReport={() => setSub('report')} onScales={() => open('scales', todayISO())} />}
      </main>

      {!sub && (
        <TabBar
          tab={tab}
          onTab={(x) => {
            setTab(x)
            window.scrollTo(0, 0)
          }}
          onPlus={() => openDay(todayISO())}
        />
      )}

      {day && <DayPage data={data} date={day} setDate={openDay} onClose={() => setDay(null)} openSheet={open} />}

      {sheet?.kind === 'pain' && <PainSheet data={data} date={sheet.date} onClose={close} onSymptoms={() => open('symptoms', sheet.date)} />}
      {sheet?.kind === 'symptoms' && <SymptomSheet data={data} date={sheet.date} onClose={close} />}
      {sheet?.kind === 'nfp' && <NfpSheet data={data} date={sheet.date} onClose={close} />}
      {sheet?.kind === 'contra' && <ContraceptionSheet data={data} date={sheet.date} onClose={close} />}
      {sheet?.kind === 'scales' && <ScalesSheet onClose={close} />}
      {sheet?.kind === 'day' && <DaySheet data={data} date={sheet.date} onClose={close} />}
    </div>
  )
}
