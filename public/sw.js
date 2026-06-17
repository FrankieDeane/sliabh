/* Sliabh — Service Worker v21 */
const CACHE = 'sliabh-v21';
const SHELL = [
  '/',
  '/index.html',
  '/(tabs)/inicio',
  '/(tabs)/supervivencia',
  '/(tabs)/rutas',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE && k !== 'sliabh-tiles-v1').map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

const TILE_CACHE = 'sliabh-tiles-v1';

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;

  // Map tiles: cache-first against the offline tile cache populated by
  // the in-app "Descargar" buttons, falling back to network.
  if (url.hostname.includes('tile') || url.hostname.includes('openstreetmap')) {
    e.respondWith(
      caches.open(TILE_CACHE).then((c) =>
        c.match(e.request.url).then((cached) => cached || fetch(e.request))
      )
    );
    return;
  }

  // Network-first: always try to get fresh content, fall back to cache offline
  e.respondWith(
    fetch(e.request).then((res) => {
      if (res.ok && url.origin === self.location.origin) {
        const clone = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, clone));
      }
      return res;
    }).catch(() => caches.match(e.request).then((cached) => cached || caches.match('/') || new Response('Offline', { status: 503 })))
  );
});
