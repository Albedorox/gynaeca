-- Gynaeca: Schema für Nutzerkonto und verschlüsselten Sync (angewendet am 22.11.2026)
--
-- Grundsatz: Der Server speichert nur verschlüsselte Datensätze. Alle Gesundheitsdaten
-- werden im Browser mit AES-256-GCM verschlüsselt, bevor sie gesendet werden.
-- Datensatz-Namen (z. B. das Datum eines Tages) sind per HMAC verschleiert.
-- Konzept: siehe docs/sync/README.md

-- ---------------------------------------------------------------------------
-- 1. Schlüsselbund: der verpackte Hauptschlüssel je Nutzerin
-- ---------------------------------------------------------------------------
create table public.key_bundles (
  user_id        uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  format         smallint not null default 1,
  -- Verpackung mit dem Sync-Passwort (Argon2id)
  kdf            text not null default 'argon2id' check (kdf in ('argon2id', 'pbkdf2-sha256')),
  kdf_params     jsonb not null,                 -- z. B. {"m": 65536, "t": 3, "p": 1}
  salt           text not null,                  -- base64
  wrapped_key    text not null,                  -- base64(iv || AES-GCM(Hauptschlüssel))
  -- Zweite Verpackung mit dem Wiederherstellungscode
  recovery_salt  text,
  recovery_wrapped_key text,
  key_version    smallint not null default 1,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  check (octet_length(wrapped_key) <= 512),
  check (recovery_wrapped_key is null or octet_length(recovery_wrapped_key) <= 512)
);

comment on table public.key_bundles is
  'Verpackter Hauptschlüssel. Ohne Sync-Passwort oder Wiederherstellungscode wertlos.';

-- ---------------------------------------------------------------------------
-- 2. Datensätze: ein verschlüsselter Eintrag je Tag, Verlauf oder Einstellungen
-- ---------------------------------------------------------------------------
create sequence public.records_seq;

create table public.records (
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  collection  text not null check (collection in ('day', 'course', 'settings')),
  record_key  text not null check (length(record_key) between 16 and 64),  -- base64url(HMAC)
  version     bigint not null default 1,         -- steigt bei jeder Änderung (Konfliktprüfung)
  seq         bigint not null,                   -- Abholreihenfolge, setzt der Trigger
  deleted     boolean not null default false,    -- Löschmarke (Tombstone)
  payload     text,                              -- base64(iv || AES-GCM(JSON)), null wenn gelöscht
  key_version smallint not null default 1,
  device_id   uuid,                              -- welches Gerät zuletzt geschrieben hat (Fehlersuche)
  updated_at  timestamptz not null default now(),
  primary key (user_id, collection, record_key),
  check (deleted or payload is not null),
  check (payload is null or octet_length(payload) <= 65536)
);

create index records_user_seq on public.records (user_id, seq);

comment on table public.records is
  'Verschlüsselte Datensätze. Der Server kann Inhalte und Datumsangaben nicht lesen.';

-- Version, Reihenfolge und Zeitstempel setzt immer der Server.
create or replace function public.records_bump()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.seq := nextval('public.records_seq');
  new.updated_at := now();
  if tg_op = 'UPDATE' then
    new.version    := old.version + 1;
    new.user_id    := old.user_id;      -- Zeilen können nicht umgehängt werden
    new.collection := old.collection;
    new.record_key := old.record_key;
  else
    new.version := 1;
  end if;
  if new.deleted then
    new.payload := null;
  end if;
  return new;
end;
$$;

create trigger records_bump
  before insert or update on public.records
  for each row execute function public.records_bump();

create or replace function public.key_bundles_touch()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.user_id := old.user_id;
  return new;
end;
$$;

create trigger key_bundles_touch
  before update on public.key_bundles
  for each row execute function public.key_bundles_touch();

-- ---------------------------------------------------------------------------
-- 3. Einwilligungen (Nachweis nach DSGVO Art. 7 Abs. 1, Art. 9 Abs. 2 lit. a)
-- ---------------------------------------------------------------------------
create table public.consents (
  id         bigint generated always as identity primary key,
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind       text not null check (kind in ('sync_health_data', 'privacy_policy')),
  version    text not null check (length(version) <= 32),
  granted    boolean not null,                   -- false = Widerruf
  created_at timestamptz not null default now()
);

create index consents_user on public.consents (user_id, kind, created_at desc);

-- ---------------------------------------------------------------------------
-- 4. Row Level Security: jede Nutzerin sieht und ändert nur ihre eigenen Zeilen
-- ---------------------------------------------------------------------------
alter table public.key_bundles enable row level security;
alter table public.records     enable row level security;
alter table public.consents    enable row level security;

