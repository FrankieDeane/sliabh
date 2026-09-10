// Supabase Edge Function — "apply as a guide" endpoint. Takes the
// application form data, computes the price server-side (never trusts a
// client-supplied amount), inserts the pending row, opens a Mercado Pago
// Checkout Pro preference for it, and returns the checkout URL for the
// browser to redirect to. The row only becomes public once mp-webhook
// confirms the payment — this function never marks anything as paid.
//
// This is the ONLY way rows get inserted into `public.guides`: the table
// has no public insert policy (see supabase/schema.sql), so every write
// goes through this service-role function, never directly from the browser.
//
// Required secrets:
//   MP_ACCESS_TOKEN            — Mercado Pago production Access Token
//                                (Developers panel → Tus integraciones →
//                                 Credenciales de producción)
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY — provided automatically
//   GUIDE_PRICE_ARS            — optional, price per trail per year in ARS.
//                                Defaults to 10000 (confirmed price) if not
//                                set. Change this any time from the
//                                Supabase dashboard (Project Settings →
//                                Edge Functions → Manage secrets) — no
//                                redeploy needed.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SITE_URL = 'https://sliabh.com.ar';
const DEFAULT_PRICE_ARS = 10000;
const PRICE_PER_TRAIL_ARS = Number(Deno.env.get('GUIDE_PRICE_ARS')) || DEFAULT_PRICE_ARS;
const MAX_TRAILS = 20;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface Body {
  fullName?: string;
  email?: string;
  phone?: string;
  photoUrl?: string;
  specialties?: string;
  certification?: string;
  bio?: string;
  instagram?: string;
  website?: string;
  trailIds?: string[];
  newsletterOptIn?: boolean;
}

function bad(msg: string) {
  return json({ error: msg }, 400);
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return bad('method not allowed');

  if (!MP_ACCESS_TOKEN) return json({ error: 'MP_ACCESS_TOKEN no configurado' }, 500);

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return bad('JSON inválido');
  }

  // ── Server-side validation — the client is never trusted ──────────────
  const fullName = (body.fullName ?? '').trim();
  const email = (body.email ?? '').trim();
  const phone = (body.phone ?? '').trim();
  const photoUrl = (body.photoUrl ?? '').trim();
  const specialties = (body.specialties ?? '').trim();
  const certification = (body.certification ?? '').trim();
  const bio = (body.bio ?? '').trim();
  const instagram = (body.instagram ?? '').trim();
  const website = (body.website ?? '').trim();
  const trailIds = Array.isArray(body.trailIds) ? [...new Set(body.trailIds.filter((x) => typeof x === 'string'))] : [];
  const newsletterOptIn = body.newsletterOptIn === true;

  if (!fullName || fullName.length > 200) return bad('Nombre inválido');
  if (!EMAIL_RE.test(email) || email.length > 200) return bad('Email inválido');
  if (phone.length > 40) return bad('Teléfono demasiado largo');
  if (photoUrl.length > 500) return bad('URL de foto demasiado larga');
  if (specialties.length > 500) return bad('Especialidades demasiado largas');
  if (certification.length > 300) return bad('Certificación demasiado larga');
  if (bio.length > 2000) return bad('Bio demasiado larga');
  if (instagram.length > 300 || website.length > 300) return bad('Link demasiado largo');
  if (trailIds.length < 1 || trailIds.length > MAX_TRAILS) {
    return bad(`Elegí entre 1 y ${MAX_TRAILS} senderos`);
  }

  // Price computed here, server-side, from the number of trails — never
  // from anything the client sends.
  const amountTotal = PRICE_PER_TRAIL_ARS * trailIds.length;

  const supabase = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');

  const { data: row, error: insertErr } = await supabase
    .from('guides')
    .insert({
      full_name: fullName,
      email,
      phone: phone || null,
      photo_url: photoUrl || null,
      trail_ids: trailIds,
      specialties: specialties || null,
      certification: certification || null,
      bio: bio || null,
      instagram: instagram || null,
      website: website || null,
      newsletter_opt_in: newsletterOptIn,
      amount_total: amountTotal,
      currency: 'ARS',
      paid: false,
    })
    .select('id')
    .single();

  if (insertErr || !row) {
    return json({ error: 'No se pudo guardar la postulación', detail: insertErr?.message }, 500);
  }

  // ── Create the Mercado Pago Checkout Pro preference ────────────────────
  const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [{
        title: `Sliabh — Publicación de guía en ${trailIds.length} sendero${trailIds.length > 1 ? 's' : ''} (1 año)`,
        quantity: 1,
        unit_price: amountTotal,
        currency_id: 'ARS',
      }],
      payer: { email },
      external_reference: row.id,
      notification_url: `${SUPABASE_URL}/functions/v1/mp-webhook`,
      back_urls: {
        success: `${SITE_URL}/guias?pago=exitoso`,
        pending: `${SITE_URL}/guias?pago=pendiente`,
        failure: `${SITE_URL}/guias?pago=fallido`,
      },
      auto_return: 'approved',
    }),
  });

  if (!mpRes.ok) {
    // Clean up the orphaned pending row — no preference means no way to
    // ever pay for it.
    await supabase.from('guides').delete().eq('id', row.id);
    return json({ error: 'Mercado Pago rechazó la solicitud', detail: await mpRes.text() }, 502);
  }

  const pref = await mpRes.json();
  await supabase.from('guides').update({ mp_preference_id: pref.id }).eq('id', row.id);

  return json({ checkoutUrl: pref.init_point as string });
});

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
