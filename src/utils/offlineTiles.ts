/**
 * Real offline tile caching (web only).
 * Downloads OpenTopoMap tiles around a point into the Cache Storage API
 * so Leaflet can render them without a connection (served via the
 * service worker / browser HTTP cache).
 */
import { Platform } from 'react-native';

const TILE_CACHE = 'sliabh-tiles-v1';
const TILE_URL = (z: number, x: number, y: number) =>
  `https://tile.opentopomap.org/${z}/${x}/${y}.png`;

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

/**
 * Cache tiles for zoom levels 8–12 in a small radius around the point.
 * Roughly 100–150 tiles (~2–4 MB) per park — enough for offline browsing.
 */
export async function downloadAreaTiles(
  lat: number,
  lon: number,
  onProgress?: (done: number, total: number) => void,
): Promise<TileDownloadResult> {
  if (!isTileCachingSupported()) return { total: 0, cached: 0, failed: 0 };

  const jobs: string[] = [];
  for (let z = 8; z <= 12; z++) {
    const cx = lonToTileX(lon, z);
    const cy = latToTileY(lat, z);
    const radius = z <= 9 ? 1 : z <= 11 ? 2 : 3;
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
  const probe = TILE_URL(10, lonToTileX(lon, 10), latToTileY(lat, 10));
  return !!(await cache.match(probe));
}
