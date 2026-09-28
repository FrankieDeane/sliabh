/**
 * Regla única para todo lo que interrumpe la lectura (banner promocional,
 * encuesta, popup de newsletter): como máximo UNA interrupción por sesión, y
 * nunca en la página de aterrizaje ni en los primeros 30 segundos.
 *
 * Por qué: quien llega desde Google aterriza en una ruta y lo primero que veía
 * eran hasta tres capas encima del contenido (banner a los 1–2 s, encuesta a
 * los 4 s, newsletter a los 9 s). Eso sube el rebote, baja el tiempo en el
 * sitio y Google penaliza los interstitials intrusivos en mobile. Además el
 * banner empujaba el layout hacia abajo después de cargar (CLS).
 *
 * Cada componente conserva sus propias condiciones (consentimiento,
 * cooldowns, ya suscripto…); esto solo decide CUÁNDO puede aparecer.
 * sessionStorage puede no existir (modo privado, bloqueado): en ese caso se
 * usa memoria, que sigue cumpliendo la regla dentro de la pestaña.
 */
const START_KEY = 'sliabh-session-start';
const PAGES_KEY = 'sliabh-session-pages';
const CLAIMED_KEY = 'sliabh-overlay-claimed';

const MIN_ELAPSED_MS = 30_000;
const MIN_PAGES = 2;

const memory: Record<string, string> = {};

function read(key: string): string | null {
  try { return sessionStorage.getItem(key); } catch { return memory[key] ?? null; }
}
function write(key: string, value: string) {
  try { sessionStorage.setItem(key, value); } catch { memory[key] = value; }
}

function sessionStart(): number {
  const v = Number(read(START_KEY));
  if (v) return v;
  const now = Date.now();
  write(START_KEY, String(now));
  return now;
}

/** Registrar cada página vista (se llama al cambiar de ruta). */
export function trackPageview(rawPathname: string) {
  sessionStart();
  // "/" redirige a "/inicio" en el cliente: es la misma página, no dos.
  const pathname = rawPathname === '/inicio' ? '/' : rawPathname;
  let pages: string[] = [];
  try { pages = JSON.parse(read(PAGES_KEY) || '[]'); } catch {}
  if (pages[pages.length - 1] === pathname) return;
  pages.push(pathname);
  write(PAGES_KEY, JSON.stringify(pages.slice(-20)));
}

function pagesSeen(): number {
  try { return (JSON.parse(read(PAGES_KEY) || '[]') as string[]).length; } catch { return 0; }
}

function eligible(): boolean {
  return !read(CLAIMED_KEY) && pagesSeen() >= MIN_PAGES && Date.now() - sessionStart() >= MIN_ELAPSED_MS;
}

/**
 * Toma la interrupción de la sesión ahora mismo, si está habilitada. Para lo
 * que desplaza el layout (el banner superior): llamarlo solo al cambiar de
 * ruta, así el desplazamiento cae dentro de los 500 ms posteriores al clic y
 * no cuenta para CLS.
 */
export function claimOverlayNow(id: string): boolean {
  if (typeof window === 'undefined' || !eligible()) return false;
  write(CLAIMED_KEY, id);
  return true;
}

/**
 * Llama a `show` cuando la sesión habilite una interrupción y ninguna otra la
 * haya tomado. Devuelve la función de limpieza para el useEffect.
 */
export function whenOverlayAllowed(id: string, show: () => void, canShow: () => boolean = () => true): () => void {
  if (typeof window === 'undefined') return () => {};
  const tryShow = () => {
    if (!eligible() || !canShow()) return false;
    write(CLAIMED_KEY, id);
    show();
    return true;
  };
  if (tryShow()) return () => {};
  const timer = setInterval(() => { if (tryShow()) clearInterval(timer); }, 3000);
  return () => clearInterval(timer);
}
