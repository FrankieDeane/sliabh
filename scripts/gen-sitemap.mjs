// Regenerates public/sitemap.xml from the trail and hub data. Runs as part
// of the Netlify build (see netlify.toml) so the sitemap never goes stale.
//
// Does NOT touch public/robots.txt: that file is hand-maintained (it lists
// explicit Allow rules for AI crawlers — GPTBot, ClaudeBot, PerplexityBot,
// etc. — that a generated file would clobber) and already has a stable
// `Sitemap:` line pointing here. Run with: node scripts/gen-sitemap.mjs
import fs from 'node:fs';
import { loadTs } from './lib/load-ts.mjs';

const BASE = process.env.SITE_URL || 'https://sliabh.com.ar';

const { ALL_HUB_TRAILS, REGIONS, PARKS } = loadTs('src/data/hubs.ts');

const today = new Date().toISOString().slice(0, 10);

// "/inicio" is deliberately absent: "/" redirects there, and its canonical
// is "/" — listing both would hand Google two homepages.
const routes = ['/', '/rutas', '/mapas', '/planificar', '/faq', '/supervivencia', '/supervivencia/zonas-seguras', '/contribuir', '/guias', '/app'];

function xmlEsc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function altLinks(urlEs, urlEn) {
  return (
    `\n    <xhtml:link rel="alternate" hreflang="es" href="${urlEs}"/>` +
    `\n    <xhtml:link rel="alternate" hreflang="en" href="${urlEn}"/>` +
    `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${urlEs}"/>`
  );
}

// Every bilingual page (homepage, trails, hubs) lists both URLs with
// reciprocal xhtml:link hreflang, the same pairs baked into each page's <head>.
function pair(pathEs, pathEn, priEs, priEn, freq, extra = '') {
  const urlEs = `${BASE}${pathEs}`;
  const urlEn = `${BASE}${pathEn}`;
  const alt = altLinks(urlEs, urlEn);
  return [
    { loc: urlEs, pri: priEs, freq, alt, extra },
    { loc: urlEn, pri: priEn, freq, alt, extra },
  ];
}

// Trail photos in the image sitemap — Google Images is a real traffic
// source for "Patagonia hiking"-style searches.
function imageTag(trail) {
  const src = trail.photo_uri.startsWith('http') ? trail.photo_uri : `${BASE}${trail.photo_uri}`;
  return `\n    <image:image>\n      <image:loc>${xmlEsc(src)}</image:loc>\n      <image:title>${xmlEsc(trail.name)}</image:title>\n    </image:image>`;
}

const urls = [
  ...pair('/', '/en', '1.0', '0.9', 'weekly'),
  ...routes.filter((r) => r !== '/').map((r) => ({ loc: BASE + r, pri: '0.8', freq: 'weekly', alt: '', extra: '' })),
  ...REGIONS.flatMap((r) => pair(`/region/${r.slug}`, `/en/region/${r.slug}`, '0.9', '0.8', 'weekly')),
  ...PARKS.flatMap((p) => pair(`/parque/${p.slug}`, `/en/parque/${p.slug}`, '0.8', '0.7', 'weekly')),
  ...ALL_HUB_TRAILS.flatMap((t) => pair(`/ruta/${t.id}`, `/en/ruta/${t.id}`, '0.7', '0.6', 'monthly', imageTag(t))),
];

const xml =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n' +
  urls
    .map(
      (u) =>
        `  <url>\n    <loc>${u.loc}</loc>${u.alt}${u.extra}\n    <lastmod>${today}</lastmod>\n    <changefreq>${u.freq}</changefreq>\n    <priority>${u.pri}</priority>\n  </url>`,
    )
    .join('\n') +
  '\n</urlset>\n';

fs.writeFileSync('public/sitemap.xml', xml);
console.log(
  `sitemap.xml: ${urls.length} URLs (${ALL_HUB_TRAILS.length} trails, ${REGIONS.length} regions, ${PARKS.length} parks × es/en + ${routes.length} core pages)`,
);
