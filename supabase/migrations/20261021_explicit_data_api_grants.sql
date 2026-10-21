-- Permisos explícitos de la Data API (supabase-js / PostgREST / GraphQL).
--
-- Desde el 30/10/2026 Supabase deja de dar acceso automático a las tablas
-- nuevas de `public`: cada una necesita su GRANT. Hasta hoy el valor por
-- defecto le daba a anon y authenticated TODO (incluidos TRUNCATE, TRIGGER y
-- REFERENCES) en todas las tablas, y la única barrera eran las políticas RLS.
--
-- Esta migración:
--   1. Reduce cada tabla existente a lo que la app realmente usa (mínimo
--      privilegio). Las políticas RLS siguen decidiendo qué FILAS ve cada uno.
--   2. Cierra el default para tablas futuras: una tabla nueva nace sin acceso
--      hasta que su migración incluya los GRANT (ver plantilla al final).
--
-- service_role no se toca: las Edge Functions (delete-account, mp-webhook,
-- create-guide-checkout, send-sponsor-kit) lo usan y se saltea RLS.

-- 1. Mínimo privilegio ----------------------------------------------------

revoke all on all tables in schema public from anon, authenticated;

-- Escritura pública sin lectura (formularios y reporte de errores)
grant insert on public.app_errors            to anon, authenticated;
grant insert on public.newsletter_subscribers to anon, authenticated;
grant insert on public.poll_leads            to anon, authenticated;
grant insert on public.sponsor_leads         to anon, authenticated;

-- Lectura pública (las políticas filtran las filas)
grant select on public.guides                to anon, authenticated;
grant select on public.profiles              to anon, authenticated;
grant select on public.trail_contributions   to anon, authenticated;
grant select on public.trail_reports         to anon, authenticated;
grant select on public.trail_tracks          to anon, authenticated;
grant select on public.saved_plans           to anon, authenticated;

-- Usuarios con sesión
grant insert, update                          on public.profiles            to authenticated;
grant insert                                  on public.trail_contributions to authenticated;
grant insert                                  on public.trail_reports       to authenticated;
grant insert, update, delete                  on public.trail_tracks        to authenticated;
grant insert, update, delete                  on public.saved_plans         to authenticated;
grant select, insert, update, delete          on public.user_downloaded_packs to authenticated;

-- error_alerts: solo la lee/escribe el backend (service_role). Sin grants.

-- 2. Tablas futuras -------------------------------------------------------

alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;

-- Plantilla para una tabla nueva:
--   create table public.mi_tabla (...);
--   alter table public.mi_tabla enable row level security;
--   grant select on public.mi_tabla to anon;                 -- si es pública
--   grant select, insert, update, delete on public.mi_tabla to authenticated;
--   grant all on public.mi_tabla to service_role;
--   create policy ... on public.mi_tabla ...;                -- RLS decide las filas
