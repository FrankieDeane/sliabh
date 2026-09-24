// Gives every core page (/rutas, /mapas, /faq, …) its own static HTML with
// its own canonical, title and description, and makes the SPA fallback stop
// claiming to be the homepage.
//
// Why: Netlify answers any path without a file of its own with
// dist/index.html (netlify.toml's `/* → /index.html` fallback), and that
// file is the homepage — canonical "/", hreflang "/"+"/en", homepage title.
// So /rutas, /mapas, /faq, … all told crawlers "I am a duplicate of the
// homepage", and after Google's JS render they carried two conflicting
// canonicals ("/" from the HTML, their own from SeoHead) — which Google
// resolves by trusting neither.
//
//  1. Core pages: dist/<route>/index.html cloned from the homepage HTML with
//     that page's own title/description/canonical, read straight from the
//     page's <SeoHead ...> props so there is no second copy to keep in sync.
//     No hreflang: these pages have no /en twin.
//  2. SPA fallback: dist/app-shell.html = the homepage HTML without its
//     canonical/hreflang, served for every other path (see netlify.toml), so
//     unknown routes carry no wrong canonical and each page's SeoHead is the
//     only one.
//
// Run with: node scripts/prerender-core.mjs (last, after prerender-hubs.mjs)
import fs from 'node:fs';
import path from 'node:path';
import { esc } from './lib/render-head.mjs';

const SITE_URL = 'https://sliabh.com.ar';
const DIST_INDEX = 'dist/index.html';

const PAGES = ['rutas', 'mapas', 'planificar', 'faq', 'supervivencia', 'contribuir', 'guias', 'app'];

// Reads title/description from the first <SeoHead ...> in the page source:
// a plain string prop, or the Spanish (else-branch) string of a
// `lang === 'en' ? '…' : '…'` prop.
function seoProps(route) {
  const src = fs.readFileSync(`app/(tabs)/${route}.tsx`, 'utf8');
  const start = src.indexOf('<SeoHead');
  if (start < 0) throw new Error(`prerender-core: no <SeoHead> in ${route}.tsx`);
  const block = src.slice(start, src.indexOf('/>', start));
  const prop = (name) => {
    const plain = block.match(new RegExp(`${name}="([^"]*)"`));
    if (plain) return plain[1];
    const ternary = block.match(new RegExp(`${name}=\\{[\\s\\S]*?:\\s*'((?:[^'\\\\]|\\\\.)*)'\\s*\\}`));
    if (ternary) return ternary[1].replace(/\\'/g, "'");
    throw new Error(`prerender-core: can't read ${name} from <SeoHead> in ${route}.tsx`);
  };
  return { title: prop('title'), description: prop('description') };
}

const HREFLANG_BLOCK =
  /\s*<link rel="alternate" hreflang="es" href="[^"]*"\s*\/?>\s*<link rel="alternate" hreflang="en" href="[^"]*"\s*\/?>\s*<link rel="alternate" hreflang="x-default" href="[^"]*"\s*\/?>/;

const template = fs.readFileSync(DIST_INDEX, 'utf8');
for (const re of [HREFLANG_BLOCK, /<link rel="canonical" href="[^"]*"\s*\/?>/, /<title>.*?<\/title>/s]) {
  if (!re.test(template)) throw new Error(`prerender-core: pattern not found in dist/index.html: ${re}`);
}

for (const route of PAGES) {
  const { title, description } = seoProps(route);
  const url = `${SITE_URL}/${route}`;
  const html = template
    .replace(/<title>.*?<\/title>/s, `<title>${esc(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${esc(description)}" />`)
    .replace(/<link rel="canonical" href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${url}" />`)
    .replace(HREFLANG_BLOCK, '')
    .replace(/<meta property="og:url" content="[^"]*"\s*\/?>/, `<meta property="og:url" content="${url}" />`)
    .replace(/<meta property="og:title" content="[^"]*"\s*\/?>/, `<meta property="og:title" content="${esc(title)}" />`)
    .replace(/<meta property="og:description" content="[^"]*"\s*\/?>/, `<meta property="og:description" content="${esc(description)}" />`)
    .replace(/<meta name="twitter:title" content="[^"]*"\s*\/?>/, `<meta name="twitter:title" content="${esc(title)}" />`)
    .replace(/<meta name="twitter:description" content="[^"]*"\s*\/?>/, `<meta name="twitter:description" content="${esc(description)}" />`);
  const outDir = path.join('dist', route);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), html);
}

const shell = template
  .replace(/<link rel="canonical" href="[^"]*"\s*\/?>\s*/, '')
  .replace(HREFLANG_BLOCK, '')
  .replace(/<meta property="og:url" content="[^"]*"\s*\/?>\s*/, '');
fs.writeFileSync('dist/app-shell.html', shell);

console.log(`prerender-core: wrote ${PAGES.length} core pages with their own canonical + dist/app-shell.html (SPA fallback, no canonical)`);
