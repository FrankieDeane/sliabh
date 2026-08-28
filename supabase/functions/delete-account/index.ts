// Supabase Edge Function — permanently deletes the authenticated user's
// account. Deployed name: `delete-account`.
//
// Flow: authenticate the caller, best-effort fire the "goodbye" email (via
// `send-account-email`, using the caller's own JWT — must happen before the
// account, and its JWT, are gone), then delete the auth user with the
// service-role client. All rows in profiles / trail_contributions /
// trail_reports / trail_tracks reference auth.users with `on delete cascade`,
// so they're removed automatically.
//
// Required secrets (set with `supabase secrets set` or in the dashboard):
//   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY — the first two
//   are provided automatically by Supabase; the service role key must be set
//   explicitly (Project Settings → API) since it's required for
//   `auth.admin.deleteUser`.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const asUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await asUser.auth.getUser();
    if (userErr || !user) {
      return json({ error: 'No autenticado' }, 401);
    }

    if (!SERVICE_ROLE_KEY) {
      return json({ error: 'SUPABASE_SERVICE_ROLE_KEY no configurada' }, 500);
    }

    // Best-effort goodbye email — fired while the caller's session is still
    // valid. A failure here must not block account deletion.
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/send-account-email`, {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          apikey: SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: 'goodbye' }),
      });
    } catch {
      // non-fatal
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { error: delErr } = await admin.auth.admin.deleteUser(user.id);
    if (delErr) {
      return json({ error: 'No se pudo eliminar la cuenta', detail: delErr.message }, 500);
    }
    return json({ ok: true });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
