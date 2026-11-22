import { db, getSettings } from './db'
import { todayISO } from './dates'
import type { ContraceptionCourse, DayEntry, Settings } from './model'
import { emptyDay } from './model'

export interface BackupFile {
  app: 'die-frau-zyklusblatt'
  version: 1
  exportedAt: string
  settings: Settings
  days: DayEntry[]
  courses: ContraceptionCourse[]
}

function download(name: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function exportJSON(): Promise<void> {
  const data: BackupFile = {
    app: 'die-frau-zyklusblatt',
    version: 1,
    exportedAt: new Date().toISOString(),
    settings: await getSettings(),
    days: await db.days.orderBy('date').toArray(),
    courses: await db.courses.toArray(),
  }
  download(`zyklusblatt-backup-${todayISO()}.json`, JSON.stringify(data, null, 2), 'application/json')
}

function csvCell(v: unknown): string {
  const s = v === null || v === undefined ? '' : String(v)
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function decimal(n: number | null): string {
  return n === null ? '' : String(n).replace('.', ',')
}

/** CSV mit Semikolon und Dezimalkomma, damit Excel (deutsch) sie direkt öffnet. */
export async function exportCSV(): Promise<void> {
  const days = await db.days.orderBy('date').toArray()
  const courses = await db.courses.toArray()
  const header = [
    'Datum', 'Blutung (0-5)', 'Schmierblutung', 'Schmerz (0-10)', 'Medikamente', 'Einnahmen gesamt',
    'Symptome', 'Notiz', 'Basaltemperatur', 'Temp. gestört', 'Zervixschleim',
    'Muttermund Öffnung', 'Muttermund Festigkeit', 'Muttermund Stellung', 'LH-Test', 'Verhütung',
  ]
  const rows = days.map((d) => {
    const course = courses.find((c) => c.start <= d.date && (c.end === null || d.date <= c.end))
    return [
      d.date,
      decimal(d.bleeding),
      d.spotting ? 'ja' : '',
      d.pain ?? '',
      d.meds.map((m) => `${m.name}${m.doseMg ? ` ${m.doseMg} mg` : ''} x${m.count}`).join(', '),
      d.meds.reduce((s, m) => s + m.count, 0) || '',
      d.symptoms.join(', '),
      d.note,
      decimal(d.temp),
      d.tempDisturbed ? 'ja' : '',
      d.mucus ?? '',
      d.cervixOpening ?? '',
      d.cervixFirmness ?? '',
      d.cervixPosition ?? '',
      d.lh ?? '',
      course?.name ?? '',
    ].map(csvCell).join(';')
  })
  download(`zyklusblatt-${todayISO()}.csv`, '﻿' + [header.join(';'), ...rows].join('\r\n'), 'text/csv;charset=utf-8')
}

export async function importJSON(file: File): Promise<{ days: number; courses: number }> {
  const data = JSON.parse(await file.text()) as Partial<BackupFile>
  if (data.app !== 'die-frau-zyklusblatt' || !Array.isArray(data.days)) {
    throw new Error('Die Datei ist kein Zyklusblatt-Backup.')
  }
  const days = data.days.map((d) => ({ ...emptyDay(d.date), ...d }))
  const courses = (data.courses ?? []).map(({ id: _id, ...c }) => c)
  await db.transaction('rw', db.days, db.courses, db.settings, async () => {
    await db.days.clear()
    await db.courses.clear()
    await db.days.bulkPut(days)
    await db.courses.bulkAdd(courses)
    if (data.settings) await db.settings.put({ ...data.settings, id: 'app' })
  })
  return { days: days.length, courses: courses.length }
}

export async function deleteAll(): Promise<void> {
  await db.transaction('rw', db.days, db.courses, db.settings, async () => {
    await db.days.clear()
    await db.courses.clear()
    await db.settings.clear()
  })
}
