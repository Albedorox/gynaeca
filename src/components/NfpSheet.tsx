import { useState } from 'react'
import Sheet, { Chip } from './Sheet'
import { updateDay } from '../lib/db'
import { formatDE, weekdayShort, type ISODate } from '../lib/dates'
import type { AppData } from '../lib/useData'
import type { CervixFirmness, CervixOpening, CervixPosition, LhResult, MucusCode } from '../lib/model'

export const MUCUS: { code: MucusCode; label: string; feel: string }[] = [
  { code: 't', label: 'trocken', feel: 'trocken, rau, juckend, unangenehm' },
  { code: 'Ø', label: 'nichts', feel: 'nichts gefühlt, nichts gesehen' },
  { code: 'f', label: 'feucht', feel: 'feucht, aber nichts zu sehen' },
  { code: 'S', label: 'cremig', feel: 'dicklich, weißlich, trüb, klumpig, nicht ziehbar' },
  { code: 'S+', label: 'glasig', feel: 'glasig, wie rohes Eiweiß, spinnbar oder sehr nass, rutschig' },
]
const OPENING: CervixOpening[] = ['geschlossen', 'leicht', 'offen']
const FIRMNESS: CervixFirmness[] = ['hart', 'mittel', 'weich']
const POSITION: CervixPosition[] = ['tief', 'mittel', 'hoch']
const LH: { v: LhResult; label: string }[] = [
  { v: 'neg', label: 'negativ' },
  { v: 'pos', label: 'positiv' },
  { v: 'peak', label: 'Höchstwert' },
]

const round2 = (n: number) => Math.round(n * 100) / 100

export default function NfpSheet({ data, date, onClose }: { data: AppData; date: ISODate; onClose: () => void }) {
  const d = data.days.get(date)
  const m = data.settings.modules
  const [howLh, setHowLh] = useState(false)
  const [howMucus, setHowMucus] = useState(false)
  // Startwert: letzte erfasste Temperatur vor diesem Tag, sonst 36,50
  const lastTemp = [...data.dayList].reverse().find((x) => x.date < date && x.temp != null)?.temp ?? 36.5
  const temp = d?.temp ?? null
  const shown = temp ?? lastTemp
  const setTemp = (v: number | null) => updateDay(date, { temp: v === null ? null : round2(Math.max(34, Math.min(42, v))) })
  const source = d?.mucusSource ?? null

  return (
    <Sheet title="Fruchtbarkeit eintragen" subtitle={`${weekdayShort(date)}, ${formatDE(date)}`} onClose={onClose}>
      <h3 className="first">Aufwachtemperatur</h3>
      <div className="temp-edit">
        <button className="btn" onClick={() => setTemp(shown - 0.1)}>−0,1</button>
        <button className="btn" onClick={() => setTemp(shown - 0.05)}>−0,05</button>
        <button className={`temp-display${temp === null ? ' unset' : ''}`} onClick={() => temp === null && setTemp(shown)}>
          {shown.toFixed(2).replace('.', ',')} °C
        </button>
        <button className="btn" onClick={() => setTemp(shown + 0.05)}>+0,05</button>
        <button className="btn" onClick={() => setTemp(shown + 0.1)}>+0,1</button>
      </div>
      <div className="chips">
        {temp === null ? <Chip onClick={() => setTemp(shown)}>Wert übernehmen</Chip> : <Chip onClick={() => setTemp(null)}>Temperatur entfernen</Chip>}
        <Chip on={d?.tempDisturbed} onClick={() => updateDay(date, { tempDisturbed: !d?.tempDisturbed })}>
          Störung (spät, wenig Schlaf, Alkohol, krank)
        </Chip>
      </div>
      <p className="hint">Direkt nach dem Aufwachen messen, vor dem Aufstehen, immer gleich (z. B. im Mund), möglichst zur selben Uhrzeit. Gestörte Werte werden in der Auswertung ausgeklammert.</p>

      {m.nfpMucus && (
        <>
          <h3>Zervixschleim</h3>
          <div className="chips">
            <Chip on={source === 'muttermund'} onClick={() => updateDay(date, { mucusSource: source === 'muttermund' ? null : 'muttermund' })}>
              am Muttermund entnommen
            </Chip>
            <Chip on={source === 'aussen'} onClick={() => updateDay(date, { mucusSource: source === 'aussen' ? null : 'aussen' })}>
              am Scheideneingang beobachtet
            </Chip>
          </div>
          <div className="mucus-list">
            {MUCUS.map((x) => (
              <button
                key={x.code}
                className={`mucus-opt${d?.mucus === x.code ? ' on' : ''}`}
                onClick={() => updateDay(date, { mucus: d?.mucus === x.code ? null : x.code, ...(d?.mucusSource ? {} : { mucusSource: 'muttermund' }) })}
                aria-pressed={d?.mucus === x.code}
              >
                <b>{x.code}</b>
                <span>
                  {x.label}
                  <small>{x.feel}</small>
                </span>
              </button>
            ))}
          </div>
          <p className="hint">Eingetragen wird die beste Qualität des Tages.</p>
          <button className="link" onClick={() => setHowMucus(!howMucus)}>{howMucus ? 'Anleitung schließen' : 'Wie beobachte ich den Schleim?'}</button>
          {howMucus && (
            <div className="howto">
              <p>
                <b>Am Muttermund (Standard):</b> Mit sauberen Händen zwei Finger in die Scheide bis zum Muttermund einführen und etwas Sekret
                aufnehmen. Zwischen Daumen und Zeigefinger prüfen: Lässt es sich ziehen, ist es glasig?
              </p>
              <p>
                <b>Am Scheideneingang (einfacher):</b> Mehrmals am Tag beim Toilettengang auf das Gefühl achten und mit Toilettenpapier abwischen.
                Ohne Slipeinlage, weil sie den Schleim aufsaugt.
              </p>
              <p>
                <b>Wichtig:</b> Nicht bei sexueller Erregung, nach Geschlechtsverkehr oder bei einer Infektion beurteilen. Das Vaginalsekret nimmt bei
                Erregung zu und kann fruchtbaren Schleim vortäuschen.
              </p>
            </div>
          )}
        </>
      )}

      {m.nfpCervix && (
        <>
          <h3>Muttermund</h3>
          <p className="hint">Öffnung</p>
          <div className="chips">
            {OPENING.map((v) => (
              <Chip key={v} on={d?.cervixOpening === v} onClick={() => updateDay(date, { cervixOpening: d?.cervixOpening === v ? null : v })}>
                {v}
              </Chip>
            ))}
          </div>
          <p className="hint">Festigkeit</p>
          <div className="chips">
            {FIRMNESS.map((v) => (
              <Chip key={v} on={d?.cervixFirmness === v} onClick={() => updateDay(date, { cervixFirmness: d?.cervixFirmness === v ? null : v })}>
                {v}
              </Chip>
            ))}
          </div>
          <p className="hint">Stellung</p>
          <div className="chips">
            {POSITION.map((v) => (
              <Chip key={v} on={d?.cervixPosition === v} onClick={() => updateDay(date, { cervixPosition: d?.cervixPosition === v ? null : v })}>
                {v}
              </Chip>
            ))}
          </div>
          <p className="hint">Einmal am Tag, möglichst zur gleichen Zeit und in der gleichen Haltung tasten. Um den Eisprung wird der Muttermund weich, öffnet sich und steht höher.</p>
        </>
      )}

      {m.lh && (
        <>
          <h3>LH-Test</h3>
          <div className="chips">
            {LH.map((x) => (
              <Chip key={x.v} on={d?.lh === x.v} onClick={() => updateDay(date, { lh: d?.lh === x.v ? null : x.v })}>
                {x.label}
              </Chip>
            ))}
          </div>
          <button className="link" onClick={() => setHowLh(!howLh)}>{howLh ? 'Anleitung schließen' : 'Wie mache ich den LH-Test?'}</button>
          {howLh && <LhHowTo />}
        </>
      )}
    </Sheet>
  )
}

