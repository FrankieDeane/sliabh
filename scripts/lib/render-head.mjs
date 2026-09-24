// Clones the SEO-tagged dist/index.html (see inject-seo.mjs) and swaps in one
// page's own tags — shared by prerender-trails.mjs and prerender-hubs.mjs.
//
// seo: { lang, title, description, keywords?, image, url, urlEs, urlEn, jsonLd }

export function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function renderPage(template, seo, label = 'prerender') {
  let html = template;
  const setTag = (re, replacement) => {
    if (!re.test(html)) throw new Error(`${label}: pattern not found in dist/index.html: ${re}`);
    html = html.replace(re, replacement);
  };
  const en = seo.lang === 'en';
  setTag(/<html lang="[^"]*"/, `<html lang="${en ? 'en' : 'es-AR'}"`);
  setTag(/<title>.*?<\/title>/s, `<title>${esc(seo.title)}</title>`);
  setTag(/<meta name="description" content="[^"]*"\s*\/?>/, `<meta name="description" content="${esc(seo.description)}" />`);
  if (seo.keywords) {
    setTag(/<meta name="keywords" content="[^"]*"\s*\/?>/, `<meta name="keywords" content="${esc(seo.keywords)}" />`);
  }
  setTag(/<link rel="canonical" href="[^"]*"\s*\/?>/, `<link rel="canonical" href="${esc(seo.url)}" />`);
  setTag(/<meta property="og:locale" content="[^"]*"\s*\/?>/, `<meta property="og:locale" content="${en ? 'en_US' : 'es_AR'}" />`);
  setTag(/<meta property="og:locale:alternate" content="[^"]*"\s*\/?>/, `<meta property="og:locale:alternate" content="${en ? 'es_AR' : 'en_US'}" />`);
  setTag(/<meta property="og:url" content="[^"]*"\s*\/?>/, `<meta property="og:url" content="${esc(seo.url)}" />`);
  setTag(/<meta property="og:title" content="[^"]*"\s*\/?>/, `<meta property="og:title" content="${esc(seo.title)}" />`);
  setTag(/<meta property="og:description" content="[^"]*"\s*\/?>/, `<meta property="og:description" content="${esc(seo.description)}" />`);
  setTag(/<meta property="og:image" content="[^"]*"\s*\/?>/, `<meta property="og:image" content="${esc(seo.image)}" />`);
  setTag(/<meta property="og:image:alt" content="[^"]*"\s*\/?>/, `<meta property="og:image:alt" content="${esc(seo.title)}" />`);
  setTag(/<meta name="twitter:title" content="[^"]*"\s*\/?>/, `<meta name="twitter:title" content="${esc(seo.title)}" />`);
  setTag(/<meta name="twitter:description" content="[^"]*"\s*\/?>/, `<meta name="twitter:description" content="${esc(seo.description)}" />`);
  setTag(/<meta name="twitter:image" content="[^"]*"\s*\/?>/, `<meta name="twitter:image" content="${esc(seo.image)}" />`);
  // The template's own hreflang block is the homepage's — replace it, don't
  // add a second one next to it.
  setTag(
    /<link rel="alternate" hreflang="es" href="[^"]*"\s*\/?>\s*<link rel="alternate" hreflang="en" href="[^"]*"\s*\/?>\s*<link rel="alternate" hreflang="x-default" href="[^"]*"\s*\/?>/,
    `<link rel="alternate" hreflang="es" href="${esc(seo.urlEs)}" />\n    <link rel="alternate" hreflang="en" href="${esc(seo.urlEn)}" />\n    <link rel="alternate" hreflang="x-default" href="${esc(seo.urlEs)}" />`,
  );
  // Additive: the site-wide WebSite/Organization JSON-LD stays; this is a
  // second, page-specific graph — multiple JSON-LD blocks per page is valid.
  const graph = { '@context': 'https://schema.org', '@graph': seo.jsonLd };
  const script = `    <script type="application/ld+json">${JSON.stringify(graph).replace(/</g, '\\u003c')}</script>\n`;
  setTag(/<\/head>/, `${script}  </head>`);
  return html;
}
