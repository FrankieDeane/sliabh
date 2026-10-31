/**
 * Lo que los mapas de la app necesitan para abrir sin señal, guardado en el
 * teléfono (Android e iOS por igual).
 *
 * Los mapas son páginas dentro de un WebView. Antes, cada vez que se abrían
 * bajaban de internet MapLibre (el motor del mapa) y, en la pestaña Mapas, la
 * página entera del mapa general. Con señal, todo bien; al reabrir la app en la
 * montaña no cargaba nada y el mapa "se rompía", aunque los tiles estuvieran
 * descargados.
 *
 * Ahora, cada vez que hay señal, se guarda una copia en la carpeta de
 * documentos de la app (no en la caché: el sistema no la borra). Sin señal:
 *   - el mapa de la caminata y el 3D de la ruta usan MapLibre de esa copia;
 *   - la pestaña Mapas abre la copia guardada de la página del mapa general.
 * Los tiles siguen viniendo de lo descargado con 💾 (ver offlineTilesJs.ts).
 */
import * as FileSystem from 'expo-file-system';
import { SITE } from '../components/map/trailMapHtml';
import { storage } from '../store/mmkv';

/** La página del mapa general, la misma que muestra la web en /mapas. */
export const PARKS_PAGE_PATH = '/parques.html';

const DIR = `${FileSystem.documentDirectory ?? ''}offline-map/`;
const PAGE_FILE = 'parques.html';
const LAST_REFRESH_KEY = 'offlineMap.lastRefresh';
// La página cambia seguido; MapLibre y jsPDF tienen la versión en el nombre y
// se bajan una sola vez.
const PAGE_MAX_AGE_MS = 6 * 60 * 60 * 1000;

/** Archivos de /vendor ya leídos a memoria, por ruta ('/vendor/x.js'). */
const vendor = new Map<string, string>();
let page: string | null = null;
let primed: Promise<void> | null = null;

function fileFor(path: string): string {
  return DIR + path.replace(/^\//, '').replace(/[^a-z0-9.-]/gi, '_');
}

/** Rutas /vendor/… que pide una página (scripts y hojas de estilo). */
export function vendorPaths(html: string): string[] {
  const out = new Set<string>();
  for (const m of html.matchAll(/(?:src|href)="(?:https:\/\/sliabh\.com\.ar)?(\/vendor\/[^"?#]+\.(?:js|css))"/g)) {
    out.add(m[1]);
  }
  return [...out];
}

async function readIfExists(uri: string): Promise<string | null> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists) return null;
    return await FileSystem.readAsStringAsync(uri);
  } catch {
    return null;
  }
}

/**
 * Baja un archivo a un temporal y solo si llegó entero reemplaza la copia
 * buena. Un corte de señal a mitad de descarga no deja un archivo roto.
 */
async function save(url: string, dest: string, minBytes: number): Promise<string | null> {
  const tmp = `${dest}.tmp`;
  try {
    const res = await FileSystem.downloadAsync(url, tmp);
    if (res.status !== 200) throw new Error(`HTTP ${res.status}`);
    const text = await FileSystem.readAsStringAsync(tmp);
    if (text.length < minBytes) throw new Error('incomplete');
    await FileSystem.deleteAsync(dest, { idempotent: true });
    await FileSystem.moveAsync({ from: tmp, to: dest });
    return text;
  } catch {
    await FileSystem.deleteAsync(tmp, { idempotent: true }).catch(() => {});
    return null;
  }
}

/** Lee a memoria lo guardado en sesiones anteriores. Rápido y sin red. */
export function primeOfflineMapShell(): Promise<void> {
  if (primed) return primed;
  primed = (async () => {
    if (!FileSystem.documentDirectory) return;
    page = await readIfExists(DIR + PAGE_FILE);
    const paths = new Set([...vendorPaths(page ?? ''), '/vendor/maplibre-gl-4.7.1.js', '/vendor/maplibre-gl-4.7.1.css']);
    await Promise.all(
      [...paths].map(async (p) => {
        const text = await readIfExists(fileFor(p));
        if (text) vendor.set(p, text);
      }),
    );
  })();
  return primed;
}

/**
 * Con señal: actualiza la copia guardada. Se llama al abrir la app y cuando
 * vuelve la conexión; como mucho baja la página cada 6 horas.
 */
export async function refreshOfflineMapShell(force = false): Promise<void> {
  if (!FileSystem.documentDirectory) return;
  await primeOfflineMapShell();
  const last = Number(storage.getString(LAST_REFRESH_KEY) ?? 0);
  if (!force && page && Date.now() - last < PAGE_MAX_AGE_MS) return;

  await FileSystem.makeDirectoryAsync(DIR, { intermediates: true }).catch(() => {});
  const fresh = await save(`${SITE}${PARKS_PAGE_PATH}`, DIR + PAGE_FILE, 10_000);
  if (fresh) page = fresh;

  const wanted = new Set([...vendorPaths(page ?? ''), '/vendor/maplibre-gl-4.7.1.js', '/vendor/maplibre-gl-4.7.1.css']);
  for (const p of wanted) {
    if (vendor.has(p)) continue;
    const text = await save(`${SITE}${p}`, fileFor(p), 1_000);
    if (text) vendor.set(p, text);
  }
  if (fresh) storage.set(LAST_REFRESH_KEY, String(Date.now()));
}

function inlineScript(js: string): string {
  // Un "</script" dentro del código cerraría la etiqueta antes de tiempo.
  return `<script>${js.replace(/<\/script/gi, '<\\/script')}</script>`;
}

/**
 * Cambia los <script src> y <link href> de /vendor por su contenido guardado,
 * para que la página no dependa de internet para arrancar. Lo que no está
 * guardado se deja como estaba (se baja de internet, como antes).
 */
export function inlineMapVendor(html: string): string {
  if (vendor.size === 0) return html;
  return html
    .replace(
      /<script\s+src="(?:https:\/\/sliabh\.com\.ar)?(\/vendor\/[^"?#]+\.js)"\s*><\/script>/g,
      (tag, path: string) => {
        const js = vendor.get(path);
        return js ? inlineScript(js) : tag;
      },
    )
    .replace(
      /<link\s+rel="stylesheet"\s+href="(?:https:\/\/sliabh\.com\.ar)?(\/vendor\/[^"?#]+\.css)"\s*\/?>/g,
      (tag, path: string) => {
        const css = vendor.get(path);
        return css ? `<style>${css}</style>` : tag;
      },
    );
}

/** La página del mapa general guardada, lista para abrir sin señal, o null. */
export function offlineParksPage(): string | null {
  return page ? inlineMapVendor(page) : null;
}
