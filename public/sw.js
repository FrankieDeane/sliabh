/* Sliabh — Service Worker v29
   - Precache the offline map shell (parques.html + vendored MapLibre/jsPDF)
     so the map works on the very first offline visit.
   - Tile caching now matches the providers the map actually uses (ESRI World
     Imagery + terrarium DEM), and retains any tile fetched while online so
     browsing an area online makes it available offline.
   - v29: SPA navigation fallback skips per-route lookup — every non-.html
     navigation request falls directly back to cached '/', which is correct
     for a single-output SPA and avoids serving a stale or missing route. */
const CACHE = 'sliabh-v29';
const TILE_CACHE = 'sliabh-tiles-v1';

// Same-origin assets the offline map needs. Kept small and stable; the
// content-hashed app bundle is cached at runtime (cache-first) on first load.
const PRECACHE_URLS = [
  '/',
  '/parques.html',
  '/vendor/maplibre-gl-4.7.1.js',
  '/vendor/maplibre-gl-4.7.1.css',
  '/vendor/jspdf-2.5.1.umd.min.js',
  '/provincias-argentina.geojson',
];

// Hosts that serve map tiles — cached tile-first, then retained on fetch.
function isTileHost(url) {
  const h = url.hostname;
  return (
    h.includes('arcgisonline.com') ||   // ESRI World Imagery (satellite base)
    h.includes('tile') ||               // *.tile.openstreetmap.org, tile.opentopomap.org
    h.includes('openstreetmap') ||
    (h.includes('amazonaws.com') && url.pathname.includes('elevation-tiles')) // terrarium DEM
  );
}

// The app bundle is content-hashed at build time, so its filename can't be
// listed above. Read it out of the shell instead: without the bundle cached,
// an offline visit serves index.html and then renders nothing at all.
async function precacheAppBundle(cache) {
  try {
    const res = await fetch('/', { cache: 'reload' });
    if (!res || !res.ok) return;
    await cache.put('/', res.clone());
    const html = await res.text();
    const assets = new Set();
    for (const m of html.matchAll(/(?:src|href)="(\/_expo\/[^"]+\.(?:js|css))"/g)) assets.add(m[1]);
    await Promise.allSettled([...assets].map((u) => cache.add(u)));
  } catch {
    // offline at install time — the runtime cache below still fills in later
  }
}

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then(async (c) => {
      // Tolerate individual failures so one bad asset can't block activation.
      await Promise.allSettled(PRECACHE_URLS.map((u) => c.add(u)));
      await precacheAppBundle(c);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE && k !== TILE_CACHE)
          .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;

  // Media / Range requests — let the browser talk to the network directly.
  // The Cache API matches by URL and ignores the Range header, so caching a
  // 206 here would replay one arbitrary byte-slice for every future request
  // and break <video> seeking/playback.
  if (e.request.headers.has('range') || url.pathname.endsWith('.mp4')) return;

  // Map tiles — cache-first, and retain anything fetched online so panning an
  // area while connected makes it available offline. Populated eagerly by the
  // in-app "download offline" buttons.
  if (isTileHost(url)) {
    e.respondWith(
      caches.open(TILE_CACHE).then((c) =>
        c.match(e.request.url).then((cached) => {
          if (cached) return cached;
          return fetch(e.request).then((res) => {
            if (res && res.ok) c.put(e.request.url, res.clone());
            return res;
          });
        })
      )
    );
    return;
  }

  // HTML pages and navigation — network-first; SPA-aware offline fallback.
  // For explicit .html requests (parques.html, etc.) try the specific URL first.
  // For all other navigation (SPA routes like /mis-recorridos, /rutas, etc.)
  // skip straight to the cached shell — those paths have no separate HTML file.
  const isHtml =
    e.request.mode === 'navigate' ||
    url.pathname.endsWith('.html') ||
    url.pathname === '/' ||
    url.pathname === '';
  if (isHtml) {
    const isExplicitHtmlFile = url.pathname.endsWith('.html');
    e.respondWith(
      fetch(e.request).catch(() => {
        if (isExplicitHtmlFile) {
          return (
            caches.match(e.request, { ignoreSearch: true }).then(
              (r) => r || caches.match('/', { ignoreSearch: true }),
            )
          );
        }
        // SPA route: always serve the app shell from cache.
        return caches.match('/', { ignoreSearch: true }).then(
          (r) => r || new Response(
            '<h1>Offline</h1><p>Abrí la app una vez con señal para activar el modo offline.</p>',
            { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
          ),
        );
      })
    );
    return;
  }

  // Static assets (JS, CSS, images, fonts) — cache-first with network fallback
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((res) => {
        if (res.status === 200 && url.origin === self.location.origin) {
          caches.open(CACHE).then((c) => c.put(e.request, res.clone()));
        }
        return res;
      }).catch(() => new Response('Offline', { status: 503 }));
    })
  );
});
