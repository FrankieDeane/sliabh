/**
 * Arma las actualizaciones automáticas de la app y las deja en el sitio.
 *
 * Corre en Netlify después del build web (ver netlify.toml). Así cada merge a
 * sliabh-index publica, junto con el sitio, el código nuevo de la app, y los
 * teléfonos lo bajan solos desde sliabh.com.ar. Sin cuentas ni servicios
 * nuevos: el mismo sitio de siempre sirve de servidor de actualizaciones.
 *
 * Qué genera, dentro de dist/:
 *   app-updates/<id>/...                    el código (Hermes) y sus imágenes
 *   app-updates/<plataforma>/<runtime>.json  el "manifiesto" que lee la app
 *
 * <runtime> es la huella nativa (fingerprint.config.js). Un teléfono solo
 * recibe el manifiesto de SU huella: si un cambio nativo la mueve, los APK
 * viejos no encuentran nada para ellos y siguen con su código, sin romperse.
 * La edge function netlify/edge-functions/app-updates.ts elige el archivo.
 *
 * Formato: protocolo de expo-updates v1 (https://docs.expo.dev/technical-specs/expo-updates-1/).
 *
 *   node scripts/build-app-updates.mjs [--out dist] [--site https://sliabh.com.ar]
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const args = process.argv.slice(2);
const arg = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : def;
};
const OUT = arg('--out', 'dist');
const SITE = arg('--site', 'https://sliabh.com.ar').replace(/\/$/, '');
const PLATFORMS = ['android', 'ios'];

const MIME = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp',
  svg: 'image/svg+xml', ttf: 'font/ttf', otf: 'font/otf', woff: 'font/woff', woff2: 'font/woff2',
  json: 'application/json', mp4: 'video/mp4', mp3: 'audio/mpeg', wav: 'audio/wav',
};

const sha256url = (buf) => createHash('sha256').update(buf).digest('base64url');
const md5 = (buf) => createHash('md5').update(buf).digest('hex');

/** UUID estable a partir de un hash: el mismo código da el mismo id. */
function uuidFrom(hex) {
  const h = hex.slice(0, 32).split('');
  h[12] = '4';
  h[16] = ((parseInt(h[16], 16) & 0x3) | 0x8).toString(16);
  const s = h.join('');
  return `${s.slice(0, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}-${s.slice(16, 20)}-${s.slice(20, 32)}`;
}

function npx(cmdArgs) {
  return execFileSync('npx', cmdArgs, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'], maxBuffer: 256 * 1024 * 1024 });
}

const STRICT = args.includes('--strict');

async function main() {
const tmp = join(tmpdir(), `sliabh-app-updates-${process.pid}`);
rmSync(tmp, { recursive: true, force: true });
console.log('[app-updates] exportando el código de la app (android + ios)…');
execFileSync('npx', ['expo', 'export', ...PLATFORMS.flatMap((p) => ['-p', p]), '--output-dir', tmp], { stdio: 'inherit' });

const metadata = JSON.parse(readFileSync(join(tmp, 'metadata.json'), 'utf8'));
// La config pública va en el manifiesto: es lo que la app lee como
// Constants.expoConfig cuando corre una actualización.
const expoClient = JSON.parse(npx(['expo', 'config', '--type', 'public', '--json']));
const createdAt = new Date().toISOString();
const root = join(OUT, 'app-updates');
mkdirSync(root, { recursive: true });

for (const platform of PLATFORMS) {
  const fm = metadata.fileMetadata?.[platform];
  if (!fm) throw new Error(`metadata.json sin ${platform}`);
  const resolved = JSON.parse(npx(['expo-updates', 'runtimeversion:resolve', '--platform', platform]));
  const runtimeVersion = resolved.runtimeVersion;
  if (!runtimeVersion) throw new Error(`sin runtimeVersion para ${platform}`);

  const bundle = readFileSync(join(tmp, fm.bundle));
  const bundleHash = sha256url(bundle);
  const id = uuidFrom(createHash('sha256').update(`${platform}:${runtimeVersion}:${bundleHash}`).digest('hex'));
  const base = `app-updates/${id}`;
  mkdirSync(join(OUT, base, 'assets'), { recursive: true });

  const bundleRel = `${base}/bundle.hbc`;
  writeFileSync(join(OUT, bundleRel), bundle);

  const assets = fm.assets.map((a) => {
    const buf = readFileSync(join(tmp, a.path));
    const name = a.path.split('/').pop();
    const rel = `${base}/assets/${name}`;
    if (!existsSync(join(OUT, rel))) cpSync(join(tmp, a.path), join(OUT, rel));
    return {
      hash: sha256url(buf),
      key: md5(buf),
      fileExtension: `.${a.ext}`,
      contentType: MIME[a.ext] ?? 'application/octet-stream',
      url: `${SITE}/${rel}`,
    };
  });

  const manifest = {
    id,
    createdAt,
    runtimeVersion,
    launchAsset: {
      hash: bundleHash,
      key: md5(bundle),
      fileExtension: '.bundle',
      contentType: 'application/javascript',
      url: `${SITE}/${bundleRel}`,
    },
    assets,
    metadata: {},
    extra: { expoClient },
  };
  mkdirSync(join(root, platform), { recursive: true });
  writeFileSync(join(root, platform, `${runtimeVersion}.json`), JSON.stringify(manifest));
  console.log(`[app-updates] ${platform}: runtime ${runtimeVersion}, update ${id}, ${assets.length} assets`);
}

rmSync(tmp, { recursive: true, force: true });
}

// En Netlify, un problema acá no puede tumbar el sitio: se avisa en el log y
// el sitio se publica igual (los teléfonos siguen con el código que tienen).
// En CI (--strict) sí falla, para enterarnos antes de que llegue a Netlify.
main().catch((e) => {
  console.error('[app-updates] no se pudo armar la actualización de la app:', e?.message ?? e);
  process.exit(STRICT ? 1 : 0);
});
