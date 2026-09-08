// Bakes a static, English-tagged dist/en/index.html for the homepage,
// cloned from the already SEO-tagged dist/index.html (see inject-seo.mjs).
//
// Why this exists: the Spanish homepage's meta/OG/JSON-LD (inject-seo.mjs)
// and keywords are Spanish-first — reasonable for the site's core Argentine
// audience, but it means hikers searching in English (the main channel for
// Europe/US traffic — "Patagonia hiking trails", "Argentina national parks
// trekking", etc.) never see an English title/description in search results
// for the homepage itself. app/en/ruta/[id].tsx + scripts/prerender-trails.mjs
// already solve this per-trail; this does the same for "/en" as a whole-site
// entry point. SiteHead.tsx (src/components/ui/SiteHead.tsx) mirrors these
// same English strings for a real visitor who toggles the language switch,
// but that only reaches the DOM after the JS bundle hydrates — crawlers that
// don't execute JS need this static file instead (same reasoning as
// scripts/prerender-trails.mjs's own comment header).
//
// Keep the EN strings below in sync with COPY.en in src/components/ui/SiteHead.tsx.
// Run with: node scripts/prerender-home.mjs (after inject-seo.mjs)
import fs from 'node:fs';
import path from 'node:path';

const SITE_URL = 'https://sliabh.com.ar';
const DIST_INDEX = 'dist/index.html';
const OUT_DIR = path.join('dist', 'en');

const TITLE = 'Sliabh — Hiking & Trekking in Argentina | Trails, 3D Maps & Offline GPS';
const DESCRIPTION =
  'Sliabh: plan your hike through Argentina’s National Parks — Patagonia, El Chaltén, Bariloche and Tierra del Fuego. Trail guides with 3D maps, offline GPS tracks, and survival planning, built for hikers travelling from Europe and the US.';
const OG_TITLE = 'Sliabh — Hiking & Trekking in Argentina';
const OG_DESCRIPTION =
  'Trail guides with 3D maps, offline GPS tracks, and trip planning for Argentina’s National Parks — Patagonia, El Chaltén, Bariloche, Tierra del Fuego.';
const TWITTER_DESCRIPTION =
  'Trails, 3D maps, offline GPS and trip planning for Argentina’s National Parks.';
const KEYWORDS =
  'hiking Argentina, trekking Patagonia, Patagonia hiking trails, Argentina national parks, El Chaltén hiking, Fitz Roy trek, Bariloche trekking, backpacking Patagonia, self-guided trekking Argentina, offline GPS hiking app, hiking maps Argentina, Torres del Paine alternative, South America trekking, best hikes in Patagonia';

const jsonLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: 'Sliabh',
      description: 'A hiking and trekking platform for Argentina’s National Parks.',
      inLanguage: 'en',
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_URL}/rutas?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'Sliabh',
      url: `${SITE_URL}/`,
      logo: `${SITE_URL}/SLIABH_Logo_Transparent.png`,
      description: 'Trails, 3D maps, offline GPS and trip planning to explore the mountains of Argentina.',
    },
  ],
});

let html = fs.readFileSync(DIST_INDEX, 'utf8');

const setTag = (re, replacement, label) => {
  if (!re.test(html)) throw new Error(`prerender-home: pattern not found (${label}): ${re}`);
  html = html.replace(re, replacement);
};

setTag(/<html lang="[^"]*"/, `<html lang="en"`, 'html lang');
setTag(/<title>.*?<\/title>/s, `<title>${TITLE}</title>`, 'title');
setTag(/<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${DESCRIPTION}" />`, 'description');
setTag(/<meta name="keywords" content="[^"]*"\s*\/?>/, `<meta name="keywords" content="${KEYWORDS}" />`, 'keywords');
setTag(/<link rel="canonical" href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${SITE_URL}/en" />`, 'canonical');
setTag(/<meta property="og:locale" content="[^"]*"\s*\/?>/, `<meta property="og:locale" content="en_US" />`, 'og:locale');
setTag(/<meta property="og:locale:alternate" content="[^"]*"\s*\/?>/, `<meta property="og:locale:alternate" content="es_AR" />`, 'og:locale:alternate');
setTag(/<meta property="og:url" content="[^"]*"\s*\/?>/, `<meta property="og:url" content="${SITE_URL}/en" />`, 'og:url');
setTag(/<meta property="og:title" content="[^"]*"\s*\/?>/, `<meta property="og:title" content="${OG_TITLE}" />`, 'og:title');
setTag(/<meta property="og:description" content="[^"]*"\s*\/?>/, `<meta property="og:description" content="${OG_DESCRIPTION}" />`, 'og:description');
setTag(/<meta property="og:image:alt" content="[^"]*"\s*\/?>/, `<meta property="og:image:alt" content="Hiking in Argentine Patagonia" />`, 'og:image:alt');
setTag(/<meta name="twitter:title" content="[^"]*"\s*\/?>/, `<meta name="twitter:title" content="${OG_TITLE}" />`, 'twitter:title');
setTag(/<meta name="twitter:description" content="[^"]*"\s*\/?>/, `<meta name="twitter:description" content="${TWITTER_DESCRIPTION}" />`, 'twitter:description');

// Reciprocal hreflang — the Spanish page (es, x-default) already links to
// /en (see inject-seo.mjs); this is the /en page's own set of alternates.
setTag(
  /<link rel="alternate" hreflang="es" href="[^"]*"\s*\/?>\s*<link rel="alternate" hreflang="en" href="[^"]*"\s*\/?>\s*<link rel="alternate" hreflang="x-default" href="[^"]*"\s*\/?>/,
  `<link rel="alternate" hreflang="es" href="${SITE_URL}/" />\n    <link rel="alternate" hreflang="en" href="${SITE_URL}/en" />\n    <link rel="alternate" hreflang="x-default" href="${SITE_URL}/" />`,
  'hreflang block',
);

// Swap the site-wide WebSite/Organization JSON-LD for the English copy —
// it's the only <script type="application/ld+json"> inject-seo.mjs writes
// on the homepage at this point (prerender-trails.mjs only touches trail
// pages), so a plain replace is safe and unambiguous here.
setTag(
  /<script type="application\/ld\+json">.*?<\/script>/s,
  `<script type="application/ld+json">${jsonLd}</script>`,
  'JSON-LD',
);

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, 'index.html'), html);
console.log(`prerender-home: wrote ${path.join(OUT_DIR, 'index.html')} with English SEO tags + hreflang`);
