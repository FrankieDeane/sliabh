// USGS Earthquake Hazards Program — free, public, no API key required.
// Used to warn hikers when a trail sits near a recent significant earthquake
// (aftershocks, rockfall/landslide risk on mountain trails).
//
// Docs: https://earthquake.usgs.gov/fdsnws/event/1/

export interface EarthquakeEvent {
  id: string;
  lat: number;
  lon: number;
  /** Richter/moment magnitude. */
  mag: number;
  place: string;
  /** Depth in km. */
  depthKm: number;
  /** Unix ms timestamp. */
  time: number;
}

export interface BoundingBox {
  west: number;
  south: number;
  east: number;
  north: number;
}

/**
 * Fetches earthquakes within `radiusKm` of a point over the last `days` days
 * with at least `minMag` magnitude. Returns [] on any failure — this is
 * best-effort supplementary data and must never block the trail screen.
 */
export async function fetchNearbyEarthquakes(
  lat: number,
  lon: number,
  { radiusKm = 100, days = 7, minMag = 3.5 }: { radiusKm?: number; days?: number; minMag?: number } = {},
): Promise<EarthquakeEvent[]> {
  const starttime = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const url =
    `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson` +
    `&starttime=${starttime}&latitude=${lat}&longitude=${lon}` +
    `&maxradiuskm=${radiusKm}&minmagnitude=${minMag}&orderby=time`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    const features = Array.isArray(data?.features) ? data.features : [];
    return features
      .map((f: any): EarthquakeEvent | null => {
        const [lon2, lat2, depth] = f?.geometry?.coordinates ?? [];
        if (typeof lat2 !== 'number' || typeof lon2 !== 'number') return null;
        return {
          id: f.id,
          lat: lat2,
          lon: lon2,
          mag: f.properties?.mag ?? 0,
          place: f.properties?.place ?? '',
          depthKm: typeof depth === 'number' ? depth : 0,
          time: f.properties?.time ?? 0,
        };
      })
      .filter((e: EarthquakeEvent | null): e is EarthquakeEvent => e !== null);
  } catch {
    return [];
  }
}

/** Great-circle distance between two points, in km (haversine). */
export function distanceKm(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = ((bLon - aLon) * Math.PI) / 180;
  const s1 =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s1), Math.sqrt(1 - s1));
}

export interface NearestQuake {
  quake: EarthquakeEvent;
  distanceKm: number;
}

/** The closest/strongest recent earthquake to a point, or null if none within range. */
export function nearestEarthquake(lat: number, lon: number, quakes: EarthquakeEvent[]): NearestQuake | null {
  let best: NearestQuake | null = null;
  for (const quake of quakes) {
    const d = distanceKm(lat, lon, quake.lat, quake.lon);
    if (!best || quake.mag > best.quake.mag || (quake.mag === best.quake.mag && d < best.distanceKm)) {
      best = { quake, distanceKm: d };
    }
  }
  return best;
}
