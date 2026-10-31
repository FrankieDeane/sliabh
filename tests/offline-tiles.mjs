/**
 * El mapa offline tiene que leer lo que guardó el botón 💾, también después
 * de cerrar y reabrir la app, y no quedar en blanco al acercar de más.
 *
 * Corre el código real del protocolo de tiles (src/components/map/
 * offlineTilesJs.ts) en Chromium, con el Cache Storage real y sin red hacia
 * Esri, y comprueba que la copia de public/parques.html es idéntica.
 *
 *   npm run test:offline-tiles
 */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const ROOT = new URL('../', import.meta.url).pathname;
const PORT = Number(process.env.TEST_PORT || 4620);

let failures = 0;
function check(label, ok, detail = '') {
  console.log(`${ok ? '✓' : '✗'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures++;
}

const { OFFLINE_TILES_JS } = await import(new URL('../src/components/map/offlineTilesJs.ts', import.meta.url).href);
const parques = await readFile(`${ROOT}public/parques.html`, 'utf8');
check('parques.html lleva la misma copia del código de tiles offline', parques.includes(OFFLINE_TILES_JS));
check('parques.html pide los tiles a través del protocolo offline',
  (parques.match(/tiles: \[sliabhTiles\(/g) || []).length >= 4);
check('parques.html registra el service worker (para abrir sin señal en la app)',
  /navigator\.serviceWorker\.register\('\/sw\.js'\)/.test(parques));

const maplibre = await readFile(`${ROOT}public/vendor/maplibre-gl-4.7.1.js`, 'utf8');
const server = createServer((req, res) => {
  if (req.url.startsWith('/maplibre.js')) {
    res.writeHead(200, { 'content-type': 'text/javascript' });
    res.end(maplibre);
    return;
  }
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  res.end(`<!doctype html><html><body><script src="/maplibre.js"></script><script>${OFFLINE_TILES_JS}</script></body></html>`);
}).listen(PORT);

const SAT = 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile';
const SAT_OTHER_HOST = 'sliabhtile://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile';

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  // Sin señal hacia el servidor de tiles: todo lo que no esté guardado falla.
  await page.route(/arcgisonline\.com/, (route) => route.abort('internetdisconnected'));
  await page.goto(`http://localhost:${PORT}/`);

  check('el protocolo queda activo con MapLibre cargado', await page.evaluate(() => window.__sliabhTilesOn === true));
  check('las URLs de Esri pasan por el protocolo',
    await page.evaluate(() => window.sliabhTiles('https://x.test/tile/1/2/3') === 'sliabhtile://x.test/tile/1/2/3'));

  // Un tile z13 "descargado con 💾": una grilla de 4×4 colores distintos, para
  // poder ver qué parte usa el zoom más cercano.
  await page.evaluate(async (SAT) => {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 256;
    const g = cv.getContext('2d');
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      g.fillStyle = `rgb(${i * 60 + 10}, ${j * 60 + 10}, 128)`;
      g.fillRect(i * 64, j * 64, 64, 64);
    }
    const blob = await new Promise((r) => cv.toBlob(r, 'image/png'));
    const cache = await caches.open('sliabh-tiles-v1');
    await cache.put(`${SAT}/13/100/200`, new Response(blob, { headers: { 'content-type': 'image/png' } }));
  }, SAT);

  // Simula cerrar y reabrir la app: página nueva, misma caché en disco.
  await page.reload();

  const same = await page.evaluate(async (u) => {
    const buf = await window.__sliabhTileLoad(u);
    const cached = await (await (await caches.open('sliabh-tiles-v1')).match(u.replace('sliabhtile://server.', 'https://services.'))).arrayBuffer();
    return buf.byteLength > 0 && buf.byteLength === cached.byteLength;
  }, `${SAT_OTHER_HOST}/13/100/200`);
  check('sin señal, al reabrir, el tile guardado se lee de la caché (aunque lo pida otro host de Esri)', same);

  // z15: y = 100*4 + 1, x = 200*4 + 2 → la celda (columna 2, fila 1) del z13.
  const px = await page.evaluate(async (u) => {
    const buf = await window.__sliabhTileLoad(u);
    const img = await createImageBitmap(new Blob([buf]));
    const cv = document.createElement('canvas');
    cv.width = img.width; cv.height = img.height;
    const g = cv.getContext('2d');
    g.drawImage(img, 0, 0);
    const d = g.getImageData(128, 128, 1, 1).data;
    return { w: img.width, h: img.height, r: d[0], g: d[1] };
  }, `${SAT_OTHER_HOST}/15/401/802`).catch((e) => ({ error: String(e) }));
  const near = (a, b) => Math.abs(a - b) <= 6;
  check('acercando de más sin señal, muestra el tile guardado agrandado (no en blanco)',
    px.w === 256 && px.h === 256 && near(px.r, 2 * 60 + 10) && near(px.g, 1 * 60 + 10),
    JSON.stringify(px));

  const missing = await page.evaluate(async (u) => {
    try { await window.__sliabhTileLoad(u); return 'resolved'; } catch { return 'rejected'; }
  }, `${SAT_OTHER_HOST}/13/5000/5000`);
  check('un tile que nunca se guardó falla limpio (MapLibre lo deja vacío)', missing === 'rejected');
} finally {
  await browser.close();
  server.close();
}

if (failures) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('\nmapa offline: todo bien');
