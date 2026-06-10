import React from 'react';
import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * Custom HTML template for the static web export (Expo Router).
 * This replaces the default shell — head tags here ship to production.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/* Favicon */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/favicon.svg" />

        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#16a34a" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Sliabh" />

        {/* SEO */}
        <title>Sliabh — Explora la montaña</title>
        <meta
          name="description"
          content="La plataforma de senderismo para explorar Argentina. Rutas, mapas offline, planificación y guías de supervivencia."
        />
        <meta property="og:title" content="Sliabh — Explora la montaña" />
        <meta property="og:description" content="Rutas, mapas offline y planificación para Argentina." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Sliabh" />
        <meta name="twitter:description" content="La plataforma de senderismo para explorar Argentina." />

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
      </head>
      <body>{children}</body>
    </html>
  );
}
