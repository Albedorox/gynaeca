// Abgleich zwischen Gerät und Supabase (Konzept: docs/sync/README.md, Abschnitt Sync).
//
// Ein Durchlauf:
//   1. Abholen: alle Datensätze mit seq > Abholstand, entschlüsseln, übernehmen oder zusammenführen
//   2. Senden:  alle markierten Datensätze verschlüsselt an push_records, mit der Version, auf der sie beruhen
//   3. Konflikt: Serverstand zusammenführen und im nächsten Durchgang erneut senden (höchstens 3 Runden)
//
// Die IndexedDB bleibt maßgeblich. Der Server sieht nur Chiffretext und HMAC-Namen.

import { db, newId, type SyncCollection, type SyncMeta, type SyncState, type ZyklusDB } from './db'
import { decryptRecord, encryptRecord, recordKey, KEY_VERSION, type SyncKeys } from './crypto'
import { merge3, same } from './merge'
import { emptyDay, isEmptyDay, normalizeDay, type ContraceptionCourse, type DayEntry, type Settings } from './model'

// ---------------------------------------------------------------------------
// Verbindung zum Server (austauschbar, damit Tests ohne Supabase laufen)
// ---------------------------------------------------------------------------

export interface RemoteRecord {
  collection: SyncCollection
  record_key: string
  version: number
  seq: number
  deleted: boolean
  payload: string | null
}

export interface PushItem {
  collection: SyncCollection
  record_key: string
  base_version: number
  deleted: boolean
  payload: string | null
  key_version: number
  device_id: string
}

export interface PushResult {
  collection: SyncCollection
  record_key: string
  status: 'ok' | 'conflict'
  version: number
  seq: number
  deleted?: boolean
  payload?: string | null
}

export interface SyncTransport {
  pull(afterSeq: number, limit: number): Promise<RemoteRecord[]>
  push(items: PushItem[]): Promise<PushResult[]>
}

/** Minimal benötigte Teile des Supabase-Clients (ohne harte Abhängigkeit) */
interface SupabaseLike {
  from(table: string): {
    select(cols: string): {
      gt(col: string, v: number): {
        order(col: string, o: { ascending: boolean }): {
          limit(n: number): PromiseLike<{ data: unknown; error: { message: string } | null }>
        }
      }
    }
  }
  rpc(fn: string, args: Record<string, unknown>): PromiseLike<{ data: unknown; error: { message: string } | null }>
}

export function supabaseTransport(client: SupabaseLike): SyncTransport {
  return {
    async pull(afterSeq, limit) {
      const { data, error } = await client
        .from('records')
        .select('collection,record_key,version,seq,deleted,payload')
        .gt('seq', afterSeq)
        .order('seq', { ascending: true })
        .limit(limit)
      if (error) throw new Error(error.message)
      return (data as RemoteRecord[]) ?? []
    },
    async push(items) {
      const { data, error } = await client.rpc('push_records', { items })
      if (error) throw new Error(error.message)
      return (data as PushResult[]) ?? []
    },
  }
}

// ---------------------------------------------------------------------------
// Was verschlüsselt wird
// ---------------------------------------------------------------------------

/** Inhalt eines Datensatzes vor der Verschlüsselung. Der lokale Schlüssel reist verschlüsselt mit. */
interface Envelope {
  v: 1
  col: SyncCollection
  key: string
  data: unknown
}

/** Einstellungen ohne Gerätebezogenes (Erscheinungsbild bleibt je Gerät) */
type SyncedSettings = Omit<Settings, 'id' | 'appearance'>

function settingsForSync(s: Settings): SyncedSettings {
  const { id: _id, appearance: _a, ...rest } = s
  return rest
}

function courseForSync(c: ContraceptionCourse): Omit<ContraceptionCourse, 'id'> {
  const { id: _id, ...rest } = c
  return rest
}

// ---------------------------------------------------------------------------
// Ablauf
// ---------------------------------------------------------------------------

export interface SyncOptions {
  transport: SyncTransport
  keys: SyncKeys
  userId: string
  /** Standard: die App-Datenbank */
  database?: ZyklusDB
  pullLimit?: number
  pushBatch?: number
  maxRounds?: number
}

export interface SyncReport {
  pulled: number
  pushed: number
  conflicts: number
}

export class AccountMismatchError extends Error {
  constructor() {
    super('Auf diesem Gerät liegen Daten eines anderen Kontos.')
    this.name = 'AccountMismatchError'
  }
}

export async function runSync(opts: SyncOptions): Promise<SyncReport> {
  const s = new Session(opts)
  return s.run()
}

