// Regenerates public/sitemap.xml from the trail data. Runs as part of the
// Netlify build (see netlify.toml) so the sitemap never goes stale.
//
// Does NOT touch public/robots.txt: that file is hand-maintained (it lists
// explicit Allow rules for AI crawlers — GPTBot, ClaudeBot, PerplexityBot,
// etc. — that a generated file would clobber) and already has a stable
// `Sitemap:` line pointing here. Run with: node scripts/gen-sitemap.mjs
import fs from 'node:fs';

const BASE = process.env.SITE_URL || 'https://sliabh.com.ar';

function ids(file) {
  const s = fs.readFileSync(file, 'utf8');
  return [...s.matchAll(/id: '([^']+)'/g)].map((m) => m[1]);
}

const trailIds = [
  ...new Set([
    ...ids('src/data/argentinaTrails.ts'),
    ...ids('src/data/barilocheTreks.ts'),
  ]),
];

const today = new Date().toISOString().slice(0, 10);
const routes = ['/', '/inicio', '/rutas', '/mapas', '/planificar', '/faq', '/supervivencia', '/contribuir'];

// Trail pages exist in both languages (see scripts/prerender-trails.mjs) —
// list both URLs with reciprocal xhtml:link hreflang annotations, same
// pattern as the <link rel="alternate"> tags baked into each page's <head>.
function trailUrls(id) {
  const urlEs = `${BASE}/ruta/${id}`;
  const urlEn = `${BASE}/en/ruta/${id}`;
  const altLinks =
    `\n    <xhtml:link rel="alternate" hreflang="es" href="${urlEs}"/>` +
    `\n    <xhtml:link rel="alternate" hreflang="en" href="${urlEn}"/>` +
    `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${urlEs}"/>`;
  return [
    { loc: urlEs, pri: '0.7', freq: 'monthly', altLinks },
    { loc: urlEn, pri: '0.6', freq: 'monthly', altLinks },
  ];
}

// English homepage (see scripts/prerender-home.mjs) — reciprocal hreflang
// with the Spanish "/" entry, same pattern as trailUrls() below.
const homeAltLinks =
  `\n    <xhtml:link rel="alternate" hreflang="es" href="${BASE}/"/>` +
  `\n    <xhtml:link rel="alternate" hreflang="en" href="${BASE}/en"/>` +
  `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE}/"/>`;

const urls = [
  ...routes.map((r) => ({
    loc: BASE + r,
    pri: r === '/' || r === '/inicio' ? '1.0' : '0.8',
    freq: 'weekly',
    altLinks: r === '/' ? homeAltLinks : '',
  })),
  { loc: `${BASE}/en`, pri: '0.9', freq: 'weekly', altLinks: homeAltLinks },
  ...trailIds.flatMap(trailUrls),
];

const xml =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
  urls
    .map(
      (u) =>
        `  <url>\n    <loc>${u.loc}</loc>${u.altLinks}\n    <lastmod>${today}</lastmod>\n    <changefreq>${u.freq}</changefreq>\n    <priority>${u.pri}</priority>\n  </url>`,
    )
    .join('\n') +
  '\n</urlset>\n';

fs.writeFileSync('public/sitemap.xml', xml);
console.log(`sitemap.xml: ${urls.length} URLs (${trailIds.length} trails × es/en + ${routes.length} core pages + /en homepage)`);
