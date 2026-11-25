import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { addCourse, saveSettings, setDbForTests, updateDay, updateCourse, ZyklusDB } from './db'
import { createVault, type SyncKeys } from './crypto'
import { runSync, AccountMismatchError, type PushItem, type PushResult, type RemoteRecord, type SyncTransport } from './sync'
import { NOTE_SEPARATOR } from './merge'

/** Nachbildung von public.records + push_records (gleiche Regeln wie das SQL) */
class FakeServer {
  rows = new Map<string, RemoteRecord>()
  seq = 0
  transport(): SyncTransport {
    return {
      pull: async (after, limit) => [...this.rows.values()].filter((r) => r.seq > after).sort((a, b) => a.seq - b.seq).slice(0, limit).map((r) => ({ ...r })),
      push: async (items: PushItem[]) => {
        const out: PushResult[] = []
        for (const it of items) {
          const k = `${it.collection}|${it.record_key}`
          const cur = this.rows.get(k)
          if (cur && cur.version !== it.base_version) {
            out.push({ ...cur, status: 'conflict' })
            continue
          }
          const row: RemoteRecord = {
            collection: it.collection,
            record_key: it.record_key,
            version: cur ? cur.version + 1 : 1,
            seq: ++this.seq,
            deleted: it.deleted,
            payload: it.deleted ? null : it.payload,
          }
          this.rows.set(k, row)
          out.push({ collection: row.collection, record_key: row.record_key, status: 'ok', version: row.version, seq: row.seq })
        }
        return out
      },
    }
  }
}

const USER = '11111111-1111-1111-1111-111111111111'
let n = 0
async function setup() {
  const server = new FakeServer()
  const { keys } = await createVault('test-passwort', { m: 1024, t: 1, p: 1 })
  const A = new ZyklusDB(`geraet-a-${++n}`)
  const B = new ZyklusDB(`geraet-b-${n}`)
  const sync = (d: ZyklusDB, k: SyncKeys = keys, user = USER) => runSync({ transport: server.transport(), keys: k, userId: user, database: d })
  /** Führt Schreibfunktionen auf einem bestimmten Gerät aus */
  const on = async (d: ZyklusDB, fn: () => Promise<unknown>) => {
    setDbForTests(d)
    await fn()
  }
  return { server, keys, A, B, sync, on }
}

