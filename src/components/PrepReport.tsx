import { Fragment, useMemo } from 'react'
import type { AppData } from '../lib/useData'
import { formatDE, type ISODate } from '../lib/dates'
import type { ContraceptionCourse } from '../lib/model'
import { durationLabel, effectiveEnd, formLabel, formOf, hormonePauses, isHormonal, monthYear, periodLabel, prepStats, RATINGS, type Pause } from '../lib/preparations'

/** Präparate-Verlauf für den Arztbericht: immer der ganze Verlauf, ältestes zuerst wie in einer Anamnese. */
export function PrepHistory({ data, today }: { data: AppData; today: ISODate }) {
  const sorted = useMemo(() => [...data.courses].sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0)), [data.courses])
  const hormonal = sorted.filter(isHormonal)
  const gyn = sorted.filter((c) => !isHormonal(c))
  const pauses = useMemo(() => hormonePauses(data.courses, today), [data.courses, today])
  if (sorted.length === 0) return null
  const current = hormonal.find((c) => c.start <= today && (c.end === null || c.end >= today))
  const stats = (c: ContraceptionCourse) => prepStats(c, data.dayList, data.cycles, data.courses, today)

  // Zeilen und Pausen zeitlich mischen
  const rows: ({ c: ContraceptionCourse } | { p: Pause })[] = [...hormonal.map((c) => ({ c })), ...pauses.map((p) => ({ p }))].sort((a, b) => {
    const s = (x: { c: ContraceptionCourse } | { p: Pause }) => ('c' in x ? x.c.start : x.p.start)
    return s(a) < s(b) ? -1 : 1
  })

  return (
    <section className="prep-report-sec">
      {hormonal.length > 0 && (
        <>
          <h2>
            Hormonelle Präparate <small>gesamter Verlauf seit {monthYear(hormonal[0].start)}</small>
          </h2>
          {current && (
            <p className="prep-now">
              <b>Aktuell:</b> {current.name}
              {current.substance ? ` (${current.substance})` : ''}
              {current.dose ? ` ${current.dose}` : ''}
              {current.schedule ? `, ${current.schedule}` : ''}, seit {formatDE(current.start)} ({durationLabel(current.start, today)}).
              {current.rating ? ` Verträglichkeit laut Patientin: ${current.rating}.` : ''}
            </p>
          )}
          <div className="prep-scroll">
            <table className="prep-table">
              <colgroup>
                <col style={{ width: '15%' }} />
                <col style={{ width: '21%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '22%' }} />
                <col style={{ width: '15%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Zeitraum</th>
                  <th>Präparat (Wirkstoff)</th>
                  <th>Dosierung · Schema</th>
                  <th>Vertragen</th>
                  <th>Häufiger als ohne Präparat¹</th>
                  <th>Abgesetzt wegen</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) =>
                  'p' in r ? (
                    <tr key={`p-${r.p.start}`} className="prep-pause">
                      <td>
                        {r.p.end ? `${monthYear(r.p.start)} – ${monthYear(r.p.end)}` : `seit ${monthYear(r.p.start)}`}
                        <br />
                        <span className="pr-mute">{durationLabel(r.p.start, r.p.end ?? today)}</span>
                      </td>
                      <td colSpan={5}><span className="pr-mute">keine hormonelle Verhütung</span></td>
                    </tr>
                  ) : (
                    <CourseRow key={r.c.id} c={r.c} today={today} st={stats(r.c)} />
                  ),
                )}
              </tbody>
            </table>
          </div>
          <p className="foot">
            ¹ Anteil der eingetragenen Tage mit diesem Beschwerdebild während der Einnahme, in Klammern in Zeiten ohne hormonelles Präparat. Aufgeführt ab 1,5-facher
            Häufigkeit und mindestens 5 Tagen. Zwischenblutung = Blutung oder Schmierblutung außerhalb der erkannten Periode. „Vertragen“ ist die eigene
            Einschätzung der Patientin. ca. = nur Monat und Jahr bekannt.
          </p>
        </>
      )}

      {gyn.length > 0 && (
        <>
          <h2>
            Weitere Dauermedikation <small>gesamter Verlauf</small>
          </h2>
          <div className="prep-scroll">
            <table className="prep-table">
              <colgroup>
                <col style={{ width: '15%' }} />
                <col style={{ width: '21%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '37%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th>Zeitraum</th>
                  <th>Präparat (Wirkstoff)</th>
                  <th>Dosierung</th>
                  <th>Vertragen</th>
                  <th>Auffällig in den Einträgen</th>
                </tr>
              </thead>
              <tbody>
                {gyn.map((c) => {
                  const st = stats(c)
                  const notable = st?.symptoms.filter((s) => s.notable) ?? []
                  const reasons = c.end !== null && c.end < today ? (c.reasons ?? []) : []
                  return (
                    <tr key={c.id}>
                      <td>
                        {periodLabel(c, today)}
                        <br />
                        <span className="pr-mute">{durationLabel(c.start, effectiveEnd(c, today))}</span>
                      </td>
                      <td>
                        <b>{c.name}</b>
                        {c.substance ? ` (${c.substance})` : ''}
                      </td>
                      <td>
                        {c.dose || '–'}
                        {c.schedule && (
                          <>
                            <br />
                            <span className="pr-mute">{c.schedule}</span>
                          </>
                        )}
                      </td>
                      <Rating c={c} />
                      <td>
                        {notable.length > 0 || !reasons.length ? <Symptoms list={notable} /> : null}
                        {reasons.length ? (
                          <>
                            {notable.length > 0 && <br />}
                            <span className="pr-mute">Abgesetzt: {reasons.join(', ')}</span>
                          </>
                        ) : null}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}

function Rating({ c }: { c: ContraceptionCourse }) {
  const r = RATINGS.find((x) => x.id === c.rating)
  return <td className={`v ${r ? `v-${r.id}` : 'v-open'}`}>{r ? r.label : 'offen'}</td>
}

function Symptoms({ list }: { list: NonNullable<ReturnType<typeof prepStats>>['symptoms'] }) {
  if (!list.length) return <span className="pr-mute">keine</span>
  return (
    <>
      {list.map((s, i) => (
        <Fragment key={s.name}>
          {i > 0 && <br />}
          {s.name}{' '}
          <span className="nw">
            {s.pct} %{s.basePct !== null && <span className="pr-mute"> ({s.basePct} %)</span>}
          </span>
        </Fragment>
      ))}
    </>
  )
}

function CourseRow({ c, today, st }: { c: ContraceptionCourse; today: ISODate; st: ReturnType<typeof prepStats> }) {
  const running = c.end === null || c.end >= today
  const notable = st?.symptoms.filter((s) => s.notable) ?? []
  return (
    <tr>
      <td>
        {periodLabel(c, today)}
        <br />
        <span className="pr-mute">{durationLabel(c.start, effectiveEnd(c, today))}</span>
      </td>
      <td>
        <b>{c.name}</b>
        {c.substance ? ` (${c.substance})` : ''}
        <br />
        <span className="pr-mute">{formLabel(formOf(c))}</span>
      </td>
      <td>
        {c.dose || '–'}
        {c.schedule && (
          <>
            <br />
            <span className="pr-mute">{c.schedule}</span>
          </>
        )}
      </td>
      <Rating c={c} />
      <td>{st ? <Symptoms list={notable} /> : <span className="pr-mute">{c.approx ? 'nachgetragen, keine Tagesdaten' : 'zu wenige Einträge'}</span>}</td>
      <td>{running ? <span className="pr-mute">läuft</span> : c.reasons?.length ? c.reasons.join(', ') : '–'}</td>
    </tr>
  )
}
