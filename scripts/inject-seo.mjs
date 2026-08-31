// Injects static <head> SEO/social tags into the exported dist/index.html.
//
// Why this exists: web.output is "single" (see app.json / netlify.toml), a
// client-only SPA export. `expo export -p web` ships its own bare-bones
// template — just <title> and app.json's generic web.description — and the
// rich <head> (Open Graph, Twitter card, canonical, JSON-LD) is instead
// injected at runtime by src/components/ui/SiteHead.tsx via expo-router/head.
// That's enough for a browser tab, but link-preview crawlers (Facebook,
// WhatsApp, Twitter/X, LinkedIn, Slack, Telegram, iMessage, ...) fetch the
// HTML and do NOT run the JS bundle, so they never see those tags — shared
// links show no title/description and no image.
//
// Run this right after `expo export -p web`, against the built dist/index.html,
// to bake the same tags in statically so crawlers see them immediately. Keep
// the content below in sync with src/components/ui/SiteHead.tsx (and
// app/+html.tsx, which mirrors it for the "static"/"server" output path).
//
// Run with: node scripts/inject-seo.mjs
import fs from 'node:fs';

const DIST_INDEX = 'dist/index.html';
const SITE_URL = 'https://sliabh.netlify.app';

const TITLE = 'Sliabh — Senderismo y trekking en Argentina | Rutas, mapas 3D y GPS offline';
const DESCRIPTION =
  'Sliabh: la plataforma de senderismo para explorar los Parques Nacionales de Argentina. Rutas y senderos con mapas 3D, GPS y mapas offline, planificación y guías de supervivencia. El Chaltén, Bariloche, Tierra del Fuego y más.';
const OG_DESCRIPTION =
  'Rutas y senderos con mapas 3D, GPS y mapas offline, planificación y guías de supervivencia para los Parques Nacionales de Argentina.';
const TWITTER_DESCRIPTION =
  'Rutas, mapas 3D, GPS offline y planificación para los Parques Nacionales de Argentina.';
const KEYWORDS =
  'senderismo Argentina, trekking Argentina, rutas de montaña, parques nacionales, mapas offline, GPS senderos, El Chaltén, Bariloche, Tierra del Fuego, Patagonia, Fitz Roy, Cerro Torre, hiking Argentina';

const jsonLd = JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: 'Sliabh',
      description: 'Plataforma de senderismo y trekking para los Parques Nacionales de Argentina.',
      inLanguage: 'es-AR',
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
      description: 'Rutas, mapas 3D, GPS offline y planificación para explorar la montaña en Argentina.',
    },
  ],
});

const headTags = `
    <!-- Favicon -->
    <link rel="icon" type="image/png" href="/favicon.png" />
    <link rel="apple-touch-icon" href="/favicon.png" />

    <!-- SEO -->
    <meta name="keywords" content="${KEYWORDS}" />
    <meta name="robots" content="index, follow, max-image-preview:large" />
    <meta name="author" content="Sliabh" />
    <link rel="canonical" href="${SITE_URL}/" />

    <!-- Open Graph -->
    <meta property="og:site_name" content="Sliabh" />
    <meta property="og:locale" content="es_AR" />
    <meta property="og:locale:alternate" content="en_US" />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${SITE_URL}/" />
    <meta property="og:title" content="Sliabh — Senderismo y trekking en Argentina" />
    <meta property="og:description" content="${OG_DESCRIPTION}" />
    <meta property="og:image" content="${SITE_URL}/og-image.jpg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="Senderismo en la Patagonia argentina" />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Sliabh — Senderismo y trekking en Argentina" />
    <meta name="twitter:description" content="${TWITTER_DESCRIPTION}" />
    <meta name="twitter:image" content="${SITE_URL}/og-image.jpg" />

    <!-- Structured data (schema.org) for rich results -->
    <script type="application/ld+json">${jsonLd}</script>
`;

let html = fs.readFileSync(DIST_INDEX, 'utf8');

// Expo's template emits its own <title> and generic <meta name="description">
// (from app.json's web.*) — replace both so there's exactly one of each,
// matching SiteHead.tsx instead of the shorter build-time defaults.
html = html.replace(/<title>.*?<\/title>/s, `<title>${TITLE}</title>`);
html = html.replace(
  /<meta name="description" content="[^"]*">/,
  `<meta name="description" content="${DESCRIPTION}">`,
);

if (!html.includes('</head>')) {
  throw new Error(`${DIST_INDEX}: no </head> found — is the export template unchanged?`);
}
html = html.replace('</head>', `${headTags}  </head>`);

fs.writeFileSync(DIST_INDEX, html);
console.log(`inject-seo: wrote OG/Twitter/JSON-LD tags into ${DIST_INDEX}`);
