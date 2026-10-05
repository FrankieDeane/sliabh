// Qué errores se registran en `app_errors` y cuáles no (src/services/errorNoise.ts).
//
// Lo importante son los dos lados: que el ruido se descarte Y que un bug de
// verdad siga llegando a la tabla. Un filtro que se come todo deja la tabla
// limpia y el sitio roto sin que nadie se entere.
//
// Uso: node scripts/test-error-noise.mjs
import assert from 'node:assert/strict';
import { loadTs } from './lib/load-ts.mjs';

const { isBotUserAgent, isEnvironmentNoise } = loadTs('src/services/errorNoise.ts');

let passed = 0;
function check(label, fn) {
  fn();
  passed += 1;
  console.log(`  ok  ${label}`);
}

// Error que sale de la tabla real: la forma exacta que tiene cada uno.
const msg = (e) => String(e?.message ?? e);
const noise = (e) => isEnvironmentNoise(e, msg(e));
const domException = (name, message) => Object.assign(new Error(message), { name });

console.log('errores que no son un bug nuestro');

check('ResizeObserver loop completed with undelivered notifications', () => {
  assert.equal(noise(new Error('ResizeObserver loop completed with undelivered notifications.')), true);
});
check('ResizeObserver loop limit exceeded (la versión de Chrome viejo)', () => {
  assert.equal(noise(new Error('ResizeObserver loop limit exceeded')), true);
});
check('fontfaceobserver: "6000ms timeout exceeded" (fuente de íconos lenta)', () => {
  assert.equal(noise(new Error('6000ms timeout exceeded')), true);
});
check('DOMException NetworkError: "A network error occurred." (FontFace.load)', () => {
  assert.equal(noise(domException('NetworkError', 'A network error occurred.')), true);
});
check('el mismo mensaje sin nombre de excepción', () => {
  assert.equal(isEnvironmentNoise('A network error occurred.', 'A network error occurred.'), true);
});

console.log('errores reales que tienen que seguir llegando');

check('el error del menú: Failed to set an indexed property', () => {
  assert.equal(noise(new Error("Failed to set an indexed property [0] on 'CSSStyleDeclaration': Indexed property setter is not supported.")), false);
});
check('el mismo error en Safari', () => {
  assert.equal(noise(new Error('Cannot set indexed properties on this object')), false);
});
check('un TypeError de código nuestro', () => {
  assert.equal(noise(new TypeError("Cannot read properties of undefined (reading 'map')")), false);
});
check('un timeout que no es de la fuente (otro texto)', () => {
  assert.equal(noise(new Error('Request timeout exceeded while saving the track')), false);
  assert.equal(noise(new Error('timeout exceeded')), false);
});
check('un fetch fallido común sigue contando', () => {
  assert.equal(noise(new TypeError('Failed to fetch')), false);
});

console.log('robots');

const UA = {
  googlebot: 'Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Mobile Safari/537.36 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  bingbot: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm) Chrome/116.0.1938.76 Safari/537.36',
  gptbot: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.1; +https://openai.com/gptbot',
  lighthouse: 'Mozilla/5.0 (Linux; Android 11; moto g power) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Mobile Safari/537.36 Chrome-Lighthouse',
  headless: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/120.0.0.0 Safari/537.36',
  androidChrome: 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Mobile Safari/537.36',
  iphoneSafari: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.2 Mobile/15E148 Safari/604.1',
  desktopChrome: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
};

check('Googlebot, Bingbot, GPTBot, Lighthouse y Chrome headless son robots', () => {
  for (const k of ['googlebot', 'bingbot', 'gptbot', 'lighthouse', 'headless']) {
    assert.equal(isBotUserAgent(UA[k]), true, k);
  }
});
check('un Android, un iPhone y una Mac de verdad NO son robots', () => {
  for (const k of ['androidChrome', 'iphoneSafari', 'desktopChrome']) {
    assert.equal(isBotUserAgent(UA[k]), false, k);
  }
});
check('sin user-agent no se descarta nada', () => {
  assert.equal(isBotUserAgent(undefined), false);
  assert.equal(isBotUserAgent(''), false);
});

console.log(`\nPASS — ${passed} checks`);
