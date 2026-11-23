import { useEffect, useState } from 'react'
import {
  backToEmail,
  deleteAccount,
  hasLocalData,
  recoveryCodeNoted,
  requestCode,
  setupSync,
  signOut,
  syncNow,
  unlock,
  useAccount,
  verifyCode,
} from '../lib/account'
import { MIN_PASSPHRASE_LENGTH } from '../lib/crypto'
import { exportJSON } from '../lib/exporter'

function time(ms: number | null): string {
  if (!ms) return 'noch nie'
  const d = new Date(ms)
  const today = new Date().toDateString() === d.toDateString()
  const hm = d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  return today ? `heute um ${hm}` : `${d.toLocaleDateString('de-DE')} um ${hm}`
}

/** Knopf, der während der Aktion gesperrt ist */
function useBusy() {
  const [busy, setBusy] = useState(false)
  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true)
    try {
      await fn()
    } finally {
      setBusy(false)
    }
  }
  return [busy, run] as const
}

export default function AccountSection() {
  const a = useAccount()
  const [busy, run] = useBusy()

  let body: React.ReactNode
  if (a.status === 'loading') body = <p className="hint">Wird geladen …</p>
  else if (a.status === 'signedOut' || a.status === 'codeSent') body = <SignIn busy={busy} run={run} />
  else if (a.status === 'needsSetup') body = <Setup busy={busy} run={run} />
  else if (a.status === 'needsUnlock') body = <Unlock busy={busy} run={run} />
  else if (a.recoveryCode) body = <RecoveryCode code={a.recoveryCode} />
  else body = <Ready busy={busy} run={run} />

  return (
    <div className="account">
      {body}
      {a.error && (
        <p className="msg error" role="alert">
          {a.error}
        </p>
      )}
    </div>
  )
}

type Props = { busy: boolean; run: (fn: () => Promise<unknown>) => Promise<void> }

function SignIn({ busy, run }: Props) {
  const a = useAccount()
  const [email, setEmail] = useState(a.email ?? '')
  const [code, setCode] = useState('')

  if (a.status === 'codeSent') {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void run(() => verifyCode(code))
        }}
      >
        <p className="hint first">
          Wir haben eine E-Mail an <b>{a.email}</b> geschickt. Geben Sie den Code daraus hier ein, oder tippen Sie auf den Link in der Mail. Die Mail kann ein, zwei Minuten brauchen und landet manchmal im Spam-Ordner.
        </p>
        <label className="field">
          Code aus der E-Mail
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            className="code-input"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^\d ]/g, ''))}
            placeholder="123456"
            autoFocus
          />
        </label>
        <div className="stack">
          <button className="btn primary" type="submit" disabled={busy || code.replace(/\s/g, '').length < 6}>
            Anmelden
          </button>
          <button className="btn ghost" type="button" onClick={backToEmail}>
            Andere E-Mail-Adresse
          </button>
        </div>
      </form>
    )
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void run(() => requestCode(email))
      }}
    >
      <p className="hint first">
        Gynaeca funktioniert ohne Konto. Mit einem Konto werden Ihre Einträge gesichert und auf Ihren Geräten abgeglichen. Alles wird vorher auf dem Gerät verschlüsselt, auch wir können es nicht lesen.
      </p>
      <label className="field">
        E-Mail-Adresse
        <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@beispiel.de" required />
      </label>
      <button className="btn primary full" type="submit" disabled={busy || !/^\S+@\S+\.\S+$/.test(email.trim())}>
        Anmelde-E-Mail senden
      </button>
    </form>
  )
}

function PassphraseFields({ value, setValue, repeat, setRepeat }: { value: string; setValue: (v: string) => void; repeat: string; setRepeat: (v: string) => void }) {
  return (
    <>
      <label className="field">
        Sync-Passwort (mindestens {MIN_PASSPHRASE_LENGTH} Zeichen)
        <input type="password" autoComplete="new-password" value={value} onChange={(e) => setValue(e.target.value)} />
      </label>
      <label className="field">
        Sync-Passwort wiederholen
        <input type="password" autoComplete="new-password" value={repeat} onChange={(e) => setRepeat(e.target.value)} />
      </label>
    </>
  )
}

