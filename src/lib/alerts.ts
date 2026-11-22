// Hinweise zum Zyklus je nach Lebensphase. Quellen: docs/knowledge/README.md, Abschnitt "Zyklus nach Lebensphase".
// - Jugendliche (internationale PCOS-Leitlinie 2023): im 1. Jahr nach der ersten Periode normal (Übergang),
//   1–3 Jahre danach 21–45 Tage, ab 3 Jahren 21–35 Tage oder weniger als 8 Zyklen im Jahr auffällig;
//   über 90 Tage in jedem Alter nach der ersten Periode auffällig.
// - POI (ESHRE 2024): vor 40 Jahren Blutung 4 Monate ausgeblieben oder unregelmäßig → abklären (FSH).
// - Perimenopause (STRAW+10): Zykluslängen schwanken wiederholt um 7 Tage oder mehr (frühe Phase),
//   60 Tage oder mehr ohne Blutung (späte Phase).
// Die App stellt keine Diagnose, sie empfiehlt nur ein Gespräch in der Praxis.

import { diffDays, parseISO, type ISODate } from './dates'
import type { Cycle } from './cycles'
import type { ContraceptionCourse, Settings } from './model'

export interface CycleAlert {
  id: string
  level: 'info' | 'arzt'
  title: string
  text: string
}

type AlertSettings = Pick<Settings, 'birthYear' | 'menarcheAge' | 'modules'>

export function ageAt(birthYear: number | null, iso: ISODate): number | null {
  return birthYear ? parseISO(iso).y - birthYear : null
}

export function cycleAlerts(cycles: Cycle[], settings: AlertSettings, courses: ContraceptionCourse[], today: ISODate): CycleAlert[] {
  const out: CycleAlert[] = []
  const age = ageAt(settings.birthYear, today)
  const yearsSinceMenarche = age !== null && settings.menarcheAge ? age - settings.menarcheAge : null
  const onHormones = settings.modules.contraception && courses.some((c) => c.end === null || c.end >= today)
  if (onHormones) return out // Abbruchblutungen sagen nichts über den natürlichen Zyklus

  const done = cycles.filter((c) => c.length !== null)
  const recent = done.slice(-12)
  const current = cycles[cycles.length - 1]
  const running = current ? diffDays(current.start, today) + 1 : null

  // Lange Pause ohne Blutung
  if (running !== null && running >= 90) {
    if (age !== null && age < 40 && running >= 120) {
      out.push({
        id: 'poi',
        level: 'arzt',
        title: 'Seit 4 Monaten keine Periode',
        text: 'Bleibt die Blutung vor dem 40. Geburtstag 4 Monate aus, sollte das ärztlich abgeklärt werden (z. B. Hormonwerte wie FSH), nachdem eine Schwangerschaft ausgeschlossen ist.',
      })
    } else if (age !== null && age >= 45 && running >= 60) {
      out.push({
        id: 'peri-spaet',
        level: 'info',
        title: 'Lange Pause ohne Periode',
        text: 'Pausen von 60 Tagen oder mehr sind in den Wechseljahren typisch. Sprechen Sie Ihre Gynäkologin bei Beschwerden oder sehr starken Blutungen an.',
      })
    } else {
      out.push({
        id: 'pause-90',
        level: 'arzt',
        title: 'Über 3 Monate keine Periode',
        text: 'Wenn ein Schwangerschaftstest negativ ist und die Periode länger als 90 Tage ausbleibt, sollte das in der Praxis abgeklärt werden.',
      })
    }
  } else if (age !== null && age >= 40 && running !== null && running >= 60) {
    out.push({
      id: 'peri-spaet',
      level: 'info',
      title: 'Lange Pause ohne Periode',
      text: 'Pausen von 60 Tagen oder mehr können ein Zeichen der späten Wechseljahre sein. Bei Unsicherheit bitte ärztlich besprechen.',
    })
  }

  // Zykluslängen außerhalb der Norm
  const inFirstYear = yearsSinceMenarche !== null && yearsSinceMenarche < 1
  if (!inFirstYear && recent.length >= 3) {
    const teen = yearsSinceMenarche !== null && yearsSinceMenarche < 3
    const lo = 21
    const hi = teen ? 45 : 35
    const out3 = recent.slice(-6).filter((c) => (c.length as number) < lo || (c.length as number) > hi)
    if (out3.length >= 3) {
      out.push({
        id: 'laenge',
        level: 'arzt',
        title: 'Mehrere Zyklen außerhalb der Norm',
        text: `${out3.length} der letzten ${Math.min(6, recent.length)} Zyklen waren kürzer als ${lo} oder länger als ${hi} Tage. ${
          age !== null && age >= 40
            ? 'Das kann zu den beginnenden Wechseljahren passen. '
            : 'Unregelmäßige Zyklen können zum Beispiel beim PCO-Syndrom vorkommen. '
        }Bitte mit der Gynäkologin besprechen.`,
      })
    }
  }

  // Frühe Perimenopause: wiederholt ≥ 7 Tage Unterschied zwischen aufeinanderfolgenden Zyklen
  if (age !== null && age >= 40 && recent.length >= 4) {
    const last10 = done.slice(-10)
    let jumps = 0
    for (let i = 1; i < last10.length; i++) if (Math.abs((last10[i].length as number) - (last10[i - 1].length as number)) >= 7) jumps++
    if (jumps >= 2) {
      out.push({
        id: 'peri-frueh',
        level: 'info',
        title: 'Zykluslängen schwanken',
        text: 'Ihre Zykluslängen unterscheiden sich wiederholt um 7 Tage oder mehr. Das ist ein typisches frühes Zeichen der Wechseljahre.',
      })
    }
  }

  if (age !== null && age >= 35) {
    out.push({
      id: 'kinderwunsch-35',
      level: 'info',
      title: 'Hinweis bei Kinderwunsch',
      text: 'Ab 35 nimmt die Fruchtbarkeit deutlicher ab. Bei Kinderwunsch lohnt sich ein frühes Gespräch in der Praxis, spätestens nach 6 Monaten ohne Schwangerschaft.',
    })
  }

  return out
}

/** Hinweis für die Fruchtbarkeitsauswertung in Lebensphasen mit unsicherem Zyklus */
export function nfpPhaseNote(settings: AlertSettings, today: ISODate): string | null {
  const age = ageAt(settings.birthYear, today)
  if (age === null) return null
  const yearsSinceMenarche = settings.menarcheAge ? age - settings.menarcheAge : null
  if (age < 18 || (yearsSinceMenarche !== null && yearsSinceMenarche < 3))
    return 'In den ersten Jahren nach der ersten Periode sind Zyklen oft noch unregelmäßig. Die Auswertung ist dann weniger aussagekräftig.'
  if (age >= 40)
    return 'In den Wechseljahren werden Zyklen unregelmäßiger, und der Eisprung bleibt öfter aus. Die Auswertung ist dann weniger aussagekräftig.'
  return null
}
