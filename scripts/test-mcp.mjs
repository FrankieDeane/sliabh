// Prueba de punta a punta del servidor MCP (src/mcp/server.ts) sin levantar
// nada: arma los mismos Request HTTP que manda un cliente MCP (Claude, MCP
// Inspector) y verifica las respuestas. Cubre lo que revisa el directorio de
// conectores: cada herramienta con título y readOnlyHint, cada herramienta
// responde bien con parámetros válidos y da errores accionables con inválidos.
//
// Uso: node scripts/test-mcp.mjs
import assert from 'node:assert/strict';
import { loadTs } from './lib/load-ts.mjs';

const { handleMcpRequest } = loadTs('src/mcp/server.ts');
const { NATIONAL_PARKS } = loadTs('src/mcp/parks.ts');

const URL = 'https://sliabh.com.ar/mcp';
const HEADERS = {
  'Content-Type': 'application/json',
  Accept: 'application/json, text/event-stream',
  'Mcp-Protocol-Version': '2025-06-18',
};
let nextId = 1;
let passed = 0;

async function rpc(method, params) {
  const res = await handleMcpRequest(new Request(URL, {
    method: 'POST', headers: HEADERS, body: JSON.stringify({ jsonrpc: '2.0', id: nextId++, method, params }),
  }));
  assert.equal(res.status, 200, `${method}: HTTP ${res.status} ${await res.clone().text()}`);
  assert.equal(res.headers.get('access-control-allow-origin'), '*', `${method}: falta CORS`);
  const body = await res.json();
  assert.ok(!body.error, `${method}: ${JSON.stringify(body.error)}`);
  return body.result;
}

async function call(name, args) {
  const result = await rpc('tools/call', { name, arguments: args });
  const text = result.content?.[0]?.text ?? '';
  return { isError: !!result.isError, text, data: result.isError ? null : JSON.parse(text) };
}

async function check(label, fn) {
  await fn();
  passed++;
  console.log(`  ok  ${label}`);
}

console.log('MCP server — sliabh.com.ar/mcp');

await check('initialize', async () => {
  const r = await rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 'test', version: '1' } });
  assert.equal(r.serverInfo.name, 'sliabh-argentina-trails');
  assert.ok(r.capabilities.tools);
  assert.ok(r.instructions?.length > 0);
  // Logo y descripción: lo que el cliente muestra junto al conector.
  assert.ok(r.serverInfo.icons?.some((i) => i.src === 'https://sliabh.com.ar/mcp-icon-512.png' && i.mimeType === 'image/png'));
  assert.ok(r.serverInfo.description?.length > 40);
  assert.equal(r.serverInfo.websiteUrl, 'https://sliabh.com.ar/claude/');
});

let tools;
await check('tools/list: 5 herramientas, todas con title + readOnlyHint', async () => {
  ({ tools } = await rpc('tools/list', {}));
  assert.deepEqual(tools.map((t) => t.name).sort(), ['find_trails_near', 'get_national_park', 'get_trail', 'list_national_parks', 'search_trails']);
  for (const t of tools) {
    assert.ok(t.name.length <= 64, `${t.name}: nombre > 64`);
    assert.ok(t.title && t.annotations?.title, `${t.name}: falta title`);
    assert.equal(t.annotations.readOnlyHint, true, `${t.name}: falta readOnlyHint`);
    assert.equal(t.annotations.destructiveHint, false, `${t.name}: destructiveHint`);
    assert.ok(t.description.length > 40, `${t.name}: descripción muy corta`);
  }
});

await check('list_national_parks: los 39 parques', async () => {
  const { data } = await call('list_national_parks', {});
  assert.equal(data.total_national_parks, 39);
  assert.equal(data.parks.length, 39);
  assert.equal(NATIONAL_PARKS.length, 39);
});

await check('list_national_parks: filtros región + con rutas', async () => {
  const { data } = await call('list_national_parks', { region: 'patagonia-norte', only_with_trails: true, lang: 'en' });
  assert.ok(data.parks.length >= 3);
  assert.ok(data.parks.every((p) => p.trail_count > 0 && p.name.endsWith('National Park')));
});

