-- Somewhere for a crash to land.
--
-- The app is live and there is no way to learn that it broke for anyone. The
-- three field bugs that mattered most were all found by one person walking to
-- the bathroom and back, then driving to a club. That does not scale, and on a
-- mountain there is nobody to notice.
--
-- This is deliberately a table and not a third-party service: the project
-- already has a database, the rows never leave it, and nothing new has to be
-- signed up for or paid. What it does not give is grouping, alerting or
-- release tracking — if the volume ever justifies those, the client writes
-- through one function and can be pointed elsewhere.
--
-- Nothing identifying is stored beyond the signed-in user's own id, and that
-- only when there is a session. No message body is ever written by this app
-- that contains a name, an email or a coordinate.

create table if not exists public.app_errors (
  id          uuid primary key default gen_random_uuid(),
  -- Null for a signed-out visitor: an anonymous crash is still worth having.
  user_id     uuid references auth.users(id) on delete set null,
  -- 'error' for a thrown exception, 'unhandled-rejection', 'render' for an
  -- error boundary, 'manual' for one the app reported on purpose.
  kind        text not null,
  message     text not null,
  stack       text,
  -- Where it happened and on what, which is what turns "it crashed" into a
  -- reproduction: the route, the user agent, whether the page was offline.
  route       text,
  user_agent  text,
  app_version text,
  online      boolean,
  created_at  timestamptz not null default now()
);

create index if not exists app_errors_created_at_idx on public.app_errors (created_at desc);
create index if not exists app_errors_message_idx on public.app_errors (message);

alter table public.app_errors enable row level security;

-- Anyone may report a crash, including a signed-out visitor: a crash on the
-- sign-in screen is exactly the one that never gets reported otherwise. The
-- insert is write-only — no policy grants select, update or delete, so a
-- client cannot read back what anyone else reported, and the rows are visible
-- only through the dashboard or the service role.
drop policy if exists "anyone can report an error" on public.app_errors;
create policy "anyone can report an error"
  on public.app_errors for insert
  with check (
    -- A row may be filed anonymously, or under your own id, never under
    -- someone else's.
    user_id is null or user_id = auth.uid()
  );
