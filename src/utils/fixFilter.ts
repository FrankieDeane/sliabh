import type { TrackPoint } from '../services/supabase';

/**
 * Which GPS fixes become part of the track.
 *
 * A phone reports a position every second or so whether or not it knows where
 * it is. Indoors, under a roof or at a cold start it answers from wifi and cell
 * towers, with an error of 30 m to a kilometre, and the fixes wander. Recorded
 * as they come, a walker standing still draws a zigzag of spikes and "walks"
 * a hundred metres at a nonsense pace. Three gates stop that:
 *
 * 1. **Accuracy.** A fix whose reported error is wider than `MAX_ACCURACY_M` is
 *    not a position worth drawing. The blue dot still moves; the line doesn't.
 * 2. **Speed.** A jump from the last kept point faster than `MAX_SPEED_MPS` is
 *    a bad fix, not a sprint. The gate heals on its own: time keeps growing
 *    while distance doesn't, so a real position is accepted a few seconds on.
 * 3. **Movement beyond the fixes' error.** Two fixes at ±10 m each can land
 *    20 m apart without anyone moving, so the bar is twice the reported error.
 *    Measured from the last *kept* point, so real walking still gets through
 *    once it exceeds the noise: at ±5 m, a point every ten metres.
 *
 * A rest stop still leaves a trace every `MAX_GAP_MS`, but at the last kept
 * position: the clock advances, the distance does not.
 */

/** Wider than this, the fix came from wifi or cell towers, not satellites. */
export const MAX_ACCURACY_M = 35;
/** About 25 km/h: past any hiker or trail runner, short of any GPS spike. */
export const MAX_SPEED_MPS = 7;
/** Fixes closer together than this are jitter, not walking. */
export const MIN_MOVE_M = 4;
/** The error-based bar never rises above this, so a walk still leaves a line. */
const MAX_MOVE_BAR_M = 30;
/** …unless this long has passed, so a rest stop still leaves a trace. */
export const MAX_GAP_MS = 15_000;

export function metresBetween(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

/**
 * The point to append for this fix, or null to drop it.
 * `accuracy` is the device's reported error in metres, when it gave one.
 */
export function filterFix(
  last: TrackPoint | undefined,
  point: TrackPoint,
  accuracy?: number | null,
): TrackPoint | null {
  const known = typeof accuracy === 'number' && Number.isFinite(accuracy);
  if (known && accuracy > MAX_ACCURACY_M) return null;
  if (!last) return point;

  const dist = metresBetween(last, point);
  const dt = (point.t - last.t) / 1000;
  if (dt <= 0) return null;
  if (dist / dt > MAX_SPEED_MPS) return null;

  const bar = Math.min(Math.max(known ? 2 * accuracy : 0, MIN_MOVE_M), MAX_MOVE_BAR_M);
  if (dist >= bar) return point;
  if (point.t - last.t < MAX_GAP_MS) return null;
  return { ...point, lat: last.lat, lon: last.lon };
}
