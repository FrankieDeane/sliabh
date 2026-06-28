/**
 * Builds the trail payload pushed to the parques.html iframe (Mapas + Rutas
 * 3D map) via postMessage `setTrails`. The iframe renders every trail that has
 * a gpxTrack as a polyline + clustered marker, deduping against its built-in
 * Bariloche / El Chaltén layers. This keeps the map data-driven from the TS
 * data files — no per-park hardcoding in the HTML.
 */

type AnyTrail = {
  id: string;
  name: string;
  difficulty: string;
  distance_km: number;
  elevation_gain_m: number;
  max_altitude_m: number;
  duration?: { min: number; max: number; unit: string } | string;
  coordinates: { lat: number; lon: number };
  trailhead?: string;
  best_season?: string;
  description?: string;
  gpxTrack?: Array<{ lat: number; lon: number; ele?: number; name?: string }>;
};

function formatDuration(d: AnyTrail['duration']): string {
  if (!d) return '';
  if (typeof d === 'string') return d;
  const unit = d.unit || 'horas';
  return d.min === d.max ? `${d.min} ${unit}` : `${d.min}–${d.max} ${unit}`;
}

export interface MapTrailPayload {
  id: string;
  name: string;
  difficulty: string;
  distance_km: number;
  elevation_gain_m: number;
  max_altitude_m: number;
  duration: string;
  lat: number;
  lng: number;
  trailhead: string;
  best_season: string;
  description: string;
  gpxTrack: Array<{ lat: number; lon: number; ele?: number }>;
}

export function buildMapTrailPayload(trails: AnyTrail[]): MapTrailPayload[] {
  return trails
    .filter((t) => Array.isArray(t.gpxTrack) && t.gpxTrack.length >= 2)
    .map((t) => ({
      id: t.id,
      name: t.name,
      difficulty: t.difficulty,
      distance_km: t.distance_km,
      elevation_gain_m: t.elevation_gain_m,
      max_altitude_m: t.max_altitude_m,
      duration: formatDuration(t.duration),
      lat: t.coordinates.lat,
      lng: t.coordinates.lon,
      trailhead: t.trailhead || '',
      best_season: t.best_season || '',
      description: t.description || '',
      gpxTrack: (t.gpxTrack as Array<{ lat: number; lon: number; ele?: number }>).map((p) => ({
        lat: p.lat,
        lon: p.lon,
        ele: p.ele,
      })),
    }));
}