class Session {
  private d: ZyklusDB
  private report: SyncReport = { pulled: 0, pushed: 0, conflicts: 0 }
  private state!: SyncState

  constructor(private o: SyncOptions) {
    this.d = o.database ?? db
  }

  async run(): Promise<SyncReport> {
    this.state = await this.loadState()
    await this.fillRecordKeys()
    await this.pull()
    for (let round = 0; round < (this.o.maxRounds ?? 3); round++) {
      const conflicts = await this.push()
      if (!conflicts) break
    }
    await this.d.syncState.put({ ...this.state, lastSyncAt: Date.now() })
    return this.report
  }

  private async loadState(): Promise<SyncState> {
    const cur = await this.d.syncState.get('state')
    if (cur?.userId && cur.userId !== this.o.userId) throw new AccountMismatchError()
    const st: SyncState = cur ?? { id: 'state', deviceId: newId(), userId: null, cursor: 0, lastSyncAt: null }
    st.userId = this.o.userId
    await this.d.syncState.put(st)
    return st
  }

  /** Server-Namen für alle bekannten Datensätze berechnen (nötig, um Löschmarken zuzuordnen) */
  private async fillRecordKeys(): Promise<void> {
    const missing = await this.d.sync.filter((m) => !m.rk).toArray()
    for (const m of missing) m.rk = await recordKey(this.o.keys, m.col, m.key)
    if (missing.length) await this.d.sync.bulkPut(missing)
  }

  // -------------------------------------------------------------------------
  // Abholen
  // -------------------------------------------------------------------------

  private async pull(): Promise<void> {
    const limit = this.o.pullLimit ?? 500
    for (;;) {
      const rows = await this.o.transport.pull(this.state.cursor, limit)
      for (const r of rows) await this.applyRemote(r)
      if (rows.length) {
        this.state.cursor = Math.max(this.state.cursor, ...rows.map((r) => r.seq))
        await this.d.syncState.put(this.state)
      }
      this.report.pulled += rows.length
      if (rows.length < limit) break
    }
  }

  private async decrypt(r: { collection: SyncCollection; record_key: string; payload?: string | null }): Promise<Envelope> {
    const env = await decryptRecord<Envelope>(
      this.o.keys,
      { userId: this.o.userId, collection: r.collection, recordKey: r.record_key, keyVersion: KEY_VERSION },
      r.payload!,
    )
    if (env.col !== r.collection) throw new Error('Datensatz passt nicht zur Sammlung')
    return env
  }

  /** Übernimmt einen Serverstand. Ist der Datensatz lokal geändert, wird zusammengeführt. */
  private async applyRemote(r: { collection: SyncCollection; record_key: string; version: number; deleted?: boolean; payload?: string | null }): Promise<void> {
    let key: string
    let data: unknown = undefined
    if (r.deleted || !r.payload) {
      const m = await this.d.sync.where('rk').equals(r.record_key).first()
      if (!m) return // Löschmarke für etwas, das dieses Gerät nie hatte
      key = m.key
    } else {
      const env = await this.decrypt(r)
      key = env.key
      data = env.data
    }
    const col = r.collection

    await this.d.transaction('rw', [this.d.days, this.d.courses, this.d.settings, this.d.sync], async () => {
      const meta = (await this.d.sync.get([col, key])) ?? fresh(col, key, r.record_key)
      const remote = data
      if (meta.dirty) {
        const local = await this.readLocal(col, key)
        const merged = this.mergeRecord(col, meta.base, local, remote)
        await this.writeLocal(col, key, merged)
        await this.d.sync.put({
          ...meta,
          rk: r.record_key,
          version: r.version,
          base: remote,
          deleted: merged === undefined ? 1 : 0,
          dirty: same(merged, remote) ? 0 : 1,
        })
        this.report.conflicts++
      } else {
        await this.writeLocal(col, key, remote)
        await this.d.sync.put({ ...meta, rk: r.record_key, version: r.version, base: remote, deleted: remote === undefined ? 1 : 0, dirty: 0 })
      }
    })
  }

  // -------------------------------------------------------------------------
  // Senden
  // -------------------------------------------------------------------------

