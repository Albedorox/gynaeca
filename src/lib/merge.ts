// Drei-Wege-Zusammenführung für den Sync (Konzept: docs/sync/README.md, Abschnitt Sync).
//
// Verglichen werden Basis (zuletzt synchronisiert), lokaler Stand und Serverstand, Feld für Feld:
// - nur eine Seite hat ein Feld geändert: deren Wert gilt
// - beide haben es geändert:
//     Listen einfacher Werte  → Hinzufügungen beider Seiten vereint, Entfernungen beider übernommen
//     Listen mit Namen (meds) → je Name wie oben, bei Abweichung gilt die neuere Seite
//     Objekte (meals, painTypes, modules) → rekursiv je Schlüssel
//     note                    → beide Texte behalten, wenn keiner den anderen enthält
//     sonstige Einzelwerte    → die neuere Seite (updatedAt)

type Obj = Record<string, unknown>

export function same(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (a === undefined || b === undefined || a === null || b === null) return false
  if (typeof a !== 'object' || typeof b !== 'object') return false
  if (Array.isArray(a) !== Array.isArray(b)) return false
  if (Array.isArray(a)) {
    const bb = b as unknown[]
    return a.length === bb.length && a.every((x, i) => same(x, bb[i]))
  }
  const ka = Object.keys(a as Obj).filter((k) => (a as Obj)[k] !== undefined)
  const kb = Object.keys(b as Obj).filter((k) => (b as Obj)[k] !== undefined)
  return ka.length === kb.length && ka.every((k) => same((a as Obj)[k], (b as Obj)[k]))
}

function isPlainObject(v: unknown): v is Obj {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

export const NOTE_SEPARATOR = '\n— — —\n'

/**
 * Führt zwei Stände eines Datensatzes zusammen.
 * @param base     zuletzt synchronisierter Stand (undefined = unbekannt, dann gilt alles als beidseitig geändert)
 * @param local    Stand auf dem Gerät
 * @param remote   Stand auf dem Server
 * @param localWins bei echtem Konflikt in Einzelwerten gewinnt die lokale Seite
 */
export function merge3<T>(base: T | undefined, local: T, remote: T, localWins: boolean): T {
  return mergeValue(base, local, remote, localWins, '') as T
}

function mergeValue(b: unknown, l: unknown, r: unknown, localWins: boolean, field: string): unknown {
  if (same(l, r)) return l
  if (b !== undefined && same(l, b)) return r
  if (b !== undefined && same(r, b)) return l

  if (Array.isArray(l) && Array.isArray(r)) {
    return mergeList(Array.isArray(b) ? b : undefined, l, r, localWins)
  }
  if (isPlainObject(l) && isPlainObject(r)) {
    const bo = isPlainObject(b) ? b : undefined
    const out: Obj = {}
    for (const k of new Set([...Object.keys(l), ...Object.keys(r)])) {
      const v = mergeValue(bo?.[k], l[k], r[k], localWins, k)
      if (v !== undefined) out[k] = v
    }
    return out
  }
  if (field === 'note' && typeof l === 'string' && typeof r === 'string') {
    if (!l.trim()) return r
    if (!r.trim()) return l
    if (l.includes(r)) return l
    if (r.includes(l)) return r
    return localWins ? `${l}${NOTE_SEPARATOR}${r}` : `${r}${NOTE_SEPARATOR}${l}`
  }
  return localWins ? l : r
}

/** Schlüssel eines Listeneintrags: Name bei Objekten mit name, sonst der Wert selbst */
function itemKey(v: unknown): string {
  if (isPlainObject(v) && typeof v.name === 'string') return `name:${v.name}`
  return JSON.stringify(v)
}

function mergeList(b: unknown[] | undefined, l: unknown[], r: unknown[], localWins: boolean): unknown[] {
  const bm = new Map((b ?? []).map((x) => [itemKey(x), x]))
  const lm = new Map(l.map((x) => [itemKey(x), x]))
  const rm = new Map(r.map((x) => [itemKey(x), x]))
  const out: unknown[] = []
  const seen = new Set<string>()
  for (const k of [...lm.keys(), ...rm.keys()]) {
    if (seen.has(k)) continue
    seen.add(k)
    const inB = bm.has(k)
    const inL = lm.has(k)
    const inR = rm.has(k)
    // Behalten, wenn beide Seiten ihn haben oder eine Seite ihn neu hinzugefügt hat.
    // Entfällt, wenn eine Seite ihn entfernt hat, den es in der Basis gab.
    const keep = (inL && inR) || (inL && !inB) || (inR && !inB)
    if (!keep) continue
    if (inL && inR) out.push(mergeValue(bm.get(k), lm.get(k), rm.get(k), localWins, ''))
    else out.push(inL ? lm.get(k) : rm.get(k))
  }
  return out
}
