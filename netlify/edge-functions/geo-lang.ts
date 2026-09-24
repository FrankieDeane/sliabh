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

// Search-engine and AI crawlers. Googlebot crawls almost entirely from US
// IPs, so geo alone would hand it English on every Spanish URL: after its
// JS render, /ruta/<id> would carry the English text of /en/ruta/<id>, two
// "different" URLs with the same content, and the Spanish page indexed in
// English. A crawler gets the language its URL is for, never its IP's.
const CRAWLER_UA =
  /googlebot|google-inspectiontool|googleother|bingbot|slurp|duckduckbot|baiduspider|yandex|applebot|gptbot|oai-searchbot|chatgpt-user|claudebot|claude-web|perplexitybot|ccbot|facebookexternalhit|twitterbot|linkedinbot/i;

const SPANISH_SPEAKING_COUNTRIES = new Set([
  'AR', 'BO', 'CL', 'CO', 'CR', 'CU', 'DO', 'EC', 'SV', 'GQ',
  'GT', 'HN', 'MX', 'NI', 'PA', 'PY', 'PE', 'PR', 'ES', 'UY', 'VE',
]);

export default async (request: Request, context: Context) => {
  const response = await context.next();

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html')) return response;

  const { pathname } = new URL(request.url);
  const isEnPath = pathname === '/en' || pathname.startsWith('/en/');
  const isCrawler = CRAWLER_UA.test(request.headers.get('user-agent') || '');

  let lang: 'es' | 'en';
  if (isEnPath) {
    // /en/* is the English version by definition, for everyone.
    lang = 'en';
  } else if (isCrawler) {
    // Every other bilingual URL is the Spanish one (see CRAWLER_UA).
    lang = 'es';
  } else {
    const countryCode = context.geo?.country?.code;
    // Unknown country (local dev, geo lookup failure) → keep the site's
    // existing default (Spanish) rather than guessing.
    lang = !countryCode || SPANISH_SPEAKING_COUNTRIES.has(countryCode) ? 'es' : 'en';
  }

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
