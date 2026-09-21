/**
 * End-to-end checks for the promises the app makes when the signal is gone.
 *
 * These exist because a silent regression already happened once: the service
 * worker was asked for inside a `load` listener registered after `load` had
 * fired, so it never installed, nothing was cached, and "works offline" was
 * false for months without a single error in the console. Nothing here mocks
 * the app — it runs the real exported bundle, the real service worker and the
 * real device storage, with the network actually cut.
 *
 *   npm run build:web && npm run test:offline
 */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;
const PORT = Number(process.env.TEST_PORT || 4610);
const TRAIL = '/ruta/fitz-roy-laguna-tres';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.geojson': 'application/geo+json',
};

/** Static server with SPA fallback — the same shape Netlify serves. */
function serveDist() {
  return createServer(async (req, res) => {
    const path = decodeURIComponent((req.url || '/').split('?')[0]);
    const candidate = join(DIST, normalize(path).replace(/^(\.\.[/\\])+/, ''));
    try {
      const info = await stat(candidate);
      if (info.isFile()) {
        const body = await readFile(candidate);
        res.writeHead(200, { 'content-type': TYPES[extname(candidate)] || 'application/octet-stream' });
        res.end(body);
        return;
      }
    } catch {
      // fall through to the SPA shell
    }
    try {
      const shell = await readFile(join(DIST, 'index.html'));
      res.writeHead(200, { 'content-type': TYPES['.html'] });
      res.end(shell);
    } catch {
      res.writeHead(500);
      res.end('dist/ missing — run npm run build:web first');
    }
  });
}

let failures = 0;
let checks = 0;

function check(label, ok, detail = '') {
  checks += 1;
  if (!ok) failures += 1;
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label}${detail ? `  — ${detail}` : ''}`);
}

const server = serveDist();
await new Promise((resolve) => server.listen(PORT, resolve));
const base = `http://localhost:${PORT}`;
console.log(`serving dist on ${base}\n`);

const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM || undefined,
});
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },      // phone first
  permissions: ['geolocation'],
  geolocation: { latitude: -49.3369, longitude: -72.8956 }, // Fitz Roy trailhead
});

async function dismissBanners(page) {
  const accept = page.getByText(/^Acepto$/).first();
  if (await accept.count()) await accept.click().catch(() => {});
  await page.waitForTimeout(300);
}

