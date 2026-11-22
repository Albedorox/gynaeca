import { useRef, useState, type ReactNode } from 'react'
import { saveSettings } from '../lib/db'
import { deleteAll, exportCSV, exportJSON, importJSON } from '../lib/exporter'
import type { AppData } from '../lib/useData'
import type { Settings } from '../lib/model'
import { Chip } from './Sheet'
import { loadDemo } from '../lib/demo'
import { NFP_DISCLAIMER } from '../lib/knowledge'

function Toggle({ label, hint, on, onChange }: { label: string; hint?: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="toggle">
      <span>
        {label}
        {hint && <small>{hint}</small>}
      </span>
      <input type="checkbox" checked={on} onChange={(e) => onChange(e.target.checked)} />
      <i aria-hidden="true" />
    </label>
  )
}

function NumberSetting({ label, value, min, max, placeholder, onChange }: { label: string; value: number | null; min: number; max: number; placeholder: string; onChange: (v: number | null) => void }) {
  const [text, setText] = useState(value?.toString() ?? '')
  return (
    <label className="row-setting">
      <span>{label}</span>
      <input
        className="num-input"
        inputMode="numeric"
        placeholder={placeholder}
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          const v = parseInt(e.target.value, 10)
          if (e.target.value.trim() === '') onChange(null)
          else if (Number.isFinite(v) && v >= min && v <= max) onChange(v)
        }}
      />
    </label>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card">
      <h2>{title}</h2>
      {children}
    </section>
  )
}

