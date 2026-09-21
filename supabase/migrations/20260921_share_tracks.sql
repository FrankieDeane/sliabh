-- ──────────────────────────────────────────────────────────────────────────
-- Sharing a recorded hike.
--
-- A track is private when it is recorded and stays that way until its owner
-- says otherwise. Making one public gives it a page anyone can open, inside
-- the app or from a link sent anywhere else. The link is the share token, not
-- the row id, so one public hike never exposes the id space: nobody can walk
-- from one link to another person's track.
--
-- Run against the project (SQL editor or `supabase db push`). It is safe to
-- run more than once.
-- ──────────────────────────────────────────────────────────────────────────

alter table public.trail_tracks
  add column if not exists visibility text not null default 'private',
  -- A 32-char hex id, distinct per row. Adding a column with a volatile
  -- default rewrites the table and evaluates it per row, so existing tracks
  -- each get their own token rather than sharing one.
  add column if not exists share_token text default replace(gen_random_uuid()::text, '-', ''),
  -- What the walker chose to call this hike, when they name it.
  add column if not exists title text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'trail_tracks_visibility_check'
  ) then
    alter table public.trail_tracks
      add constraint trail_tracks_visibility_check
      check (visibility in ('private', 'public'));
  end if;
end $$;

-- Backfill anything that predates the column, then make the token mandatory.
update public.trail_tracks
   set share_token = replace(gen_random_uuid()::text, '-', '')
 where share_token is null;

alter table public.trail_tracks alter column share_token set not null;

create unique index if not exists trail_tracks_share_token_idx
  on public.trail_tracks (share_token);

-- Anyone, signed in or not, may read a track its owner made public. The
-- owner-only policy already in place keeps every private track invisible.
drop policy if exists "Anyone can view public tracks" on public.trail_tracks;
create policy "Anyone can view public tracks"
  on public.trail_tracks for select
  using (visibility = 'public');

-- Owners need UPDATE to flip visibility or name a hike; there was no update
-- policy at all before, so every attempt was silently refused by RLS.
drop policy if exists "Users update their own tracks" on public.trail_tracks;
create policy "Users update their own tracks"
  on public.trail_tracks for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- And to remove one they never meant to keep.
drop policy if exists "Users delete their own tracks" on public.trail_tracks;
create policy "Users delete their own tracks"
  on public.trail_tracks for delete
  using (auth.uid() = user_id);
