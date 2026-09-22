/**
 * Does the elevation engine report the climb that was actually walked?
 *
 * This matters more than it looks. A hiker plans a day around the climb, and a
 * figure inflated by GPS noise makes an easy walk look brutal — or, worse, a
 * brutal one look easy once someone stops trusting the number at all.
 *
 * The cases below are synthetic on purpose: a real GPS trace has no known
 * answer to check against, while a profile built by hand does. Noise is added
 * from a seeded generator so a failure here is always reproducible.
 *
 *   node --experimental-strip-types scripts/validate-track-stats.mjs
 */
import { elevationStats, paceMinPerKm, formatPace, smoothAltitudes } from '../src/utils/trackStats.ts';

let checks = 0;
let failures = 0;

function check(label, ok, detail = '') {
  checks += 1;
  if (!ok) failures += 1;
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label}${detail ? `  — ${detail}` : ''}`);
}

function near(actual, expected, tolerance, label) {
  const ok = actual !== null && Math.abs(actual - expected) <= tolerance;
  check(label, ok, `got ${actual}, expected ${expected} ±${tolerance}`);
}

/** Deterministic noise: a failure must be reproducible, not a coin toss. */
function seeded(seed) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296 - 0.5; // −0.5 … 0.5
  };
}

function track(alts, { noise = 0, seed = 7 } = {}) {
  const rand = seeded(seed);
  return alts.map((alt, i) => ({
    lat: -41 + i * 0.0001,
    lon: -71,
    t: 1_700_000_000_000 + i * 5000,
    alt: alt + (noise ? rand() * 2 * noise : 0),
  }));
}

function ramp(from, to, steps) {
  return Array.from({ length: steps }, (_, i) => from + ((to - from) * i) / (steps - 1));
}

console.log('flat ground');
{
  // The case that motivates the whole filter: walking a flat road for an hour
  // must not report a climb. Unfiltered, summing positive deltas of ±8 m noise
  // over 720 samples reports hundreds of metres of ascent.
  const flat = track(new Array(720).fill(600), { noise: 8 });
  const stats = elevationStats(flat);
  check('a flat hour reports no climb at all', stats.gain === 0, `${stats.gain} m`);
  check('and no descent', stats.loss === 0, `${stats.loss} m`);

  const raw = flat.reduce((sum, p, i) => (i && p.alt > flat[i - 1].alt ? sum + (p.alt - flat[i - 1].alt) : sum), 0);
  check('the naive sum really would have been wrong', raw > 200, `unfiltered: ${Math.round(raw)} m`);
}

console.log('\na climb and a descent');
{
  // Up 500 m, back down: the classic out-and-back.
  const profile = [...ramp(600, 1100, 300), ...ramp(1100, 600, 300)];
  const stats = elevationStats(track(profile, { noise: 4 }));
  near(stats.gain, 500, 40, 'climbs about 500 m');
  near(stats.loss, 500, 40, 'descends about 500 m');
  near(stats.max, 1100, 12, 'tops out near the summit');
  near(stats.min, 600, 12, 'bottoms out near the trailhead');
}

console.log('\nrolling terrain');
{
  // Four 100 m bumps: 400 m of real climb that a naive peak-to-trough
  // measurement would report as 100.
  const bumps = [];
  for (let i = 0; i < 4; i += 1) {
    bumps.push(...ramp(800, 900, 60), ...ramp(900, 800, 60));
  }
  const stats = elevationStats(track(bumps, { noise: 3 }));
  // Rolling terrain is where hysteresis costs the most: each of the eight
  // turns gives up a threshold. The contract is that it under-reports and
  // never inflates — 86% of the truth here, which is the documented behaviour
  // rather than a tolerance loosened until the test went green.
  check('counts every bump, not just the highest', stats.gain >= 330, `${stats.gain} m of 400`);
  check('never claims more climb than was walked', stats.gain <= 400, `${stats.gain} m`);
  check('and counts every descent', stats.loss >= 330 && stats.loss <= 400, `${stats.loss} m of 400`);
}

console.log('\nwhat the filters do');
{
  const spike = [700, 700, 700, 700, 700, 940, 700, 700, 700, 700, 700];
  const smoothed = smoothAltitudes(spike);
  check('a single wild sample is thrown away', Math.max(...smoothed) < 720, `peak ${Math.max(...smoothed)}`);

  // A staircase of 2 m steps is below the threshold and must not accumulate.
  const wobble = track([700, 702, 700, 702, 700, 702, 700, 702, 700], { noise: 0 });
  const stats = elevationStats(wobble);
  check('movement under the threshold is not counted', stats.gain === 0, `${stats.gain} m`);
}

console.log('\nwhen there is nothing to report');
{
  check('a track with no altitude returns null, not zero',
    elevationStats([{ lat: -41, lon: -71, t: 1 }, { lat: -41, lon: -71, t: 2 }]) === null,
    'zero would claim the walk was flat');
  check('a single altitude sample is not enough',
    elevationStats([{ lat: -41, lon: -71, t: 1, alt: 700 }]) === null);
  check('hikes recorded before altitude existed still load',
    elevationStats([{ lat: -41, lon: -71, t: 1 }, { lat: -41, lon: -71, t: 2, alt: 700 }]) === null,
    'one sample among them is still one sample');
}

console.log('\npace');
{
  near(paceMinPerKm(5, 3600), 12, 0.01, '5 km in an hour is 12 min/km');
  check('formats as minutes and seconds', formatPace(7.5) === "7'30\"", formatPace(7.5));
  check('carries a rounded 60 seconds into the minute', formatPace(7.999) === "8'00\"", formatPace(7.999));
  check('too short to mean anything returns null', paceMinPerKm(0.02, 60) === null);
  check('zero duration returns null', paceMinPerKm(5, 0) === null);
  check('a rest stop averaged in is not shown as a pace', formatPace(126) === '—');
  check('null formats as a dash', formatPace(null) === '—');
}

console.log(`\n${failures === 0 ? 'PASS' : 'FAIL'} — ${checks - failures}/${checks} checks passed`);
process.exit(failures === 0 ? 0 : 1);