export function LhHowTo() {
  return (
    <div className="howto">
      <ol>
        <li>Ab etwa 3 Tage vor dem erwarteten Eisprung täglich testen, am besten mittags oder nachmittags, nicht mit dem Morgenurin.</li>
        <li>2 Stunden vorher wenig trinken und möglichst nicht zur Toilette gehen.</li>
        <li>Teststreifen so lange wie in der Packungsbeilage angegeben in den Urin halten.</li>
        <li>Nach etwa 5 Minuten ablesen, später nicht mehr werten.</li>
      </ol>
      <div className="lh-example" aria-label="Beispiel Teststreifen">
        <LhStrip test={0.15} label="negativ" />
        <LhStrip test={0.55} label="negativ" />
        <LhStrip test={1} label="positiv" />
        <LhStrip test={1.25} label="positiv" />
      </div>
      <p>
        <b>Positiv</b> ist der Test nur, wenn die Testlinie <b>genauso dunkel oder dunkler</b> ist als die Kontrolllinie. Eine schwächere Linie ist
        negativ. Der Eisprung folgt meist 24 bis 36 Stunden nach dem ersten positiven Test.
      </p>
      <p className="hint">Der LH-Test bestätigt den Eisprung nicht. Die Auswertung richtet sich weiter nach Temperatur und Schleim.</p>
    </div>
  )
}

function LhStrip({ test, label }: { test: number; label: string }) {
  const c = (o: number) => `color-mix(in srgb, var(--accent) ${Math.round(Math.min(100, o * 80))}%, transparent)`
  return (
    <figure className="lh-strip">
      <svg viewBox="0 0 30 90" width="30" height="90" aria-hidden="true">
        <rect x="1" y="1" width="28" height="88" rx="4" fill="var(--paper)" stroke="var(--line-strong)" />
        <rect x="5" y="22" width="20" height="5" rx="1" fill={c(test)} />
        <rect x="5" y="46" width="20" height="5" rx="1" fill={c(0.95)} />
        <text x="15" y="16" fontSize="7" textAnchor="middle" fill="var(--muted)">T</text>
        <text x="15" y="64" fontSize="7" textAnchor="middle" fill="var(--muted)">K</text>
      </svg>
      <figcaption>{label}</figcaption>
    </figure>
  )
}
