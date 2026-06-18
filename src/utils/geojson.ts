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
