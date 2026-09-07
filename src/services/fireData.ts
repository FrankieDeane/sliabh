// NASA EONET (Earth Observatory Natural Event Tracker) — free, public API,
// no signup or key required. Used to warn hikers when a trail sits near an
// active wildfire NASA is currently tracking.
//
// Docs: https://eonet.gsfc.nasa.gov/docs/v3
//
// Why EONET and not FIRMS: FIRMS (raw per-pixel satellite hotspot
// detections, near-real-time) needs a personal MAP_KEY from
// firms.modis.gov — every user has to register. EONET tracks named
// wildfire *events*, curated roughly daily by NASA analysts — coarser and
// less real-time than FIRMS, but genuinely public: no registration, no
// key, works for every visitor out of the box.

export interface FireEvent {
  id: string;
  title: string;
  lat: number;
  lon: number;
  /** ISO date of the most recently recorded position for this event. */
  date: string;
}

export interface BoundingBox {
  west: number;
  south: number;
  east: number;
  north: number;
}

/**
 * Fetches open wildfire events from NASA EONET whose most recent recorded
 * position falls inside `bbox`. Returns [] on any failure — this is
 * best-effort supplementary data and must never block the trail screen
 * from rendering.
 */
export async function fetchFireEvents(bbox: BoundingBox): Promise<FireEvent[]> {
  // EONET's bbox param order is "west,north,east,south" (top-left lon,lat
  // then bottom-right lon,lat) — not the west,south,east,north order most
  // other geo APIs use.
  const bboxParam = `${bbox.west},${bbox.north},${bbox.east},${bbox.south}`;
  const url = `https://eonet.gsfc.nasa.gov/api/v3/events?category=wildfires&status=open&bbox=${bboxParam}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      // Visible in the browser console so "no banner anywhere" is
      // diagnosable (fetch failing) vs. simply "no fires nearby right now".
      console.warn(`[fireData] EONET returned ${res.status} for`, url);
      return [];
    }
    const data = await res.json();
    const events = Array.isArray(data?.events) ? data.events : [];
    const parsed = events
      .map((e: any): FireEvent | null => {
        const geoms = Array.isArray(e?.geometry) ? e.geometry : [];
        const last = geoms[geoms.length - 1];
        const coords = last?.coordinates;
        if (!Array.isArray(coords) || coords.length < 2) return null;
        return {
          id: e.id,
          title: e.title ?? 'Wildfire',
          lon: coords[0],
          lat: coords[1],
          date: last.date ?? '',
        };
      })
      .filter((e: FireEvent | null): e is FireEvent => e !== null);
    console.info(`[fireData] EONET: ${parsed.length} open wildfire event(s) in bbox`, bboxParam);
    return parsed;
  } catch (err) {
    console.warn('[fireData] EONET fetch failed (network/CORS?):', err);
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

/** A bounding box (± `marginDeg`) around a point. EONET events are
 *  city/complex-scale, not pixel-scale, so use a wider margin than a
 *  FIRMS-style per-trail box would need. */
export function bboxAround(lat: number, lon: number, marginDeg = 1.5): BoundingBox {
  return { west: lon - marginDeg, south: lat - marginDeg, east: lon + marginDeg, north: lat + marginDeg };
}

export interface NearestFire {
  event: FireEvent;
  distanceKm: number;
}

/** The closest open wildfire event to a point, or null if none are within `radiusKm`. */
export function nearestFire(lat: number, lon: number, events: FireEvent[], radiusKm = 30): NearestFire | null {
  let best: NearestFire | null = null;
  for (const event of events) {
    const d = distanceKm(lat, lon, event.lat, event.lon);
    if (d <= radiusKm && (!best || d < best.distanceKm)) best = { event, distanceKm: d };
  }
  return best;
}
