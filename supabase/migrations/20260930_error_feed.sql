-- The feed behind the `error-feed` edge function (RSS by Zapier → Gmail).
-- Zapier has no Supabase trigger, so error_alerts is read over RSS instead.
--
-- The token lives in a schema the API does not expose; the function is the
-- only way in, and only the service role (the edge function) may call it.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.settings (
  key   text primary key,
  value text not null
);

insert into private.settings (key, value)
values ('error_feed_token', encode(extensions.gen_random_bytes(24), 'hex'))
on conflict (key) do nothing;

create or replace function public.error_alerts_feed(p_token text)
returns setof public.error_alerts
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if p_token is null or p_token <> (
    select value from private.settings where key = 'error_feed_token'
  ) then
    raise exception 'forbidden';
  end if;
  return query
    select * from public.error_alerts
    order by id desc
    limit 50;
end;
$$;

revoke all on function public.error_alerts_feed(text) from public, anon, authenticated;
grant execute on function public.error_alerts_feed(text) to service_role;
