// Supabase Edge Function — Mercado Pago payment webhook. Called by
// Mercado Pago itself (not by our frontend) whenever a payment's status
// changes. This is the ONLY place that ever sets guides.paid = true.
//
// Security: never trust the webhook body's own claims about payment
// status — Mercado Pago's documented best practice is to always re-fetch
// the payment from their API using our own secret Access Token before
// acting on it. A forged POST to this URL with a fake "approved" status
// can't activate anything, because we only believe what MP's API itself
// says when we ask it directly.
//
// No JWT verification (deployed with verify_jwt: false) — Mercado Pago
// can't send a Supabase auth token. That's fine: the re-fetch above is
// what actually authenticates the event, not the caller.
//
// Required secrets: MP_ACCESS_TOKEN, SUPABASE_URL,
// SUPABASE_SERVICE_ROLE_KEY (the latter two provided automatically).
// RESEND_API_KEY / EMAIL_FROM (shared with send-sponsor-kit) — used for a
// best-effort confirmation email; never blocks the payment confirmation.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN') ?? '';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') ?? '';
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') ?? 'Sliabh <onboarding@resend.dev>';
const SITE_URL = 'https://sliabh.com.ar';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

/** Extracts the MP payment id from either notification shape MP uses:
 *  the modern JSON webhook ({type:'payment', data:{id}}) or the legacy
 *  IPN query-string form (?topic=payment&id=123). */
async function extractPaymentId(req: Request): Promise<string | null> {
  const url = new URL(req.url);
  const qsId = url.searchParams.get('id') ?? url.searchParams.get('data.id');
  const topic = url.searchParams.get('topic') ?? url.searchParams.get('type');
  if (qsId && (!topic || topic === 'payment')) return qsId;

  if (req.method === 'POST') {
    try {
      const body = await req.json();
      if (body?.type === 'payment' && body?.data?.id) return String(body.data.id);
      if (body?.action?.startsWith('payment.') && body?.data?.id) return String(body.data.id);
    } catch {
      // no/invalid JSON body — fall through
    }
  }
  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  // Always ack quickly with 200 so Mercado Pago doesn't retry forever on
  // notifications that just don't apply to us (e.g. other topics).
  const paymentId = await extractPaymentId(req);
  if (!paymentId) return json({ ok: true, ignored: true });

  if (!MP_ACCESS_TOKEN) return json({ ok: false, error: 'MP_ACCESS_TOKEN no configurado' }, 500);

  // The authoritative source of truth: ask Mercado Pago directly, never
  // trust the notification payload itself.
  const payRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
  });
  if (!payRes.ok) return json({ ok: true, ignored: true, reason: 'payment_lookup_failed' });
  const payment = await payRes.json();

  if (payment.status !== 'approved') {
    return json({ ok: true, ignored: true, status: payment.status });
  }

  const guideId = payment.external_reference as string | undefined;
  if (!guideId) return json({ ok: true, ignored: true, reason: 'no_external_reference' });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  // `paid = false` guard makes this idempotent — Mercado Pago may send the
  // same "approved" notification more than once; the second one is a
  // harmless no-op instead of re-sending the confirmation email.
  const oneYearMs = 365 * 24 * 60 * 60 * 1000;
  const { data: updated, error: updateErr } = await supabase
    .from('guides')
    .update({
      paid: true,
      paid_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + oneYearMs).toISOString(),
      mp_payment_id: String(payment.id),
      amount_total: payment.transaction_amount,
      currency: payment.currency_id,
    })
    .eq('id', guideId)
    .eq('paid', false)
    .select('id, full_name, email, trail_ids')
    .maybeSingle();

  if (updateErr) return json({ ok: false, error: updateErr.message }, 500);
  if (!updated) return json({ ok: true, already_processed: true });

  // Best-effort confirmation email — never blocks the payment confirmation.
  if (RESEND_API_KEY) {
    sendConfirmationEmail(updated.email, updated.full_name, updated.trail_ids).catch(() => {});
  }

  return json({ ok: true });
});

async function sendConfirmationEmail(email: string, fullName: string, trailIds: string[]) {
  const html = `<div style="margin:0;padding:0;background:#070b14;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:480px;margin:0 auto;padding:32px 24px;">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="font-size:40px;line-height:1;">🏔️</div>
        <div style="color:#f0f9ff;font-size:22px;font-weight:800;letter-spacing:-0.5px;margin-top:8px;">Sliabh</div>
      </div>
      <div style="background:#0f1724;border:1px solid #1e2d42;border-radius:18px;padding:28px 24px;">
        <h1 style="color:#f0f9ff;font-size:20px;font-weight:800;margin:0 0 10px;">¡Listo, ${fullName}! Ya estás publicado 🎉</h1>
        <p style="color:#94a3b8;font-size:14px;line-height:22px;margin:0 0 16px;">
          Tu perfil de guía ya aparece en ${trailIds.length} sendero${trailIds.length > 1 ? 's' : ''} de Sliabh, activo por 1 año.
          Te vamos a avisar antes de que venza.
        </p>
        <div style="text-align:center;margin:8px 0 0;">
          <a href="${SITE_URL}/ruta/${trailIds[0]}" style="display:inline-block;background:#22c55e;color:#04110a;font-size:14px;font-weight:800;text-decoration:none;padding:12px 24px;border-radius:12px;">Ver mi publicación</a>
        </div>
      </div>
      <p style="color:#475569;font-size:11px;text-align:center;margin:24px 0 0;">Sliabh · Rutas y montaña de Argentina</p>
    </div>
  </div>`;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: EMAIL_FROM,
      to: email,
      subject: 'Sliabh — ¡Tu perfil de guía ya está publicado!',
      html,
    }),
  });
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
