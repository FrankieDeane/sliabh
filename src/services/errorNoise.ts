/**
 * Lo que NO es un bug nuestro y por eso no va a la tabla `app_errors`.
 *
 * Un reporte que nadie puede arreglar solo tapa los que sí: en un mes de
 * tabla, 54 de las 65 filas eran del robot de Google y el resto casi todo la
 * fuente de íconos bajando lento. Plain TS, sin React Native, así lo carga el
 * test (scripts/test-error-noise.mjs) sin armar la app.
 */

/**
 * Los crawlers renderizan la página con requests bloqueados, así que cada
 * fetch que les rechazan se registraba como un "crash" que ningún usuario puede
 * tener. Googlebot solo era la mayor parte de la tabla.
 */
export const BOT_UA = /bot|crawler|spider|GoogleOther|externalagent|Lighthouse|HeadlessChrome/i;

export function isBotUserAgent(userAgent: string | undefined | null): boolean {
  return !!userAgent && BOT_UA.test(userAgent);
}

/**
 * Errores que el navegador o la red producen sin que haya un bug en la app:
 *
 * - `ResizeObserver loop …`: aviso inofensivo de Chromium y WebKit cuando un
 *   observer cambia el layout que observa. No rompe nada, y lo dispara
 *   cualquier página que use ResizeObserver.
 * - `<n>ms timeout exceeded`: la librería `fontfaceobserver` (la que usa
 *   expo-font en la web) rechaza así cuando la fuente de íconos tarda más que
 *   el timeout, típico en un celular con señal lenta. @expo/vector-icons hace
 *   `await Font.loadAsync()` sin atrapar el error, y llega como un rechazo sin
 *   manejar. Es red lenta, no un bug de la app.
 * - `NetworkError` (DOMException, "A network error occurred."): es la forma en
 *   que `FontFace.load()` avisa que la descarga de la fuente falló. Por
 *   definición es un fallo de red.
 */
export function isEnvironmentNoise(error: unknown, message: string): boolean {
  if (/^ResizeObserver loop (completed with undelivered notifications|limit exceeded)/.test(message)) return true;
  if (/^\d+ms timeout exceeded$/.test(message)) return true;
  const name = (error as { name?: string } | null | undefined)?.name;
  if (name === 'NetworkError' || message === 'A network error occurred.') return true;
  return false;
}
