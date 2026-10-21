-- poll_votes nunca se había creado en producción: el widget de encuesta
-- (submitPollVote / fetchPollResults en src/services/supabase.ts) fallaba sin
-- avisar. Definición tomada de supabase/schema.sql, con GRANT explícitos.
create table if not exists public.poll_votes (
  id         uuid primary key default gen_random_uuid(),
  poll_id    text not null,
  option_id  text not null,
  voter_key  text not null,
  created_at timestamptz not null default now(),
  unique (poll_id, voter_key)
);

alter table public.poll_votes enable row level security;

create policy "Anyone can vote"
  on public.poll_votes for insert
  with check (
    length(poll_id) between 1 and 100
    and length(option_id) between 1 and 100
    and length(voter_key) between 8 and 100
  );

create policy "Results are public"
  on public.poll_votes for select
  using (true);

create index if not exists poll_votes_poll_idx on public.poll_votes (poll_id);

grant select, insert on public.poll_votes to anon, authenticated;
grant all on public.poll_votes to service_role;
