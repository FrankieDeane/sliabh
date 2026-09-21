import { ARGENTINA_TRAILS } from './argentinaTrails';
import { BARILOCHE_TRAILS } from './barilocheTreks';
import type { HikeTrailRef } from '../store/hikeStore';

/**
 * A recording stores only the trail's id, so resuming it after the app was
 * killed has to find the trail again — its name for the header, its line for
 * the map, its trailhead to centre on.
 */
export function findTrailForHike(trailId: string | null | undefined): HikeTrailRef | null {
  if (!trailId) return null;
  const all = [...ARGENTINA_TRAILS, ...BARILOCHE_TRAILS] as Array<{
    id: string;
    name: string;
    coordinates?: { lat: number; lon: number };
    gpxTrack?: Array<{ lat: number; lon: number }>;
  }>;
  const trail = all.find((tr) => tr.id === trailId);
  if (!trail) return null;
  return {
    id: trail.id,
    name: trail.name,
    coordinates: trail.coordinates,
    gpxTrack: trail.gpxTrack,
  };
}

/** The trail's display name, for listing a recorded track. */
export function trailNameFor(trailId: string, fallback: string): string {
  return findTrailForHike(trailId)?.name ?? fallback;
}
