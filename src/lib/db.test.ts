import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { addCourse, clearAll, db, deleteCourse, replaceAll, saveSettings, updateCourse, updateDay } from './db'
import { emptyDay } from './model'

async function syncRows() {
  return (await db.sync.toArray()).map((m) => `${m.col}:${m.key}:${m.dirty}${m.deleted}`).sort()
}

beforeEach(async () => {
  await db.transaction('rw', [db.days, db.courses, db.settings, db.sync], async () => {
    await Promise.all([db.days.clear(), db.courses.clear(), db.settings.clear(), db.sync.clear()])
  })
})

describe('Schreibfunktionen markieren Änderungen für den Sync', () => {
  it('Tag anlegen, ändern und durch Leeren löschen', async () => {
    await updateDay('2026-11-01', { bleeding: 2 })
    expect(await syncRows()).toEqual(['day:2026-11-01:10'])
    await db.sync.update(['day', '2026-11-01'], { dirty: 0, version: 3 })
    await updateDay('2026-11-01', { bleeding: 0 })
    expect(await db.days.get('2026-11-01')).toBeUndefined()
    const m = await db.sync.get(['day', '2026-11-01'])
    expect(m).toMatchObject({ dirty: 1, deleted: 1, version: 3 })
  })

  it('ein leerer Tag, der nie existierte, erzeugt keine Löschmarke', async () => {
    await updateDay('2026-11-02', { bleeding: 0 })
    expect(await syncRows()).toEqual([])
  })

  it('Verläufe bekommen eine uid und werden verfolgt', async () => {
    const id = await addCourse({ name: 'Pille', start: '2026-10-01', end: null })
    const c = await db.courses.get(id)
    expect(c?.uid).toMatch(/^[0-9a-f-]{36}$/)
    await updateCourse(id, { end: '2026-10-20' })
    expect((await db.courses.get(id))?.uid).toBe(c?.uid)
    await deleteCourse(id)
    expect(await syncRows()).toEqual([`course:${c?.uid}:11`])
  })

  it('Einstellungen', async () => {
    await saveSettings({ minGapDays: 9 })
    expect(await syncRows()).toEqual(['settings:app:10'])
  })

  it('replaceAll markiert Entferntes als gelöscht und Neues als zu senden', async () => {
    await updateDay('2026-11-01', { bleeding: 2 })
    await updateDay('2026-11-03', { pain: 4 })
    await replaceAll({ days: [{ ...emptyDay('2026-11-03'), pain: 5 }, { ...emptyDay('2026-11-04'), bleeding: 1 }], courses: [] })
    expect(await syncRows()).toEqual(['day:2026-11-01:11', 'day:2026-11-03:10', 'day:2026-11-04:10'])
  })

  it('clearAll löscht alles und hinterlässt Löschmarken', async () => {
    await updateDay('2026-11-01', { bleeding: 2 })
    await saveSettings({ minGapDays: 9 })
    await clearAll()
    expect(await db.days.count()).toBe(0)
    expect(await db.settings.count()).toBe(0)
    expect(await syncRows()).toEqual(['day:2026-11-01:11', 'settings:app:11'])
  })
})
