/**
 * URL pública de una sección para el menú, en el idioma activo.
 *
 * Los menús (header, menú móvil, footer) se renderizan como <a href> reales
 * vía <Link>: Google no hace clic en botones, así que un menú de
 * TouchableOpacity + router.push dejaba a /rutas, /mapas, /faq… sin ningún
 * enlace interno rastreable. En inglés apuntan a la versión /en/, para que
 * cada idioma enlace a sus propias URLs (las mismas del sitemap y hreflang).
 */
const EN_TWINS = new Set(['rutas', 'mapas', 'planificar', 'faq', 'supervivencia', 'contribuir', 'guias', 'app']);

export function navHref(route: string, lang: 'es' | 'en'): string {
  if (route === 'inicio') return lang === 'en' ? '/en' : '/';
  return lang === 'en' && EN_TWINS.has(route) ? `/en/${route}` : `/${route}`;
}

/** ¿La URL actual es la de esa sección (en cualquiera de los dos idiomas)? */
export function isActiveRoute(pathname: string, route: string): boolean {
  if (route === 'inicio') return pathname === '/' || pathname === '/en' || pathname.startsWith('/inicio');
  return pathname === `/${route}` || pathname === `/en/${route}` || pathname.startsWith(`/${route}/`) || pathname.startsWith(`/en/${route}/`);
}
