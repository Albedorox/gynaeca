import { clearAll, db, getSettings, mergeSettings, replaceAll } from './db'
import { todayISO } from './dates'
import type { ContraceptionCourse, DayEntry, Settings } from './model'
import { normalizeDay } from './model'
import { BACK_LOCATIONS, PAIN_TYPES } from './knowledge'

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
  download(`gynaeca-backup-${todayISO()}.json`, JSON.stringify(data, null, 2), 'application/json')
}

export function csvCell(v: unknown): string {
  let s = v === null || v === undefined ? '' : String(v)
  // Schutz vor Formel-Injektion: Excel/LibreOffice würden "=…", "+…", "-…", "@…" als Formel ausführen
  if (typeof v === 'string' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function decimal(n: number | null): string {
  return n === null ? '' : String(n).replace('.', ',')
}

/** CSV mit Semikolon und Dezimalkomma, damit Excel (deutsch) sie direkt öffnet. */
export async function exportCSV(): Promise<void> {
  const days = (await db.days.orderBy('date').toArray()).map(normalizeDay)
  const courses = await db.courses.toArray()
  const header = [
    'Datum', 'Blutung (0-5)', 'Schmierblutung', 'Schmerz (0-10)', 'Medikamente', 'Einnahmen gesamt',
    'Symptome', 'Notiz', 'Basaltemperatur', 'Temp. gestört', 'Zervixschleim',
    'Muttermund Öffnung', 'Muttermund Festigkeit', 'Muttermund Stellung', 'LH-Test', 'Verhütung',
    'Schmerzarten (0-10)', 'Rücken', 'Schmerzcharakter', 'Alltag', 'Stress (0-10)', 'Bewegung/Entspannung (alt)', 'Schleim beobachtet',
    'Bewegung (min)', 'Bewegungsart', 'Entspannung/Achtsamkeit', 'Hilfsmittel', 'Cheat Day', 'Ernährung', 'Ergänzungsmittel',
    'Frühstück', 'Mittag', 'Abend', 'Zwischendurch', 'Getrunken (Gläser)', 'Verträglichkeit', 'Geschlechtsverkehr', 'Regelmäßige Medikamente',
  ]
  const rows = days.map((d) => {
    const course = courses.find((c) => !c.kind && c.start <= d.date && (c.end === null || d.date <= c.end))
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
      Object.entries(d.painTypes ?? {}).map(([k, v]) => `${PAIN_TYPES.find((t) => t.id === k)?.label ?? k} ${v}`).join(', '),
      (d.backLocations ?? []).map((b) => BACK_LOCATIONS.find((x) => x.id === b)?.label ?? b).join(', '),
      (d.painCharacter ?? []).join(', '),
      (d.impairments ?? []).join(', '),
      d.stress ?? '',
      '',
      d.mucusSource === 'muttermund' ? 'am Muttermund' : d.mucusSource === 'aussen' ? 'am Scheideneingang' : '',
      d.movementMin ?? '',
      d.movement.join(', '),
      d.relax.join(', '),
      d.aids.join(', '),
      d.cheatDay ? 'ja' : '',
      d.food.join(', '),
      d.supplements.join(', '),
      d.meals.morgens ?? '',
      d.meals.mittags ?? '',
      d.meals.abends ?? '',
      d.meals.zwischendurch ?? '',
      d.water ?? '',
      d.foodReaction.join(', '),
      d.sex === 'ungeschuetzt' ? 'ungeschützt' : d.sex === 'geschuetzt' ? 'mit Kondom' : d.sex === 'kein' ? 'nein' : '',
      courses.filter((c) => c.kind === 'gyn' && c.start <= d.date && (c.end === null || d.date <= c.end)).map((c) => c.name).join(', '),
    ].map(csvCell).join(';')
  })
  download(`gynaeca-${todayISO()}.csv`, '﻿' + [header.join(';'), ...rows].join('\r\n'), 'text/csv;charset=utf-8')
}

export async function importJSON(file: File): Promise<{ days: number; courses: number }> {
  const data = JSON.parse(await file.text()) as Partial<BackupFile>
  if (data.app !== 'die-frau-zyklusblatt' || !Array.isArray(data.days)) {
    throw new Error('Die Datei ist kein Gynaeca-Backup.')
  }
  const days = data.days.map((d) => normalizeDay(d))
  const courses = (data.courses ?? []).map(({ id: _id, ...c }) => c)
  await replaceAll({ days, courses, settings: data.settings ? mergeSettings(data.settings) : undefined })
  return { days: days.length, courses: courses.length }
}

export async function deleteAll(): Promise<void> {
  await clearAll()
}
