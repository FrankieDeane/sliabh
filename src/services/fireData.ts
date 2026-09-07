// NASA FIRMS (Fire Information for Resource Management System) — free, public,
// near-real-time active-fire hotspot data from VIIRS satellites. Used to warn
// hikers when a trail sits near an active fire.
//
// Get a free MAP_KEY (instant, no approval wait) at
// https://firms.modis.gov/api/map_key/ and set it as EXPO_PUBLIC_FIRMS_MAP_KEY.
// Without a key, fire checks are silently skipped — nothing else depends on this.

const FIRMS_MAP_KEY = process.env.EXPO_PUBLIC_FIRMS_MAP_KEY ?? '';

/** True once a real FIRMS key is configured (not empty/placeholder). */
export function isFirmsConfigured(): boolean {
  return !!FIRMS_MAP_KEY && !FIRMS_MAP_KEY.includes('placeholder');
}

export interface FireHotspot {
  lat: number;
  lon: number;
  /** Fire Radiative Power (MW) — rough proxy for fire intensity. */
  frp: number;
  /** 'l' | 'n' | 'h' for VIIRS confidence. */
  confidence: string;
  satellite: string;
  acqDate: string; // YYYY-MM-DD
  acqTime: string; // HHMM, UTC
}

export interface BoundingBox {
  west: number;
  south: number;
  east: number;
  north: number;
}

// VIIRS_SNPP_NRT: 375m resolution, near-real-time (few-hour latency), the FIRMS
// source best suited to trail-scale fire proximity checks.
const SOURCE = 'VIIRS_SNPP_NRT';

/**
 * Fetches active-fire hotspots inside a bounding box from the last `dayRange`
 * day(s) (FIRMS caps this at 10). Returns [] on any failure or when no key is
 * configured — this is best-effort supplementary data and must never block
 * the trail screen from rendering.
 */
export async function fetchFireHotspots(bbox: BoundingBox, dayRange = 2): Promise<FireHotspot[]> {
  if (!isFirmsConfigured()) return [];
  const area = `${bbox.west},${bbox.south},${bbox.east},${bbox.north}`;
  const url = `https://firms.modis.gov/api/area/csv/${FIRMS_MAP_KEY}/${SOURCE}/${area}/${dayRange}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const csv = await res.text();
    return parseFirmsCsv(csv);
  } catch {
    return [];
  }
}

/** Parses the FIRMS CSV response into typed hotspots. */
function parseFirmsCsv(csv: string): FireHotspot[] {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];
  const header = lines[0].split(',').map((h) => h.trim());
  const col = (name: string) => header.indexOf(name);
  const iLat = col('latitude');
  const iLon = col('longitude');
  const iFrp = col('frp');
  const iConf = col('confidence');
  const iSat = col('satellite');
  const iDate = col('acq_date');
  const iTime = col('acq_time');
  if (iLat < 0 || iLon < 0) return [];

  const hotspots: FireHotspot[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    const lat = parseFloat(cols[iLat]);
    const lon = parseFloat(cols[iLon]);
    if (Number.isNaN(lat) || Number.isNaN(lon)) continue;
    hotspots.push({
      lat,
      lon,
      frp: parseFloat(cols[iFrp]) || 0,
      confidence: cols[iConf] ?? '',
      satellite: cols[iSat] ?? '',
      acqDate: cols[iDate] ?? '',
      acqTime: cols[iTime] ?? '',
    });
  }
  return hotspots;
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

/** A bounding box (± `marginDeg`) around a point — plenty for a single trail's radius check. */
export function bboxAround(lat: number, lon: number, marginDeg = 0.5): BoundingBox {
  return { west: lon - marginDeg, south: lat - marginDeg, east: lon + marginDeg, north: lat + marginDeg };
}

export interface NearestFire {
  hotspot: FireHotspot;
  distanceKm: number;
}

/** The closest hotspot to a point, or null if none are within `radiusKm`. */
export function nearestFire(lat: number, lon: number, hotspots: FireHotspot[], radiusKm = 15): NearestFire | null {
  let best: NearestFire | null = null;
  for (const hotspot of hotspots) {
    const d = distanceKm(lat, lon, hotspot.lat, hotspot.lon);
    if (d <= radiusKm && (!best || d < best.distanceKm)) best = { hotspot, distanceKm: d };
  }
  return best;
}
