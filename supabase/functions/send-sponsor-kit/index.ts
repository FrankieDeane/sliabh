// Supabase Edge Function — emails the sponsorship PDF (public/sliabh-sponsorship.pdf)
// to whoever just submitted the "Sumate como sponsor" form. Deployed name:
// `send-sponsor-kit`.
//
// Security: this endpoint takes no auth (sponsor form submitters aren't
// signed in), so it must not become an open "send this PDF to anyone"
// relay. It never trusts a name/email from the request body directly —
// instead it looks up the most recent matching row in `sponsor_leads`
// (service role, bypassing RLS) created in the last 15 minutes, and only
// sends if one exists. That ties every send to a real form submission
// that just happened, not an arbitrary address.
//
// Required secrets (already set for send-account-email, shared at the
// project level — nothing new to configure):
//   RESEND_API_KEY, EMAIL_FROM, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// (SUPABASE_SERVICE_ROLE_KEY is provided automatically by Supabase, like
// SUPABASE_URL/SUPABASE_ANON_KEY.)

import { createClient } from 'jsr:@supabase/supabase-js@2';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') ?? 'Sliabh <onboarding@resend.dev>';
const PDF_URL = 'https://sliabh.com.ar/sliabh-sponsorship.pdf';
const LOOKUP_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

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

function sponsorKitHtml(name: string): { subject: string; html: string } {
  return {
    subject: 'Sliabh — Oportunidades de sponsoreo · Sponsorship opportunities',
    html: shell(`
      <h1 style="${H1}">¡Gracias por tu interés, ${name}! 🙌</h1>
      <p style="${P}">Recibimos tu propuesta y te respondemos por email en los próximos días. Mientras tanto, te dejamos adjunta la presentación con lo que ofrecemos hoy: espacios en el sitio y newsletter esponsoreado. El costo se conversa y se personaliza para cada sponsor.</p>
      <div style="text-align:center;margin:8px 0 24px;"><a href="https://sliabh.com.ar" style="${BTN}">Ver Sliabh</a></div>
      <div style="${HR}"></div>
      <h1 style="${H1}">Thanks for your interest, ${name}! 🙌</h1>
      <p style="${P}">We received your proposal and will get back to you by email within a few days. In the meantime, attached is our sponsorship presentation — on-site placements and sponsored newsletter. Cost is discussed and customized for each sponsor.</p>
      <div style="text-align:center;"><a href="https://sliabh.com.ar" style="${BTN}">Visit Sliabh</a></div>
    `),
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { email } = await req.json().catch(() => ({ email: '' }));
    if (!email || typeof email !== 'string') {
      return json({ error: 'email requerido' }, 400);
    }

    if (!RESEND_API_KEY) {
      return json({ error: 'RESEND_API_KEY no configurada' }, 500);
    }

    // Service-role client — sponsor_leads has no public select policy, so
    // this lookup can only happen server-side.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const since = new Date(Date.now() - LOOKUP_WINDOW_MS).toISOString();
    const { data: lead, error: leadErr } = await supabase
      .from('sponsor_leads')
      .select('full_name, email, created_at')
      .eq('email', email)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (leadErr || !lead) {
      // No matching recent submission — do not send. Not an error the
      // caller needs to see (the form already told the user it worked);
      // just no-op so this can't be used to spam arbitrary addresses.
      return json({ ok: false, reason: 'no_recent_lead' });
    }

    const pdfRes = await fetch(PDF_URL);
    if (!pdfRes.ok) {
      return json({ error: 'No se pudo obtener el PDF' }, 502);
    }
    const pdfBuf = new Uint8Array(await pdfRes.arrayBuffer());
    let binary = '';
    for (let i = 0; i < pdfBuf.length; i++) binary += String.fromCharCode(pdfBuf[i]);
    const pdfB64 = btoa(binary);

    const name = lead.full_name?.trim() || 'sponsor';
    const { subject, html } = sponsorKitHtml(name);

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: lead.email,
        subject,
        html,
        attachments: [
          { filename: 'Sliabh - Sponsorship.pdf', content: pdfB64 },
        ],
      }),
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
