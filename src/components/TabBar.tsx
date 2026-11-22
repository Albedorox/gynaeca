import { Icon } from './Icons'

export type Tab = 'home' | 'stats' | 'themes' | 'settings'

const LEFT: { id: Tab; label: string; icon: string }[] = [
  { id: 'home', label: 'Kalender', icon: 'calendar' },
  { id: 'stats', label: 'Statistik', icon: 'chart' },
]
const RIGHT: { id: Tab; label: string; icon: string }[] = [
  { id: 'themes', label: 'Themen', icon: 'palette' },
  { id: 'settings', label: 'Einstellungen', icon: 'gear' },
]

/** Untere Navigation mit großem Plus in der Mitte (öffnet den heutigen Tag). */
export default function TabBar({ tab, onTab, onPlus }: { tab: Tab; onTab: (t: Tab) => void; onPlus: () => void }) {
  const item = (t: (typeof LEFT)[number]) => (
    <button key={t.id} className={`tb-item${tab === t.id ? ' on' : ''}`} onClick={() => onTab(t.id)} aria-current={tab === t.id ? 'page' : undefined}>
      <Icon name={t.icon} />
      <span>{t.label}</span>
    </button>
  )
  return (
    <nav className="tabbar" aria-label="Hauptnavigation">
      {LEFT.map(item)}
      <span className="tb-gap" />
      <button className="tb-plus" onClick={onPlus} aria-label="Heute eintragen">
        <Icon name="plus" size={30} />
      </button>
      {RIGHT.map(item)}
    </nav>
  )
}