function Setup({ busy, run }: Props) {
  const a = useAccount()
  const [consent, setConsent] = useState(false)
  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const ok = consent && pw.length >= MIN_PASSPHRASE_LENGTH && pw === pw2

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        if (ok) void run(() => setupSync(pw))
      }}
    >
      <p className="hint first">
        Angemeldet als <b>{a.email}</b>. Noch zwei Schritte, dann ist der Sync eingerichtet.
      </p>

      <h3 className="acc-step">1. Einwilligung</h3>
      <label className="consent">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>
          Ich willige ein, dass meine Zyklus- und Gesundheitsdaten verschlüsselt auf Servern von Supabase in Frankfurt gespeichert werden, um sie zu sichern und auf meinen Geräten abzugleichen
          (Art. 9 Abs. 2 lit. a DSGVO). Die Daten werden auf meinem Gerät verschlüsselt und sind ohne mein Sync-Passwort für niemanden lesbar. Ich kann die Einwilligung jederzeit widerrufen, indem ich
          mein Konto lösche.
        </span>
      </label>

      <h3 className="acc-step">2. Sync-Passwort</h3>
      <p className="hint">
        Mit diesem Passwort werden Ihre Daten verschlüsselt. Sie brauchen es einmal auf jedem neuen Gerät. Wählen Sie ein Passwort, das Sie nirgends sonst verwenden, zum Beispiel drei bis vier zufällige Wörter.
      </p>
      <PassphraseFields value={pw} setValue={setPw} repeat={pw2} setRepeat={setPw2} />
      {pw2 && pw !== pw2 && <p className="hint warn">Die Passwörter stimmen nicht überein.</p>}

      <button className="btn primary full" type="submit" disabled={busy || !ok}>
        {busy ? 'Wird eingerichtet …' : 'Sync einrichten'}
      </button>
      <button className="btn ghost full" type="button" disabled={busy} onClick={() => void run(() => signOut(false))}>
        Abbrechen und abmelden
      </button>
    </form>
  )
}

function RecoveryCode({ code }: { code: string }) {
  const [noted, setNoted] = useState(false)
  const [copied, setCopied] = useState(false)
  const text = `Gynaeca – Wiederherstellungscode\n\n${code}\n\nMit diesem Code können Sie Ihre synchronisierten Daten öffnen, falls Sie Ihr Sync-Passwort vergessen. Bewahren Sie ihn sicher auf, zum Beispiel ausgedruckt oder in einem Passwort-Manager.\n`

  return (
    <div>
      <p className="hint first">
        <b>Ihr Wiederherstellungscode.</b> Falls Sie Ihr Sync-Passwort vergessen, öffnet nur dieser Code Ihre gesicherten Daten. Er wird nur jetzt angezeigt. Wir können ihn nicht wiederherstellen.
      </p>
      <p className="recovery-code" aria-label="Wiederherstellungscode">
        {code}
      </p>
      <div className="stack">
        <button
          className="btn"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(code)
              setCopied(true)
            } catch {
              setCopied(false)
            }
          }}
        >
          {copied ? 'Kopiert' : 'Code kopieren'}
        </button>
        <button
          className="btn"
          onClick={() => {
            const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }))
            const link = document.createElement('a')
            link.href = url
            link.download = 'gynaeca-wiederherstellungscode.txt'
            link.click()
            setTimeout(() => URL.revokeObjectURL(url), 1000)
          }}
        >
          Als Datei speichern
        </button>
      </div>
      <label className="consent">
        <input type="checkbox" checked={noted} onChange={(e) => setNoted(e.target.checked)} />
        <span>Ich habe den Code sicher aufbewahrt.</span>
      </label>
      <button className="btn primary full" disabled={!noted} onClick={recoveryCodeNoted}>
        Fertig
      </button>
    </div>
  )
}

