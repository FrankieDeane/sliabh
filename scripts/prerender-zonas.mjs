// Builds /en/supervivencia/zonas-seguras from the Spanish static page
// (public/supervivencia/zonas-seguras/index.html, copied into dist by expo
// export). One source page, one dictionary (src/data/zonasSegurasEn.json):
//  - the static HTML is translated here, so crawlers read English without JS;
//  - the dictionary is also injected as window.ZS_EN, and the page's own
//    script translates everything it renders at runtime (legends, cards…).
//
// Run with: node scripts/prerender-zonas.mjs (after expo export)
import fs from 'node:fs';
import path from 'node:path';

const SRC = 'dist/supervivencia/zonas-seguras/index.html';
const OUT = 'dist/en/supervivencia/zonas-seguras/index.html';
const URL_ES = 'https://sliabh.com.ar/supervivencia/zonas-seguras';
const URL_EN = 'https://sliabh.com.ar/en/supervivencia/zonas-seguras';

const EN = JSON.parse(fs.readFileSync('src/data/zonasSegurasEn.json', 'utf8'));
let html = fs.readFileSync(SRC, 'utf8');

const TITLE = 'Safe-Areas Map of Argentina: Nuclear, Volcanoes, Earthquakes | Sliabh';
const DESC = "3D map of risks and refuge areas in Argentina. Simulators for a nuclear blast, toxic cloud, volcanic ash and earthquakes, AI data centres, safe water and what to do in a blackout.";
const KEYWORDS = 'safest place in Argentina, safe areas Argentina, nuclear war Argentina, nuclear blast simulator Buenos Aires, volcanic ash Bariloche, earthquake San Juan, toxic cloud Bahía Blanca, AI data centers Argentina, Patagonia refuge, emergency water, blackout preparedness, Sliabh';

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function swap(re, replacement, label) {
  if (!re.test(html)) throw new Error(`prerender-zonas: ${label} not found in ${SRC}`);
  html = html.replace(re, replacement);
}

swap(/<html lang="[^"]*">/, '<html lang="en">', 'html lang');
swap(/<title>[^<]*<\/title>/, `<title>${esc(TITLE)}</title>`, 'title');
swap(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(DESC)}">`, 'description');
swap(/<meta name="keywords" content="[^"]*">/, `<meta name="keywords" content="${esc(KEYWORDS)}">`, 'keywords');
swap(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${URL_EN}">`, 'canonical');
swap(/<meta property="og:locale" content="[^"]*">/, '<meta property="og:locale" content="en_US">', 'og:locale');
swap(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${URL_EN}">`, 'og:url');
swap(/<meta property="og:title" content="[^"]*">/, '<meta property="og:title" content="Safe-Areas Map of Argentina | Sliabh">', 'og:title');
swap(/<meta property="og:description" content="[^"]*">/, '<meta property="og:description" content="Risks, refuges and simulators for a nuclear blast, toxic cloud, volcanic ash and earthquakes on a 3D map of Argentina.">', 'og:description');
swap(/<meta name="twitter:title" content="[^"]*">/, '<meta name="twitter:title" content="Safe-Areas Map of Argentina | Sliabh">', 'twitter:title');
swap(/<meta name="twitter:description" content="[^"]*">/, '<meta name="twitter:description" content="Risks, refuges and simulators on a 3D map of Argentina.">', 'twitter:description');

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'WebPage', '@id': `${URL_EN}#page`, url: URL_EN, name: 'Safe-areas map of Argentina', inLanguage: 'en', description: DESC, isPartOf: { '@type': 'WebSite', name: 'Sliabh', url: 'https://sliabh.com.ar/' }, about: ['Civil protection', 'Safe areas', 'Volcanic risk', 'Seismic risk', 'Nuclear emergency'] },
    { '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Sliabh', item: 'https://sliabh.com.ar/en' },
      { '@type': 'ListItem', position: 2, name: 'Survival', item: 'https://sliabh.com.ar/en/supervivencia' },
      { '@type': 'ListItem', position: 3, name: 'Safe-areas map', item: URL_EN },
    ] },
  ],
};
swap(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, () => `<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`, 'JSON-LD');

// Links that have an English twin.
html = html.replace(/href="([^"]*)" (class="[^"]*" )?data-en-href="([^"]*)"/g, (m, _es, cls, en) => `href="${en}" ${cls || ''}data-en-href="${en}"`);

// Static text: translate text nodes and aria-labels outside <script>/<style>.
const tr = (s) => {
  const k = s.trim();
  return k && EN[k] !== undefined ? s.replace(k, EN[k]) : s;
};
const bodyStart = html.indexOf('<body>');
let head = html.slice(0, bodyStart);
let body = html.slice(bodyStart);
body = body.split(/(<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>)/).map((part, i) => {
  if (i % 2 === 1) return part;
  return part
    .replace(/>([^<>]+)</g, (m, text) => `>${tr(text)}<`)
    .replace(/aria-label="([^"]*)"/g, (m, v) => `aria-label="${esc(tr(v))}"`);
}).join('');

// Runtime dictionary for everything the page renders with JS.
const dict = `<script>window.ZS_EN=${JSON.stringify(EN).replace(/</g, '\\u003c')};</script>\n`;
if (!body.includes('<script src="/vendor/maplibre-gl-4.7.1.js">')) throw new Error('prerender-zonas: maplibre script tag not found');
body = body.replace('<script src="/vendor/maplibre-gl-4.7.1.js">', `${dict}<script src="/vendor/maplibre-gl-4.7.1.js">`);

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, head + body);
console.log(`prerender-zonas: wrote ${OUT} (English, ${Object.keys(EN).length} strings)`);
