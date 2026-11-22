// Eigene Linien-Icons der App (24×24, Strichstärke folgt currentColor).
import type { ReactNode } from 'react'

const P: Record<string, ReactNode> = {
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="3" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
      <circle cx="8.5" cy="14.5" r=".6" fill="currentColor" />
      <circle cx="12" cy="14.5" r=".6" fill="currentColor" />
      <circle cx="15.5" cy="14.5" r=".6" fill="currentColor" />
    </>
  ),
  chart: <path d="M5 20V12M10 20V6M15 20v-9M20 20V9M3 20.5h18" />,
  palette: (
    <>
      <path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.4 0 2-1 1.5-2.1-.6-1.2.2-2.4 1.5-2.4h1.6a3.9 3.9 0 0 0 3.9-3.9C20.5 7.3 16.7 3.5 12 3.5z" />
      <circle cx="7.8" cy="11" r="1.1" fill="currentColor" />
      <circle cx="10.5" cy="7.4" r="1.1" fill="currentColor" />
      <circle cx="15" cy="7.6" r="1.1" fill="currentColor" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7" />
      <circle cx="12" cy="12" r="6.5" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  back: <path d="M15 5l-7 7 7 7" />,
  chevron: <path d="M9 5l7 7-7 7" />,
  today: (
    <>
      <rect x="3.5" y="5" width="17" height="15" rx="3" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
      <circle cx="12" cy="15" r="2" fill="currentColor" />
    </>
  ),
  drop: <path d="M12 3.5s-6 6.8-6 11a6 6 0 0 0 12 0c0-4.2-6-11-6-11z" />,
  pill: (
    <>
      <rect x="3" y="8.5" width="18" height="7" rx="3.5" transform="rotate(-35 12 12)" />
      <path d="M9.9 9l4.2 6" />
    </>
  ),
  bolt: <path d="M13 3L5 13.5h6L10 21l8-10.5h-6z" />,
  thermo: (
    <>
      <path d="M10 14.5V5a2 2 0 0 1 4 0v9.5a4 4 0 1 1-4 0z" />
      <path d="M12 9v7" />
    </>
  ),
  note: (
    <>
      <path d="M6 3.5h9l4 4v13H6z" />
      <path d="M15 3.5v4h4M9 12h7M9 15.5h7" />
    </>
  ),
  flag: <path d="M6 21V4M6 4.5h11l-2.5 4 2.5 4H6" />,
  heart: <path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.3 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z" />,
  doc: (
    <>
      <path d="M6 3.5h9l4 4v13H6z" />
      <path d="M15 3.5v4h4M9 13l2 2 4-4" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.5M12 7.8v.4" />
    </>
  ),
  shield: <path d="M12 3l7 3v5.5c0 4.5-3 7.7-7 9.5-4-1.8-7-5-7-9.5V6z" />,
  user: (
    <>
      <circle cx="12" cy="8.5" r="3.8" />
      <path d="M4.5 20.5c1-4 4-6 7.5-6s6.5 2 7.5 6" />
    </>
  ),
  layers: <path d="M12 4l8.5 4.5L12 13 3.5 8.5zM3.5 12.5L12 17l8.5-4.5M3.5 16.5L12 21l8.5-4.5" />,
  table: (
    <>
      <rect x="3.5" y="4" width="17" height="16" rx="2.5" />
      <path d="M3.5 9h17M3.5 14h17M9 4v16" />
    </>
  ),
  sparkle: <path d="M12 3.5l2 5.5 5.5 2-5.5 2-2 5.5-2-5.5-5.5-2 5.5-2z" />,
  // Symptome
  head: (
    <>
      <path d="M7 20v-3.5c-1.8-1.3-3-3.4-3-5.8C4 6.6 7.6 3.5 12 3.5s8 3.1 8 7.2c0 1-.2 1.9-.5 2.8l1 2.5h-2v3h-4.5v1" />
      <path d="M11 7.5l-1.5 3h3L11 13.5" />
    </>
  ),
  belly: (
    <>
      <path d="M7 3.5c0 4-2.5 5.5-2.5 9.5a7.5 7.5 0 0 0 15 0c0-4-2.5-5.5-2.5-9.5" />
      <circle cx="12" cy="13.5" r="1" />
      <path d="M8 17c1.2.9 2.5 1.3 4 1.3s2.8-.4 4-1.3" />
    </>
  ),
  breast: <path d="M3.5 9c1 5 4.2 7 6 7s2.5-1.5 2.5-1.5S12.7 16 14.5 16s5-2 6-7" />,
  nausea: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M8.5 10.2h1.5M14 10.2h1.5M8.5 15.5c1-.8 2-.8 3 0s2 .8 3 0" />
    </>
  ),
  back_: (
    <>
      <path d="M12 3.5v17" strokeDasharray="2.2 2.2" />
      <path d="M7 6c-1.5 2-2 4-2 6s.5 4 2 6M17 6c1.5 2 2 4 2 6s-.5 4-2 6" />
    </>
  ),
  tired: (
    <>
      <rect x="3" y="8" width="16" height="9" rx="2" />
      <path d="M21 11v3M6 11v3" />
    </>
  ),
  skin: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="9" cy="9.5" r=".9" fill="currentColor" />
      <circle cx="15" cy="13" r=".9" fill="currentColor" />
      <circle cx="10.5" cy="15.5" r=".9" fill="currentColor" />
    </>
  ),
  moon: <path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z" />,
  bowel: <path d="M6 5h9a3 3 0 0 1 0 6H9a3 3 0 0 0 0 6h9" />,
  wave: <path d="M3 9c2-2 4-2 6 0s4 2 6 0 4-2 6 0M3 15c2-2 4-2 6 0s4 2 6 0 4-2 6 0" />,
  migraine: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 3.5L10 10h4l-2 6.5" />
    </>
  ),
}