export default function SettingsView({ data, onBack, onReport }: { data: AppData; onBack: () => void; onReport: () => void }) {
  const s = data.settings
  const setModule = (k: keyof Settings['modules'], v: boolean) => saveSettings({ modules: { ...s.modules, [k]: v } })
  const [msg, setMsg] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmDemo, setConfirmDemo] = useState(false)
  const [medName, setMedName] = useState('')
  const [medDoses, setMedDoses] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <div className="page settings">
      <header className="page-head">
        <button className="icon-btn" onClick={onBack} aria-label="Zurück">‹</button>
        <h1>Einstellungen</h1>
      </header>
      <div className="page-body">
        <Section title="Module">
          <p className="hint">Die Periode wird immer erfasst. Alles andere schalten Sie nach Bedarf dazu.</p>
          <Toggle label="Schmerzen & Medikamente" hint="Schmerzskala 0–10, ab 4 Frage nach Schmerzmitteln" on={s.modules.pain} onChange={(v) => setModule('pain', v)} />
          <Toggle
            label="Endometriose-Fragen"
            hint="Schmerzarten mit Stärke, Rücken, Alltag, Stress, Bewegung"
            on={s.modules.endo}
            onChange={(v) => saveSettings({ modules: { ...s.modules, endo: v, pain: v ? true : s.modules.pain } })}
          />
          <Toggle label="Begleitsymptome" hint="Kopfschmerz, Verdauung, Stimmung und eigene Tags" on={s.modules.symptoms} onChange={(v) => setModule('symptoms', v)} />
          <Toggle label="Hormonelle Verhütung" hint="Balken links neben der Tageszahl" on={s.modules.contraception} onChange={(v) => setModule('contraception', v)} />
          <Toggle label="Fruchtbarkeit" hint="Natürliche Familienplanung (symptothermale Methode)" on={s.modules.nfp} onChange={(v) => setModule('nfp', v)} />
          {s.modules.nfp && (
            <div className="sub-toggles">
              <p className="hint">Zeichen für die Auswertung. Die Temperatur ist immer dabei, dazu Schleim oder Muttermund.</p>
              <Toggle label="Zervixschleim" hint="Standard: am Muttermund entnommen" on={s.modules.nfpMucus} onChange={(v) => setModule('nfpMucus', v)} />
              <Toggle
                label="Muttermund"
                hint={s.modules.nfpMucus ? 'Wird zusätzlich notiert, ausgewertet wird der Schleim' : 'Ersetzt den Schleim in der Auswertung'}
                on={s.modules.nfpCervix}
                onChange={(v) => setModule('nfpCervix', v)}
              />
              <Toggle label="LH-Test" hint="Zur Bestätigung, ändert die Auswertung nicht" on={s.modules.lh} onChange={(v) => setModule('lh', v)} />
              <p className="hint">{NFP_DISCLAIMER}</p>
            </div>
          )}
        </Section>

        <Section title="Angaben für Hinweise">
          <p className="hint">Damit die App Zykluslängen passend zu Ihrem Alter einordnen kann. Bleibt auf diesem Gerät.</p>
          <NumberSetting
            label="Geburtsjahr"
            value={s.birthYear}
            min={1940}
            max={new Date().getFullYear() - 8}
            placeholder="z. B. 1992"
            onChange={(v) => saveSettings({ birthYear: v })}
          />
          <NumberSetting label="Alter bei der ersten Periode" value={s.menarcheAge} min={7} max={20} placeholder="z. B. 12" onChange={(v) => saveSettings({ menarcheAge: v })} />
        </Section>

        <Section title="Zyklusberechnung">
          <Toggle
            label="Schmierblutung mitzählen"
            hint="Reine Schmierblutung direkt vor oder nach der Periode zählt zur Blutungsdauer"
            on={s.countSpotting}
            onChange={(v) => saveSettings({ countSpotting: v })}
          />
          <div className="row-setting">
            <span>
              Neue Periode nach mind.
              <small>blutungsfreien Tagen (kürzere Pausen gelten als Zwischenblutung)</small>
            </span>
            <div className="stepper">
              <button onClick={() => saveSettings({ minGapDays: Math.max(1, s.minGapDays - 1) })} aria-label="Weniger">−</button>
              <span>{s.minGapDays}</span>
              <button onClick={() => saveSettings({ minGapDays: Math.min(30, s.minGapDays + 1) })} aria-label="Mehr">+</button>
            </div>
          </div>
        </Section>

        <Section title="Schmerzmittel-Favoriten">
          {s.medFavorites.map((f) => (
            <div key={f.name} className="fav-row">
              <span>
                <b>{f.name}</b> <small className="muted">{f.doses.map((d) => `${d} mg`).join(', ')}</small>
              </span>
              <button className="btn ghost" onClick={() => saveSettings({ medFavorites: s.medFavorites.filter((x) => x.name !== f.name) })}>
                Entfernen
              </button>
            </div>
          ))}
          <form
            className="inline-form"
            onSubmit={(e) => {
              e.preventDefault()
              const name = medName.trim()
              if (!name) return
              const doses = medDoses.split(/[,; ]+/).map((x) => parseInt(x, 10)).filter((x) => Number.isFinite(x) && x > 0)
              saveSettings({ medFavorites: [...s.medFavorites.filter((x) => x.name !== name), { name, doses }] })
              setMedName('')
              setMedDoses('')
            }}
          >
            <input value={medName} onChange={(e) => setMedName(e.target.value)} placeholder="Präparat" aria-label="Präparat" />
            <input value={medDoses} onChange={(e) => setMedDoses(e.target.value)} placeholder="Dosen mg, z. B. 400, 600" aria-label="Dosierungen" />
            <button className="btn" type="submit">+</button>
          </form>
        </Section>

        {s.modules.contraception && (
          <Section title="Verhütungs-Präparate">
            <div className="chips">
              {s.contraceptionFavorites.map((f) => (
                <Chip key={f} onClick={() => saveSettings({ contraceptionFavorites: s.contraceptionFavorites.filter((x) => x !== f) })} title="Tippen zum Entfernen">
                  {f} ✕
                </Chip>
              ))}
            </div>
          </Section>
        )}

        {s.customSymptoms.length > 0 && (
          <Section title="Eigene Symptome">
            <div className="chips">
              {s.customSymptoms.map((f) => (
                <Chip key={f} onClick={() => saveSettings({ customSymptoms: s.customSymptoms.filter((x) => x !== f) })} title="Tippen zum Entfernen">
                  {f} ✕
                </Chip>
              ))}
            </div>
          </Section>
        )}

        <Section title="Export & Datensicherung">
          <p className="hint">Alle Daten liegen nur auf diesem Gerät (im Browser-Speicher). Es gibt keinen Server und kein Konto. Lege regelmäßig ein Backup an.</p>
          <div className="stack">
            <button className="btn primary" onClick={onReport}>Arztbericht / PDF-Zyklusblatt</button>
            <button className="btn" onClick={() => exportJSON()}>Backup als JSON speichern</button>
            <button className="btn" onClick={() => exportCSV()}>Tabelle als CSV (Excel)</button>
            <button className="btn" onClick={() => fileRef.current?.click()}>Backup wiederherstellen …</button>
            {!confirmDemo ? (
              <button className="btn" onClick={() => setConfirmDemo(true)}>Beispieldaten laden …</button>
            ) : (
              <div className="confirm">
                <span>Ersetzt alle Tageseinträge durch drei Beispielzyklen.</span>
                <button
                  className="btn primary"
                  onClick={async () => {
                    await loadDemo()
                    setConfirmDemo(false)
                    setMsg('Beispieldaten geladen.')
                  }}
                >
                  Laden
                </button>
                <button className="btn" onClick={() => setConfirmDemo(false)}>Abbrechen</button>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={async (e) => {
                const f = e.target.files?.[0]
                e.target.value = ''
                if (!f) return
                try {
                  const r = await importJSON(f)
                  setMsg(`Wiederhergestellt: ${r.days} Tage, ${r.courses} Verhütungszeiträume.`)
                } catch (err) {
                  setMsg(err instanceof Error ? err.message : 'Import fehlgeschlagen.')
                }
              }}
            />
            {!confirmDelete ? (
              <button className="btn danger" onClick={() => setConfirmDelete(true)}>Alle Daten löschen …</button>
            ) : (
              <div className="confirm">
                <span>Wirklich alles unwiderruflich löschen?</span>
                <button
                  className="btn danger"
                  onClick={async () => {
                    await deleteAll()
                    setConfirmDelete(false)
                    setMsg('Alle Daten wurden gelöscht.')
                  }}
                >
                  Ja, löschen
                </button>
                <button className="btn" onClick={() => setConfirmDelete(false)}>Abbrechen</button>
              </div>
            )}
          </div>
          {msg && <p className="msg">{msg}</p>}
        </Section>

        <p className="hint center">Zyklusblatt v0.2 · offline nutzbar · zum Startbildschirm hinzufügen für App-Modus</p>
      </div>
    </div>
  )
}
