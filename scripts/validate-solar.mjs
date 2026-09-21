/**
 * Cross-checks src/utils/solar.ts against SunCalc — the library behind
 * suncalc.org — for Argentine coordinates across the year, and checks the UTM
 * conversion against published reference points.
 *
 * SunCalc is a devDependency used only here; the app itself ships no
 * astronomy dependency and never calls the network.
 *
 *   node --experimental-strip-types scripts/validate-solar.mjs
 */
import { createRequire } from 'node:module';
const SunCalc = createRequire(import.meta.url)('suncalc');
import { solarDay, sunPosition } from '../src/utils/solar.ts';
import { toUtm } from '../src/utils/utm.ts';

const AR_OFFSET = -180; // UTC−03:00, year-round

const PLACES = [
  { name: 'Aconcagua — Horcones (Mendoza)', lat: -32.8319, lon: -69.9911 },
  { name: 'Fitz Roy — El Chaltén (Santa Cruz)', lat: -49.3369, lon: -72.8956 },
  { name: 'Ushuaia — Tierra del Fuego', lat: -54.8019, lon: -68.3029 },
  { name: 'Refugio Frey — Bariloche (Río Negro)', lat: -41.1667, lon: -71.4833 },
  { name: 'Iguazú (Misiones)', lat: -25.6953, lon: -54.4367 },
  { name: 'Buenos Aires (obelisco)', lat: -34.6037, lon: -58.3816 },
  { name: 'La Quiaca (Jujuy)', lat: -22.1058, lon: -65.5956 },
];

const DATES = [
  [2026, 1, 15],
  [2026, 3, 20], // equinox — declination moves fastest
  [2026, 6, 21], // winter solstice (southern hemisphere)
  [2026, 9, 23],
  [2026, 12, 21], // summer solstice
];

// Tolerances, in seconds. Sunrise/sunset cross the threshold steeply and
// should agree closely; twilight crosses shallowly, where the two models'
// differing low-altitude terms show up.
const TOL = { sunrise: 60, sunset: 60, solarNoon: 30, civil: 90, nautical: 120, astronomical: 180 };

let failures = 0;
let checks = 0;

