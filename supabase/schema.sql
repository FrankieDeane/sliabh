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

-- ──────────────────────────────────────────────────────────────────────────
-- poll_votes: lightweight anonymous "quick poll" widget shown to web visitors.
-- No auth required to vote — one vote per browser, enforced by a client-
-- generated voter_key (localStorage) plus the unique(poll_id, voter_key)
-- constraint below.
-- ──────────────────────────────────────────────────────────────────────────
create table if not exists public.poll_votes (
  id         uuid primary key default gen_random_uuid(),
  poll_id    text not null,
  option_id  text not null,
  voter_key  text not null,
  created_at timestamptz not null default now(),
  unique (poll_id, voter_key)
);

alter table public.poll_votes enable row level security;

drop policy if exists "Anyone can vote" on public.poll_votes;
create policy "Anyone can vote"
  on public.poll_votes for insert
  with check (
    length(poll_id) between 1 and 100
    and length(option_id) between 1 and 100
    and length(voter_key) between 8 and 100
  );

-- Only poll_id/option_id are ever read (to render result percentages); voter_key
-- is never selected by the app, but RLS can't restrict columns, only rows, so
-- results stay intentionally free of anything more identifying than that string.
drop policy if exists "Results are public" on public.poll_votes;
create policy "Results are public"
  on public.poll_votes for select
  using (true);

create index if not exists poll_votes_poll_idx on public.poll_votes (poll_id);

-- ──────────────────────────────────────────────────────────────────────────
-- poll_leads: name/last name/email captured alongside a poll_votes vote.
-- Kept as a SEPARATE table from poll_votes (which stays anonymous and
-- publicly readable for the results bar chart) because this one holds PII —
-- it must never be publicly selectable via the anon key. No select policy is
-- defined below, so RLS blocks all reads for anon/authenticated roles; only
-- the project owner (Supabase Dashboard / service role) can read it.
-- ──────────────────────────────────────────────────────────────────────────
create table if not exists public.poll_leads (
  id          uuid primary key default gen_random_uuid(),
  poll_id     text not null,
  option_id   text not null,
  voter_key   text not null,
  first_name  text not null,
  last_name   text not null,
  email       text not null,
  created_at  timestamptz not null default now()
);

alter table public.poll_leads enable row level security;

drop policy if exists "Anyone can submit their info" on public.poll_leads;
create policy "Anyone can submit their info"
  on public.poll_leads for insert
  with check (
    length(poll_id) between 1 and 100
    and length(option_id) between 1 and 100
    and length(voter_key) between 8 and 100
    and length(first_name) between 1 and 100
    and length(last_name) between 1 and 100
    and email like '%_@_%.__%' and length(email) between 5 and 200
  );

-- Deliberately no select policy: PII stays unreadable via the public anon key.

create index if not exists poll_leads_poll_idx on public.poll_leads (poll_id, created_at desc);

-- ──────────────────────────────────────────────────────────────────────────
-- sponsor_leads: inquiries submitted from the "Sobre nosotros / Sponsors"
-- section. Same privacy shape as poll_leads (holds PII: name, email, phone) —
-- no public select policy, only readable from the Supabase dashboard.
-- ──────────────────────────────────────────────────────────────────────────
create table if not exists public.sponsor_leads (
  id                uuid primary key default gen_random_uuid(),
  full_name         text not null,
  company_website   text not null,
  additional_link   text,
  email             text not null,
  phone             text,
  message           text,
  created_at        timestamptz not null default now()
);

alter table public.sponsor_leads enable row level security;

drop policy if exists "Anyone can submit a sponsor inquiry" on public.sponsor_leads;
create policy "Anyone can submit a sponsor inquiry"
  on public.sponsor_leads for insert
  with check (
    length(full_name) between 1 and 200
    and length(company_website) between 1 and 300
    and (additional_link is null or length(additional_link) <= 300)
    and email like '%_@_%.__%' and length(email) between 5 and 200
    and (phone is null or length(phone) <= 40)
    and (message is null or length(message) <= 4000)
  );

-- Deliberately no select policy: PII stays unreadable via the public anon key.

create index if not exists sponsor_leads_created_idx on public.sponsor_leads (created_at desc);

-- ──────────────────────────────────────────────────────────────────────────
-- newsletter_subscribers: email-only signups from the newsletter button.
-- Same privacy shape as poll_leads/sponsor_leads — no public select policy,
-- only readable from the Supabase dashboard. Unique on email so a repeat
-- signup is a harmless no-op (insert ... on conflict do nothing, handled
-- client-side by treating the unique_violation error as success).
-- ──────────────────────────────────────────────────────────────────────────
create table if not exists public.newsletter_subscribers (
  id          uuid primary key default gen_random_uuid(),
  email       text not null unique,
  lang        text,
  created_at  timestamptz not null default now()
);

alter table public.newsletter_subscribers enable row level security;

drop policy if exists "Anyone can subscribe" on public.newsletter_subscribers;
create policy "Anyone can subscribe"
  on public.newsletter_subscribers for insert
  with check (
    email like '%_@_%.__%' and length(email) between 5 and 200
    and (lang is null or lang in ('es', 'en'))
  );

-- Deliberately no select policy: emails stay unreadable via the public anon key.

create index if not exists newsletter_subscribers_created_idx on public.newsletter_subscribers (created_at desc);

-- ──────────────────────────────────────────────────────────────────────────
-- guides: public directory of mountain guides. Unlike the lead tables above,
-- this one IS publicly readable (that's the point — it's a directory), but
-- only rows an admin has approved. `status` gates the review queue and
-- `featured`/`verified` gate paid placement / manual credential checks —
-- both flags are admin-only, flipped from the Supabase dashboard (service
-- role bypasses RLS), never settable by the applicant. The insert policy
-- pins new rows to status='pending', featured=false, verified=false so an
-- applicant can't self-approve, self-feature or self-verify by sending a
-- crafted payload.
-- ──────────────────────────────────────────────────────────────────────────
create table if not exists public.guides (
  id             uuid primary key default gen_random_uuid(),
  full_name      text not null,
  email          text not null,
  phone          text,
  regions        text[] not null default '{}',
  specialties    text,
  certification  text,
  bio            text,
  instagram      text,
  website        text,
  status         text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  verified       boolean not null default false,
  featured       boolean not null default false,
  featured_until timestamptz,
  created_at     timestamptz not null default now()
);

alter table public.guides enable row level security;

drop policy if exists "Anyone can apply as a guide" on public.guides;
create policy "Anyone can apply as a guide"
  on public.guides for insert
  with check (
    status = 'pending' and verified = false and featured = false
    and length(full_name) between 1 and 200
    and email like '%_@_%.__%' and length(email) between 5 and 200
    and (phone is null or length(phone) <= 40)
    and array_length(regions, 1) between 1 and 20
    and (specialties is null or length(specialties) <= 500)
    and (certification is null or length(certification) <= 300)
    and (bio is null or length(bio) <= 2000)
    and (instagram is null or length(instagram) <= 300)
    and (website is null or length(website) <= 300)
  );

drop policy if exists "Approved guides are viewable by everyone" on public.guides;
create policy "Approved guides are viewable by everyone"
  on public.guides for select
  using (status = 'approved');

-- Deliberately no public update/delete policy: moderation (approve/reject,
-- toggle verified/featured) happens only from the Supabase dashboard
-- (service role), never via the anon key.

create index if not exists guides_status_idx on public.guides (status);
create index if not exists guides_featured_idx on public.guides (featured) where featured = true;
