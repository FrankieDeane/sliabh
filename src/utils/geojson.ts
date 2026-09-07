export interface GpxPoint {
  lat: number;
  lon: number;
  ele?: number;
  name?: string;
}

/**
 * Converts a gpxTrack array to a GeoJSON Feature with a LineString geometry.
 * Coordinates follow GeoJSON order: [longitude, latitude, elevation?].
 * Elevation defaults to 0 when absent — callers should supply real ele values
 * before using this for 3D terrain draping.
 */
export function gpxTrackToGeoJSON(track: GpxPoint[]): GeoJSON.Feature<GeoJSON.LineString> {
  return {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates: track.map((p) => (p.ele != null ? [p.lon, p.lat, p.ele] : [p.lon, p.lat])),
    },
    properties: {},
  };
}

/**
 * Haversine distance in km between two lat/lon points.
 */
function haversineKm(a: GpxPoint, b: GpxPoint): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

/**
 * Builds cumulative distance array (km) from a track.
 * Index 0 is always 0.
 */
export function trackCumulativeDistances(track: GpxPoint[]): number[] {
  const dists: number[] = [0];
  for (let i = 1; i < track.length; i++) {
    dists.push(dists[i - 1] + haversineKm(track[i - 1], track[i]));
  }
  return dists;
}

/**
 * Splits a track into one 2-point LineString per consecutive pair, each
 * tagged with `slopeDeg` (average grade of that segment, in degrees —
 * atan(rise/run), not percent) so a MapLibre line layer can color each
 * segment by steepness via a data-driven `line-color` expression.
 *
 * Caveat worth knowing: for most trails `track` is Sliabh's own smoothed
 * approximation between real waypoints (see the trail data files), not a
 * dense raw GPS recording — so this is the average grade of each stretch
 * between those waypoints, not the literal pitch at any single meter of
 * trail. Still a real, useful signal (a segment gaining 400m over 800m
 * horizontal reads as steep no matter how it's sampled), just not a
 * pixel-perfect terrain reading the way a LIDAR-derived slope map would be.
 */
export function trackToSlopeSegments(track: GpxPoint[]): GeoJSON.FeatureCollection<GeoJSON.LineString> {
  const features: GeoJSON.Feature<GeoJSON.LineString>[] = [];
  for (let i = 1; i < track.length; i++) {
    const a = track[i - 1];
    const b = track[i];
    const runM = haversineKm(a, b) * 1000;
    const riseM = Math.abs((b.ele ?? 0) - (a.ele ?? 0));
    const slopeDeg = runM > 0.5 ? (Math.atan2(riseM, runM) * 180) / Math.PI : 0;
    features.push({
      type: 'Feature',
      properties: { slopeDeg: Math.round(slopeDeg * 10) / 10 },
      geometry: {
        type: 'LineString',
        coordinates: [
          a.ele != null ? [a.lon, a.lat, a.ele] : [a.lon, a.lat],
          b.ele != null ? [b.lon, b.lat, b.ele] : [b.lon, b.lat],
        ],
      },
    });
  }
  return { type: 'FeatureCollection', features };
}
