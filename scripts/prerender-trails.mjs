// Bakes a unique <title>/description/keywords/canonical/OG/Twitter/JSON-LD/
// hreflang into static dist/ruta/<id>/index.html and dist/en/ruta/<id>/index.html
// pages for every trail, each cloned from the already SEO-tagged
// dist/index.html (see inject-seo.mjs).
//
// Why this exists: web.output is "single" — one dist/index.html serves every
// route in the SPA. The trail screen renders its tags through SeoHead only
// after the JS bundle hydrates. Crawlers that don't execute JS — Facebook,
// WhatsApp, X/Twitter, LinkedIn, Slack, Telegram, iMessage link previews,
// and most non-Google AI answer engines — only ever see dist/index.html's
// generic homepage tags, identical for every trail.
//
// This script does NOT change how the app renders or routes — it only adds
// pre-baked static files that Netlify serves in place of the SPA fallback
// for an exact path match (netlify.toml's catch-all redirect has no
// `force = true`, so a real file on disk always wins). React still hydrates
// on top exactly as before.
//
// The tags themselves come from src/utils/trailSeo.ts — the same builder the
// trail screen's SeoHead uses — so the static HTML and the hydrated page
// can't disagree.
//
// Run with: node scripts/prerender-trails.mjs (after expo export + inject-seo)
import fs from 'node:fs';
import path from 'node:path';
import { loadTs } from './lib/load-ts.mjs';
import { renderPage, esc } from './lib/render-head.mjs';

const DIST_INDEX = 'dist/index.html';

const { ALL_HUB_TRAILS: ALL_TRAILS } = loadTs('src/data/hubs.ts');
const { trailSeo } = loadTs('src/utils/trailSeo.ts');
const { trailFaqs } = loadTs('src/utils/trailFaq.ts');
const { regionMeta, parkMeta, slugifyArea } = loadTs('src/data/hubs.ts');
const { difficultyLabel, seasonLabel } = loadTs('src/data/argentinaTrails.ts');

// The trail's real text for crawlers that never run JS (GPTBot, ClaudeBot,
// PerplexityBot and most AI answer engines): same content the screen
// renders — H1, description, key facts, FAQ, links up to its hubs. React
// replaces #root on hydration; <noscript> is inert once JS runs.
function noscriptBody(trail, lang) {
  const en = lang === 'en';
  const prefix = en ? '/en' : '';
  const body = en ? (trail.description_en ?? trail.description) : trail.description;
  const long = en ? (trail.long_description_en ?? '') : (trail.long_description ?? '');
  const u = trail.duration.unit === 'dias' ? (en ? 'days' : 'días') : (en ? 'hours' : 'horas');
  const facts = [
    [en ? 'Difficulty' : 'Dificultad', difficultyLabel(trail.difficulty, lang)],
    [en ? 'Distance' : 'Distancia', `${trail.distance_km} km`],
    [en ? 'Duration' : 'Duración', `${trail.duration.min}–${trail.duration.max} ${u}`],
    [en ? 'Elevation gain' : 'Desnivel positivo', `${trail.elevation_gain_m} m`],
    [en ? 'Max altitude' : 'Altura máxima', `${trail.max_altitude_m} m`],
    [en ? 'Best season' : 'Mejor época', seasonLabel(trail.best_season, lang)],
    [en ? 'Trailhead' : 'Punto de partida', trail.trailhead],
    [en ? 'Park / area' : 'Parque / área', `${trail.area}, ${trail.province}`],
  ].map(([k, v]) => `<li><strong>${esc(k)}:</strong> ${esc(v)}</li>`).join('');
  const faqs = trailFaqs(trail, lang).map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`).join('');
  const region = regionMeta(trail.region);
  const park = parkMeta(slugifyArea(trail.area));
  const links = [
    park ? `<a href="${prefix}/parque/${park.slug}">${esc(en ? park.en.name : park.es.name)}</a>` : '',
    region ? `<a href="${prefix}/region/${region.slug}">${esc(en ? `Hiking in ${region.en.name}` : `Trekking en ${region.es.name}`)}</a>` : '',
  ].filter(Boolean).join(' · ');
  return (
    `<noscript><main><h1>${esc(trail.name)}</h1><p>${esc(body)}</p>` +
    (long ? long.split(/\n\s*\n/).map((pp) => `<p>${esc(pp.trim())}</p>`).join('') : '') +
    `<ul>${facts}</ul><h2>${en ? 'Frequently asked questions' : 'Preguntas frecuentes'}</h2>${faqs}` +
    (links ? `<p>${links}</p>` : '') +
    `</main></noscript>`
  );
}

if (!ALL_TRAILS.length) throw new Error('prerender-trails: no trails loaded — data file shape changed?');

const missingEn = ALL_TRAILS.filter((t) => !t.description_en).map((t) => t.id);
if (missingEn.length) {
  console.warn(`prerender-trails: ${missingEn.length} trail(s) have no description_en, falling back to Spanish: ${missingEn.join(', ')}`);
}

const template = fs.readFileSync(DIST_INDEX, 'utf8');
let written = 0;
for (const trail of ALL_TRAILS) {
  for (const lang of ['es', 'en']) {
    const seo = trailSeo(trail, lang);
    const outDir = lang === 'en'
      ? path.join('dist', 'en', 'ruta', trail.id)
      : path.join('dist', 'ruta', trail.id);
    fs.mkdirSync(outDir, { recursive: true });
    const html = renderPage(template, seo, 'prerender-trails')
      .replace(/<body([^>]*)>/, (m) => `${m}${noscriptBody(trail, lang)}`);
    fs.writeFileSync(path.join(outDir, 'index.html'), html);
    written++;
  }
}

console.log(`prerender-trails: wrote ${written} static pages (${ALL_TRAILS.length} trails × es/en) with unique SEO tags + hreflang`);