-- Gäste (anon) bekommen gar nichts
revoke all on public.key_bundles, public.records, public.consents from anon;
revoke all on sequence public.records_seq from anon;

create policy key_bundles_select on public.key_bundles
  for select to authenticated using ((select auth.uid()) = user_id);
create policy key_bundles_insert on public.key_bundles
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy key_bundles_update on public.key_bundles
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
-- Kein Delete: der Schlüsselbund verschwindet nur mit dem Konto.

create policy records_select on public.records
  for select to authenticated using ((select auth.uid()) = user_id);
create policy records_insert on public.records
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy records_update on public.records
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy records_delete on public.records
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Einwilligungen: nur lesen und neu eintragen, nie ändern (Nachweis bleibt unverfälscht)
create policy consents_select on public.consents
  for select to authenticated using ((select auth.uid()) = user_id);
create policy consents_insert on public.consents
  for insert to authenticated with check ((select auth.uid()) = user_id);

grant select, insert, update on public.key_bundles to authenticated;
grant select, insert, update, delete on public.records to authenticated;
grant select, insert on public.consents to authenticated;
grant usage on sequence public.records_seq to authenticated;

-- ---------------------------------------------------------------------------
-- 5. Senden mit Konfliktprüfung
-- ---------------------------------------------------------------------------
-- items: [{"collection":"day","record_key":"…","base_version":3,"deleted":false,
--          "payload":"…","key_version":1,"device_id":"…"}, …]
-- base_version = Version, auf der die lokale Änderung beruht (0 = neu).
-- Antwort je Eintrag: {"record_key","collection","status":"ok"|"conflict","version","seq"}
-- bei "conflict" zusätzlich der aktuelle Serverstand ("deleted","payload").
create or replace function public.push_records(items jsonb)
returns jsonb
language plpgsql
security invoker            -- RLS gilt auch hier
set search_path = ''
as $$
declare
  uid  uuid := auth.uid();
  it   jsonb;
  cur  public.records%rowtype;
  res  public.records%rowtype;
  base bigint;
  acc  jsonb := '[]'::jsonb;
begin
  if uid is null then
    raise exception 'nicht angemeldet' using errcode = '28000';
  end if;
  if jsonb_typeof(items) <> 'array' or jsonb_array_length(items) > 200 then
    raise exception 'items muss ein Array mit höchstens 200 Einträgen sein' using errcode = '22023';
  end if;

  -- Schreibvorgänge einer Nutzerin nacheinander: seq-Reihenfolge = Commit-Reihenfolge,
  -- so überspringt das Abholen nie einen Datensatz.
  perform pg_advisory_xact_lock(hashtextextended(uid::text, 0));

  for it in select value from jsonb_array_elements(items) loop
    base := coalesce((it ->> 'base_version')::bigint, 0);

    select * into cur from public.records r
     where r.user_id = uid
       and r.collection = it ->> 'collection'
       and r.record_key = it ->> 'record_key'
     for update;

    if found and cur.version <> base then
      acc := acc || jsonb_build_object(
        'collection', cur.collection, 'record_key', cur.record_key, 'status', 'conflict',
        'version', cur.version, 'seq', cur.seq, 'deleted', cur.deleted, 'payload', cur.payload);
      continue;
    end if;

    if found then
      update public.records r
         set deleted     = coalesce((it ->> 'deleted')::boolean, false),
             payload     = it ->> 'payload',
             key_version = coalesce((it ->> 'key_version')::smallint, 1),
             device_id   = (it ->> 'device_id')::uuid
       where r.user_id = uid and r.collection = cur.collection and r.record_key = cur.record_key
      returning * into res;
    else
      insert into public.records (user_id, collection, record_key, deleted, payload, key_version, device_id)
      values (uid, it ->> 'collection', it ->> 'record_key',
              coalesce((it ->> 'deleted')::boolean, false), it ->> 'payload',
              coalesce((it ->> 'key_version')::smallint, 1), (it ->> 'device_id')::uuid)
      returning * into res;
    end if;

    acc := acc || jsonb_build_object(
      'collection', res.collection, 'record_key', res.record_key, 'status', 'ok',
      'version', res.version, 'seq', res.seq);
  end loop;

  return acc;
end;
$$;

revoke all on function public.push_records(jsonb) from public, anon;
grant execute on function public.push_records(jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- 6. Konto löschen (DSGVO Art. 17): entfernt das Konto, alle Daten folgen per Cascade
-- ---------------------------------------------------------------------------
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'nicht angemeldet' using errcode = '28000';
  end if;
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
