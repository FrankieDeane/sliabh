/* Sliabh — Service Worker v1 */
const CACHE = 'sliabh-v1';
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
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  // Skip non-GET, cross-origin tile requests, analytics
  if (e.request.method !== 'GET') return;
  if (url.hostname.includes('tile') || url.hostname.includes('openstreetmap')) return;

  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((res) => {
        if (res.ok && url.origin === self.location.origin) {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, clone));
        }
        return res;
      }).catch(() => caches.match('/') || new Response('Offline', { status: 503 }));
    })
  );
});
