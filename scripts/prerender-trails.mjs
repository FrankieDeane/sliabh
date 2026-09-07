// Bakes a unique <title>/description/canonical/OG/Twitter/JSON-LD into a
// static dist/ruta/<id>/index.html for every trail, cloned from the already
// SEO-tagged dist/index.html (see inject-seo.mjs).
//
// Why this exists: web.output is "single" — one dist/index.html serves every
// route in the SPA. SeoHead.tsx already renders a unique title/description/
// JSON-LD per trail (see app/(tabs)/ruta/[id].tsx), but only after the JS
// bundle hydrates. Crawlers that don't execute JS — Facebook, WhatsApp,
// X/Twitter, LinkedIn, Slack, Telegram, iMessage link previews, and most
// non-Google AI answer engines — only ever see dist/index.html's generic
// homepage tags, identical for all 60 trail pages.
//
// This script does NOT change how the app renders or routes — it only adds
// pre-baked static files that Netlify serves in place of the SPA fallback
// for an exact path match (netlify.toml's catch-all redirect has no
// `force = true`, so a real file on disk always wins). React still hydrates
// on top exactly as before; SeoHead's tags just confirm what's already here.
//
// Keep the seoTitle/seoImage/seoJsonLd formulas below in sync with
// app/(tabs)/ruta/[id].tsx (the client-side render must match what a
// crawler sees, or Google's second-pass JS render will just overwrite this
// with the same thing anyway — the two are meant to agree, not diverge).
//
// Run with: node scripts/prerender-trails.mjs (after expo export + inject-seo)
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { createRequire } from 'node:module';

const SITE_URL = 'https://sliabh.com.ar';
const DIST_INDEX = 'dist/index.html';

// ── Load the trail data (real .ts source, not a regex scrape) ──────────────
// The data files are plain interfaces + object literals with no JSX and no
// RN imports at module scope, so transpiling just the TS syntax away (no
// bundler) is enough to require() them directly.
function loadTsModule(relPath) {
  const absPath = path.resolve(relPath);
  const source = fs.readFileSync(absPath, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const mod = { exports: {} };
  const req = createRequire(import.meta.url);
  new Function('exports', 'require', 'module', '__filename', '__dirname', outputText)(
    mod.exports, req, mod, absPath, path.dirname(absPath),
  );
  return mod.exports;
}

const argentina = loadTsModule('src/data/argentinaTrails.ts');
const bariloche = loadTsModule('src/data/barilocheTreks.ts');
const DIFFICULTY_LABEL = argentina.DIFFICULTY_LABEL;
const ALL_TRAILS = [...argentina.ARGENTINA_TRAILS, ...bariloche.BARILOCHE_TRAILS];

if (!ALL_TRAILS.length) throw new Error('prerender-trails: no trails loaded — data file shape changed?');

// ── Per-trail SEO tags — mirrors app/(tabs)/ruta/[id].tsx exactly ──────────
function seoFor(trail) {
  const title = `${trail.name} — ${trail.province} | Sliabh`;
  const image = trail.photo_uri.startsWith('http') ? trail.photo_uri : `${SITE_URL}${trail.photo_uri}`;
  const url = `${SITE_URL}/ruta/${trail.id}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'TouristAttraction',
        name: trail.name,
        description: trail.description,
        url,
        image,
        address: { '@type': 'PostalAddress', addressRegion: trail.province, addressCountry: 'AR' },
        geo: { '@type': 'GeoCoordinates', latitude: trail.coordinates.lat, longitude: trail.coordinates.lon },
        containedInPlace: { '@type': 'Place', name: trail.area },
        additionalProperty: [
          { '@type': 'PropertyValue', name: 'Dificultad', value: DIFFICULTY_LABEL[trail.difficulty] ?? trail.difficulty },
          { '@type': 'PropertyValue', name: 'Distancia', value: `${trail.distance_km} km` },
          { '@type': 'PropertyValue', name: 'Duración', value: `${trail.duration.min}–${trail.duration.max} ${trail.duration.unit}` },
          { '@type': 'PropertyValue', name: 'Mejor época', value: trail.best_season },
        ],
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Sliabh', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'Rutas', item: `${SITE_URL}/rutas` },
          { '@type': 'ListItem', position: 3, name: trail.name, item: url },
        ],
      },
    ],
  };
  return { title, description: trail.description, image, url, jsonLd };
}

// ── Swap the baked-in tags in a copy of dist/index.html ────────────────────
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderPage(template, seo) {
  let html = template;
  const setTag = (re, replacement) => {
    if (!re.test(html)) throw new Error(`prerender-trails: pattern not found in dist/index.html: ${re}`);
    html = html.replace(re, replacement);
  };
  setTag(/<title>.*?<\/title>/s, `<title>${esc(seo.title)}</title>`);
  setTag(/<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${esc(seo.description)}" />`);
  setTag(/<link rel="canonical" href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${esc(seo.url)}" />`);
  setTag(/<meta property="og:url" content="[^"]*"\s*\/?>/, `<meta property="og:url" content="${esc(seo.url)}" />`);
  setTag(/<meta property="og:title" content="[^"]*"\s*\/?>/, `<meta property="og:title" content="${esc(seo.title)}" />`);
  setTag(/<meta property="og:description" content="[^"]*"\s*\/?>/, `<meta property="og:description" content="${esc(seo.description)}" />`);
  setTag(/<meta property="og:image" content="[^"]*"\s*\/?>/, `<meta property="og:image" content="${esc(seo.image)}" />`);
  setTag(/<meta property="og:image:alt" content="[^"]*"\s*\/?>/, `<meta property="og:image:alt" content="${esc(seo.title)}" />`);
  setTag(/<meta name="twitter:title" content="[^"]*"\s*\/?>/, `<meta name="twitter:title" content="${esc(seo.title)}" />`);
  setTag(/<meta name="twitter:description" content="[^"]*"\s*\/?>/, `<meta name="twitter:description" content="${esc(seo.description)}" />`);
  setTag(/<meta name="twitter:image" content="[^"]*"\s*\/?>/, `<meta name="twitter:image" content="${esc(seo.image)}" />`);
  // Additive: the site-wide WebSite/Organization JSON-LD stays; this is a
  // second, page-specific graph — multiple JSON-LD blocks per page is valid.
  const trailScript = `    <script type="application/ld+json">${JSON.stringify(seo.jsonLd)}</script>\n`;
  setTag(/<\/head>/, `${trailScript}  </head>`);
  return html;
}

const template = fs.readFileSync(DIST_INDEX, 'utf8');
let written = 0;
for (const trail of ALL_TRAILS) {
  const seo = seoFor(trail);
  const outDir = path.join('dist', 'ruta', trail.id);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), renderPage(template, seo));
  written++;
}

console.log(`prerender-trails: wrote ${written} static dist/ruta/<id>/index.html pages with unique SEO tags`);
