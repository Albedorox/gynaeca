import Sheet, { Chip } from './Sheet'
import { updateDay } from '../lib/db'
import { formatDE, weekdayShort, type ISODate } from '../lib/dates'
import type { AppData } from '../lib/useData'
import type { CervixFirmness, CervixOpening, CervixPosition, MucusCode } from '../lib/model'

const MUCUS: { code: MucusCode; label: string }[] = [
  { code: 't', label: 'trocken' },
  { code: 'Ø', label: 'nichts gefühlt' },
  { code: 'f', label: 'feucht' },
  { code: 'S', label: 'dicklich, weißlich' },
  { code: 'S+', label: 'glasig, spinnbar' },
]
const OPENING: CervixOpening[] = ['geschlossen', 'leicht', 'offen']
const FIRMNESS: CervixFirmness[] = ['hart', 'mittel', 'weich']
const POSITION: CervixPosition[] = ['tief', 'mittel', 'hoch']

const round2 = (n: number) => Math.round(n * 100) / 100

export default function NfpSheet({ data, date, onClose }: { data: AppData; date: ISODate; onClose: () => void }) {
  const d = data.days.get(date)
  // Startwert: letzte erfasste Temperatur vor diesem Tag, sonst 36,50
  const lastTemp = [...data.dayList].reverse().find((x) => x.date < date && x.temp != null)?.temp ?? 36.5
  const temp = d?.temp ?? null
  const shown = temp ?? lastTemp
  const setTemp = (v: number | null) => updateDay(date, { temp: v === null ? null : round2(Math.max(34, Math.min(42, v))) })

  return (
    <Sheet title="NFP" subtitle={`${weekdayShort(date)}, ${formatDE(date)}`} onClose={onClose}>
      <h3>Basaltemperatur</h3>
      <div className="temp-edit">
        <button className="btn" onClick={() => setTemp(shown - 0.1)}>−0,1</button>
        <button className="btn" onClick={() => setTemp(shown - 0.01)}>−0,01</button>
        <button className={`temp-display${temp === null ? ' unset' : ''}`} onClick={() => temp === null && setTemp(shown)}>
          {shown.toFixed(2).replace('.', ',')} °C
        </button>
        <button className="btn" onClick={() => setTemp(shown + 0.01)}>+0,01</button>
        <button className="btn" onClick={() => setTemp(shown + 0.1)}>+0,1</button>
      </div>
      <div className="chips">
        {temp === null ? (
          <Chip onClick={() => setTemp(shown)}>Wert übernehmen</Chip>
        ) : (
          <Chip onClick={() => setTemp(null)}>Temperatur entfernen</Chip>
        )}
        <Chip on={d?.tempDisturbed} onClick={() => updateDay(date, { tempDisturbed: !d?.tempDisturbed })}>
          Störfaktor (Schlaf, Alkohol, Krankheit)
        </Chip>
      </div>

      <h3>Zervixschleim</h3>
      <div className="chips">
        {MUCUS.map((m) => (
          <Chip key={m.code} on={d?.mucus === m.code} onClick={() => updateDay(date, { mucus: d?.mucus === m.code ? null : m.code })} title={m.label}>
            <b>{m.code}</b> {m.label}
          </Chip>
        ))}
      </div>

      <h3>Muttermund</h3>
      <div className="chips">
        {OPENING.map((v) => (
          <Chip key={v} on={d?.cervixOpening === v} onClick={() => updateDay(date, { cervixOpening: d?.cervixOpening === v ? null : v })}>
            {v}
          </Chip>
        ))}
      </div>
      <div className="chips">
        {FIRMNESS.map((v) => (
          <Chip key={v} on={d?.cervixFirmness === v} onClick={() => updateDay(date, { cervixFirmness: d?.cervixFirmness === v ? null : v })}>
            {v}
          </Chip>
        ))}
      </div>
      <div className="chips">
        {POSITION.map((v) => (
          <Chip key={v} on={d?.cervixPosition === v} onClick={() => updateDay(date, { cervixPosition: d?.cervixPosition === v ? null : v })}>
            {v}
          </Chip>
        ))}
      </div>
      <p className="hint">Anzeige in der Zeile: ● geschlossen, ◐ leicht, ○ offen · h/m/w Festigkeit · ↓ → ↑ Stellung</p>
    </Sheet>
  )
}
