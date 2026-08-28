import React from 'react';
import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * Custom HTML template for the static web export (Expo Router).
 *
 * NOT CURRENTLY LIVE: web.output is "single" (see app.json / netlify.toml),
 * a client-only SPA export, and Expo Router only runs +html.tsx for
 * "static"/"server" output — so none of the SEO <head> content below
 * (title, description, OG, Twitter, JSON-LD) reaches production today.
 * The PWA bits still work because app/_layout.tsx injects them at runtime
 * separately. The live equivalent of this file's SEO tags is
 * src/components/ui/SiteHead.tsx, mounted in the root layout — keep the two
 * in sync, or better, make SiteHead the only source of truth. This file
 * would become live again if output ever switches to "static".
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/* Favicon */}
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/favicon.png" />

        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#16a34a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Sliabh" />

        {/* SEO */}
        <title>Sliabh — Senderismo y trekking en Argentina | Rutas, mapas 3D y GPS offline</title>
        <meta
          name="description"
          content="Sliabh: la plataforma de senderismo para explorar los Parques Nacionales de Argentina. Rutas y senderos con mapas 3D, GPS y mapas offline, planificación y guías de supervivencia. El Chaltén, Bariloche, Tierra del Fuego y más."
        />
        <meta
          name="keywords"
          content="senderismo Argentina, trekking Argentina, rutas de montaña, parques nacionales, mapas offline, GPS senderos, El Chaltén, Bariloche, Tierra del Fuego, Patagonia, Fitz Roy, Cerro Torre, hiking Argentina"
        />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta name="author" content="Sliabh" />
        <link rel="canonical" href="https://sliabh.netlify.app/" />

        {/* Open Graph */}
        <meta property="og:site_name" content="Sliabh" />
        <meta property="og:locale" content="es_AR" />
        <meta property="og:locale:alternate" content="en_US" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://sliabh.netlify.app/" />
        <meta property="og:title" content="Sliabh — Senderismo y trekking en Argentina" />
        <meta property="og:description" content="Rutas y senderos con mapas 3D, GPS y mapas offline, planificación y guías de supervivencia para los Parques Nacionales de Argentina." />
        <meta property="og:image" content="https://sliabh.netlify.app/og-image.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Senderismo en la Patagonia argentina" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Sliabh — Senderismo y trekking en Argentina" />
        <meta name="twitter:description" content="Rutas, mapas 3D, GPS offline y planificación para los Parques Nacionales de Argentina." />
        <meta name="twitter:image" content="https://sliabh.netlify.app/og-image.jpg" />

        {/* Structured data (schema.org) for rich results */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'WebSite',
                  '@id': 'https://sliabh.netlify.app/#website',
                  url: 'https://sliabh.netlify.app/',
                  name: 'Sliabh',
                  description: 'Plataforma de senderismo y trekking para los Parques Nacionales de Argentina.',
                  inLanguage: 'es-AR',
                  potentialAction: {
                    '@type': 'SearchAction',
                    target: 'https://sliabh.netlify.app/rutas?q={search_term_string}',
                    'query-input': 'required name=search_term_string',
                  },
                },
                {
                  '@type': 'Organization',
                  '@id': 'https://sliabh.netlify.app/#organization',
                  name: 'Sliabh',
                  url: 'https://sliabh.netlify.app/',
                  logo: 'https://sliabh.netlify.app/SLIABH_Logo_Transparent.png',
                  description: 'Rutas, mapas 3D, GPS offline y planificación para explorar la montaña en Argentina.',
                },
              ],
            }),
          }}
        />

        <ScrollViewStyleReset />

        {/* Base background + scrollbar styling */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body, #root { height: 100%; margin: 0; padding: 0; }
              body { background-color: #060d1b; overflow-x: hidden; }
              ::-webkit-scrollbar { width: 6px; }
              ::-webkit-scrollbar-track { background: #070b14; }
              ::-webkit-scrollbar-thumb { background: #1e2d42; border-radius: 3px; }
              ::-webkit-scrollbar-thumb:hover { background: #16a34a; }
            `,
          }}
        />

        {/* Service worker registration for offline support */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function () {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />

        {/* Boot watchdog: if the JS bundle never boots (failed fetch on bad
            signal, stale service-worker cache, crashed script), the page is
            otherwise a permanent silent black screen. First stall: silently
            drop SW + caches once and reload fresh. Second stall: show a
            visible retry screen instead of black. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                setTimeout(function () {
                  var root = document.getElementById('root');
                  if (root && root.childElementCount > 0) return;
                  try {
                    if (!sessionStorage.getItem('sliabh-boot-retry')) {
                      sessionStorage.setItem('sliabh-boot-retry', '1');
                      var reload = function () { location.reload(); };
                      var jobs = [];
                      if (navigator.serviceWorker && navigator.serviceWorker.getRegistrations) {
                        jobs.push(navigator.serviceWorker.getRegistrations().then(function (rs) {
                          return Promise.all(rs.map(function (r) { return r.unregister(); }));
                        }));
                      }
                      if (window.caches && caches.keys) {
                        jobs.push(caches.keys().then(function (ks) {
                          return Promise.all(ks.map(function (k) { return caches.delete(k); }));
                        }));
                      }
                      Promise.all(jobs).then(reload, reload);
                      return;
                    }
                  } catch (e) {}
                  var el = document.createElement('div');
                  el.style.cssText = 'position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;background:#060d1b;color:#f0f9ff;font-family:sans-serif;padding:24px;text-align:center;z-index:99999';
                  el.innerHTML = '<div style="font-size:34px">\\u26F0</div>' +
                    '<div style="font-weight:700">Sliabh no pudo cargar</div>' +
                    '<div style="color:#94a3b8;font-size:13px;max-width:280px">Revis\\u00E1 tu conexi\\u00F3n e intent\\u00E1 de nuevo. / Check your connection and try again.</div>' +
                    '<button onclick="location.reload()" style="margin-top:6px;background:#16a34a;color:#fff;border:none;border-radius:999px;padding:10px 22px;font-weight:700;font-size:14px;cursor:pointer">Reintentar / Retry</button>';
                  document.body.appendChild(el);
                }, 20000);
              })();
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
