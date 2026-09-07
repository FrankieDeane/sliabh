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

const urls = [
  ...routes.map((r) => ({ loc: BASE + r, pri: r === '/' || r === '/inicio' ? '1.0' : '0.8', freq: 'weekly' })),
  ...trailIds.map((id) => ({ loc: `${BASE}/ruta/${id}`, pri: '0.7', freq: 'monthly' })),
];

const xml =
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls
    .map(
      (u) =>
        `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${u.freq}</changefreq>\n    <priority>${u.pri}</priority>\n  </url>`,
    )
    .join('\n') +
  '\n</urlset>\n';

fs.writeFileSync('public/sitemap.xml', xml);
console.log(`sitemap.xml: ${urls.length} URLs (${trailIds.length} trails)`);
