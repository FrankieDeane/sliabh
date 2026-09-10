import type { Context } from 'https://edge.netlify.com';

/**
 * Sets the site's DEFAULT language from the visitor's country, detected via
 * Netlify's built-in geo-IP (context.geo) — no external service, no extra
 * cost. Spanish-speaking countries get "es", everyone else (English-speaking
 * or any other language) gets "en", per the site's request.
 *
 * This only sets a DEFAULT: langStore.ts (src/store/langStore.ts) uses it as
 * the store's initial value ONLY when nothing is persisted yet in
 * localStorage. A returning visitor's own choice (the EN/ES toggle) is
 * saved there and always wins over this — geo-detection never overrides a
 * real manual choice, only fills in a sensible first impression.
 *
 * Implementation: intercept the HTML document response (index.html, the
 * prerendered /en/index.html, and every prerendered /ruta/<id>/index.html —
 * this runs on all of them since it wraps context.next(), which resolves
 * to whichever the normal static-file/redirect logic would have served)
 * and inject `window.__SLIABH_GEO_LANG__` right after <head> — early enough
 * that it's set before langStore.ts runs when the JS bundle loads. Never
 * touches non-HTML responses (JS/CSS/images) or the static SEO tags
 * themselves — a crawler that doesn't execute JS sees the same prerendered
 * content as before; this only affects a real visitor's client-side state
 * after hydration.
 */

const SPANISH_SPEAKING_COUNTRIES = new Set([
  'AR', 'BO', 'CL', 'CO', 'CR', 'CU', 'DO', 'EC', 'SV', 'GQ',
  'GT', 'HN', 'MX', 'NI', 'PA', 'PY', 'PE', 'PR', 'ES', 'UY', 'VE',
]);

export default async (_request: Request, context: Context) => {
  const response = await context.next();

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;

  const countryCode = context.geo?.country?.code;
  // Unknown country (local dev, geo lookup failure) → keep the site's
  // existing default (Spanish) rather than guessing.
  const lang = !countryCode || SPANISH_SPEAKING_COUNTRIES.has(countryCode) ? 'es' : 'en';

  const html = await response.text();
  const injected = html.replace(
    '<head>',
    `<head><script>window.__SLIABH_GEO_LANG__=${JSON.stringify(lang)};</script>`,
  );

  // The original content-length no longer matches the injected body —
  // strip it so the runtime recalculates it, instead of the browser
  // truncating the response at the stale byte count.
  const headers = new Headers(response.headers);
  headers.delete('content-length');

  return new Response(injected, { status: response.status, statusText: response.statusText, headers });
};
