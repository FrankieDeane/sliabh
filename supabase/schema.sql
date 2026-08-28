-- Sliabh — Supabase schema for community & contributions.
-- Run this in your Supabase project (SQL Editor) once.
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE where possible.

-- ──────────────────────────────────────────────────────────────────────────
-- profiles: one row per auth user (display name shown on contributions)
-- ──────────────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone"
  on public.profiles for select using (true);

drop policy if exists "Users manage their own profile" on public.profiles;
create policy "Users manage their own profile"
  on public.profiles for all
  using (auth.uid() = id) with check (auth.uid() = id);

-- Auto-create/update the profiles row when an auth user is confirmed, so
-- profile creation doesn't depend on the client-side upsertProfile() call
-- succeeding (see upsertProfile in src/services/supabase.ts — it's
-- best-effort and swallows failures so it never blocks login).
create or replace function public.handle_confirmed_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email_confirmed_at is not null then
    insert into public.profiles (id, display_name, updated_at)
    values (new.id, nullif(trim(new.raw_user_meta_data->>'display_name'), ''), now())
    on conflict (id) do update
      set display_name = coalesce(excluded.display_name, public.profiles.display_name),
          updated_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_confirmed on auth.users;
create trigger on_auth_user_confirmed
  after insert or update of email_confirmed_at on auth.users
  for each row execute function public.handle_confirmed_user();

-- ──────────────────────────────────────────────────────────────────────────
-- trail_contributions: new routes, POIs, edits, alerts, notes (moderated)
-- ──────────────────────────────────────────────────────────────────────────
create table if not exists public.trail_contributions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  type        text not null check (type in ('nueva_ruta','edicion_ruta','punto_interes','alerta','nota')),
  title       text not null,
  description text not null default '',
  lat         double precision,
  lon         double precision,
  status      text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at  timestamptz not null default now()
);

alter table public.trail_contributions enable row level security;

drop policy if exists "Approved contributions are public" on public.trail_contributions;
create policy "Approved contributions are public"
  on public.trail_contributions for select
  using (status = 'approved' or auth.uid() = user_id);

drop policy if exists "Users insert their own contributions" on public.trail_contributions;
create policy "Users insert their own contributions"
  on public.trail_contributions for insert
  -- status must start at 'pending': clients cannot self-approve by sending
  -- status='approved' in the insert payload.
  with check (auth.uid() = user_id and status = 'pending');

create index if not exists trail_contributions_user_idx on public.trail_contributions (user_id);
create index if not exists trail_contributions_status_idx on public.trail_contributions (status);

-- ──────────────────────────────────────────────────────────────────────────
-- trail_reports: live condition reports per trail (snow, flooded river, etc.)
-- ──────────────────────────────────────────────────────────────────────────
create table if not exists public.trail_reports (
  id          uuid primary key default gen_random_uuid(),
  trail_id    text not null,
  user_id     uuid not null references auth.users (id) on delete cascade,
  condition   text not null check (condition in ('ok','nieve','rio_crecido','cerrado','huella_perdida','barro','otro')),
  note        text not null default '',
  created_at  timestamptz not null default now(),
  -- condition reports are perishable; default useful window ~ 21 days
  expires_at  timestamptz not null default (now() + interval '21 days')
);

alter table public.trail_reports enable row level security;

drop policy if exists "Recent reports are public" on public.trail_reports;
create policy "Recent reports are public"
  on public.trail_reports for select
  using (expires_at > now());

drop policy if exists "Users insert their own reports" on public.trail_reports;
create policy "Users insert their own reports"
  on public.trail_reports for insert
  with check (auth.uid() = user_id);

create index if not exists trail_reports_trail_idx on public.trail_reports (trail_id, created_at desc);

-- ──────────────────────────────────────────────────────────────────────────
-- trail_tracks: GPS track recorded during "Modo Caminata" (Hike Mode).
-- Saved automatically for every signed-in user when a hike is stopped —
-- not opt-in. Anonymous (not logged-in) hikes are never persisted here.
-- ──────────────────────────────────────────────────────────────────────────
create table if not exists public.trail_tracks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  trail_id    text not null,
  points      jsonb not null, -- array of {lat, lon, t} (t = ms epoch)
  distance_km double precision not null default 0,
  duration_s  integer not null default 0,
  started_at  timestamptz not null,
  created_at  timestamptz not null default now()
);

alter table public.trail_tracks enable row level security;

drop policy if exists "Users view their own tracks" on public.trail_tracks;
create policy "Users view their own tracks"
  on public.trail_tracks for select
  using (auth.uid() = user_id);

drop policy if exists "Users insert their own tracks" on public.trail_tracks;
create policy "Users insert their own tracks"
  on public.trail_tracks for insert
  with check (auth.uid() = user_id);

create index if not exists trail_tracks_user_idx on public.trail_tracks (user_id);
create index if not exists trail_tracks_trail_idx on public.trail_tracks (trail_id, created_at desc);
