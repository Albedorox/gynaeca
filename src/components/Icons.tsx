// Eigene Linien-Icons der App (24×24, Strichstärke folgt currentColor).
import type { ReactNode } from 'react'
import { AID_TYPES, FOOD_GOOD, FOOD_LESS, MOVEMENT_TYPES, RELAX_TYPES, SUPPLEMENTS } from '../lib/knowledge'

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
  // Bewegung
  walk: (
    <>
      <circle cx="13" cy="4.5" r="1.8" />
      <path d="M12.5 8.2L10.3 13l2.7 2.6V21M10.3 13l-.3-3.5-3 2M12.5 8.2l3 3.3 2.8.6M10.6 16.4L8 21" />
    </>
  ),
  bike: (
    <>
      <circle cx="6" cy="16" r="3.6" />
      <circle cx="18" cy="16" r="3.6" />
      <path d="M6 16l3.5-7h6L18 16M9.5 9L12.5 16H6M14 5.5h2.5l-1 3.5" />
    </>
  ),
  swim: (
    <>
      <circle cx="16.5" cy="6.5" r="1.8" />
      <path d="M4.5 12.5l4.5-3 3.5 2.6 2.5-1.6" />
      <path d="M3 16.5c1.5-1.2 3-1.2 4.5 0s3 1.2 4.5 0 3-1.2 4.5 0 3 1.2 4.5 0M3 20c1.5-1.2 3-1.2 4.5 0s3 1.2 4.5 0 3-1.2 4.5 0 3 1.2 4.5 0" />
    </>
  ),
  run: (
    <>
      <circle cx="15" cy="4.3" r="1.8" />
      <path d="M13.7 8L10.5 12l3.6 2.6-1.4 6M10.5 12L6.5 11.5l2-3.5h5.2l2.4 3 3 .4M14.1 14.6l4.3 1.4" />
    </>
  ),
  yoga: (
    <>
      <circle cx="12" cy="4.8" r="1.9" />
      <path d="M12 8v6M7.5 10.5l4.5 1.6 4.5-1.6M4.5 18.5c2-2 4.6-3 7.5-3s5.5 1 7.5 3M7 19.5h10" />
    </>
  ),
  stretch: (
    <>
      <circle cx="12" cy="4.3" r="1.8" />
      <path d="M6.5 2.5L12 8l5.5-5.5M12 8v6.5M12 14.5L8.5 21M12 14.5l3.5 6.5" />
    </>
  ),
  dumbbell: <path d="M6.5 7.5v9M17.5 7.5v9M3.8 10v4M20.2 10v4M6.5 12h11" />,
  pelvis: (
    <>
      <path d="M3.5 6.5c2 0 3.6 1.1 4 3.2.6 3.4 2.2 6.3 4.5 6.3s3.9-2.9 4.5-6.3c.4-2.1 2-3.2 4-3.2" />
      <path d="M8.5 20c1.1-1.1 2.3-1.6 3.5-1.6s2.4.5 3.5 1.6M12 3.5v3" />
    </>
  ),
  // Entspannung
  breath: <path d="M3 9h10.5a3 3 0 1 0-3-3M3 13h15a3 3 0 1 1-3 3M3 17h6.5" />,
  lotus: (
    <>
      <path d="M12 5c-2 2.6-2 7.4 0 11 2-3.6 2-8.4 0-11z" />
      <path d="M12 16c-2.6-.9-5.2-3.4-5.6-7 2.8.2 4.6 2 5.6 4.2M12 16c2.6-.9 5.2-3.4 5.6-7-2.8.2-4.6 2-5.6 4.2M3.5 16c2 2.6 5 3.6 8.5 3.6s6.5-1 8.5-3.6" />
    </>
  ),
  muscle: <path d="M5 20.5c0-6.5 1.3-11 4.5-15l3.2 1.2-1.6 3.4c2.1-.6 4.3-.1 5.9 1.5 2.1 2.1 2.6 5.2 1.6 8.9z" />,
  bodyscan: (
    <>
      <circle cx="12" cy="4.6" r="2" />
      <path d="M8.5 9h7l-1 6.2H13l-.4 5.8h-1.2l-.4-5.8H9.5z" />
      <path d="M3 12.5h3M18 12.5h3" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12s3.6-6 9.5-6 9.5 6 9.5 6-3.6 6-9.5 6-9.5-6-9.5-6z" />
      <circle cx="12" cy="12" r="2.6" />
    </>
  ),
  tree: <path d="M12 21v-6.5M12 17l-2.5-1.8M12 14.5c4 0 6.5-2.4 6.5-5.4a4.4 4.4 0 0 0-3-4.2A3.6 3.6 0 0 0 9 4.3a4.4 4.4 0 0 0-3.5 4.8c0 3 2.5 5.4 6.5 5.4z" />,
  cup: (
    <>
      <path d="M5 9.5h11v4.5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5zM16 11h1.5a2.4 2.4 0 0 1 0 4.8H16" />
      <path d="M8.5 3.5c-.6 1 .6 2 0 3.2M12 3.5c-.6 1 .6 2 0 3.2" />
    </>
  ),
  // Hilfsmittel
  patch: (
    <>
      <rect x="3.5" y="7" width="17" height="10" rx="3.5" />
      <path d="M9 10c-.8.8.8 3.2 0 4M12 10c-.8.8.8 3.2 0 4M15 10c-.8.8.8 3.2 0 4" />
    </>
  ),
  hotwater: (
    <>
      <path d="M10 3.5h4v3h-4z" />
      <path d="M8.3 6.5h7.4a2.8 2.8 0 0 1 2.8 2.8v8.4a2.8 2.8 0 0 1-2.8 2.8H8.3a2.8 2.8 0 0 1-2.8-2.8V9.3a2.8 2.8 0 0 1 2.8-2.8zM8.5 11h7M8.5 14h7M8.5 17h7" />
    </>
  ),
  pillow: (
    <>
      <path d="M5 6c4.5-1.5 9.5-1.5 14 0 1.3 4 1.3 8 0 12-4.5 1.5-9.5 1.5-14 0-1.3-4-1.3-8 0-12z" />
      <circle cx="9" cy="10" r=".6" fill="currentColor" />
      <circle cx="14" cy="9.5" r=".6" fill="currentColor" />
      <circle cx="11.5" cy="13.5" r=".6" fill="currentColor" />
      <circle cx="15.5" cy="14" r=".6" fill="currentColor" />
      <circle cx="8.5" cy="14.5" r=".6" fill="currentColor" />
    </>
  ),
  bath: (
    <>
      <path d="M3.5 12h17v2a5 5 0 0 1-5 5h-7a5 5 0 0 1-5-5zM6 12V6a2 2 0 0 1 3.8-.9M7 19l-1 2M17 19l1 2" />
      <circle cx="13" cy="8.5" r="1" />
      <circle cx="16.5" cy="7" r="1.4" />
    </>
  ),
  tens: (
    <>
      <rect x="7" y="3" width="10" height="11" rx="2.2" />
      <path d="M9.8 6.5h4.4M9.8 9.5h2.4M10 14v2.5c0 1.6-2 1.8-4 3.5M14 14v2.5c0 1.6 2 1.8 4 3.5" />
    </>
  ),
  hand: <path d="M8 12.5V5.5a1.5 1.5 0 0 1 3 0V11M11 10.5V4a1.5 1.5 0 0 1 3 0v7M14 10.5V6a1.5 1.5 0 0 1 3 0v8c0 4-2.5 6.5-6 6.5-2.5 0-4-1-5.5-3l-2-3.4a1.5 1.5 0 0 1 2.4-1.8L8 14.5" />,
  // Ernährung
  leaf: <path d="M5 19C5 10.5 10 5.2 19.5 4.5 19 14 14 19 5 19zM5 19l8.5-8.5" />,
  apple: <path d="M12 8c-1.6-1-5.2-1.6-6.6 1.6-1.4 3.2.1 7.8 2 9.7 1.5 1.5 3.1 1 4.6.4 1.5.6 3.1 1.1 4.6-.4 1.9-1.9 3.4-6.5 2-9.7C17.2 6.4 13.6 7 12 8zM12 8c0-2 1-3.6 3-4.3" />,
  wheat: <path d="M12 21V8.5M12 8.5c-1.8-1-2.3-3-1.8-5 1.8.6 2.3 3 1.8 5zm0 0c1.8-1 2.3-3 1.8-5-1.8.6-2.3 3-1.8 5zM12 13.5c-2.3-.4-3.4-2.3-3.4-4.3 2.3.5 3.4 2.3 3.4 4.3zm0 0c2.3-.4 3.4-2.3 3.4-4.3-2.3.5-3.4 2.3-3.4 4.3zM12 18c-2.3-.4-3.4-2.3-3.4-4.3 2.3.5 3.4 2.3 3.4 4.3zm0 0c2.3-.4 3.4-2.3 3.4-4.3-2.3.5-3.4 2.3-3.4 4.3z" />,
  bean: <path d="M8.5 4.5c3-1 6.2.8 6.2 3.8 0 2 1.7 2.6 3.2 4 2.6 2.6 1 7.2-3 7.2-3.6 0-5.2-2-6.6-4.6S3.5 6.2 8.5 4.5z" />,
  fish: (
    <>
      <path d="M3 12c3-4.5 9-6 14-1.5L21 7v10l-4-3.5C12 18 6 16.5 3 12z" />
      <circle cx="8" cy="11.2" r=".8" fill="currentColor" />
    </>
  ),
  olive: (
    <>
      <ellipse cx="10" cy="14" rx="4.5" ry="5.5" transform="rotate(-25 10 14)" />
      <path d="M12.5 9c1-3 3-5 6.5-5.5M16 5.5c1.5 1 2 2.5 1.8 4" />
    </>
  ),
  nut: <path d="M12 3.5c4 3 5.5 7 5.5 10a5.5 5.5 0 0 1-11 0c0-3 1.5-7 5.5-10zM12 8.5v8" />,
  meat: (
    <>
      <path d="M14 4c4 0 6.5 3 6.5 6.5 0 5-5 9.5-11 9.5-3.5 0-6-2-6-5 0-3 2.5-3.5 4-5.5S10 4 14 4z" />
      <circle cx="14" cy="10" r="2.2" />
    </>
  ),
  cake: (
    <>
      <path d="M4 20.5h16M5 20.5v-7h14v7M5 16.5c1.2 1 2.3 1 3.5 0s2.3-1 3.5 0 2.3 1 3.5 0 2.3-1 3.5 0" />
      <path d="M12 13.5V10M12 7.2c-.8-.8 0-2.2 0-3 .8.8 1.2 2.2 0 3z" />
    </>
  ),
  pizza: (
    <>
      <path d="M3.5 5.5c5.5-2.4 11.5-2.4 17 0L12 21z" />
      <circle cx="10" cy="9" r="1" fill="currentColor" />
      <circle cx="14.2" cy="10" r="1" fill="currentColor" />
      <circle cx="12" cy="14" r="1" fill="currentColor" />
    </>
  ),
  bread: <path d="M5.5 20V11a3 3 0 0 1-1-5.5C6 4 9 3.5 12 3.5s6 .5 7.5 2a3 3 0 0 1-1 5.5v9z" />,
  milk: <path d="M8 8.5L9.5 3.5h5L16 8.5v12H8zM8 8.5h8M8 13h8" />,
  coffee: (
    <>
      <path d="M5 9.5h11v4.5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5zM16 11h1.5a2.4 2.4 0 0 1 0 4.8H16M4 21h13" />
      <path d="M9 3.5c1 1-1 2 0 3.5M12.5 3.5c1 1-1 2 0 3.5" />
    </>
  ),
  wine: <path d="M7.5 3.5h9c0 4.6-1 8-4.5 8s-4.5-3.4-4.5-8zM12 11.5v8.5M8.5 20.5h7M7.7 7h8.6" />,
  chili: <path d="M16 6.5c-1 0-2 .5-2.3 1.5C13 11.5 10 15.5 4 18c4 3 11 1 13.5-5 1-2.5 1-5-1.5-6.5zM16 6.5c0-1.5 1-2.6 2.5-2.8" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" />
    </>
  ),
  root: <path d="M6 9c2-3 6-4 9-2.5 2.5 1.2 4 3.8 3 6-1 2-3.5 2.2-5 1.4L9.5 20l-1-1 2.4-4.5C8 14 5 12 6 9zM15 6.5l1.5-3M17.5 9l3-1" />,
  pineapple: (
    <>
      <ellipse cx="12" cy="15" rx="5" ry="6" />
      <path d="M9 12l6 6M15 12l-6 6M12 9V3.5M12 9L8.5 4.5M12 9l3.5-4.5" />
    </>
  ),
  glass: <path d="M6 4h12l-1.6 16.5H7.6zM6.5 9.5h11" />,
  utensils: <path d="M7 3v7a2 2 0 0 0 4 0V3M9 10v11M17 21V3c-2 1-3.2 4-3.2 8H17" />,
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

// Icons für Selbstfürsorge, Ernährung und Hilfsmittel (aus knowledge.ts)
export const CARE_ICON: Record<string, string> = Object.fromEntries(
  [...MOVEMENT_TYPES, ...RELAX_TYPES, ...AID_TYPES, ...FOOD_GOOD, ...FOOD_LESS, ...SUPPLEMENTS].map((x) => [x.label, x.icon]),
)
