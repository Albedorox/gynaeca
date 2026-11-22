import type { ThemeMode, ThemePalette } from './model'

const KEY = 'gynaeca-appearance'

/** Setzt Hell/Dunkel und Akzentfarbe am <html>-Element und merkt sie für den nächsten Start. */
export function applyAppearance(mode: ThemeMode, palette: ThemePalette): void {
  const root = document.documentElement
  const dark = mode === 'dunkel' || (mode === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches)
  root.dataset.theme = dark ? 'dark' : 'light'
  root.dataset.palette = palette
  const bg = getComputedStyle(root).getPropertyValue('--bg').trim()
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg || (dark ? '#17161b' : '#faf6f4'))
  try {
    localStorage.setItem(KEY, JSON.stringify({ mode, palette }))
  } catch {
    /* ohne Speicher: nur diese Sitzung */
  }
}

/** Vor dem ersten Rendern: zuletzt gewähltes Aussehen sofort anwenden (kein Aufblitzen). */
export function restoreAppearance(): void {
  let saved: { mode: ThemeMode; palette: ThemePalette } = { mode: 'dunkel', palette: 'rose' }
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) saved = { ...saved, ...JSON.parse(raw) }
  } catch {
    /* Standard verwenden */
  }
  applyAppearance(saved.mode, saved.palette)
}
