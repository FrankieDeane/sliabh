/**
 * WGS-84 geographic coordinates to UTM, offline.
 *
 * Snyder's series expansion (USGS Professional Paper 1395, pp. 60-64), the
 * same one the standard NGA and IGN conversions use. Accurate to a few
 * centimetres within a zone's 6° span, which is far finer than a GPS fix; it
 * degrades outside the zone, so the zone is always chosen from the longitude
 * rather than forced. UTM is undefined beyond ±84°/−80°, where callers should
 * fall back to UPS — not a case any trail in this app reaches.
 *
 * Argentina spans zones 19 to 21 in the southern hemisphere, so northings
 * carry the 10 000 000 m false northing that UTM uses south of the equator.
 */

const A = 6378137.0; // WGS-84 semi-major axis
const F = 1 / 298.257223563;
const K0 = 0.9996;
const E2 = F * (2 - F);
const EP2 = E2 / (1 - E2);

const DEG = Math.PI / 180;

export interface UtmCoordinate {
  zone: number;
  /** MGRS latitude band letter (C–X, omitting I and O). */
  band: string;
  hemisphere: 'N' | 'S';
  easting: number;
  northing: number;
}

/** MGRS latitude band for a latitude in degrees. */
export function latitudeBand(lat: number): string {
  if (lat < -80 || lat > 84) return '';
  const bands = 'CDEFGHJKLMNPQRSTUVWXX';
  return bands[Math.floor((lat + 80) / 8)] ?? '';
}

/** UTM zone number, including the Norway and Svalbard exceptions. */
export function utmZone(lat: number, lon: number): number {
  let zone = Math.floor(((((lon + 180) % 360) + 360) % 360) / 6) + 1;
  // South-west Norway: zone 32 is widened westwards.
  if (lat >= 56 && lat < 64 && lon >= 3 && lon < 12) zone = 32;
  // Svalbard: zones 32, 34 and 36 are absorbed by their neighbours.
  if (lat >= 72 && lat < 84) {
    if (lon >= 0 && lon < 9) zone = 31;
    else if (lon >= 9 && lon < 21) zone = 33;
    else if (lon >= 21 && lon < 33) zone = 35;
    else if (lon >= 33 && lon < 42) zone = 37;
  }
  return zone;
}

export function toUtm(lat: number, lon: number): UtmCoordinate {
  const zone = utmZone(lat, lon);
  const lon0 = (zone - 1) * 6 - 180 + 3;

  const phi = lat * DEG;
  const lambda = (lon - lon0) * DEG;

  const sinPhi = Math.sin(phi);
  const cosPhi = Math.cos(phi);
  const tanPhi = Math.tan(phi);

  const N = A / Math.sqrt(1 - E2 * sinPhi * sinPhi);
  const T = tanPhi * tanPhi;
  const C = EP2 * cosPhi * cosPhi;
  const Aa = cosPhi * lambda;

  const M =
    A *
    ((1 - E2 / 4 - (3 * E2 * E2) / 64 - (5 * E2 ** 3) / 256) * phi -
      ((3 * E2) / 8 + (3 * E2 * E2) / 32 + (45 * E2 ** 3) / 1024) * Math.sin(2 * phi) +
      ((15 * E2 * E2) / 256 + (45 * E2 ** 3) / 1024) * Math.sin(4 * phi) -
      ((35 * E2 ** 3) / 3072) * Math.sin(6 * phi));

  const easting =
    K0 *
      N *
      (Aa +
        ((1 - T + C) * Aa ** 3) / 6 +
        ((5 - 18 * T + T * T + 72 * C - 58 * EP2) * Aa ** 5) / 120) +
    500000;

  let northing =
    K0 *
    (M +
      N *
        tanPhi *
        ((Aa * Aa) / 2 +
          ((5 - T + 9 * C + 4 * C * C) * Aa ** 4) / 24 +
          ((61 - 58 * T + T * T + 600 * C - 330 * EP2) * Aa ** 6) / 720));

  if (lat < 0) northing += 10_000_000; // false northing, southern hemisphere

  return {
    zone,
    band: latitudeBand(lat),
    hemisphere: lat < 0 ? 'S' : 'N',
    easting: Math.round(easting),
    northing: Math.round(northing),
  };
}

/** Degrees as degrees/minutes/seconds, e.g. 49°20'13"S. */
export function toDms(value: number, axis: 'lat' | 'lon'): string {
  const hemi = axis === 'lat' ? (value < 0 ? 'S' : 'N') : value < 0 ? 'O' : 'E';
  const abs = Math.abs(value);
  const d = Math.floor(abs);
  const mFloat = (abs - d) * 60;
  const m = Math.floor(mFloat);
  const s = Math.round((mFloat - m) * 60);
  // Carry a rounded-up 60 into the next unit instead of printing 60".
  const sFix = s === 60 ? 0 : s;
  const mFix = s === 60 ? m + 1 : m;
  const dFix = mFix === 60 ? d + 1 : d;
  return `${dFix}°${String(mFix === 60 ? 0 : mFix).padStart(2, '0')}'${String(sFix).padStart(2, '0')}"${hemi}`;
}
