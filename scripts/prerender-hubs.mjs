// Bakes static dist/region/<slug>/index.html, dist/parque/<slug>/index.html
// and their /en/ twins for every region and park hub page (src/data/hubs.ts),
// each cloned from the SEO-tagged dist/index.html — same approach and same
// reasons as prerender-trails.mjs.
//
// Beyond the <head> tags, it also writes the page's real text (H1, intro,
// trail list with links, FAQ) into a <noscript> block, so a crawler that
// never runs JS still reads the hub's content and follows its links to
// every trail. React replaces #root on hydration; <noscript> is inert once
// JS runs.
//
// Run with: node scripts/prerender-hubs.mjs (after expo export + inject-seo)
import fs from 'node:fs';
import path from 'node:path';
import { loadTs } from './lib/load-ts.mjs';
import { renderPage, esc } from './lib/render-head.mjs';

const DIST_INDEX = 'dist/index.html';

const { REGIONS, PARKS } = loadTs('src/data/hubs.ts');
const { hubSeo } = loadTs('src/utils/hubSeo.ts');

function noscriptBody(seo) {
  const en = seo.lang === 'en';
  const prefix = en ? '/en' : '';
  const h1 = seo.kind === 'region'
    ? (en ? `Hiking in ${seo.name}` : `Trekking en ${seo.name}`)
    : (en ? `Hiking trails in ${seo.name}` : `Rutas de trekking en ${seo.name}`);
  const trails = seo.trails
    .map((t) => `<li><a href="${prefix}/ruta/${esc(t.id)}">${esc(t.name)}</a> — ${esc(t.province)}, ${t.distance_km} km</li>`)
    .join('');
  const parks = seo.childParks.length
    ? `<h2>${en ? 'Parks in this region' : 'Parques de esta región'}</h2><ul>${seo.childParks
        .map((p) => `<li><a href="${prefix}/parque/${esc(p.slug)}">${esc(en ? p.en.name : p.es.name)}</a></li>`)
        .join('')}</ul>`
    : '';
  const faqs = seo.faqs.map((f) => `<h3>${esc(f.q)}</h3><p>${esc(f.a)}</p>`).join('');
  return (
    `<noscript><main><h1>${esc(h1)}</h1><p>${esc(seo.intro)}</p>${parks}` +
    `<h2>${en ? 'Trails' : 'Rutas'}</h2><ul>${trails}</ul>` +
    `<h2>${en ? 'Frequently asked questions' : 'Preguntas frecuentes'}</h2>${faqs}</main></noscript>`
  );
}

const template = fs.readFileSync(DIST_INDEX, 'utf8');
if (!/<body[^>]*>/.test(template)) throw new Error('prerender-hubs: no <body> in dist/index.html');

let written = 0;
const hubs = [
  ...REGIONS.map((r) => ['region', r.slug]),
  ...PARKS.map((p) => ['park', p.slug]),
];
for (const [kind, slug] of hubs) {
  for (const lang of ['es', 'en']) {
    const seo = hubSeo(kind, slug, lang);
    if (!seo) throw new Error(`prerender-hubs: ${kind} "${slug}" has no trails — check src/data/hubs.ts`);
    let html = renderPage(template, seo, 'prerender-hubs');
    html = html.replace(/<body([^>]*)>/, (m) => `${m}${noscriptBody(seo)}`);
    const base = kind === 'region' ? 'region' : 'parque';
    const outDir = lang === 'en' ? path.join('dist', 'en', base, slug) : path.join('dist', base, slug);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'index.html'), html);
    written++;
  }
}

console.log(`prerender-hubs: wrote ${written} static pages (${REGIONS.length} regions + ${PARKS.length} parks × es/en)`);

// ── Crawl paths from the homepage ───────────────────────────────────────────
// Last step, after every page has been cloned from dist/index.html: give the
// homepage (and the SPA fallback it doubles as) a plain-HTML map of every
// region and park hub, so a crawler that doesn't run JS can reach the whole
// site from "/" and "/en".
function homeNav(lang) {
  const en = lang === 'en';
  const prefix = en ? '/en' : '';
  const regions = REGIONS.map((r) => `<li><a href="${prefix}/region/${r.slug}">${esc(en ? `Hiking in ${r.en.name}` : `Trekking en ${r.es.name}`)}</a></li>`).join('');
  const parks = PARKS.map((p) => `<li><a href="${prefix}/parque/${p.slug}">${esc(en ? p.en.name : p.es.name)}</a></li>`).join('');
  return (
    `<noscript><nav><h2>${en ? 'Hiking regions in Argentina' : 'Regiones de trekking en Argentina'}</h2><ul>${regions}</ul>` +
    `<h2>${en ? 'National parks & areas' : 'Parques nacionales y áreas'}</h2><ul>${parks}</ul>` +
    `<p><a href="/rutas">${en ? 'All trails' : 'Todas las rutas'}</a></p></nav></noscript>`
  );
}
for (const [file, lang] of [['dist/index.html', 'es'], ['dist/en/index.html', 'en']]) {
  if (!fs.existsSync(file)) continue;
  const html = fs.readFileSync(file, 'utf8');
  if (html.includes('<noscript><nav>')) continue;
  fs.writeFileSync(file, html.replace(/<body([^>]*)>/, (m) => `${m}${homeNav(lang)}`));
}
console.log('prerender-hubs: added hub navigation to the homepage for non-JS crawlers');
