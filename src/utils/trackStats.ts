import type { TrackPoint } from '../services/supabase';

/**
 * Elevation and pace for a recorded walk.
 *
 * Elevation gain is the headline number of a hike — eight kilometres with
 * 900 m of climb is a different day out from eight flat ones — but it is also
 * the easiest statistic to get badly wrong, because a phone's vertical error
 * is two to three times its horizontal one. Summing raw altitude deltas over
 * nine hours reports thousands of metres of climb on a flat road: the noise
 * never cancels, since only the rises are added.
 *
 * So two filters run before anything is counted, which is what GPS watches do:
 *
 * 1. A **median window** over the altitude series. A median throws away a
 *    single wild sample outright, where an average would let it drag the
 *    result — and wild samples are exactly what a phone produces when it loses
 *    a satellite behind a ridge. Nine samples, about forty-five seconds of
 *    walking, which is short enough not to flatten a real summit and wide
 *    enough that steady noise averages out rather than surviving as wobble.
 * 2. **A hysteresis accumulator**: altitude is credited only when it has moved
 *    `THRESHOLD_M` from the last level that was credited, and the whole move
 *    is credited at once.
 *
 * The second one is easy to get subtly wrong, and the validator caught this
 * code doing exactly that. An earlier version gated only the *turns* — once it
 * believed a climb was under way, every new high was added however small. On
 * flat ground that credited the upward half of the noise and none of the
 * downward half, and a level hour came out as 402 m of climb. Gating the
 * turns is not enough; every credit has to clear the threshold.
 *
 * The result reads low rather than high, which is the right way to be wrong
 * about a number someone plans a day around.
 */

/**
 * Samples in the median window. Odd, so there is a true middle. Fifteen is
 * about a minute of walking at the rate the recorder samples.
 */
const SMOOTH_WINDOW = 15;
/**
 * How far the altitude must move before it is credited.
 *
 * Both numbers were chosen by measuring, not by taste. Against a level hour
 * carrying ±8 m of noise, and against known profiles:
 *
 *   window  threshold |  flat   4×100 m bumps   500 m climb
 *        9          5 |   51 m          355 m         491 m
 *        9          7 |   15 m          349 m         491 m
 *       15          7 |    0 m          345 m         487 m   ← chosen
 *       31          5 |    0 m          289 m         473 m
 *
 * The trade is real and there is no setting that wins everywhere. This pair
 * reports **no** phantom climb on flat ground, 97% of a sustained climb, and
 * about 86% of rolling terrain, where each turn costs a threshold. Under-
 * reporting a rolling day is the tolerable error; telling someone a flat walk
 * climbed 300 m is the one that makes the whole number worthless.
 */
const THRESHOLD_M = 7;

export interface ElevationStats {
  /** Metres climbed, after filtering. */
  gain: number;
  /** Metres descended, as a positive number. */
  loss: number;
  min: number;
  max: number;
  /** How many of the track's points carried an altitude at all. */
  samples: number;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

/**
 * Smooths the altitude series with a median window.
 * Exported for the tests, which check the filter and the accumulator apart.
 */
export function smoothAltitudes(alts: number[], window = SMOOTH_WINDOW): number[] {
  // A short track got no smoothing at all when the window did not fit, so a
  // five-minute walk kept every spike the filter exists to remove. Narrow the
  // window to the largest odd size that fits instead of giving up on it.
  const usable = Math.min(window, alts.length % 2 === 1 ? alts.length : alts.length - 1);
  if (usable < 3) return [...alts];
  const half = Math.floor(usable / 2);
  return alts.map((_, i) => {
    const from = Math.max(0, i - half);
    const to = Math.min(alts.length, i + half + 1);
    return median(alts.slice(from, to));
  });
}

/**
 * Climb and descent for a track, or `null` when the track carries no altitude
 * at all.
 *
 * Null rather than zero, deliberately: hikes recorded before altitude was
 * captured, and any recorded on a 2D fix, know nothing about the climb. Zero
 * would claim the walk was flat, and the screen would have no way to tell the
 * difference between flat ground and no data.
 */
export function elevationStats(
  points: TrackPoint[],
  { threshold = THRESHOLD_M, window = SMOOTH_WINDOW }: { threshold?: number; window?: number } = {},
): ElevationStats | null {
  const alts = points
    .map((p) => p.alt)
    .filter((a): a is number => typeof a === 'number' && Number.isFinite(a));
  if (alts.length < 2) return null;

  const smoothed = smoothAltitudes(alts, window);

  let gain = 0;
  let loss = 0;
  // The last altitude that was actually credited. Nothing is added until the
  // track has moved a full threshold away from it, and then the whole move is
  // added and this becomes the new level — so noise that never travels that
  // far contributes nothing, in either direction, however long it goes on.
  let credited = smoothed[0];

  for (const alt of smoothed) {
    const delta = alt - credited;
    if (delta >= threshold) {
      gain += delta;
      credited = alt;
    } else if (-delta >= threshold) {
      loss += -delta;
      credited = alt;
    }
  }

  return {
    gain: Math.round(gain),
    loss: Math.round(loss),
    min: Math.round(Math.min(...smoothed)),
    max: Math.round(Math.max(...smoothed)),
    samples: alts.length,
  };
}

/**
 * Minutes per kilometre — the unit walkers think in, unlike km/h, because it
 * answers "how long will the next kilometre take?" directly.
 *
 * Null when there is not enough distance for the figure to mean anything: over
 * fifty metres, GPS scatter alone can halve or double it.
 */
export function paceMinPerKm(distanceKm: number, durationS: number): number | null {
  if (!(distanceKm > 0.05) || !(durationS > 0)) return null;
  return durationS / 60 / distanceKm;
}

/** `7'30" /km`, or a dash when there is no meaningful pace yet. */
export function formatPace(minPerKm: number | null): string {
  if (minPerKm === null || !Number.isFinite(minPerKm)) return '—';
  // A pace this slow is a rest stop being averaged in, not walking; showing
  // "126'04\"" is noise dressed up as precision.
  if (minPerKm > 99) return '—';
  const mins = Math.floor(minPerKm);
  const secs = Math.round((minPerKm - mins) * 60);
  // Rounding 7.999 gives 60 seconds, which must carry rather than print :60.
  return secs === 60 ? `${mins + 1}'00"` : `${mins}'${String(secs).padStart(2, '0')}"`;
}

/** `+420 m` / `—` when the track carries no altitude. */
export function formatGain(stats: ElevationStats | null): string {
  if (!stats) return '—';
  return `+${stats.gain} m`;
}