try {
  // ── 1. The service worker installs and takes control ──────────────────
  console.log('service worker');
  let page = await ctx.newPage();
  await page.goto(base + TRAIL, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  const registered = await page.evaluate(async () => !!(await navigator.serviceWorker?.getRegistration()));
  check('registers on first visit', registered);

  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  const controlled = await page.evaluate(() => !!navigator.serviceWorker?.controller);
  check('controls the page after a reload', controlled);

  const cached = await page.evaluate(async () => {
    const names = await caches.keys();
    const shell = names.find((n) => n.startsWith('sliabh-v'));
    if (!shell) return { shell: false, bundle: false };
    const keys = await (await caches.open(shell)).keys();
    return {
      shell: keys.some((r) => new URL(r.url).pathname === '/'),
      bundle: keys.some((r) => /\/_expo\/.*\.js$/.test(new URL(r.url).pathname)),
    };
  });
  check('caches the app shell', cached.shell);
  check('caches the hashed app bundle', cached.bundle, 'without it an offline visit renders a blank page');

  // ── 2. The trail comes back after quitting the browser, with no network ──
  console.log('\noffline revisit');
  await page.close();                 // the user quits Chrome
  await ctx.setOffline(true);
  page = await ctx.newPage();
  await page.goto(base + TRAIL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);
  check('trail page renders offline', (await page.getByText(/Fitz Roy/).count()) > 0);
  check('sun almanac renders offline', (await page.getByText(/Sol y coordenadas/).count()) > 0);
  check('record button is reachable offline', (await page.getByText(/Grabar recorrido/).count()) > 0);

  // ── 3. Recording offline is written to storage as it happens ──────────
  console.log('\noffline recording');
  await dismissBanners(page);
  await page.getByText(/Grabar recorrido/).first().click();
  await page.waitForTimeout(2000);
  check('hike mode opens offline', (await page.getByText(/CAMINATA ACTIVA/).count()) > 0);
  check('shows it is recording without signal', (await page.getByText(/sin señal|offline/i).count()) > 0);

  const LEGS = [
    [-49.3283, -72.8982], [-49.3195, -72.9048], [-49.3108, -72.9148],
    [-49.3058, -72.9228], [-49.2978, -72.9348],
  ];
  for (const [latitude, longitude] of LEGS) {
    await ctx.setGeolocation({ latitude, longitude });
    await page.waitForTimeout(700);
  }
  await page.waitForTimeout(1000);

  const live = await page.evaluate(() => {
    const raw = localStorage.getItem('live-hike-v1');
    return raw ? JSON.parse(raw) : null;
  });
  check('in-progress track is on disk mid-hike', !!live && live.p?.length >= 3,
    live ? `${live.p?.length ?? 0} points persisted` : 'nothing written');

  // ── 4. Killing the browser mid-hike must not end the recording ────────
  //
  // This is the case that failed in the field: the walk was on disk, but the
  // app came back to an ordinary page with nothing recording, and the walker
  // had no way to know. Coming back has to mean coming back *to the
  // recording*, still running.
  console.log('\ncrash recovery');
  const pointsBeforeCrash = live?.p?.length ?? 0;
  await page.reload({ waitUntil: 'domcontentloaded' });   // the OS reclaims the tab
  await page.waitForTimeout(4000);

  const survived = await page.evaluate(() => {
    const raw = localStorage.getItem('live-hike-v1');
    return raw ? JSON.parse(raw).p.length : 0;
  });
  check('the track survives the reload', survived >= pointsBeforeCrash && survived >= 3,
    `${survived} points still stored`);

  check('the recording screen comes back by itself',
    (await page.getByText(/CAMINATA ACTIVA/).count()) > 0);
  check('it says the recording was resumed',
    (await page.getByText(/retomada|resumed/i).count()) > 0);

  // Keep walking: the resumed screen must still be appending fixes.
  const MORE = [[-49.2920, -72.9430], [-49.2880, -72.9520], [-49.2840, -72.9600]];
  for (const [latitude, longitude] of MORE) {
    await ctx.setGeolocation({ latitude, longitude });
    await page.waitForTimeout(800);
  }
  await page.waitForTimeout(1200);
  const afterResume = await page.evaluate(() => {
    const raw = localStorage.getItem('live-hike-v1');
    return raw ? JSON.parse(raw).p.length : 0;
  });
  check('it keeps recording after coming back', afterResume > survived,
    `${survived} → ${afterResume} points`);

  const sameStart = await page.evaluate(() => {
    const raw = localStorage.getItem('live-hike-v1');
    return raw ? JSON.parse(raw).startedAt : null;
  });
  check('the resumed walk is the same walk, not a new one',
    !!sameStart && new Date(sameStart).getTime() < Date.now() - 4000,
    `started ${sameStart}`);

  // ── 4b. A session abandoned hours ago is offered back instead ──────────
  await page.evaluate(() => {
    const raw = localStorage.getItem('live-hike-v1');
    if (!raw) return;
    const s = JSON.parse(raw);
    s.updatedAt = new Date(Date.now() - 9 * 3600_000).toISOString();
    localStorage.setItem('live-hike-v1', JSON.stringify(s));
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(4000);
  await dismissBanners(page);
  const offered = (await page.getByText(/Quedó una caminata sin cerrar/).count()) > 0;
  check('a hike abandoned hours ago is offered back, not resumed', offered);

  if (offered) {
    await page.getByText(/Guardarla/).first().click();
    await page.waitForTimeout(2500);
    const queued = await page.evaluate(() => {
      const raw = localStorage.getItem('track-queue');
      if (!raw) return 0;
      try { return JSON.parse(raw).state?.pending?.length ?? 0; } catch { return 0; }
    });
    check('recovering it files the hike for upload', queued >= 1, `${queued} queued`);
    const cleared = await page.evaluate(() => localStorage.getItem('live-hike-v1') === null);
    check('the recovered session is not offered twice', cleared);
  }

  // ── 5. Stopping offline keeps the hike and says so ────────────────────
  console.log('\nstopping with no signal');
  await page.evaluate(() => localStorage.removeItem('track-queue'));
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  await dismissBanners(page);
  await page.getByText(/Grabar recorrido/).first().click();
  await page.waitForTimeout(1800);
  for (const [latitude, longitude] of LEGS) {
    await ctx.setGeolocation({ latitude, longitude });
    await page.waitForTimeout(600);
  }
  await page.getByText(/Detener/).first().click();
  await page.waitForTimeout(3000);

  check('tells the walker the hike is on the device',
    (await page.getByText(/Guardado en este dispositivo/).count()) > 0);
  const pending = await page.evaluate(() => {
    const raw = localStorage.getItem('track-queue');
    if (!raw) return 0;
    try { return JSON.parse(raw).state?.pending?.length ?? 0; } catch { return 0; }
  });
  check('the stopped hike is queued for upload', pending >= 1, `${pending} queued`);
  // ── 6. The walker can find their hikes from the menu ──────────────────
  console.log('\nmy hikes page');
  await page.goto(base + '/mis-recorridos', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);
  check('the hikes page opens offline', (await page.getByText(/Mis recorridos/).count()) > 0);
  check('it lists what is waiting to upload',
    (await page.getByText(/esperando subir|waiting to upload/i).count()) > 0);
} finally {
  await browser.close();
  server.close();
}

console.log(`\n${failures === 0 ? 'PASS' : 'FAIL'} — ${checks - failures}/${checks} checks passed`);
process.exit(failures === 0 ? 0 : 1);
