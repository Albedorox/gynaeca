import type { AppData } from '../lib/useData'
import { saveSettings } from '../lib/db'
import type { ThemeMode, ThemePalette } from '../lib/model'

export const PALETTES: { id: ThemePalette; label: string; a: string; b: string }[] = [
  { id: 'rose', label: 'Rosé', a: '#e2668e', b: '#f2a7b8' },
  { id: 'beere', label: 'Beere', a: '#c2416b', b: '#8e2c55' },
  { id: 'lavendel', label: 'Lavendel', a: '#9b87e6', b: '#c9b8f2' },
  { id: 'salbei', label: 'Salbei', a: '#6fae8f', b: '#b5d6b0' },
  { id: 'ozean', label: 'Ozean', a: '#5b9bd5', b: '#9fd0e6' },
  { id: 'sand', label: 'Sand', a: '#d69c55', b: '#efcf9c' },
]

const MODES: { id: ThemeMode; label: string }[] = [
  { id: 'dunkel', label: 'Dunkel' },
  { id: 'hell', label: 'Hell' },
  { id: 'system', label: 'Wie Gerät' },
]

/** Eigene, abstrakte Kachel: weiche Bögen und Kreise in den Farben der Palette. */
function Tile({ a, b }: { a: string; b: string }) {
  return (
    <svg viewBox="0 0 120 120" aria-hidden="true">
      <rect width="120" height="120" fill="var(--surface)" />
      <circle cx="30" cy="38" r="26" fill={b} opacity=".55" />
      <circle cx="78" cy="30" r="18" fill={a} opacity=".75" />
      <circle cx="100" cy="58" r="12" fill={b} opacity=".8" />
      <circle cx="58" cy="56" r="9" fill={a} opacity=".5" />
      <path d="M0 84c25-14 50-14 70-4s38 8 50-2v42H0z" fill={b} opacity=".6" />
      <path d="M0 96c22-10 46-10 66-2s38 6 54-4v34H0z" fill={a} />
    </svg>
  )
}

export default function Themes({ data }: { data: AppData }) {
  const ap = data.settings.appearance
  const set = (p: Partial<typeof ap>) => saveSettings({ appearance: { ...ap, ...p } })
  return (
    <div className="page themes">
      <header className="tab-head">
        <h1>Themen</h1>
      </header>
      <div className="page-body">
        <section className="card">
          <h2>Darstellung</h2>
          <div className="seg wide" role="radiogroup" aria-label="Hell oder dunkel">
            {MODES.map((m) => (
              <button key={m.id} role="radio" aria-checked={ap.mode === m.id} className={ap.mode === m.id ? 'on' : ''} onClick={() => set({ mode: m.id })}>
                {m.label}
              </button>
            ))}
          </div>
          <p className="hint">Dunkel schont die Augen abends und spart bei vielen Handys Akku.</p>
        </section>
        <h2 className="group-title">Farbe</h2>
        <div className="theme-grid" role="radiogroup" aria-label="Farbthema">
          {PALETTES.map((p) => (
            <button key={p.id} role="radio" aria-checked={ap.palette === p.id} className={`theme-tile${ap.palette === p.id ? ' on' : ''}`} onClick={() => set({ palette: p.id })}>
              <Tile a={p.a} b={p.b} />
              <span>{p.label}</span>
              {ap.palette === p.id && <i className="theme-check" aria-hidden="true">✓</i>}
            </button>
          ))}
        </div>
        <p className="hint">Die Farbe für Blutung bleibt in jedem Thema gleich, damit Einträge immer eindeutig sind.</p>
      </div>
    </div>
  )
}