function Unlock({ busy, run }: Props) {
  const a = useAccount()
  const [kind, setKind] = useState<'passphrase' | 'recovery'>('passphrase')
  const [secret, setSecret] = useState('')
  const [local, setLocal] = useState(false)
  const [replace, setReplace] = useState(false)

  useEffect(() => {
    void hasLocalData().then(setLocal)
  }, [])

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void run(() => unlock(secret, kind, local && replace))
      }}
    >
      <p className="hint first">
        Angemeldet als <b>{a.email}</b>. Für dieses Konto ist der Sync schon eingerichtet. Geben Sie Ihr Sync-Passwort ein, um Ihre Daten auf diesem Gerät zu öffnen.
      </p>
      <label className="field">
        {kind === 'passphrase' ? 'Sync-Passwort' : 'Wiederherstellungscode'}
        <input
          type={kind === 'passphrase' ? 'password' : 'text'}
          autoComplete={kind === 'passphrase' ? 'current-password' : 'off'}
          autoCapitalize="characters"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder={kind === 'recovery' ? 'XXXX-XXXX-XXXX-XXXX-XXXX-XXXX' : undefined}
          autoFocus
        />
      </label>
      <button
        className="btn ghost small"
        type="button"
        onClick={() => {
          setKind(kind === 'passphrase' ? 'recovery' : 'passphrase')
          setSecret('')
        }}
      >
        {kind === 'passphrase' ? 'Passwort vergessen? Mit Wiederherstellungscode öffnen' : 'Doch mit Sync-Passwort öffnen'}
      </button>

      {local && (
        <fieldset className="choice">
          <legend>Auf diesem Gerät gibt es schon Einträge</legend>
          <label>
            <input type="radio" name="merge" checked={!replace} onChange={() => setReplace(false)} />
            <span>
              Mit dem Konto zusammenführen <small>empfohlen, nichts geht verloren</small>
            </span>
          </label>
          <label>
            <input type="radio" name="merge" checked={replace} onChange={() => setReplace(true)} />
            <span>
              Durch die Daten aus dem Konto ersetzen <small>Einträge dieses Geräts werden entfernt</small>
            </span>
          </label>
          <button className="btn small" type="button" onClick={() => exportJSON()}>
            Vorher Backup dieses Geräts speichern
          </button>
        </fieldset>
      )}

      <button className="btn primary full" type="submit" disabled={busy || !secret}>
        {busy ? 'Wird geöffnet …' : 'Öffnen und abgleichen'}
      </button>
      <button className="btn ghost full" type="button" disabled={busy} onClick={() => void run(() => signOut(false))}>
        Abbrechen und abmelden
      </button>
    </form>
  )
}

function Ready({ busy, run }: Props) {
  const a = useAccount()
  const [confirm, setConfirm] = useState<'signout' | 'delete' | null>(null)
  const [typed, setTyped] = useState('')

  return (
    <div>
      <div className="sync-status">
        <span className={`sync-dot${a.error ? ' err' : a.syncing ? ' busy' : ''}`} aria-hidden="true" />
        <span>
          <b>{a.email ?? 'Angemeldet'}</b>
          <small>{a.syncing ? 'Wird abgeglichen …' : `Zuletzt abgeglichen ${time(a.lastSyncAt)}`}</small>
        </span>
      </div>
      <p className="hint">Ihre Einträge werden verschlüsselt gesichert und auf Ihren Geräten automatisch abgeglichen.</p>
      <div className="stack">
        <button className="btn" disabled={a.syncing} onClick={() => void syncNow()}>
          Jetzt abgleichen
        </button>

        {confirm !== 'signout' ? (
          <button className="btn" onClick={() => setConfirm('signout')}>
            Abmelden …
          </button>
        ) : (
          <div className="confirm">
            <span>Sollen die Daten auf diesem Gerät bleiben? Auf geteilten Geräten besser entfernen.</span>
            <button className="btn" disabled={busy} onClick={() => void run(() => signOut(false))}>
              Abmelden, Daten behalten
            </button>
            <button className="btn danger" disabled={busy} onClick={() => void run(() => signOut(true))}>
              Abmelden und vom Gerät entfernen
            </button>
            <button className="btn ghost" onClick={() => setConfirm(null)}>
              Abbrechen
            </button>
          </div>
        )}

        {confirm !== 'delete' ? (
          <button className="btn danger" onClick={() => setConfirm('delete')}>
            Konto löschen …
          </button>
        ) : (
          <div className="confirm">
            <span>
              Löscht Ihr Konto und alle gesicherten Daten auf dem Server sofort und endgültig. Die Einträge auf diesem Gerät bleiben erhalten. Zum Bestätigen tippen Sie <b>LÖSCHEN</b>.
            </span>
            <input type="text" value={typed} onChange={(e) => setTyped(e.target.value)} aria-label="Zum Bestätigen LÖSCHEN eingeben" />
            <button className="btn danger" disabled={busy || typed.trim().toUpperCase() !== 'LÖSCHEN'} onClick={() => void run(() => deleteAccount())}>
              Konto endgültig löschen
            </button>
            <button
              className="btn ghost"
              onClick={() => {
                setConfirm(null)
                setTyped('')
              }}
            >
              Abbrechen
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
