-- Alerts for app_errors, delivered by Zapier.
--
-- app_errors only helps if someone looks at it. This turns it into two kinds
-- of message, written as rows a Zapier "Supabase → New Row" trigger picks up
-- and forwards by email (free plan, polls every 15 minutes):
--
-- - 'new'    — the first time an error shows up from a real person, and again
--              only if it keeps happening after an hour of quiet. Crawlers are
--              skipped: Googlebot alone filled the table the first week.
-- - 'digest' — Monday morning, the week in one message, including "all clear".
--
-- All the deciding happens here, so the Zap is two dumb steps and changing
-- what counts as worth an alert never means touching Zapier.

create table if not exists public.error_alerts (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  kind       text not null check (kind in ('new', 'digest')),
  -- The error this alert is about; null for a digest. Used for the one-hour
  -- quiet window, not shown.
  message    text,
  subject    text not null,
  body       text not null
);

create index if not exists error_alerts_message_idx
  on public.error_alerts (message, created_at desc);

-- No policies: clients can neither read nor write this. Zapier reads it with
-- the service role key.
alter table public.error_alerts enable row level security;

create or replace function public.is_bot_user_agent(ua text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(ua, '') ~* '(bot|crawler|spider|GoogleOther|externalagent|Lighthouse|HeadlessChrome)';
$$;

create or replace function public.queue_error_alert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  hits  int;
  users int;
begin
  if public.is_bot_user_agent(new.user_agent) then
    return new;
  end if;

  -- Already alerted within the hour: same bug, not news.
  if exists (
    select 1 from public.error_alerts
    where kind = 'new' and message = new.message
      and created_at > now() - interval '1 hour'
  ) then
    return new;
  end if;

  select count(*), count(distinct user_id)
    into hits, users
  from public.app_errors
  where message = new.message
    and created_at > now() - interval '7 days'
    and not public.is_bot_user_agent(user_agent);

  insert into public.error_alerts (kind, message, subject, body)
  values (
    'new',
    new.message,
    '🔴 Sliabh error: ' || left(new.message, 80),
    concat_ws(E'\n',
      'Error:   ' || new.message,
      'Page:    ' || coalesce(new.route, '(unknown)'),
      'Device:  ' || coalesce(left(new.user_agent, 120), '(unknown)'),
      'Online:  ' || coalesce(new.online::text, 'unknown'),
      'Signed in: ' || case when new.user_id is null then 'no' else 'yes' end,
      'Kind:    ' || new.kind,
      '',
      'Last 7 days: ' || hits || ' time(s), ' || users || ' signed-in user(s).',
      '',
      'Stack (top):',
      coalesce(left(new.stack, 800), '(none)')
    )
  );
  return new;
exception when others then
  -- An alert is never worth losing the error report itself.
  return new;
end;
$$;

drop trigger if exists app_errors_alert on public.app_errors;
create trigger app_errors_alert
  after insert on public.app_errors
  for each row execute function public.queue_error_alert();

create or replace function public.queue_error_digest()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  total int;
  lines text;
begin
  select count(*) into total
  from public.app_errors
  where created_at > now() - interval '7 days'
    and not public.is_bot_user_agent(user_agent);

  select string_agg(
           format('• %s×  %s  (%s)', veces, left(message, 100), coalesce(pages, '-')),
           E'\n' order by veces desc)
    into lines
  from (
    select message, count(*) as veces,
           string_agg(distinct route, ', ') as pages
    from public.app_errors
    where created_at > now() - interval '7 days'
      and not public.is_bot_user_agent(user_agent)
    group by message
    order by count(*) desc
    limit 5
  ) top;

  insert into public.error_alerts (kind, subject, body)
  values (
    'digest',
    case when total = 0 then '🟢 Sliabh weekly: no errors'
         else '🟡 Sliabh weekly: ' || total || ' error(s) from real users' end,
    case when total = 0 then 'No real user hit an error in the last 7 days.'
         else 'Top errors, last 7 days:' || E'\n\n' || lines end
  );
end;
$$;

-- Old alert rows are only a delivery queue.
create or replace function public.prune_error_alerts()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.error_alerts where created_at < now() - interval '30 days';
$$;

revoke all on function public.queue_error_alert() from public, anon, authenticated;
revoke all on function public.queue_error_digest() from public, anon, authenticated;
revoke all on function public.prune_error_alerts() from public, anon, authenticated;

create extension if not exists pg_cron;

-- Monday 10:52 UTC = 07:52 in Argentina.
select cron.schedule('error-digest-weekly', '52 10 * * 1', 'select public.queue_error_digest()');
select cron.schedule('error-alerts-prune', '7 4 * * *', 'select public.prune_error_alerts()');