describe('Sync zwischen zwei Geräten', () => {
  it('Einträge von A kommen verschlüsselt auf B an', async () => {
    const { server, A, B, sync, on } = await setup()
    await on(A, () => updateDay('2026-11-20', { bleeding: 3, symptoms: ['Kopfschmerzen'] }))
    await on(A, () => addCourse({ name: 'Pille', start: '2026-10-01', end: null }))
    await on(A, () => saveSettings({ minGapDays: 9, appearance: { mode: 'hell', palette: 'ozean', ring: 'zart' } }))
    expect(await sync(A)).toMatchObject({ pushed: 3 })

    const raw = JSON.stringify([...server.rows.values()])
    expect(raw).not.toContain('2026-11-20')
    expect(raw).not.toContain('Pille')
    expect(raw).not.toContain('Kopfschmerzen')

    expect(await sync(B)).toMatchObject({ pulled: 3, pushed: 0 })
    expect(await B.days.get('2026-11-20')).toMatchObject({ bleeding: 3, symptoms: ['Kopfschmerzen'] })
    expect((await B.courses.toArray())[0]).toMatchObject({ name: 'Pille' })
    const s = await B.settings.get('app')
    expect(s?.minGapDays).toBe(9)
    expect(s?.appearance).toBeUndefined() // Erscheinungsbild bleibt je Gerät
    expect(await B.sync.where('dirty').equals(1).count()).toBe(0)
  })

  it('beide ändern denselben Tag offline: Felder werden zusammengeführt', async () => {
    const { A, B, sync, on } = await setup()
    await on(A, () => updateDay('2026-11-21', { bleeding: 2, symptoms: ['Kopfschmerzen'], note: 'morgens' }))
    await sync(A)
    await sync(B)

    await on(A, () => updateDay('2026-11-21', (d) => ({ pain: 6, symptoms: [...d.symptoms, 'Übelkeit'], note: 'morgens, Krämpfe' })))
    await on(B, () => updateDay('2026-11-21', (d) => ({ temp: 36.55, symptoms: d.symptoms.filter((x) => x !== 'Kopfschmerzen').concat('Brustspannen'), note: 'abends müde' })))

    await sync(A)
    const rb = await sync(B)
    expect(rb.conflicts).toBe(1)
    await sync(A)

    for (const d of [A, B]) {
      const day = await d.days.get('2026-11-21')
      expect(day).toMatchObject({ bleeding: 2, pain: 6, temp: 36.55 })
      expect([...day!.symptoms].sort()).toEqual(['Brustspannen', 'Übelkeit'])
      expect(day!.note).toContain('morgens, Krämpfe')
      expect(day!.note).toContain('abends müde')
      expect(day!.note).toContain(NOTE_SEPARATOR.trim())
    }
  })

  it('Löschen auf einem Gerät entfernt den Tag auch auf dem anderen', async () => {
    const { A, B, sync, on } = await setup()
    await on(A, () => updateDay('2026-11-22', { bleeding: 1 }))
    await sync(A)
    await sync(B)
    expect(await B.days.get('2026-11-22')).toBeTruthy()
    await on(B, () => updateDay('2026-11-22', { bleeding: 0 }))
    await sync(B)
    await sync(A)
    expect(await A.days.get('2026-11-22')).toBeUndefined()
  })

  it('gelöscht auf A, geändert auf B: die Änderung bleibt erhalten', async () => {
    const { A, B, sync, on } = await setup()
    await on(A, () => updateDay('2026-11-23', { bleeding: 1 }))
    await sync(A)
    await sync(B)
    await on(A, () => updateDay('2026-11-23', { bleeding: 0 }))
    await on(B, () => updateDay('2026-11-23', { pain: 5 }))
    await sync(A)
    await sync(B)
    await sync(A)
    expect(await A.days.get('2026-11-23')).toMatchObject({ pain: 5 })
    expect(await B.days.get('2026-11-23')).toMatchObject({ pain: 5 })
  })

  it('zweites Gerät mit eigenen alten Daten: derselbe Tag wird vereint, kein Duplikat', async () => {
    const { A, B, sync, on } = await setup()
    await on(A, () => updateDay('2026-11-10', { bleeding: 3 }))
    await on(B, () => updateDay('2026-11-10', { pain: 4 }))
    await on(B, () => updateDay('2026-11-11', { bleeding: 1 }))
    await sync(A)
    await sync(B)
    await sync(A)
    for (const d of [A, B]) {
      expect(await d.days.count()).toBe(2)
      expect(await d.days.get('2026-11-10')).toMatchObject({ bleeding: 3, pain: 4 })
    }
  })

  it('Verlauf beenden auf B kommt auf A an', async () => {
    const { A, B, sync, on } = await setup()
    let id = 0
    await on(A, async () => (id = await addCourse({ name: 'Dienogest', kind: 'gyn', start: '2026-09-01', end: null })))
    await sync(A)
    await sync(B)
    const bid = (await B.courses.toArray())[0].id!
    await on(B, () => updateCourse(bid, { end: '2026-11-01' }))
    await sync(B)
    await sync(A)
    expect(await A.courses.get(id)).toMatchObject({ name: 'Dienogest', end: '2026-11-01' })
    expect(await A.courses.count()).toBe(1)
  })

  it('ein Gerät mit Daten eines anderen Kontos wird abgewiesen', async () => {
    const { A, sync, keys } = await setup()
    await sync(A)
    await expect(sync(A, keys, '22222222-2222-2222-2222-222222222222')).rejects.toBeInstanceOf(AccountMismatchError)
  })

  it('Abholen in kleinen Paketen verliert nichts', async () => {
    const { server, A, B, keys, on } = await setup()
    for (let i = 1; i <= 12; i++) await on(A, () => updateDay(`2026-10-${String(i).padStart(2, '0')}`, { bleeding: 1 }))
    await runSync({ transport: server.transport(), keys, userId: USER, database: A, pushBatch: 5 })
    const r = await runSync({ transport: server.transport(), keys, userId: USER, database: B, pullLimit: 5 })
    expect(r.pulled).toBe(12)
    expect(await B.days.count()).toBe(12)
  })
})