  /** Gibt die Anzahl der Konflikte zurück */
  private async push(): Promise<number> {
    const dirty = await this.d.sync.where('dirty').equals(1).toArray()
    if (!dirty.length) return 0
    const batch = this.o.pushBatch ?? 100
    let conflicts = 0
    for (let i = 0; i < dirty.length; i += batch) {
      const metas = dirty.slice(i, i + batch)
      const sent = new Map<string, { meta: SyncMeta; data: unknown }>()
      const items: PushItem[] = []
      for (const m of metas) {
        const rk = m.rk ?? (await recordKey(this.o.keys, m.col, m.key))
        const data = await this.readLocal(m.col, m.key)
        const deleted = data === undefined
        const payload = deleted
          ? null
          : await encryptRecord(
              this.o.keys,
              { userId: this.o.userId, collection: m.col, recordKey: rk, keyVersion: KEY_VERSION },
              { v: 1, col: m.col, key: m.key, data } satisfies Envelope,
            )
        sent.set(`${m.col}|${rk}`, { meta: { ...m, rk }, data })
        items.push({ collection: m.col, record_key: rk, base_version: m.version, deleted, payload, key_version: KEY_VERSION, device_id: this.state.deviceId })
      }

      const results = await this.o.transport.push(items)
      for (const res of results) {
        const s = sent.get(`${res.collection}|${res.record_key}`)
        if (!s) continue
        if (res.status === 'ok') {
          this.report.pushed++
          await this.d.transaction('rw', this.d.sync, async () => {
            const now = await this.d.sync.get([s.meta.col, s.meta.key])
            // Während des Sendens erneut geändert? Dann bleibt der Datensatz markiert.
            const changed = (now?.tick ?? 0) !== (s.meta.tick ?? 0)
            await this.d.sync.put({ ...(now ?? s.meta), rk: s.meta.rk, version: res.version, base: s.data, dirty: changed ? 1 : 0 })
          })
        } else {
          conflicts++
          await this.applyRemote(res)
        }
      }
    }
    return conflicts
  }

  // -------------------------------------------------------------------------
  // Lokale Daten lesen und schreiben (ohne erneut zu markieren)
  // -------------------------------------------------------------------------

  private async readLocal(col: SyncCollection, key: string): Promise<unknown> {
    if (col === 'day') {
      const d = await this.d.days.get(key)
      return d ? normalizeDay(d) : undefined
    }
    if (col === 'course') {
      const c = await this.d.courses.where('uid').equals(key).first()
      return c ? courseForSync(c) : undefined
    }
    const s = await this.d.settings.get('app')
    return s ? settingsForSync(s) : undefined
  }

  private async writeLocal(col: SyncCollection, key: string, data: unknown): Promise<void> {
    if (col === 'day') {
      if (data === undefined) await this.d.days.delete(key)
      else await this.d.days.put(normalizeDay({ ...(data as DayEntry), date: key }))
      return
    }
    if (col === 'course') {
      const cur = await this.d.courses.where('uid').equals(key).first()
      if (data === undefined) {
        if (cur?.id !== undefined) await this.d.courses.delete(cur.id)
      } else {
        const c = { ...(data as ContraceptionCourse), uid: key }
        if (cur?.id !== undefined) await this.d.courses.put({ ...c, id: cur.id })
        else {
          const { id: _id, ...rest } = c
          await this.d.courses.add(rest)
        }
      }
      return
    }
    if (data === undefined) await this.d.settings.delete('app')
    else {
      const cur = await this.d.settings.get('app')
      await this.d.settings.put({ ...(data as SyncedSettings), appearance: cur?.appearance ?? (data as Settings).appearance, id: 'app' } as Settings)
    }
  }

  /** Zusammenführen je Sammlung. undefined bedeutet „gelöscht“. */
  private mergeRecord(col: SyncCollection, base: unknown, local: unknown, remote: unknown): unknown {
    // Gelöscht gegen geändert: die geänderte Seite gewinnt, damit keine Einträge verloren gehen
    if (local === undefined && remote === undefined) return undefined
    if (local === undefined) return base !== undefined && same(remote, base) ? undefined : remote
    if (remote === undefined) return base !== undefined && same(local, base) ? undefined : local

    const lt = (local as { updatedAt?: number }).updatedAt ?? 0
    const rt = (remote as { updatedAt?: number }).updatedAt ?? 0
    const localWins = lt >= rt
    const b = base ?? (col === 'day' ? emptyDay((local as DayEntry).date) : undefined)
    const merged = merge3(b, local, remote, localWins) as Record<string, unknown>
    if ('updatedAt' in merged || lt || rt) merged.updatedAt = Math.max(lt, rt)
    if (col === 'day' && isEmptyDay(normalizeDay(merged as unknown as DayEntry))) return undefined
    return merged
  }
}

function fresh(col: SyncCollection, key: string, rk: string): SyncMeta {
  return { col, key, version: 0, dirty: 0, deleted: 0, rk }
}
