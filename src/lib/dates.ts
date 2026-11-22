// Datums-Helfer. Tage werden als lokale ISO-Strings "YYYY-MM-DD" gespeichert,
// damit Zeitzonen und Sommerzeit keine Rolle spielen.

export type ISODate = string

export function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

export function toISO(y: number, m0: number, d: number): ISODate {
  return `${y}-${pad(m0 + 1)}-${pad(d)}`
}

export function todayISO(): ISODate {
  const t = new Date()
  return toISO(t.getFullYear(), t.getMonth(), t.getDate())
}

export function parseISO(iso: ISODate): { y: number; m0: number; d: number } {
  const [y, m, d] = iso.split('-').map(Number)
  return { y, m0: m - 1, d }
}

/** Tage seit 1970-01-01 (UTC-basiert, daher DST-sicher). */
export function dayNumber(iso: ISODate): number {
  const { y, m0, d } = parseISO(iso)
  return Math.round(Date.UTC(y, m0, d) / 86400000)
}

export function fromDayNumber(n: number): ISODate {
  const dt = new Date(n * 86400000)
  return toISO(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate())
}

export function addDays(iso: ISODate, days: number): ISODate {
  return fromDayNumber(dayNumber(iso) + days)
}

export function diffDays(a: ISODate, b: ISODate): number {
  return dayNumber(b) - dayNumber(a)
}

export function daysInMonth(y: number, m0: number): number {
  return new Date(Date.UTC(y, m0 + 1, 0)).getUTCDate()
}

export function weekdayShort(iso: ISODate): string {
  const { y, m0, d } = parseISO(iso)
  return ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'][new Date(Date.UTC(y, m0, d)).getUTCDay()]
}

export function isWeekend(iso: ISODate): boolean {
  const { y, m0, d } = parseISO(iso)
  const wd = new Date(Date.UTC(y, m0, d)).getUTCDay()
  return wd === 0 || wd === 6
}

const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember']
const MONTHS_SHORT = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']

export function monthName(m0: number): string {
  return MONTHS[m0]
}
export function monthShort(m0: number): string {
  return MONTHS_SHORT[m0]
}

export function formatDE(iso: ISODate): string {
  const { y, m0, d } = parseISO(iso)
  return `${pad(d)}.${pad(m0 + 1)}.${y}`
}

export function shiftMonth(y: number, m0: number, delta: number): { y: number; m0: number } {
  const total = y * 12 + m0 + delta
  return { y: Math.floor(total / 12), m0: ((total % 12) + 12) % 12 }
}
