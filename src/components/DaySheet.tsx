import Sheet, { Chip } from './Sheet'
import { updateDay } from '../lib/db'
import { formatDE, weekdayShort, type ISODate } from '../lib/dates'
import type { AppData } from '../lib/useData'
import { cycleDay } from '../lib/cycles'
import NoteField from './NoteField'

export default function DaySheet({ data, date, onClose }: { data: AppData; date: ISODate; onClose: () => void }) {
  const d = data.days.get(date)
  const zt = cycleDay(data.cycles, date)
  const cs = d?.cycleStart ?? null
  return (
    <Sheet title={`${weekdayShort(date)}, ${formatDE(date)}`} subtitle={zt ? `Zyklustag ${zt}` : undefined} onClose={onClose}>
      <h3>Zyklusbeginn</h3>
      <div className="chips">
        <Chip on={cs === null} onClick={() => updateDay(date, { cycleStart: null })}>Automatisch</Chip>
        <Chip on={cs === true} onClick={() => updateDay(date, { cycleStart: true })}>Hier beginnt ein Zyklus</Chip>
        <Chip on={cs === false} onClick={() => updateDay(date, { cycleStart: false })}>Kein Zyklusbeginn</Chip>
      </div>
      <p className="hint">Automatisch: Die erste Blutung nach mindestens {data.settings.minGapDays} blutungsfreien Tagen ist Zyklustag 1.</p>
      <h3>Notiz</h3>
      <NoteField date={date} initial={d?.note ?? ''} />
    </Sheet>
  )
}
