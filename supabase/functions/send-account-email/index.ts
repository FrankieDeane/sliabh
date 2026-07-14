// Supabase Edge Function — sends transactional account emails (welcome / goodbye)
// through Resend. Deployed name: `send-account-email`.
//
// Security: the caller must be authenticated. The email is always sent to the
// *authenticated user's own* address, so the endpoint can't be used to spam
// arbitrary recipients.
//
// Required secrets (set with `supabase secrets set` or in the dashboard):
//   RESEND_API_KEY   — your Resend API key
//   EMAIL_FROM       — verified sender, e.g. "Sliabh <hola@tudominio.com>"
//   SUPABASE_URL, SUPABASE_ANON_KEY — provided automatically by Supabase.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') ?? 'Sliabh <onboarding@resend.dev>';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function welcomeHtml(name: string): { subject: string; html: string } {
  return {
    subject: '¡Bienvenido/a a Sliabh! · Welcome to Sliabh!',
    html: shell(`
      <h1 style="${H1}">¡Hola ${name}, bienvenido/a a Sliabh! 🎉</h1>
      <p style="${P}">Tu cuenta está lista. Explorá los 39 Parques Nacionales de Argentina, descargá mapas offline, planificá rutas y aportá a la comunidad de montañistas.</p>
      <div style="text-align:center;margin:8px 0 24px;"><a href="https://sliabh.netlify.app" style="${BTN}">Explorar Sliabh</a></div>
      <div style="${HR}"></div>
      <h1 style="${H1}">Hi ${name}, welcome to Sliabh! 🎉</h1>
      <p style="${P}">Your account is ready. Explore Argentina's 39 National Parks, download offline maps, plan routes and contribute to the hikers' community.</p>
      <div style="text-align:center;"><a href="https://sliabh.netlify.app" style="${BTN}">Explore Sliabh</a></div>
    `),
  };
}

function goodbyeHtml(name: string): { subject: string; html: string } {
  return {
    subject: 'Te vamos a extrañar · We\'ll miss you',
    html: shell(`
      <h1 style="${H1}">Te vamos a extrañar, ${name} 👋</h1>
      <p style="${P}">Tu cuenta fue dada de baja y tus datos se eliminaron. Gracias por haber sido parte de la comunidad de Sliabh. La montaña siempre te espera.</p>
      <div style="${HR}"></div>
      <h1 style="${H1}">We'll miss you, ${name} 👋</h1>
      <p style="${P}">Your account has been closed and your data deleted. Thank you for being part of the Sliabh community. The mountains will always be here.</p>
    `),
  };
}

// ── Inline styles + shell (email clients need inline CSS) ──────────────
const H1 = "color:#f0f9ff;font-size:20px;font-weight:800;margin:0 0 10px;";
const P = "color:#94a3b8;font-size:14px;line-height:22px;margin:0 0 16px;";
const BTN = "display:inline-block;background:#22c55e;color:#04110a;font-size:14px;font-weight:800;text-decoration:none;padding:12px 24px;border-radius:12px;";
const HR = "height:1px;background:#1e2d42;margin:0 0 24px;";

function shell(inner: string): string {
  return `<div style="margin:0;padding:0;background:#070b14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:480px;margin:0 auto;padding:32px 24px;">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:40px;line-height:1;">🏔️</div>
        <div style="color:#f0f9ff;font-size:22px;font-weight:800;letter-spacing:-0.5px;margin-top:8px;">Sliabh</div>
      </div>
      <div style="background:#0f1724;border:1px solid #1e2d42;border-radius:18px;padding:28px 24px;">${inner}</div>
      <p style="color:#475569;font-size:11px;text-align:center;margin:24px 0 0;">Sliabh · Rutas y montaña de Argentina / Argentina hiking &amp; mountains</p>
    </div>
  </div>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    // Authenticate the caller and resolve *their* email — never trust a
    // recipient from the request body.
    const authHeader = req.headers.get('Authorization') ?? '';
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user?.email) {
      return json({ error: 'No autenticado' }, 401);
    }

    const { type } = await req.json().catch(() => ({ type: '' }));
    if (type !== 'welcome' && type !== 'goodbye') {
      return json({ error: 'type debe ser "welcome" o "goodbye"' }, 400);
    }

    const name =
      (user.user_metadata?.display_name as string | undefined)?.trim() ||
      (type === 'goodbye' ? 'montañista' : 'montañista');
    const { subject, html } = type === 'welcome' ? welcomeHtml(name) : goodbyeHtml(name);

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: EMAIL_FROM, to: user.email, subject, html }),
    });
    if (!res.ok) {
      return json({ error: 'Resend rechazó el envío', detail: await res.text() }, 502);
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
