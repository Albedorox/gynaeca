# Gynaeca

Gynaeca ist eine Offline-first Progressive Web App für den Zyklus: Blutung, Schmerz und Schmerzmittel,
Endometriose-Symptome, Verhütung, Fruchtbarkeit (NFP) und Selbstfürsorge schnell erfassen und für
das Gespräch in der Praxis aufbereiten. Die Daten liegen zuerst auf dem Gerät. Ein Konto ist freiwillig
und synchronisiert Ende-zu-Ende-verschlüsselt.

Live: https://femaleapp.showcube.de

> Gynaeca ist ein Dokumentationswerkzeug und stellt keine Diagnosen.

## Starten

```bash
npm install
npm run dev        # Entwicklungsserver, http://localhost:5173
npm test           # Tests (Zyklus, NFP, Hinweise, Verschlüsselung, Sync)
npm run build      # Produktions-Build nach dist/ (inkl. Service Worker)
npm run preview    # Build lokal ansehen
npm run icons      # App-Icons neu erzeugen (braucht Playwright)
```

Für den Test auf dem Handy: `npm run dev -- --host` und die angezeigte Netzwerk-Adresse im Handy-Browser
öffnen (gleiches WLAN). Installation als App („Zum Startbildschirm“) und Offline-Betrieb funktionieren
nur über HTTPS oder localhost.

## Aufbau der App

Dunkles Design mit feinen Linien (Titel in Cormorant Garamond), wahlweise hell. Farbpaletten
Beere, Lavendel, Salbei, Ozean und Sand unter **Themen**. Unten eine Tab-Leiste:

| Tab | Inhalt |
|---|---|
| **Kalender** | Zyklusring mit Zyklus- bzw. Periodentag und Prognose, darunter der Monatskalender mit Periodenbändern. Tippen auf einen Tag öffnet die Tagesansicht. |
| **Statistik** | Zykluslänge, Periodendauer, Schmerzverlauf, Zyklusverlauf, Selbstfürsorge und Vergleiche (z. B. Ernährung oder Bewegung und Schmerz). Von hier aus der **Arztbericht**. |
| **+** | Heute eintragen. |
| **Themen** | Erscheinungsbild (dunkel/hell, Farbpalette). |
| **Einstellungen** | Konto & Synchronisation, Mein Zyklus, Module, Persönliches, Schmerzmittel, Präparate, eigene Symptome, Berichte & Hilfe, Meine Daten (Export/Import). |

**Tagesansicht:** Wochenstreifen oben, darunter Abschnitte mit Icon-Rastern für Blutung, Schmerz,
Schmerzmittel, Symptome, Stimmung, Fruchtbarkeit, Verhütung, Selbstfürsorge und Notiz.

### Module

Module werden in den Einstellungen an- und ausgeschaltet. Ausgeschaltete Bereiche verschwinden.

- **Schmerz & Medikamente:** Schmerz 0–10, Schmerzmittel mit Favoriten, Dosis und Anzahl.
- **Endometriose:** erweiterte Abfrage mit Schmerzarten, Auswirkungen auf den Alltag, Stress und Bewegung,
  dazu Selbstfürsorge mit Tagebuch für Ernährung, Bewegung, Entspannung und Hilfsmittel sowie eine kurze Atemübung.
- **Symptome:** Begleitsymptome und eigene Tags.
- **Verhütung:** Präparat ab einem Tag starten, beenden oder absetzen.
- **Regelmäßige gynäkologische Medikamente.**
- **Fruchtbarkeit (NFP):** Basaltemperatur, Zervixschleim, Muttermund, LH-Test, Auswertung nach den
  Regeln der deutschen NFP (`src/lib/nfp.ts`) mit eigener Ansicht.
- **Geschlechtsverkehr.**

Zusätzlich Hinweise je nach Lebensphase (z. B. auffällig lange Zyklen), die ein Gespräch in der Praxis
empfehlen (`src/lib/alerts.ts`).

## Zyklusberechnung (`src/lib/cycles.ts`)

- Zyklustag 1 = erster Tag mit Blutung > 0 nach mindestens N blutungsfreien Tagen (Standard 7, einstellbar).
  Kürzere Pausen gelten als Zwischenblutung. Pro Tag manuell überschreibbar.
