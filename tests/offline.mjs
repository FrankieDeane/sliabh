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

/**
 * Wait for what the check is actually about, rather than for the network to
 * fall silent.
 *
 * `networkidle` made this suite depend on every external service the page
 * touches — Supabase, remote images — answering within the timeout. It passed
 * where those hosts were unreachable and failed on a runner where they were
 * not, which is the wrong way round and tells us nothing about the worker.
 */
async function waitFor(page, condition, timeoutMs = 25_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await page.evaluate(condition).catch(() => false)) return true;
    await page.waitForTimeout(250);
  }
  return false;
}

try {
  // ── 1. The service worker installs and takes control ──────────────────
  console.log('service worker');
  let page = await ctx.newPage();
  await page.goto(base + TRAIL, { waitUntil: 'domcontentloaded' });
  const registered = await waitFor(page, async () => !!(await navigator.serviceWorker?.getRegistration()));
  check('registers on first visit', registered);

  await page.reload({ waitUntil: 'domcontentloaded' });
  const controlled = await waitFor(page, () => !!navigator.serviceWorker?.controller);
  check('controls the page after a reload', controlled);

  // Precaching happens after the worker takes over, so wait for the bundle to
  // land rather than assuming a fixed number of seconds is enough on a slow
  // runner.
  await waitFor(page, async () => {
    const names = await caches.keys();
    const shell = names.find((n) => n.startsWith('sliabh-v'));
    if (!shell) return false;
    const keys = await (await caches.open(shell)).keys();
    return keys.some((r) => /\/_expo\/.*\.js$/.test(new URL(r.url).pathname));
  });
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
  // A point is [lat, lon, t] or [lat, lon, t, alt]. Anything else means the
  // storage format drifted, and a reader pinned to one length would silently
  // drop every point rather than fail loudly.
  check('each stored point has a readable shape',
    !!live && live.p.every((pt) => Array.isArray(pt) && (pt.length === 3 || pt.length === 4)),
    'lat, lon, t, and altitude when the device reported one');
  // The climb and the pace are on screen while walking, not only afterwards.
  check('the hike screen shows the climb', (await page.getByText(/^Desnivel$/i).count()) > 0);
  check('the hike screen shows the pace', (await page.getByText(/^Ritmo$/i).count()) > 0);
  // Five figures where there were three. Mobile is the case that matters, and
  // a stat strip that overflows a 390 px phone is worse than one stat fewer —
  // the walker would have to scroll sideways mid-hike to read their climb.
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return { scroll: doc.scrollWidth, client: doc.clientWidth };
  });
  check('the hike screen does not scroll sideways on a phone',
    overflow.scroll <= overflow.client + 1,
    `${overflow.scroll}px of content in ${overflow.client}px`);

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

  // ── 7. A share link opened with no signal must say so, not spin ────────
  console.log('\nshared hike link');
  await page.goto(base + '/recorrido/sin-conexion-test', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(11_000);   // longer than the read timeout
  check('a share link with no connection explains itself',
    (await page.getByText(/no está disponible|not available/i).count()) > 0,
    'it must never sit on a spinner');

  // ── 8. A climb is reported, and never invented ────────────────────────
  //
  // Elevation gain is the number a hiker plans a day around, and the seven
  // hikes recorded before altitude was captured have none. Showing them a
  // confident "+0 m" would be a lie the screen has no way to walk back, so the
  // two cases are asserted against each other on the real page.
  console.log('\nclimb and pace');
  {
    const seeded = await ctx.newPage();
    await seeded.goto(base + '/mis-recorridos', { waitUntil: 'domcontentloaded' });
    await seeded.evaluate(() => {
      // A 300 m climb, sampled finely enough to clear the smoothing window,
      // and a second walk with no altitude at all.
      const climb = Array.from({ length: 120 }, (_, i) => [
        -49.33 + i * 0.0002, -72.9, 1_700_000_000_000 + i * 5000, Math.round(600 + i * 2.5),
      ]);
      const flat = Array.from({ length: 120 }, (_, i) => [
        -41.13 + i * 0.0002, -71.3, 1_700_000_000_000 + i * 5000,
      ]);
      const toPoints = (raw) => raw.map(([lat, lon, t, alt]) =>
        alt === undefined ? { lat, lon, t } : { lat, lon, t, alt });
      localStorage.setItem('track-queue', JSON.stringify({
        version: 0,
        state: {
          pending: [
            { id: 'climb', queuedAt: new Date().toISOString(), trailId: 'recorrido-libre',
              points: toPoints(climb), distanceKm: 2.7, durationS: 3600,
              startedAt: new Date(1_700_000_000_000).toISOString() },
            { id: 'flat', queuedAt: new Date().toISOString(), trailId: 'recorrido-libre',
              points: toPoints(flat), distanceKm: 2.7, durationS: 3600,
              startedAt: new Date(1_700_000_100_000).toISOString() },
          ],
        },
      }));
    });
    await seeded.reload({ waitUntil: 'domcontentloaded' });
    await seeded.waitForTimeout(3000);
    const body = await seeded.evaluate(() => document.body.innerText);

    check('a hike with altitude reports its climb', /\+2\d\d m|\+3\d\d m/.test(body),
      (body.match(/\+\d+ m/) || ['none'])[0]);
    check('a hike without altitude shows a dash, not a zero', !/\+0 m/.test(body),
      '"+0 m" would claim a mountain was flat');
    check('pace is shown per hike', /\d+'\d\d"/.test(body),
      (body.match(/\d+'\d\d"/) || ['none'])[0]);
    await seeded.close();
  }

  // ── 9. Each browser is told what *it* can do, not what "the web" can ──
  //
  // A walker on an iPhone and one on Android hit different limits and need
  // different settings changed, so one sentence for both is wrong for at least
  // one of them. Real user agents, real render, real text on the page.
  console.log('\nper-browser honesty');
  const AGENTS = [
    {
      name: 'Chrome on Android',
      ua: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
      labelled: /Con la pantalla apagada · Chrome/,
      advice: /apagar la pantalla.*sigue grabando/i,
      setting: /Batería → Sin restricciones/i,
      notSetting: /Bloqueo automático/i,
    },
    {
      name: 'Safari on iPhone',
      ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
      labelled: /Con la pantalla apagada · Safari/,
      advice: /mantiene la pantalla encendida sola/i,
      setting: /Bloqueo automático/i,
      notSetting: /Batería → Sin restricciones/i,
    },
  ];

  for (const agent of AGENTS) {
    const agentCtx = await browser.newContext({
      viewport: { width: 390, height: 844 },
      permissions: ['geolocation'],
      geolocation: { latitude: -49.3369, longitude: -72.8956 },
      userAgent: agent.ua,
    });
    const agentPage = await agentCtx.newPage();
    await agentPage.goto(base + TRAIL, { waitUntil: 'domcontentloaded' });
    await agentPage.waitForTimeout(3500);
    await dismissBanners(agentPage);
    const body = await agentPage.evaluate(() => document.body.innerText);

    check(`${agent.name}: the row names the browser in hand`,
      agent.labelled.test(body));
    check(`${agent.name}: says what this engine actually does`,
      agent.advice.test(body));
    check(`${agent.name}: gives the setting that exists on this OS`,
      agent.setting.test(body));
    check(`${agent.name}: never gives the other platform's setting`,
      !agent.notSetting.test(body),
      'telling an iPhone user to open Android battery settings is worse than saying nothing');

    await agentCtx.close();
  }
} finally {
  await browser.close();
  server.close();
}

console.log(`\n${failures === 0 ? 'PASS' : 'FAIL'} — ${checks - failures}/${checks} checks passed`);
process.exit(failures === 0 ? 0 : 1);
