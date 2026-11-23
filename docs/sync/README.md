# Nutzerkonto und Sync (Konzept, Entwurf)

Stand: 22.11.2026. Ausführliches Konzept als Claude Doc:
https://claude.ai/artifact/NsXBsjYYwWrQz3J3YsbPy9

## Kurzfassung

- **Offline zuerst.** IndexedDB (Dexie) bleibt die maßgebliche Datenquelle. Ein Konto ist freiwillig und dient nur Sync und Sicherung.
- **Ende-zu-Ende-verschlüsselt.** Jeder Datensatz (Tag, Verlauf, Einstellungen) wird im Browser mit AES-256-GCM verschlüsselt. Datensatz-Namen (z. B. das Datum) werden per HMAC verschleiert. Der Hauptschlüssel liegt auf dem Server nur verpackt (Argon2id aus einem Sync-Passwort, zweite Verpackung mit Wiederherstellungscode).
- **Generisches Schema.** Supabase (Projekt `gynaeca`, eu-central-1 Frankfurt) kennt nur `key_bundles`, `records` und `consents`. Neue App-Felder brauchen keine Migration.
- **Sync:** Abholen per `seq > Abholstand`, Senden über `push_records` mit Versionsprüfung. Konflikte führt das Gerät per Drei-Wege-Vergleich zusammen.
- **Login:** zuerst E-Mail-Code (OTP, kein Magic Link wegen iOS-PWA), später Google und Apple.
- **RLS:** jede Zeile gehört genau einer Nutzerin, `anon` hat keinen Zugriff.
- **DSGVO:** Einwilligung nach Art. 9 Abs. 2 lit. a in `consents`, Konto löschen über `delete_my_account()` mit Cascade.

## Dateien

- `supabase/migrations/20261122000000_sync_schema.sql` – Schema, RLS, Funktionen. Lokal gegen Postgres 16 mit nachgebildetem `auth`-Schema getestet. Wird im Supabase-Projekt über den SQL-Editor angewendet.

## Umsetzungsschritte

1. Supabase vorbereiten (AVV, SMTP, E-Mail-Vorlage mit `{{ .Token }}`, Site-URL), Schema anwenden.
2. ✓ Alle Schreibzugriffe nach `src/lib/db.ts`, Dexie Version 2 (`uid` für Verläufe, Tabellen `sync`, `syncState`, `keys`). Jede Änderung setzt im selben Schritt einen Eintrag in `sync` (dirty, Löschmarke).
3. ✓ `src/lib/crypto.ts` mit Tests: Hauptschlüssel, Verpackung per Argon2id (64 MiB, t=3) und Wiederherstellungscode (24 Zeichen Crockford-Base32, HKDF), AES-256-GCM mit AAD (Nutzer-ID, Sammlung, Datensatz-Name, Schlüsselversion), HMAC-Datensatz-Namen, Schlüssel als nicht exportierbare CryptoKeys in `db.keys`.
4. ✓ `src/lib/sync.ts` (Abholen, Senden über `push_records`, Konflikte, Löschmarken, Kontoprüfung) und `src/lib/merge.ts` (Drei-Wege-Zusammenführung je Feld). Tests mit nachgebildetem Server und zwei Geräten. Der Server-Zugang ist austauschbar (`supabaseTransport` für den echten Client). Dexie Version 3 indiziert den Server-Namen (`rk`) in `sync`.
5. Oberfläche „Konto & Synchronisation“.
6. Testphase auf zwei Geräten, dann Google und Apple.