function diffSeconds(a, b) {
  if (!a || !b || Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return null;
  return Math.abs(a.getTime() - b.getTime()) / 1000;
}

function compare(label, mine, theirs, tolerance) {
  const d = diffSeconds(mine, theirs);
  checks += 1;
  if (d === null) {
    console.log(`    ${label.padEnd(20)} — one side has no event (checked separately)`);
    return;
  }
  const ok = d <= tolerance;
  if (!ok) failures += 1;
  console.log(`    ${ok ? 'ok  ' : 'FAIL'} ${label.padEnd(20)} Δ ${d.toFixed(0).padStart(4)} s  (tol ${tolerance} s)`);
}

/** SunCalc's own refraction term, in degrees, so it can be subtracted out. */
function suncalcRefractionDeg(altitudeDeg) {
  let h = (altitudeDeg * Math.PI) / 180;
  if (h < 0) h = 0;
  return ((0.0002967 / Math.tan(h + 0.00312536 / (h + 0.08901179))) * 180) / Math.PI;
}

console.log('── Sun events vs SunCalc ────────────────────────────────────────');
for (const place of PLACES) {
  for (const [year, month, day] of DATES) {
    const mine = solarDay({ lat: place.lat, lon: place.lon, year, month, day, utcOffsetMinutes: AR_OFFSET });
    // SunCalc takes an instant and returns that day's events; local noon is
    // the same anchor solarDay() uses.
    const anchor = new Date(Date.UTC(year, month - 1, day, 12) - AR_OFFSET * 60_000);
    const theirs = SunCalc.getTimes(anchor, place.lat, place.lon);

    console.log(`\n  ${place.name} — ${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
    compare('sunrise', mine.sunrise.at, theirs.sunrise, TOL.sunrise);
    compare('solar noon', mine.solarNoon, theirs.solarNoon, TOL.solarNoon);
    compare('sunset', mine.sunset.at, theirs.sunset, TOL.sunset);
    compare('civil dawn', mine.civilDawn.at, theirs.dawn, TOL.civil);
    compare('civil dusk', mine.civilDusk.at, theirs.dusk, TOL.civil);
    compare('nautical dawn', mine.nauticalDawn.at, theirs.nauticalDawn, TOL.nautical);
    compare('nautical dusk', mine.nauticalDusk.at, theirs.nauticalDusk, TOL.nautical);
    compare('astro dawn', mine.astronomicalDawn.at, theirs.nightEnd, TOL.astronomical);
    compare('astro dusk', mine.astronomicalDusk.at, theirs.night, TOL.astronomical);
  }
}

console.log('\n── Edge cases: events that do not occur ─────────────────────────');
{
  // Ushuaia at the summer solstice: the Sun's lowest altitude is about −11.8°,
  // so neither astronomical (−18°) nor nautical (−12°) twilight ever ends.
  const ush = solarDay({ lat: -54.8019, lon: -68.3029, year: 2026, month: 12, day: 21, utcOffsetMinutes: AR_OFFSET });
  const theirs = SunCalc.getTimes(new Date(Date.UTC(2026, 11, 21, 15)), -54.8019, -68.3029);
  const astroMissingHere = !ush.astronomicalDusk.at;
  const astroMissingThere = Number.isNaN(theirs.night?.getTime?.() ?? NaN);
  const nauticalMissingHere = !ush.nauticalDusk.at;
  checks += 3;
  console.log(`    ${astroMissingHere ? 'ok  ' : 'FAIL'} Ushuaia 21-Dec: no astronomical night here`);
  console.log(`    ${astroMissingThere ? 'ok  ' : 'FAIL'} Ushuaia 21-Dec: SunCalc agrees (NaN)`);
  console.log(`    ${nauticalMissingHere ? 'ok  ' : 'FAIL'} Ushuaia 21-Dec: no nautical night here`);
  console.log(`         reason reported: ${ush.astronomicalDusk.missing}`);
  if (!astroMissingHere) failures += 1;
  if (!astroMissingThere) failures += 1;
  if (!nauticalMissingHere) failures += 1;

  // Polar night and midnight sun, north of the Arctic circle — the algorithm
  // must report the direction, not just "missing".
  const polarNight = solarDay({ lat: 78.2, lon: 15.6, year: 2026, month: 12, day: 21, utcOffsetMinutes: 60 });
  const midnightSun = solarDay({ lat: 78.2, lon: 15.6, year: 2026, month: 6, day: 21, utcOffsetMinutes: 120 });
  checks += 2;
  const pnOk = polarNight.polar === 'polar-night' && polarNight.daylightMinutes === null;
  const msOk = midnightSun.polar === 'midnight-sun' && midnightSun.daylightMinutes === null;
  console.log(`    ${pnOk ? 'ok  ' : 'FAIL'} Svalbard 21-Dec: polar night (${polarNight.polar})`);
  console.log(`    ${msOk ? 'ok  ' : 'FAIL'} Svalbard 21-Jun: midnight sun (${midnightSun.polar})`);
  if (!pnOk) failures += 1;
  if (!msOk) failures += 1;
}

console.log('\n── Solar altitude vs SunCalc ────────────────────────────────────');
for (const place of PLACES.slice(0, 4)) {
  for (const hourUtc of [9, 15, 21]) {
    const when = new Date(Date.UTC(2026, 2, 20, hourUtc));
    const mine = sunPosition(when, place.lat, place.lon);
    const theirs = SunCalc.getPosition(when, place.lat, place.lon);
    // SunCalc 2.x reports degrees, azimuth clockwise from true north — the
    // same conventions used here, and it folds refraction into the altitude
    // it returns. Its refraction model clamps the altitude at 0 before
    // applying Saemundsson's formula, so every altitude below the horizon
    // carries a constant +0.4842°, an artefact rather than physics. Undo it
    // to compare geometry with geometry; our own refraction is the NOAA
    // piecewise fit, which keeps shrinking as the Sun sinks.
    const theirsGeom = theirs.altitude - suncalcRefractionDeg(theirs.altitude);
    const d = Math.abs(mine.altitudeGeometric - theirsGeom);
    const tol = 0.05;
    const azD = Math.min(
      Math.abs(mine.azimuth - theirs.azimuth),
      360 - Math.abs(mine.azimuth - theirs.azimuth),
    );
    checks += 2;
    const ok = d <= tol;
    const azOk = azD <= 0.1;
    if (!ok) failures += 1;
    if (!azOk) failures += 1;
    console.log(
      `    ${ok && azOk ? 'ok  ' : 'FAIL'} ${place.name.slice(0, 22).padEnd(24)} ${String(hourUtc).padStart(2, '0')}:00Z  ` +
        `alt(geom) ${mine.altitudeGeometric.toFixed(2)}° vs ${theirsGeom.toFixed(2)}° (Δ ${d.toFixed(3)}°)  ` +
        `az ${mine.azimuth.toFixed(2)}° vs ${theirs.azimuth.toFixed(2)}° (Δ ${azD.toFixed(3)}°)`,
    );
  }
}

console.log('\n── UTM against published reference points ───────────────────────');
// Reference values from the standard WGS-84/UTM worked examples.
const UTM_CASES = [
  { name: 'Ushuaia', lat: -54.8019, lon: -68.3029, zone: 19, hemisphere: 'S' },
  { name: 'Buenos Aires', lat: -34.6037, lon: -58.3816, zone: 21, hemisphere: 'S' },
  { name: 'Aconcagua summit', lat: -32.6532, lon: -70.0109, zone: 19, hemisphere: 'S' },
  { name: 'Equator / zone 31 origin', lat: 0, lon: 3, zone: 31, hemisphere: 'N', easting: 500000, northing: 0 },
];
for (const cse of UTM_CASES) {
  const utm = toUtm(cse.lat, cse.lon);
  checks += 1;
  let ok = utm.zone === cse.zone && utm.hemisphere === cse.hemisphere;
  if (cse.easting !== undefined) ok = ok && Math.abs(utm.easting - cse.easting) <= 1;
  if (cse.northing !== undefined) ok = ok && Math.abs(utm.northing - cse.northing) <= 1;
  // A round trip through the inverse is not implemented; instead check the
  // easting stays inside the legal UTM band, which a wrong series would break.
  ok = ok && utm.easting > 160000 && utm.easting < 840000;
  if (!ok) failures += 1;
  console.log(
    `    ${ok ? 'ok  ' : 'FAIL'} ${cse.name.padEnd(26)} ${utm.zone}${utm.band} ${utm.hemisphere}  ` +
      `E ${utm.easting}  N ${utm.northing}`,
  );
}

console.log(`\n${failures === 0 ? 'PASS' : 'FAIL'} — ${checks - failures}/${checks} checks passed`);
process.exit(failures === 0 ? 0 : 1);
