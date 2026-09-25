// Gives every core page (/rutas, /mapas, /faq, …) and its English twin
// (/en/rutas, …) its own static HTML: title, description, canonical,
// hreflang pair, OG/Twitter and a small JSON-LD graph. Also writes the SPA
// fallback (dist/app-shell.html) with no canonical/hreflang, so unknown
// routes never claim to be the homepage.
//
// The copy comes from src/data/coreSeo.ts, the same module the screens pass
// to SeoHead, so the static and hydrated tags can't drift. Tag swapping goes
// through lib/render-head.mjs, which fails the build if a tag it expects in
// dist/index.html is missing.
//
// Run with: node scripts/prerender-core.mjs (last, after prerender-hubs.mjs)
import fs from 'node:fs';
import path from 'node:path';
import { esc, renderPage } from './lib/render-head.mjs';
import { loadTs } from './lib/load-ts.mjs';

const SITE_URL = 'https://sliabh.com.ar';
const DIST_INDEX = 'dist/index.html';
const IMAGE = `${SITE_URL}/og-image.jpg`;

const { CORE_ROUTES, coreSeo } = loadTs('src/data/coreSeo.ts');

// /supervivencia renders each guide's full text only when its card is
// expanded, so crawlers would never see it. Bake the whole guide set into the
// static HTML: keywords, FAQPage JSON-LD and a <noscript> copy.
function survivalExtras(lang) {
  const { GUIDES, survivalJsonLd, SURVIVAL_KEYWORDS_ES, SURVIVAL_KEYWORDS_EN } = loadTs('src/data/survivalGuides.ts');
  const en = lang === 'en';
  const para = (text) => text.split('\n').filter(Boolean).map((l) => `<p>${esc(l)}</p>`).join('');
  const body = GUIDES.map((g) => {
    const title = en ? g.titleEn : g.titleEs;
    const tagline = en ? g.taglineEn : g.taglineEs;
    const quick = en ? g.quickEn : g.quickEs;
    const text = en ? g.bodyEn : g.bodyEs;
    const warn = en ? g.warningEn : g.warningEs;
    return `<section><h2>${esc(title)}</h2><p>${esc(tagline)}</p><ul>${quick.map((q) => `<li>${esc(q)}</li>`).join('')}</ul>` +
      `${para(text)}${warn ? `<p><strong>${esc(warn)}</strong></p>` : ''}</section>`;
  }).join('');
  const map = en
    ? '<p><a href="/en/supervivencia/zonas-seguras">Safe-areas map of Argentina</a></p>'
    : '<p><a href="/supervivencia/zonas-seguras">Mapa de zonas seguras de Argentina</a></p>';
  return {
    keywords: en ? SURVIVAL_KEYWORDS_EN : SURVIVAL_KEYWORDS_ES,
    jsonLd: survivalJsonLd(lang),
    noscript: `<noscript><main><h1>${en ? 'Survival guides for Argentina' : 'Guías de supervivencia en Argentina'}</h1>${map}${body}</main></noscript>`,
  };
}
const EXTRAS = { supervivencia: survivalExtras };

// prerender-hubs.mjs adds a Spanish homepage-only <noscript><nav> to
// dist/index.html; core pages are cloned from it and must not carry it.
const HOME_NAV = /<noscript><nav>[\s\S]*?<\/nav><\/noscript>/;

const template = fs.readFileSync(DIST_INDEX, 'utf8').replace(HOME_NAV, '');

let written = 0;
for (const route of CORE_ROUTES) {
  for (const lang of ['es', 'en']) {
    const s = coreSeo(route, lang);
    const url = `${SITE_URL}${s.path}`;
    const urlEs = `${SITE_URL}${s.alternates.es}`;
    const urlEn = `${SITE_URL}${s.alternates.en}`;
    const extra = EXTRAS[route]?.(lang);
    const jsonLd = [
      { '@type': 'WebPage', '@id': `${url}#page`, url, name: s.title, description: s.description, inLanguage: lang, isPartOf: { '@type': 'WebSite', name: 'Sliabh', url: `${SITE_URL}/` } },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Sliabh', item: `${SITE_URL}${lang === 'en' ? '/en' : '/'}` },
          { '@type': 'ListItem', position: 2, name: s.title.split(/ [—|:] /)[0], item: url },
        ],
      },
      ...(extra ? extra.jsonLd : []),
    ];
    let html = renderPage(template, { lang, title: s.title, description: s.description, keywords: extra?.keywords, image: IMAGE, url, urlEs, urlEn, jsonLd }, 'prerender-core');
    if (extra) html = html.replace(/<body([^>]*)>/, (m) => `${m}${extra.noscript}`);
    const outDir = lang === 'en' ? path.join('dist', 'en', route) : path.join('dist', route);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'index.html'), html);
    written++;
  }
}

const HREFLANG_BLOCK =
  /\s*<link rel="alternate" hreflang="es" href="[^"]*"\s*\/?>\s*<link rel="alternate" hreflang="en" href="[^"]*"\s*\/?>\s*<link rel="alternate" hreflang="x-default" href="[^"]*"\s*\/?>/;
for (const re of [HREFLANG_BLOCK, /<link rel="canonical" href="[^"]*"\s*\/?>/, /<meta property="og:url" content="[^"]*"\s*\/?>/]) {
  if (!re.test(template)) throw new Error(`prerender-core: pattern not found in dist/index.html: ${re}`);
}
const shell = template
  .replace(/<link rel="canonical" href="[^"]*"\s*\/?>\s*/, '')
  .replace(HREFLANG_BLOCK, '')
  .replace(/<meta property="og:url" content="[^"]*"\s*\/?>\s*/, '');
fs.writeFileSync('dist/app-shell.html', shell);

console.log(`prerender-core: wrote ${written} core pages (${CORE_ROUTES.length} × es/en) with canonical + hreflang, and dist/app-shell.html (SPA fallback, no canonical)`);
