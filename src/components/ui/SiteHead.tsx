import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import Head from 'expo-router/head';
import { useLangStore } from '../../store/langStore';

const SITE_URL = 'https://sliabh.com.ar';

const COPY = {
  es: {
    title: 'Sliabh — Senderismo y trekking en Argentina | Rutas, mapas 3D y GPS offline',
    description:
      'Sliabh: la plataforma de senderismo para explorar los Parques Nacionales de Argentina. Rutas y senderos con mapas 3D, GPS y mapas offline, planificación y guías de supervivencia. El Chaltén, Bariloche, Tierra del Fuego y más.',
    ogTitle: 'Sliabh — Senderismo y trekking en Argentina',
    ogDescription:
      'Rutas y senderos con mapas 3D, GPS y mapas offline, planificación y guías de supervivencia para los Parques Nacionales de Argentina.',
    twitterDescription:
      'Rutas, mapas 3D, GPS offline y planificación para los Parques Nacionales de Argentina.',
    keywords:
      'senderismo Argentina, trekking Argentina, rutas de montaña, parques nacionales, mapas offline, GPS senderos, El Chaltén, Bariloche, Tierra del Fuego, Patagonia, Fitz Roy, Cerro Torre',
    imageAlt: 'Senderismo en la Patagonia argentina',
    websiteDescription: 'Plataforma de senderismo y trekking para los Parques Nacionales de Argentina.',
    orgDescription: 'Rutas, mapas 3D, GPS offline y planificación para explorar la montaña en Argentina.',
    locale: 'es_AR',
    localeAlt: 'en_US',
    htmlLang: 'es',
    inLanguage: 'es-AR',
  },
  en: {
    title: 'Sliabh — Hiking & Trekking in Argentina | Trails, 3D Maps & Offline GPS',
    description:
      'Sliabh: plan your hike through Argentina’s National Parks — Patagonia, El Chaltén, Bariloche and Tierra del Fuego. Trail guides with 3D maps, offline GPS tracks, and survival planning, built for hikers travelling from Europe and the US.',
    ogTitle: 'Sliabh — Hiking & Trekking in Argentina',
    ogDescription:
      'Trail guides with 3D maps, offline GPS tracks, and trip planning for Argentina’s National Parks — Patagonia, El Chaltén, Bariloche, Tierra del Fuego.',
    twitterDescription:
      'Trails, 3D maps, offline GPS and trip planning for Argentina’s National Parks.',
    keywords:
      'hiking Argentina, trekking Patagonia, Patagonia hiking trails, Argentina national parks, El Chaltén hiking, Fitz Roy trek, Bariloche trekking, backpacking Patagonia, self-guided trekking Argentina, offline GPS hiking app, hiking maps Argentina, Torres del Paine alternative, South America trekking',
    imageAlt: 'Hiking in Argentine Patagonia',
    websiteDescription: 'A hiking and trekking platform for Argentina’s National Parks.',
    orgDescription: 'Trails, 3D maps, offline GPS and trip planning to explore the mountains of Argentina.',
    locale: 'en_US',
    localeAlt: 'es_AR',
    htmlLang: 'en',
    inLanguage: 'en',
  },
} as const;

/**
 * Site-wide default <head> tags (title, description, OG, Twitter, canonical,
 * Organization/WebSite JSON-LD), mounted once at the root layout.
 *
 * Language-aware: reads useLangStore so a real visitor who switched to
 * English (the audience this targets — hikers in Europe/the US researching
 * Argentina) gets English tab title/meta/social-share tags, not just the
 * in-page copy. This only reaches hydrated browsers, same caveat as below —
 * crawlers get the English variant from the prerendered /en/index.html
 * (see scripts/prerender-home.mjs) regardless of this component.
 *
 * Why this exists instead of just app/+html.tsx: with web.output:"single"
 * (a client-only SPA — see netlify.toml), Expo Router does NOT process
 * +html.tsx at all — that file only applies to "static"/"server" output.
 * The exported dist/index.html ships Expo's own bare-bones template instead
 * (just <title>Sliabh</title> and app.json's generic web.description), so
 * everything that used to live in +html.tsx's <head> — OG tags, Twitter
 * cards, canonical, keywords, the Organization/WebSite JSON-LD — was never
 * actually reaching production. This component restores it at runtime via
 * the same Helmet mechanism SeoHead (src/components/ui/SeoHead.tsx) uses
 * per-route, so a route's own <SeoHead> correctly overrides these defaults
 * (Helmet resolves duplicate title/meta tags by tree depth — a nested
 * route's tags win over this root-level default) instead of the two
 * silently duplicating.
 *
 * +html.tsx is left in place, unchanged — if the app ever switches to
 * web.output:"static" it becomes the real per-build static template again,
 * and this component's tags would just get overridden at hydration like any
 * other route's, so there's no conflict either way.
 */
export function SiteHead() {
  const lang = useLangStore((s) => s.lang);
  const c = COPY[lang];

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    document.documentElement.lang = c.htmlLang;
    // Expo's exported index.html ships its own pre-hydration <meta
    // name="description"> (from app.json's web.description) as a fallback
    // for the moment before this component's Helmet-managed tag takes over.
    // Helmet marks its own elements with data-rh="true" but applies them
    // asynchronously, so poll a few animation frames (rather than assume one
    // effect pass is enough) until it shows up, then drop the static one —
    // otherwise any tool that just reads "the first meta description" sees
    // the generic fallback instead of the current page's.
    let frame = 0;
    let raf: number;
    const tryCleanup = () => {
      const helmetTag = document.querySelector('meta[name="description"][data-rh]');
      if (helmetTag) {
        document.querySelectorAll('meta[name="description"]:not([data-rh])').forEach((el) => el.remove());
        return;
      }
      if (frame++ < 30) raf = requestAnimationFrame(tryCleanup);
    };
    raf = requestAnimationFrame(tryCleanup);
    return () => cancelAnimationFrame(raf);
  }, [c.htmlLang]);

  const url = lang === 'en' ? `${SITE_URL}/en` : `${SITE_URL}/`;

  return (
    <Head>
      <title>{c.title}</title>
      <meta name="description" content={c.description} />
      <meta name="keywords" content={c.keywords} />
      <meta name="robots" content="index, follow, max-image-preview:large" />
      <meta name="author" content="Sliabh" />
      <link rel="canonical" href={url} />
      <link rel="alternate" hrefLang="es" href={`${SITE_URL}/`} />
      <link rel="alternate" hrefLang="en" href={`${SITE_URL}/en`} />
      <link rel="alternate" hrefLang="x-default" href={`${SITE_URL}/`} />

      <meta property="og:site_name" content="Sliabh" />
      <meta property="og:locale" content={c.locale} />
      <meta property="og:locale:alternate" content={c.localeAlt} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={c.ogTitle} />
      <meta property="og:description" content={c.ogDescription} />
      <meta property="og:image" content={`${SITE_URL}/og-image.jpg`} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={c.imageAlt} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={c.ogTitle} />
      <meta name="twitter:description" content={c.twitterDescription} />
      <meta name="twitter:image" content={`${SITE_URL}/og-image.jpg`} />

      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'WebSite',
              '@id': `${SITE_URL}/#website`,
              url: `${SITE_URL}/`,
              name: 'Sliabh',
              description: c.websiteDescription,
              inLanguage: c.inLanguage,
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
              description: c.orgDescription,
            },
          ],
        })}
      </script>
    </Head>
  );
}
