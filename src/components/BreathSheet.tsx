import { useEffect, useState } from 'react'
import Sheet, { Chip } from './Sheet'
import { updateDay } from '../lib/db'
import type { ISODate } from '../lib/dates'

// Ruhiges Atmen mit etwa sechs Atemzügen pro Minute (4 s ein, 6 s aus).
// Die verlängerte Ausatmung aktiviert den Parasympathikus und senkt Stress.
const IN = 4
const OUT = 6

const SENSES = [
  { n: 5, text: 'Dinge, die Sie sehen' },
  { n: 4, text: 'Dinge, die Sie spüren (Kleidung, Boden, Luft)' },
  { n: 3, text: 'Geräusche, die Sie hören' },
  { n: 2, text: 'Gerüche, die Sie wahrnehmen' },
  { n: 1, text: 'Geschmack im Mund' },
]

async function logRelax(date: ISODate, what: string) {
  await updateDay(date, (cur) => ({ relax: cur.relax.includes(what) ? cur.relax : [...cur.relax, what] }))
}

export default function BreathSheet({ date, onClose }: { date: ISODate; onClose: () => void }) {
  const [mode, setMode] = useState<'atem' | 'sinne'>('atem')
  return (
    <Sheet title="Kurze Übung" subtitle="Stress senken, Schmerz besser aushalten" onClose={onClose}>
      <div className="seg wide two" role="tablist">
        <button role="tab" aria-selected={mode === 'atem'} className={mode === 'atem' ? 'on' : ''} onClick={() => setMode('atem')}>Atmen</button>
        <button role="tab" aria-selected={mode === 'sinne'} className={mode === 'sinne' ? 'on' : ''} onClick={() => setMode('sinne')}>5-4-3-2-1</button>
      </div>
      {mode === 'atem' ? <Breathing date={date} /> : <Senses date={date} />}
    </Sheet>
  )
}

function Breathing({ date }: { date: ISODate }) {
  const [minutes, setMinutes] = useState(3)
  const [startAt, setStartAt] = useState<number | null>(null)
  const [now, setNow] = useState(Date.now())
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (startAt === null) return
    const t = window.setInterval(() => setNow(Date.now()), 200)
    return () => window.clearInterval(t)
  }, [startAt])

  const total = minutes * 60
  const elapsed = startAt === null ? 0 : (now - startAt) / 1000
  useEffect(() => {
    if (startAt !== null && elapsed >= total) {
      setStartAt(null)
      setDone(true)
      navigator.vibrate?.([30, 60, 30])
      logRelax(date, 'Atemübung')
    }
  }, [elapsed, total, startAt, date])

  const t = elapsed % (IN + OUT)
  const inhale = t < IN
  const left = Math.max(0, Math.ceil(total - elapsed))
  const phaseLeft = Math.ceil(inhale ? IN - t : IN + OUT - t)

  return (
    <div className="breath">
      <div className={`breath-circle${startAt !== null ? (inhale ? ' in' : ' out') : ''}`} style={{ ['--in' as string]: `${IN}s`, ['--out' as string]: `${OUT}s` }} aria-live="polite">
        <span>
          {startAt !== null ? (
            <>
              <b>{inhale ? 'Einatmen' : 'Ausatmen'}</b>
              <small>{phaseLeft}</small>
            </>
          ) : done ? (
            <>
              <b>Geschafft</b>
              <small>als Atemübung eingetragen</small>
            </>
          ) : (
            <>
              <b>Bereit?</b>
              <small>4 s ein, 6 s aus</small>
            </>
          )}
        </span>
      </div>
      {startAt === null ? (
        <>
          <div className="chips center">
            {[1, 3, 5].map((m) => (
              <Chip key={m} on={minutes === m} onClick={() => setMinutes(m)}>
                {m} min
              </Chip>
            ))}
          </div>
          <button
            className="btn primary btn-pill full"
            onClick={() => {
              setDone(false)
              setNow(Date.now())
              setStartAt(Date.now())
            }}
          >
            {done ? 'Nochmal' : 'Starten'}
          </button>
        </>
      ) : (
        <>
          <p className="hint center">
            Noch {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')} · in den Bauch atmen, Schultern locker
          </p>
          <button className="btn full" onClick={() => setStartAt(null)}>Beenden</button>
        </>
      )}
      <p className="hint">Langsames Ausatmen beruhigt das Nervensystem und senkt Stresshormone wie Cortisol. Wärme auf dem Bauch verstärkt die Wirkung.</p>
    </div>
  )
}

function Senses({ date }: { date: ISODate }) {
  const [step, setStep] = useState(0)
  const finished = step >= SENSES.length
  return (
    <div className="senses">
      <p className="hint first">Eine Achtsamkeitsübung für akute Anspannung. Nennen Sie still für sich:</p>
      <ol className="senses-list">
        {SENSES.map((s, i) => (
          <li key={s.n} className={i < step ? 'done' : i === step ? 'cur' : ''}>
            <b>{s.n}</b>
            <span>{s.text}</span>
          </li>
        ))}
      </ol>
      {finished ? (
        <>
          <p className="hint center"><b className="ok-text">Gut gemacht.</b> Als Achtsamkeitsübung eingetragen.</p>
          <button className="btn full" onClick={() => setStep(0)}>Nochmal</button>
        </>
      ) : (
        <button
          className="btn primary btn-pill full"
          onClick={() => {
            const n = step + 1
            setStep(n)
            if (n >= SENSES.length) logRelax(date, 'Achtsamkeitsübung')
          }}
        >
          {step === SENSES.length - 1 ? 'Fertig' : 'Weiter'}
        </button>
      )}
    </div>
  )
}
