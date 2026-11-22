import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import {
  DEFAULT_ARGON2,
  WrongSecretError,
  changePassphrase,
  createVault,
  decryptRecord,
  encryptRecord,
  formatRecoveryCode,
  loadKeys,
  parseRecoveryCode,
  recordKey,
  storeKeys,
  unlockWithPassphrase,
  unlockWithRecoveryCode,
  type RecordContext,
} from './crypto'

// Schnelle Parameter für Tests, die Standardwerte werden unten einmal gemessen
const FAST = { m: 1024, t: 1, p: 1 }
const ctx: RecordContext = { userId: '11111111-1111-1111-1111-111111111111', collection: 'day', recordKey: 'abcdefghijklmnopqrstuv' }
const day = { date: '2026-11-22', bleeding: 3, symptoms: ['Kopfschmerzen'], note: 'Ümläute ✓' }

describe('Schlüssel', () => {
  it('Passwort und Wiederherstellungscode öffnen denselben Hauptschlüssel', async () => {
    const { bundle, recoveryCode, keys } = await createVault('korrekt pferd batterie', FAST)
    expect(recoveryCode).toMatch(/^([0-9A-HJKMNP-TV-Z]{4}-){5}[0-9A-HJKMNP-TV-Z]{4}$/)
    const payload = await encryptRecord(keys, ctx, day)

    const viaPass = await unlockWithPassphrase(bundle, 'korrekt pferd batterie')
    expect(await decryptRecord(viaPass, ctx, payload)).toEqual(day)
    const viaCode = await unlockWithRecoveryCode(bundle, recoveryCode.toLowerCase().replace(/-/g, ' '))
    expect(await decryptRecord(viaCode, ctx, payload)).toEqual(day)
    expect(await recordKey(viaCode, 'day', '2026-11-22')).toBe(await recordKey(keys, 'day', '2026-11-22'))
  })

  it('falsches Passwort und falscher Code werden erkannt', async () => {
    const { bundle } = await createVault('richtig-richtig', FAST)
    await expect(unlockWithPassphrase(bundle, 'falsch-falsch')).rejects.toBeInstanceOf(WrongSecretError)
    await expect(unlockWithRecoveryCode(bundle, 'AAAA-AAAA-AAAA-AAAA-AAAA-AAAA')).rejects.toBeInstanceOf(WrongSecretError)
    await expect(unlockWithRecoveryCode(bundle, 'zu kurz')).rejects.toBeInstanceOf(WrongSecretError)
  })

  it('Passwort ändern lässt Datensätze lesbar und sperrt das alte Passwort aus', async () => {
    const { bundle, recoveryCode, keys } = await createVault('altes-passwort', FAST)
    const payload = await encryptRecord(keys, ctx, day)
    const b2 = await changePassphrase(bundle, { recoveryCode }, 'neues-passwort', FAST)
    expect(b2.recovery_wrapped_key).toBe(bundle.recovery_wrapped_key)
    await expect(unlockWithPassphrase(b2, 'altes-passwort')).rejects.toBeInstanceOf(WrongSecretError)
    expect(await decryptRecord(await unlockWithPassphrase(b2, 'neues-passwort'), ctx, payload)).toEqual(day)
  })

  it('Unicode-Passwörter werden normalisiert (NFC)', async () => {
    const { bundle } = await createVault('Grüße-aus-Köln', FAST)
    await expect(unlockWithPassphrase(bundle, 'Grüße-aus-Köln')).resolves.toBeTruthy()
  })

  it('Schlüssel lassen sich auf dem Gerät speichern und laden', async () => {
    const { keys } = await createVault('geraet-speicher', FAST)
    await storeKeys(keys)
    const loaded = await loadKeys()
    expect(loaded).not.toBeNull()
    expect(await decryptRecord(loaded!, ctx, await encryptRecord(keys, ctx, day))).toEqual(day)
    expect(keys.enc.extractable).toBe(false)
  })

  it('Standard-Parameter (64 MiB) funktionieren', async () => {
    const t0 = Date.now()
    const { bundle } = await createVault('standard-parameter', DEFAULT_ARGON2)
    expect(bundle.kdf_params).toEqual({ m: 65536, t: 3, p: 1 })
    await unlockWithPassphrase(bundle, 'standard-parameter')
    console.log(`Argon2id 64 MiB, zweimal: ${Date.now() - t0} ms`)
  }, 30000)
})

describe('Datensätze', () => {
  it('jede Verschlüsselung sieht anders aus (zufälliger IV)', async () => {
    const { keys } = await createVault('iv-test-1234', FAST)
    expect(await encryptRecord(keys, ctx, day)).not.toBe(await encryptRecord(keys, ctx, day))
  })

  it('vertauschte Zuordnung (anderer Datensatz, andere Nutzerin) schlägt fehl', async () => {
    const { keys } = await createVault('aad-test-1234', FAST)
    const payload = await encryptRecord(keys, ctx, day)
    await expect(decryptRecord(keys, { ...ctx, recordKey: 'zzzzzzzzzzzzzzzzzzzzzz' }, payload)).rejects.toThrow()
    await expect(decryptRecord(keys, { ...ctx, userId: '22222222-2222-2222-2222-222222222222' }, payload)).rejects.toThrow()
    await expect(decryptRecord(keys, { ...ctx, collection: 'course' }, payload)).rejects.toThrow()
  })

  it('veränderter Chiffretext schlägt fehl', async () => {
    const { keys } = await createVault('manipulation-1', FAST)
    const payload = await encryptRecord(keys, ctx, day)
    const bytes = Uint8Array.from(atob(payload), (c) => c.charCodeAt(0))
    bytes[20] ^= 1
    await expect(decryptRecord(keys, ctx, btoa(String.fromCharCode(...bytes)))).rejects.toThrow()
  })

  it('Datensatz-Namen passen zum Server-Schema und verraten kein Datum', async () => {
    const { keys } = await createVault('namen-test-12', FAST)
    const k = await recordKey(keys, 'day', '2026-11-22')
    expect(k).toMatch(/^[A-Za-z0-9_-]{43}$/)
    expect(k).not.toContain('2026')
    expect(await recordKey(keys, 'course', '2026-11-22')).not.toBe(k)
  })
})

describe('Wiederherstellungscode', () => {
  it('Hin- und Rückweg, Verwechslungen O/0 und I/L/1', () => {
    const bytes = Uint8Array.from({ length: 15 }, (_, i) => i * 17)
    const code = formatRecoveryCode(bytes)
    expect(parseRecoveryCode(code)).toEqual(bytes)
    expect(parseRecoveryCode(code.replace(/0/g, 'O').replace(/1/g, 'l'))).toEqual(bytes)
    expect(parseRecoveryCode('!!!!-AAAA-AAAA-AAAA-AAAA-AAAA')).toBeNull()
  })
})
