import Sheet from './Sheet'
import { BLEEDING_LEVELS, MED_PROMPT_FROM } from '../lib/knowledge'

/** Erklärt Blutungs- und Schmerzskala, wie sie mit der Gynäkologin abgestimmt sind. */
export default function ScalesSheet({ onClose }: { onClose: () => void }) {
  return (
    <Sheet title="So zählen die Skalen" onClose={onClose}>
      <h3 className="first">Blutungsstärke</h3>
      <p className="hint">Gezählt werden volle Tampons am ganzen Tag, halb volle anteilig. Für Binden oder Tassen gilt die gleiche Menge.</p>
      <table className="scale-table">
        <tbody>
          {BLEEDING_LEVELS.map((l) => (
            <tr key={l.value}>
              <th>{String(l.value).replace('.', ',')}</th>
              <td>
                <b>{l.label}</b>
                <small>{l.criterion}</small>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="hint">Ab Stufe 4 gilt die Blutung als zu stark (Hypermenorrhoe). Bitte in der Praxis ansprechen, vor allem bei Schwindel oder Müdigkeit.</p>
      <h3>Schmerzstärke</h3>
      <p className="hint">
        Numerische Skala 0–10: 0 kein Schmerz, 1–3 leicht, 4–6 mittel, 7–10 stark. Ab {MED_PROMPT_FROM} fragt die App, ob Sie ein Schmerzmittel
        genommen haben.
      </p>
    </Sheet>
  )
}
