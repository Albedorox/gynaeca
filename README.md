# Die Frau – Zyklusblatt (PWA)

Offline-first Progressive Web App zur schnellen Erfassung von Blutung, Schmerz, Schmerzmedikation,
hormoneller Verhütung, Symptomen und NFP-Daten. Aufbau wie ein Zyklusblatt aus Papier:
ein Monat, eine Zeile pro Tag, ohne Scrollen.

## Starten

```bash
npm install
npm run dev        # Entwicklungsserver, http://localhost:5173
npm test           # Tests der Zyklusberechnung
npm run build      # Produktions-Build nach dist/ (inkl. Service Worker)
npm run preview    # Build lokal ansehen
```

Für den Test auf dem Handy: `npm run dev -- --host` und die angezeigte Netzwerk-Adresse im Handy-Browser
öffnen (gleiches WLAN). Installation als App ("Zum Startbildschirm") und Offline-Betrieb funktionieren
nur über HTTPS oder localhost, also nach dem Deployment.

## Bedienung

| Spalte | Geste |
|---|---|
| Verhütung (links, optional) | Tippen: Präparat ab diesem Tag starten, oder bei laufender Einnahme beenden / absetzen |
| Tag | Tippen: Notiz und manueller Zyklusbeginn |
| ZT | Zyklustag (automatisch) |
| Blutung | Horizontal wischen: 0 bis 5 in 0,5er-Schritten. Tippen: Schmierblutung an/aus |
| Schm. | Tippen: Schmerz 0 bis 10 und Schmerzmittel (Favoriten, Dosis, Anzahl mit +/−) |
| Sym. | Tippen: Begleitsymptome (Endometriose, Verdauung, Stimmung, eigene Tags) und Notiz |
| °C / ZS / MM | NFP: Basaltemperatur (0,01 °C), Zervixschleim (t, Ø, f, S, S+), Muttermund |
| LH | Tippen wechselt: – negativ, + positiv, ★ Peak, leer |

Module werden in den Einstellungen an- und ausgeschaltet; ausgeschaltete Spalten verschwinden.
Die Kopfzeile lässt sich zum Monatswechsel wischen, Tippen auf den Monatsnamen springt zu heute.

## Zyklusberechnung (`src/lib/cycles.ts`)

- Zyklustag 1 = erster Tag mit Blutung > 0 nach mindestens N blutungsfreien Tagen (Standard 7, einstellbar).
  Kürzere Pausen gelten als Zwischenblutung. Pro Tag manuell überschreibbar.
- Zykluslänge = Tage von ZT 1 bis einschließlich zum Tag vor der nächsten Periode.
- Blutungsdauer = zusammenhängende Blutungstage ab ZT 1 (ein einzelner Tag Pause wird überbrückt).
  Optional zählen reine Schmierblutungstage direkt davor und danach mit.
- Anzeige als `Blutungstage/Zykluslänge`, z. B. `5/25`; laufender Zyklus als `5/–`.

## Technik

- Vite + React + TypeScript
- Dexie (IndexedDB) für die lokale Speicherung, `src/lib/db.ts`
- vite-plugin-pwa (Workbox) für Offline-Fähigkeit und Installierbarkeit
- Vitest für Logik-Tests

## Datenschutz

Alle Daten bleiben im Browser-Speicher des Geräts. Kein Server, kein Konto, keine Analyse-Tools.
Die App bittet den Browser um dauerhaften Speicher (`navigator.storage.persist`).
Backup: JSON-Export/-Import. CSV für Excel (Semikolon, Dezimalkomma).
Arztbericht: druckbares Zyklusblatt, über den Druckdialog als PDF speicherbar.

## Offen / nächste Schritte

- Verschlüsselung der lokalen Daten mit PIN/Passphrase (WebCrypto) und optionale Ende-zu-Ende-verschlüsselte Synchronisation
- Temperaturkurve und NFP-Auswertung (Hochlage, Auswertungsregeln)
- Erinnerungen (z. B. Pilleneinnahme)
- Deployment (HTTPS) und GitHub-Repository
- Icon `npm run icons` neu erzeugen, wenn `public/icon.svg` geändert wird (benötigt Playwright)