// Gesichter für Stimmungen: gleicher Kopf, verschiedene Augen und Münder
const FACES: Record<string, ReactNode> = {
  happy: <path d="M8.5 14c1 1.5 2.2 2.2 3.5 2.2s2.5-.7 3.5-2.2" />,
  calm: <path d="M9 15h6" />,
  sad: <path d="M8.5 16.5c1-1.4 2.2-2 3.5-2s2.5.6 3.5 2" />,
  angry: (
    <>
      <path d="M8.5 16.3c1-1 2.2-1.4 3.5-1.4s2.5.4 3.5 1.4" />
      <path d="M7.5 8l2.5 1.3M16.5 8L14 9.3" />
    </>
  ),
  anxious: (
    <>
      <path d="M8.5 15.8l1.2-.9 1.2.9 1.1-.9 1.2.9 1.1-.9 1.2.9" />
      <path d="M7.8 8.6L10 7.6M16.2 8.6L14 7.6" />
    </>
  ),
  swing: <path d="M8.5 15.5c.9-.9 1.8-.9 2.6 0s1.8.9 2.6 0 1.8-.9 2.3 0" />,
  energy: (
    <>
      <path d="M8 13.8h8c0 2.2-1.8 3.4-4 3.4s-4-1.2-4-3.4z" fill="currentColor" fillOpacity=".25" />
    </>
  ),
}

export function Icon({ name, size = 24, className, label }: { name: string; size?: number; className?: string; label?: string }) {
  const face = FACES[name]
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={label ? undefined : true}
      role={label ? 'img' : undefined}
      aria-label={label}
    >
      {face ? (
        <>
          <circle cx="12" cy="12" r="8.5" />
          {name !== 'anxious' && name !== 'angry' && (
            <>
              <circle cx="9.2" cy="10" r=".9" fill="currentColor" />
              <circle cx="14.8" cy="10" r=".9" fill="currentColor" />
            </>
          )}
          {(name === 'anxious' || name === 'angry') && (
            <>
              <circle cx="9.2" cy="11" r=".9" fill="currentColor" />
              <circle cx="14.8" cy="11" r=".9" fill="currentColor" />
            </>
          )}
          {face}
        </>
      ) : (
        P[name] ?? P.sparkle
      )}
    </svg>
  )
}

/** Icon je Symptom bzw. Stimmung; unbekannte bekommen ein neutrales Zeichen. */
export const SYMPTOM_ICON: Record<string, string> = {
  Kopfschmerzen: 'head',
  Migräne: 'migraine',
  Brustspannen: 'breast',
  Übelkeit: 'nausea',
  'Blähbauch (Endo-Belly)': 'belly',
  Blähungen: 'belly',
  Rückenschmerz: 'back_',
  Erschöpfung: 'tired',
  'Unreine Haut': 'skin',
  Schlafprobleme: 'moon',
  Durchfall: 'bowel',
  Verstopfung: 'bowel',
  Wassereinlagerungen: 'drop',
  'Dysmenorrhoe stark': 'bolt',
  'Schmerz beim Stuhlgang': 'bowel',
  'Schmerz beim Wasserlassen': 'drop',
  'Schmerz beim GV': 'heart',
  'Ausstrahlung ins Bein': 'bolt',
  Ausgeglichen: 'calm',
  Energiegeladen: 'energy',
  Stimmungsschwankungen: 'swing',
  Gereizt: 'angry',
  Traurig: 'sad',
  Ängstlich: 'anxious',
}