- Zykluslänge = Tage von ZT 1 bis einschließlich zum Tag vor der nächsten Periode.
- Blutungsdauer = zusammenhängende Blutungstage ab ZT 1 (ein einzelner Tag Pause wird überbrückt).
  Optional zählen reine Schmierblutungstage direkt davor und danach mit.
- Prognose der nächsten Periode = Mittel der letzten 6 Zyklen.

## Fachliche Grundlage

Die klinischen Kriterien (Blutungsstärke, Schmerzskalen, Endometriose, NFP, Lebensphasen) stehen in
der Wissensbasis [`docs/knowledge/README.md`](docs/knowledge/README.md). Sie wird mit einer Gynäkologin
abgestimmt; die Umsetzung im Code liegt in `src/lib/knowledge.ts`, `src/lib/nfp.ts` und `src/lib/alerts.ts`.

## Konto & Synchronisation

Konzept: [`docs/sync/README.md`](docs/sync/README.md). Kurz:

- **Offline zuerst.** IndexedDB (Dexie) bleibt die maßgebliche Datenquelle, die App funktioniert ohne Konto.
- **Ende-zu-Ende-verschlüsselt** (`src/lib/crypto.ts`). Jeder Datensatz wird im Browser mit AES-256-GCM
  verschlüsselt, Datensatz-Namen wie das Datum per HMAC verschleiert. Der Hauptschlüssel liegt auf dem Server
  nur verpackt: mit einem Sync-Passwort (Argon2id) und mit einem Wiederherstellungscode.
- **Supabase** (Projekt `gynaeca`, Frankfurt) speichert nur verschlüsselte Datensätze (`key_bundles`, `records`,
  `consents`), abgesichert über RLS. Schema: `supabase/migrations/`.
- **Sync** (`src/lib/sync.ts`, `src/lib/merge.ts`): Abholen und Senden mit Versionsprüfung, Konflikte werden
  auf dem Gerät per Drei-Wege-Vergleich zusammengeführt.
- **Anmeldung** per E-Mail-Code oder Link aus der E-Mail (`src/lib/account.ts`, `src/components/AccountSection.tsx`).
- **DSGVO:** Einwilligung nach Art. 9 Abs. 2 lit. a wird gespeichert, das Konto lässt sich samt Daten löschen.

## Datenschutz

Ohne Konto bleiben alle Daten im Browser-Speicher des Geräts; die App bittet um dauerhaften Speicher
(`navigator.storage.persist`). Keine Analyse-Tools. Mit Konto sieht der Server nur verschlüsselte Daten.
Backup: JSON-Export/-Import, CSV für Excel (Semikolon, Dezimalkomma).
Arztbericht: druckbares Zyklusblatt, über den Druckdialog als PDF speicherbar.

## Technik

- Vite + React + TypeScript
- Dexie (IndexedDB) für die lokale Speicherung, `src/lib/db.ts`
- vite-plugin-pwa (Workbox) für Offline-Fähigkeit und Installierbarkeit
- Supabase (`@supabase/supabase-js`) für Konto und Sync, Argon2id und WebCrypto für die Verschlüsselung
- Vitest für Tests

Die interne Datenbank heißt aus Kompatibilitätsgründen weiter `die-frau-zyklusblatt` (ebenso die Kennung in
JSON-Backups). Nicht umbenennen, sonst finden bestehende Installationen ihre Daten und alten Backups nicht mehr.

## Deployment

`main` wird automatisch auf https://femaleapp.showcube.de (Hostinger) ausgeliefert. Änderungen laufen über
einen Branch und einen Pull Request. `public/.htaccess` erzwingt HTTPS.

## Logo

Linienzeichnung (Gebärmutter mit Herz) als App-Icon auf Beeren-Rosé. Vorlage in `assets-src/`, Vektor in `public/icon-full.svg`.
Die PNG-Icons erzeugt `npm run icons` (`scripts/make-icons.mjs`, braucht Playwright).

## Offen / nächste Schritte

- Konto & Sync: Testphase auf zwei Geräten, danach Anmeldung mit Google und Apple
- Erinnerungen (z. B. Pilleneinnahme)
- PIN-Sperre für die lokalen Daten
- Gewicht und Schlaf, Mustererkennung
