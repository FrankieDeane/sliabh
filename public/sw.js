/* Sliabh — Service Worker v26 (cache bump: purge partial (206) video
   responses that v25 could cache under the full URL and then serve for
   every Range request, stalling hero-video playback on repeat visits) */
const CACHE = 'sliabh-v26';
const TILE_CACHE = 'sliabh-tiles-v1';

self.addEventListener('install', (e) => {
  e.waitUntil(self.skipWaiting());
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

  // Map tiles — cache-first (populated by in-app download buttons)
  if (url.hostname.includes('tile') || url.hostname.includes('openstreetmap')) {
    e.respondWith(
      caches.open(TILE_CACHE).then((c) =>
        c.match(e.request.url).then((cached) => cached || fetch(e.request))
      )
    );
    return;
  }

  // HTML pages and navigation — ALWAYS network-first, never serve stale HTML
  const isHtml =
    e.request.mode === 'navigate' ||
    url.pathname.endsWith('.html') ||
    url.pathname === '/' ||
    url.pathname === '';
  if (isHtml) {
    e.respondWith(
      fetch(e.request).catch(() =>
        caches.match(e.request).then((r) => r || caches.match('/'))
      )
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
