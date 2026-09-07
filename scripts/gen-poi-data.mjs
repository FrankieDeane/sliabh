// Generates public/poi-data.json: every named waypoint (refugios, miradores,
// lagunas, bifurcaciones, etc.) across every trail that has them, flattened
// into one GeoJSON FeatureCollection for the "Puntos de interés" layer on
// the general map (public/parques.html).
//
// Single source of truth: reads the real .ts trail data files (same
// transpileModule trick as scripts/prerender-trails.mjs), so this can never
// drift from what's shown on each trail's own page — re-run this whenever
// trail data changes, same as the sitemap.
//
// Run with: node scripts/gen-poi-data.mjs
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { createRequire } from 'node:module';

function loadTsModule(relPath) {
  const absPath = path.resolve(relPath);
  const source = fs.readFileSync(absPath, 'utf8');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  const mod = { exports: {} };
  const req = createRequire(import.meta.url);
  new Function('exports', 'require', 'module', '__filename', '__dirname', outputText)(
    mod.exports, req, mod, absPath, path.dirname(absPath),
  );
  return mod.exports;
}

const argentina = loadTsModule('src/data/argentinaTrails.ts');
const bariloche = loadTsModule('src/data/barilocheTreks.ts');
const ALL_TRAILS = [...argentina.ARGENTINA_TRAILS, ...bariloche.BARILOCHE_TRAILS];

const features = [];
for (const trail of ALL_TRAILS) {
  const waypoints = trail.namedWaypoints;
  if (!Array.isArray(waypoints)) continue;
  for (const wp of waypoints) {
    if (typeof wp.lat !== 'number' || typeof wp.lon !== 'number') continue;
    features.push({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [wp.lon, wp.lat] },
      properties: {
        name: wp.name,
        description: wp.description ?? '',
        trailId: trail.id,
        trailName: trail.name,
      },
    });
  }
}

if (!features.length) throw new Error('gen-poi-data: 0 waypoints found — data file shape changed?');

const geojson = { type: 'FeatureCollection', features };
fs.writeFileSync('public/poi-data.json', JSON.stringify(geojson));
console.log(`gen-poi-data: wrote ${features.length} points from ${ALL_TRAILS.length} trails to public/poi-data.json`);
