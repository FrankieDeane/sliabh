/**
 * Real offline tile caching (web only).
 *
 * Downloads the SAME tiles the interactive map renders — ESRI World Imagery
 * satellite — into the Cache Storage API so the MapLibre map in parques.html
 * (and the service worker fallback) can serve them without a connection.
 *
 * Must stay in sync with parques.html: same tile provider (ESRI_SAT), same
 * cache name (sliabh-tiles-v1). Caching any other provider here produces the
 * "downloaded but the map is blank offline" bug.
 */
import { Platform } from 'react-native';

const TILE_CACHE = 'sliabh-tiles-v1';

// ESRI World Imagery — the base layer used by the map. Note the {z}/{y}/{x}
// order (y before x), which is how ArcGIS serves tiles.
const TILE_URL = (z: number, x: number, y: number) =>
  `https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`;

// Per-zoom tile radius around the park centre. Zooms 10–15 give both an
// overview and enough on-trail detail to navigate; the radii keep the total
// bounded (~600 tiles, ~10–20 MB of satellite imagery per park).
const ZOOM_RADII: Record<number, number> = { 10: 2, 11: 2, 12: 3, 13: 4, 14: 6, 15: 8 };

function lonToTileX(lon: number, z: number) {
  return Math.floor(((lon + 180) / 360) * 2 ** z);
}
function latToTileY(lat: number, z: number) {
  const rad = (lat * Math.PI) / 180;
  return Math.floor(((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) * 2 ** z);
}

export interface TileDownloadResult {
  total: number;
  cached: number;
  failed: number;
}

export function isTileCachingSupported(): boolean {
  return Platform.OS === 'web' && typeof caches !== 'undefined';
}

/** Rough estimate of how much imagery a park download will store, in MB. */
export function estimateAreaSizeMb(): number {
  const tiles = Object.values(ZOOM_RADII).reduce((sum, r) => sum + (2 * r + 1) ** 2, 0);
  // ESRI World Imagery JPEG tiles average ~18 KB each.
  return Math.round((tiles * 18) / 1024);
}

/**
 * Cache ESRI satellite tiles around a point across zoom levels 10–15 so the
 * park is fully browsable offline in the same map the user already sees.
 */
export async function downloadAreaTiles(
  lat: number,
  lon: number,
  onProgress?: (done: number, total: number) => void,
): Promise<TileDownloadResult> {
  if (!isTileCachingSupported()) return { total: 0, cached: 0, failed: 0 };

  const jobs: string[] = [];
  for (const [zStr, radius] of Object.entries(ZOOM_RADII)) {
    const z = Number(zStr);
    const cx = lonToTileX(lon, z);
    const cy = latToTileY(lat, z);
    for (let x = cx - radius; x <= cx + radius; x++) {
      for (let y = cy - radius; y <= cy + radius; y++) {
        jobs.push(TILE_URL(z, x, y));
      }
    }
  }

  const cache = await caches.open(TILE_CACHE);
  let done = 0;
  let failed = 0;

  // Limit concurrency to be polite to the tile server
  const CONCURRENCY = 4;
  const queue = [...jobs];
  async function worker() {
    while (queue.length) {
      const url = queue.shift()!;
      try {
        const existing = await cache.match(url);
        if (!existing) {
          const res = await fetch(url, { mode: 'cors' });
          if (res.ok) await cache.put(url, res);
          else failed++;
        }
      } catch {
        failed++;
      }
      done++;
      onProgress?.(done, jobs.length);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  return { total: jobs.length, cached: done - failed, failed };
}

export async function isAreaCached(lat: number, lon: number): Promise<boolean> {
  if (!isTileCachingSupported()) return false;
  const cache = await caches.open(TILE_CACHE);
  // Probe a mid-zoom tile at the park centre — present only after a download.
  const probe = TILE_URL(13, lonToTileX(lon, 13), latToTileY(lat, 13));
  return !!(await cache.match(probe));
}
