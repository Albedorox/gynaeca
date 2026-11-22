import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { expect, it } from 'vitest'

it('Upgrade von Version 1 vergibt uids und markiert Bestand als zu senden', async () => {
  const old = new Dexie('die-frau-zyklusblatt')
  old.version(1).stores({ days: 'date', courses: '++id, start, end', settings: 'id' })
  await old.table('days').put({ date: '2026-11-01', bleeding: 2 })
  await old.table('courses').add({ name: 'Pille', start: '2026-10-01', end: null })
  await old.table('settings').put({ id: 'app', minGapDays: 8 })
  old.close()

  const { db } = await import('./db')
  const courses = await db.courses.toArray()
  expect(courses[0].uid).toMatch(/^[0-9a-f-]{36}$/)
  expect(courses[0].name).toBe('Pille')
  expect(await db.days.get('2026-11-01')).toMatchObject({ bleeding: 2 })
  const keys = (await db.sync.toArray()).map((m) => `${m.col}:${m.key}:${m.dirty}${m.deleted}`).sort()
  expect(keys).toEqual(['course:' + courses[0].uid + ':10', 'day:2026-11-01:10', 'settings:app:10'])
})