await check('get_national_park: por nombre con tilde y sin tilde', async () => {
  const a = await call('get_national_park', { park: 'Lanín' });
  const b = await call('get_national_park', { park: 'parque nacional lanin' });
  assert.equal(a.data.slug, 'lanin');
  assert.equal(b.data.slug, 'lanin');
  assert.ok(a.data.trails.length > 0);
  assert.ok(a.data.park_page?.startsWith('https://sliabh.com.ar/parque/'));
});

await check('get_national_park: parque sin rutas lo dice', async () => {
  const { data } = await call('get_national_park', { park: 'talampaya', lang: 'en' });
  assert.equal(data.trail_count, 0);
  assert.match(data.note, /no mapped trails/);
});

await check('get_national_park: nombre inexistente → error accionable', async () => {
  const r = await call('get_national_park', { park: 'Yosemite' });
  assert.ok(r.isError);
  assert.match(r.text, /Valid slugs/);
});

await check('search_trails: keyword + parque', async () => {
  const { data } = await call('search_trails', { query: 'Fitz Roy', park: 'los-glaciares' });
  assert.ok(data.total_matches > 0);
  assert.ok(data.trails.every((t) => t.national_park === 'los-glaciares'));
});

await check('search_trails: filtros de dificultad, distancia y orden', async () => {
  const { data } = await call('search_trails', { difficulty: ['easy'], max_distance_km: 10, sort: 'distance_asc', limit: 5, lang: 'en' });
  assert.ok(data.returned <= 5 && data.returned > 0);
  assert.ok(data.trails.every((t) => t.difficulty === 'easy' && t.distance_km <= 10));
  for (let i = 1; i < data.trails.length; i++) assert.ok(data.trails[i - 1].distance_km <= data.trails[i].distance_km);
});

await check('search_trails: parque inexistente → error accionable', async () => {
  const r = await call('search_trails', { park: 'narnia' });
  assert.ok(r.isError);
  assert.match(r.text, /list_national_parks/);
});

await check('search_trails: parámetro inválido → error de validación, no 500', async () => {
  const r = await call('search_trails', { limit: 999 });
  assert.ok(r.isError);
});

await check('get_trail: detalle completo en inglés', async () => {
  const { data } = await call('get_trail', { trail_id: 'fitz-roy-laguna-tres', lang: 'en' });
  assert.equal(data.id, 'fitz-roy-laguna-tres');
  assert.ok(data.description && data.trailhead && data.trailhead_coordinates);
  assert.ok(data.url.startsWith('https://sliabh.com.ar/en/ruta/'));
});

await check('get_trail: id inexistente sugiere parecidos', async () => {
  const r = await call('get_trail', { trail_id: 'laguna-de-los-tres' });
  assert.ok(r.isError);
  assert.match(r.text, /Similar trails|search_trails/);
});

await check('find_trails_near: El Chaltén', async () => {
  const { data } = await call('find_trails_near', { latitude: -49.33, longitude: -72.89, radius_km: 30 });
  assert.ok(data.returned > 0);
  for (let i = 1; i < data.trails.length; i++) {
    assert.ok(data.trails[i - 1].distance_from_point_km <= data.trails[i].distance_from_point_km);
  }
});

await check('find_trails_near: solo fáciles cerca de Bariloche', async () => {
  const { data } = await call('find_trails_near', { latitude: -41.13, longitude: -71.31, radius_km: 30, difficulty: ['easy'] });
  assert.ok(data.returned > 0);
  assert.ok(data.trails.every((t) => t.difficulty === 'easy'));
});

await check('respuestas acotadas (< 25 KB por llamada)', async () => {
  const r = await call('search_trails', { limit: 25 });
  assert.ok(r.text.length < 25_000, `search_trails: ${r.text.length} bytes`);
  const p = await call('get_national_park', { park: 'nahuel-huapi' });
  assert.ok(p.text.length < 60_000, `nahuel-huapi: ${p.text.length} bytes`);
});

await check('GET → 405, OPTIONS → 204 con CORS', async () => {
  const g = await handleMcpRequest(new Request(URL, { method: 'GET', headers: { Accept: 'text/event-stream' } }));
  assert.equal(g.status, 405);
  const o = await handleMcpRequest(new Request(URL, { method: 'OPTIONS' }));
  assert.equal(o.status, 204);
  assert.match(o.headers.get('access-control-allow-headers'), /Mcp-Protocol-Version/);
});

console.log(`\nPASS — ${passed} checks`);
