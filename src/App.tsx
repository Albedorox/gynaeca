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
import CareView from './components/CareView'
import GynMedSheet from './components/GynMedSheet'
import BreathSheet from './components/BreathSheet'
import DayLayoutSheet from './components/DayLayoutSheet'
import PrepView from './components/PrepView'
import { PrepInfoSheet, PrepSheet } from './components/PrepSheets'
import type { CareTab } from './components/CareSections'
import TabBar, { type Tab } from './components/TabBar'
import { useBackButton } from './lib/useBackButton'
import { applyAppearance } from './lib/theme'
import { cameFromLoginLink } from './lib/account'

export type SubView = 'report' | 'fertility' | 'month' | 'care' | 'preps'
export type SheetKind = 'pain' | 'symptoms' | 'nfp' | 'contra' | 'day' | 'scales' | 'gyn' | 'breath' | 'symptomsEdit' | 'layout' | 'prep' | 'prepInfo'

export default function App() {
  const data = useAppData()
  const t = parseISO(todayISO())
  const [ym, setYm] = useState({ y: t.y, m0: t.m0 })
  const [tab, setTab] = useState<Tab>(cameFromLoginLink ? 'settings' : 'home')
  const [sub, setSub] = useState<SubView | null>(null)
  const [day, setDay] = useState<ISODate | null>(null)
  const [sheet, setSheet] = useState<{ kind: SheetKind; date: ISODate; id?: number } | null>(null)
  const [careTab, setCareTab] = useState<CareTab>('food')
  // Unterseite, zu der „Zurück“ führt (z. B. vom Bericht zurück zum Präparate-Verlauf)
  const [subBack, setSubBack] = useState<SubView | null>(null)

  const { mode, palette } = data.settings.appearance
  useEffect(() => {
    if (data.ready) applyAppearance(mode, palette)
  }, [data.ready, mode, palette])

  const depth = (tab !== 'home' ? 1 : 0) + (sub ? 1 : 0) + (subBack ? 1 : 0) + (day ? 1 : 0) + (sheet ? 1 : 0)
  useBackButton(depth, () => {
    if (sheet) setSheet(null)
    else if (day) setDay(null)
    else if (sub) back()
    else if (tab !== 'home') setTab('home')
  })

  if (!data.ready) return <div className="loading">Gynaeca</div>

  const close = () => setSheet(null)
  const open = (kind: SheetKind, date: ISODate, id?: number) => setSheet({ kind, date, id })
  const openCare = (t: CareTab) => {
    setCareTab(t)
    setDay(null)
    setSub('care')
  }
  function back() {
    setSub(subBack)
    setSubBack(null)
  }
  const openSub = (s: SubView, from: SubView | null = null) => {
    setSubBack(from)
    setDay(null)
    setSub(s)
    window.scrollTo(0, 0)
  }
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
        {sub === 'preps' && <PrepView data={data} onBack={back} onReport={() => openSub('report', 'preps')} openSheet={open} />}
        {sub === 'care' && <CareView data={data} tab={careTab} setTab={setCareTab} onBack={back} onPickDay={openDay} />}
        {sub === 'month' && <MonthView data={data} ym={ym} setYm={setYm} openSheet={open} onBack={back} onPickDay={openDay} />}
        {!sub && tab === 'home' && <Home data={data} ym={ym} setYm={setYm} onOpenDay={openDay} onFertility={() => setSub('fertility')} />}
        {!sub && tab === 'stats' && (
          <Stats
            data={data}
            onReport={() => setSub('report')}
            onTable={() => setSub('month')}
            onFertility={() => setSub('fertility')}
            onCare={() => openCare('food')}
            onPreps={() => openSub('preps')}
            onPickMonth={(y, m0) => {
              setYm({ y, m0 })
              setSub('month')
            }}
          />
        )}
        {!sub && tab === 'themes' && <Themes data={data} />}
        {!sub && tab === 'settings' && <SettingsView data={data} onReport={() => setSub('report')} onScales={() => open('scales', todayISO())} onDayLayout={() => open('layout', todayISO())} />}
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

      {day && <DayPage data={data} date={day} setDate={openDay} onClose={() => setDay(null)} openSheet={open} onDiary={openCare} onPreps={() => openSub('preps')} />}

      {sheet?.kind === 'pain' && <PainSheet data={data} date={sheet.date} onClose={close} onSymptoms={() => open('symptoms', sheet.date)} />}
      {sheet?.kind === 'symptoms' && <SymptomSheet data={data} date={sheet.date} onClose={close} />}
      {sheet?.kind === 'symptomsEdit' && <SymptomSheet data={data} date={sheet.date} onClose={close} editCustom />}
      {sheet?.kind === 'layout' && (
        <DayLayoutSheet
          data={data}
          onClose={close}
          onSettings={() => {
            setSheet(null)
            setDay(null)
            setSub(null)
            setTab('settings')
          }}
        />
      )}
      {sheet?.kind === 'nfp' && <NfpSheet data={data} date={sheet.date} onClose={close} />}
      {sheet?.kind === 'contra' && <ContraceptionSheet data={data} date={sheet.date} onClose={close} />}
      {sheet?.kind === 'scales' && <ScalesSheet onClose={close} />}
      {sheet?.kind === 'gyn' && <GynMedSheet data={data} date={sheet.date} id={sheet.id} onClose={close} />}
      {sheet?.kind === 'breath' && <BreathSheet date={sheet.date} onClose={close} />}
      {sheet?.kind === 'prep' && (
        <PrepSheet
          key={sheet.id ?? 'new'}
          data={data}
          id={sheet.id}
          onClose={close}
          onSaved={(id) => {
            // Nach dem Speichern die Übersicht des Eintrags zeigen (Bewertung, Absetzgrund)
            if (sub !== 'preps') openSub('preps')
            open('prepInfo', sheet.date, id)
          }}
        />
      )}
      {sheet?.kind === 'prepInfo' && sheet.id !== undefined && (
        <PrepInfoSheet key={sheet.id} data={data} id={sheet.id} onClose={close} onEdit={() => open('prep', sheet.date, sheet.id)} />
      )}
      {sheet?.kind === 'day' && <DaySheet data={data} date={sheet.date} onClose={close} />}
    </div>
  )
}
