import { useEffect, useRef, useState } from 'react'
import { updateDay } from '../lib/db'
import type { ISODate } from '../lib/dates'

/** Freitext-Notiz, wird kurz nach dem Tippen gespeichert. */
export default function NoteField({ date, initial }: { date: ISODate; initial: string }) {
  const [v, setV] = useState(initial)
  const timer = useRef<number | undefined>(undefined)
  const latest = useRef(v)
  latest.current = v

  useEffect(
    () => () => {
      window.clearTimeout(timer.current)
      if (latest.current !== initial) updateDay(date, { note: latest.current })
    },
    // nur beim Schließen speichern
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  return (
    <textarea
      className="note"
      rows={3}
      value={v}
      placeholder="z. B. Arzttermin, Auslöser, Besonderheiten"
      onChange={(e) => {
        setV(e.target.value)
        window.clearTimeout(timer.current)
        const next = e.target.value
        timer.current = window.setTimeout(() => updateDay(date, { note: next }), 400)
      }}
    />
  )
}
