import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import '@fontsource/cormorant-garamond/latin-500.css'
import '@fontsource/cormorant-garamond/latin-600.css'
import './styles.css'
import { restoreAppearance } from './lib/theme'
import { initAccount } from './lib/account'

restoreAppearance()

// Offline-Cache nur in der eigentlichen App, nicht in eingebetteten Vorschauen
if (window.self === window.top) registerSW({ immediate: true })

// Bittet den Browser, die lokalen Daten nicht automatisch zu löschen.
if (navigator.storage?.persist) {
  navigator.storage.persisted().then((p) => (p ? undefined : navigator.storage.persist())).catch(() => {})
}

// Konto und Sync: lädt Supabase nur nach, wenn eine Anmeldung gespeichert ist
void initAccount()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
