/**
 * Does the offline route suggester find the right way — and say so honestly
 * when there is none?
 *
 * Two kinds of check. Synthetic networks, built by hand, where the correct
 * answer is known (the shorter of two paths, the flat detour that beats a
 * steep shortcut, a hard trail left out when the walker asks for easy ones).
 * And the real bundled trails, where a few routes walkers actually ask about
 * must be found, and the © OpenStreetMap credit must follow OSM data.
 *
 *   node --experimental-strip-types scripts/validate-routing.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { createRequire } from 'node:module';
import {
  buildTrailGraph, suggestRoute, placesOnGraph, toblerKmh, haversineKm, normalizeForSearch, signpostHours,
} from '../src/routing/trailRouter.ts';

let checks = 0;
let failures = 0;
function check(label, ok, detail = '') {
  checks += 1;
  if (!ok) failures += 1;
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label}${detail ? `  — ${detail}` : ''}`);
}

// ── Synthetic networks ───────────────────────────────────────────────────────
console.log('Synthetic networks');

// ~111 m per 0.001° of latitude. Base at -41°, -71° (Bariloche-ish).
const P = (dLat, dLon, ele) => ({ lat: -41 + dLat, lon: -71 + dLon, ele });

check('Tobler peaks on a gentle descent', toblerKmh(-0.05) > toblerKmh(0) && toblerKmh(-0.05) > toblerKmh(-0.2));
// Laguna de los Tres one way: ~10 km, +750 m. Park signs say 4 h.
const lt = signpostHours(10, 750, 0);
check('walking time matches the signposts', lt > 3.5 && lt < 4.2, `${lt.toFixed(2)} h`);

{
  // A — B direct (short), and A — C — B (long). Both easy, no altitude.
  const g = buildTrailGraph([
    { id: 'short', name: 'Corto', difficulty: 'facil', distance_km: 2.2, gpxTrack: [P(0, 0), P(0.01, 0), P(0.02, 0, undefined)] },
    { id: 'long', name: 'Largo', difficulty: 'facil', distance_km: 6.6, gpxTrack: [P(0, 0), P(0, 0.02), P(0.02, 0.02), P(0.02, 0)] },
  ]);
  const r = suggestRoute(g, P(0, 0), P(0.02, 0));
  check('takes the shorter of two paths', r.ok && r.legs.length === 1 && r.legs[0].trailId === 'short', r.ok ? r.legs.map((l) => l.trailId).join('>') : r.reason);
  check('distance adds up', r.ok && Math.abs(r.km - 2.22) < 0.05, r.ok ? r.km.toFixed(2) : '');
  check('the two trails meet at the shared trailhead', g.nodes.length === 5, `${g.nodes.length} nodes`);
}

{
  // Steep shortcut (+600 m over 1.1 km) against a flat detour of 2.2 km.
  const g = buildTrailGraph([
    { id: 'steep', name: 'Empinado', difficulty: 'facil', distance_km: 1.2, gpxTrack: [P(0, 0, 1000), P(0.005, 0, 1300), P(0.01, 0, 1600)] },
    { id: 'flat', name: 'Llano', difficulty: 'facil', distance_km: 2, gpxTrack: [P(0, 0, 1000), P(0.005, 0.01, 1300), P(0.01, 0, 1600)] },
  ]);
  // Same climb either way, so make the detour gentler by inserting distance.
  const g2 = buildTrailGraph([
    { id: 'steep', name: 'Empinado', difficulty: 'facil', distance_km: 1.2, gpxTrack: [P(0, 0, 1000), P(0.01, 0, 1600)] },
    { id: 'zigzag', name: 'Zigzag', difficulty: 'facil', distance_km: 1.6, gpxTrack: [P(0, 0, 1000), P(0.003, 0.006, 1200), P(0.006, 0.0, 1400), P(0.01, 0, 1600)] },
  ]);
  const r = suggestRoute(g2, P(0, 0), P(0.01, 0));
  check('a gentler zigzag beats a 55 % wall', r.ok && r.legs[0].trailId === 'zigzag', r.ok ? r.legs[0].trailId : r.reason);
  check('climb is measured', r.ok && r.ascentM === 600 && r.elevationComplete, r.ok ? `+${r.ascentM}` : '');
  const back = suggestRoute(g, P(0.01, 0), P(0, 0));
  check('descending counts as descent, not climb', back.ok && back.ascentM === 0 && back.descentM === 600);
}

{
  // A hard trail is the only link; asking for easy trails must fail clearly.
  const g = buildTrailGraph([
    { id: 'hard', name: 'Duro', difficulty: 'dificil', distance_km: 1.2, gpxTrack: [P(0, 0), P(0.01, 0)] },
  ]);
  const ok = suggestRoute(g, P(0, 0), P(0.01, 0), { maxDifficulty: 'extremo' });
  const no = suggestRoute(g, P(0, 0), P(0.01, 0), { maxDifficulty: 'moderado' });
  check('hard trail used when allowed', ok.ok);
  check('hard trail skipped when walker asks for moderate', !no.ok && no.reason === 'no-connection', no.ok ? 'found' : no.reason);
}

{
  // Two islands; and points far from any trail.
  const g = buildTrailGraph([
    { id: 'a', name: 'A', difficulty: 'facil', distance_km: 1.2, gpxTrack: [P(0, 0), P(0.01, 0)] },
    { id: 'b', name: 'B', difficulty: 'facil', distance_km: 1.2, gpxTrack: [P(0, 0.1), P(0.01, 0.1)] },
  ]);
  const r = suggestRoute(g, P(0, 0), P(0, 0.1));
  check('unconnected trails are not joined across country', !r.ok && r.reason === 'no-connection', r.ok ? 'joined' : r.reason);
  const far = suggestRoute(g, P(0.5, 0), P(0, 0));
  check('start far from every trail is reported', !far.ok && far.reason === 'start-far');
  const near = suggestRoute(g, P(-0.005, 0), P(0.01, 0));
  check('a start 550 m off the trail is joined and reported', near.ok && near.offTrailStartM > 500 && near.offTrailStartM < 600, near.ok ? `${near.offTrailStartM} m` : near.reason);
}

{
  // A pasted point 30 km away is a data error, not a path.
  const g = buildTrailGraph([
    { id: 'bad', name: 'Malo', difficulty: 'facil', distance_km: 3, gpxTrack: [P(0, 0), P(0.01, 0), P(0.3, 0), P(0.31, 0)] },
  ]);
  check('a jump longer than the whole trail is dropped', g.droppedJumps.length === 1, JSON.stringify(g.droppedJumps));
}

{
  // Sparse lines cut every bend; the published distance wins.
  const line = [P(0, 0), P(0.01, 0), P(0.02, 0)]; // 2.22 km drawn
  const oneWay = buildTrailGraph([{ id: 'w', name: 'W', difficulty: 'facil', distance_km: 3.3, gpxTrack: line }]);
  const r1 = suggestRoute(oneWay, P(0, 0), P(0.02, 0));
  check('a one-way trail takes its published length', r1.ok && Math.abs(r1.km - 3.3) < 0.05, r1.ok ? r1.km.toFixed(2) : '');
  const there = buildTrailGraph([{ id: 'w', name: 'W', difficulty: 'facil', distance_km: 6.6, round_trip: true, gpxTrack: line }]);
  const r2 = suggestRoute(there, P(0, 0), P(0.02, 0));
  check('an out-and-back trail counts one way only', r2.ok && Math.abs(r2.km - 3.3) < 0.05, r2.ok ? r2.km.toFixed(2) : '');
  const guess = buildTrailGraph([{ id: 'w', name: 'W', difficulty: 'facil', distance_km: 4.6, gpxTrack: line }]);
  const r3 = suggestRoute(guess, P(0, 0), P(0.02, 0));
  check('nearly double the line, unlabelled, is read as out-and-back', r3.ok && Math.abs(r3.km - 2.3) < 0.05, r3.ok ? r3.km.toFixed(2) : '');
}

// ── Real bundled trails ──────────────────────────────────────────────────────
console.log('Bundled trails');

function loadTsModule(relPath) {
  const absPath = path.resolve(relPath);
  const { outputText } = ts.transpileModule(fs.readFileSync(absPath, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const mod = { exports: {} };
  new Function('exports', 'require', 'module', outputText)(mod.exports, createRequire(import.meta.url), mod);
  return mod.exports;
}
const trails = [
  ...loadTsModule('src/data/argentinaTrails.ts').ARGENTINA_TRAILS,
  ...loadTsModule('src/data/barilocheTreks.ts').BARILOCHE_TRAILS,
];
const t0 = Date.now();
const g = buildTrailGraph(trails);
const places = placesOnGraph(g);
check('graph builds fast enough for a phone', Date.now() - t0 < 1000, `${Date.now() - t0} ms, ${g.nodes.length} nodes`);
check('no trail has a pasted-in jump', g.droppedJumps.length === 0, JSON.stringify(g.droppedJumps));
check('places to pick from', places.length > 100, `${places.length}`);

const find = (q) => places.find((p) => normalizeForSearch(p.name).includes(normalizeForSearch(q)));
function route(fromQ, toQ, opts) {
  const a = find(fromQ);
  const b = find(toQ);
  if (!a || !b) return { missing: !a ? fromQ : toQ };
  return suggestRoute(g, a, b, opts);
}

{
  const r = route('Refugio Frey', 'Refugio Jakob');
  check('Bariloche: Frey to Jakob across the network', r.ok && r.km > 8 && r.km < 40, r.ok ? `${r.km.toFixed(1)} km via ${r.legs.map((l) => l.trailId).join(' > ')}` : JSON.stringify(r));
}
{
  const r = route('Laguna Capri', 'Laguna de los Tres');
  check('El Chaltén: Capri to Laguna de los Tres', r.ok && r.km > 4 && r.km < 12, r.ok ? `${r.km.toFixed(1)} km` : JSON.stringify(r));
}
{
  // Laguna Esmeralda is an OSM trail: the credit must come with it.
  const esm = trails.find((t) => t.id === 'laguna-esmeralda-ushuaia');
  const first = esm.gpxTrack[0];
  const last = esm.gpxTrack[esm.gpxTrack.length - 1];
  const r = suggestRoute(g, first, last);
  check('OSM trail routes and carries the OpenStreetMap credit', r.ok && r.usesOsm && r.legs.every((l) => l.osm), r.ok ? `osm=${r.usesOsm}` : r.reason);
  const curated = route('Refugio Frey', 'Refugio Jakob');
  check('curated-only route does not claim OSM', curated.ok && !curated.usesOsm);
}
{
  // Every route the engine returns must be walkable: consecutive points
  // never further apart than the longest real stretch of trail.
  let worst = 0;
  for (let i = 0; i < 40; i++) {
    const a = places[(i * 37) % places.length];
    const b = places[(i * 91 + 13) % places.length];
    const r = suggestRoute(g, a, b);
    if (!r.ok) continue;
    for (let k = 1; k < r.points.length; k++) worst = Math.max(worst, haversineKm(r.points[k - 1], r.points[k]));
  }
  check('no route teleports between distant points', worst < 12, `longest step ${worst.toFixed(1)} km`);
}

console.log(`\n${checks - failures}/${checks} checks passed`);
if (failures) process.exit(1);
