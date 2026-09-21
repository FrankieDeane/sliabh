/**
 * Offline solar almanac — sun event times, altitude and day length for any
 * coordinate on Earth, with no network access at any point.
 *
 * ── Method ───────────────────────────────────────────────────────────────
 * Implements the NOAA Solar Calculator equations (themselves a condensation
 * of Meeus, *Astronomical Algorithms*, ch. 12, 22, 25 and 28):
 *
 *   1. The instant is reduced to a Julian century T from J2000.0.
 *   2. Geometric mean longitude, mean anomaly and the equation of the centre
 *      give the Sun's apparent ecliptic longitude, corrected for nutation and
 *      aberration.
 *   3. The obliquity of the ecliptic (Laskar's polynomial, with the nutation
 *      term) turns that into declination, and the same terms give the
 *      equation of time.
 *   4. Solar transit (true solar noon) for the day is
 *        720 − 4·longitude − equationOfTime   [minutes UTC]
 *      and every rise/set/twilight event is transit ± 4·H, where H is the
 *      hour angle at which the Sun reaches the event altitude:
 *        cos H = (sin h − sin φ · sin δ) / (cos φ · cos δ)
 *   5. Declination and equation of time are then recomputed *at* each event
 *      instant and the event is solved again (one refinement pass), which
 *      matters near the equinoxes where declination moves fastest.
 *
 * ── Accuracy ─────────────────────────────────────────────────────────────
 * Within ±1 minute for sunrise/sunset between latitudes ±72°, which covers
 * every trail in this app (southernmost ≈ −55°, Tierra del Fuego). Twilight
 * times, whose altitude threshold is crossed at a shallower angle, are within
 * ~2 minutes. Solar noon is within a few seconds. Cross-checked against
 * SunCalc (the library behind suncalc.org) for Argentine locations across the
 * year — see scripts/validate-solar.mjs.
 *
 * The error that dominates in practice is not the algorithm: it is refraction
 * (below) and local terrain. A ridge to the east delays visible sunrise far
 * more than a minute, so these times describe a *flat, unobstructed horizon*.
 *
 * ── Refraction assumptions ───────────────────────────────────────────────
 * Sunrise and sunset use a geometric altitude of −0.833°, the standard
 * convention: 34′ of mean atmospheric refraction at the horizon plus the 16′
 * semidiameter of the solar disc, so the event is the moment the *upper limb*
 * appears to touch the horizon. Refraction varies with pressure and
 * temperature; a cold, dense morning in Patagonia can shift true sunrise by
 * ~30 s from this mean value, and no almanac published for hikers models it.
 *
 * Observer elevation lowers the visible horizon by the dip angle
 *   0.0353° · √(metres)
 * which is subtracted from the −0.833°: at Plaza de Mulas (4370 m) the Sun
 * rises about 8 minutes earlier than it does at sea level under the same sky.
 * Pass `elevationM` to apply it.
 *
 * Twilight thresholds (−6° civil, −12° nautical, −18° astronomical) are, by
 * definition, the altitude of the Sun's *centre* with no refraction or
 * semidiameter correction, and are therefore not adjusted for elevation.
 *
 * ── Edge cases ───────────────────────────────────────────────────────────
 * When |cos H| > 1 the Sun never reaches that altitude on that day, and the
 * event does not exist. Both directions are reported rather than collapsed to
 * null: `always-above` (the Sun stays higher all day — midnight sun, or for a
 * twilight threshold, a night that never gets that dark) and `always-below`
 * (polar night). At −54.8° (Ushuaia) around the December solstice the Sun's
 * lowest altitude is about −11.8°, so *neither* astronomical nor nautical
 * twilight ends: the sky stays in nautical twilight all night. Callers must
 * render that as a statement, not as a blank field.
 *
 * Daylight duration is null whenever sunrise or sunset is missing; a 24-hour
 * day and a 0-hour day are both "no sunrise today" and must be distinguished
 * by the polar flag.
 */

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;
const MS_PER_DAY = 86_400_000;
const J2000 = 2451545.0;

/** Geometric altitude of the Sun's centre at each event, in degrees. */
export const EVENT_ALTITUDE = {
  sunrise: -0.833,
  civil: -6,
  nautical: -12,
  astronomical: -18,
} as const;

export type MissingReason = 'always-above' | 'always-below';

export interface SolarEvent {
  /** UTC instant of the event, or null when it does not occur that day. */
  at: Date | null;
  /** Why it does not occur, when it does not. */
  missing?: MissingReason;
}

export interface SolarPosition {
  /** Apparent altitude above the horizon in degrees (refraction included). */
  altitude: number;
  /** True geometric altitude, before atmospheric refraction. */
  altitudeGeometric: number;
  /** Azimuth in degrees clockwise from true north. */
  azimuth: number;
  /** Solar declination in degrees. */
  declination: number;
  /** Equation of time in minutes. */
  equationOfTime: number;
}

export interface SolarDay {
  astronomicalDawn: SolarEvent;
  nauticalDawn: SolarEvent;
  civilDawn: SolarEvent;
  sunrise: SolarEvent;
  /** True solar noon — always defined, the Sun culminates every day. */
  solarNoon: Date;
  sunset: SolarEvent;
  civilDusk: SolarEvent;
  nauticalDusk: SolarEvent;
  astronomicalDusk: SolarEvent;
  /** Minutes between sunrise and sunset; null when either is missing. */
  daylightMinutes: number | null;
  /** Solar altitude at culmination, in degrees — the day's maximum. */
  noonAltitude: number;
  /** Whether the Sun stays up or down for the whole day. */
  polar: 'none' | 'midnight-sun' | 'polar-night';
  /** Horizon altitude actually used for sunrise/sunset, dip included. */
  horizonAltitude: number;
}

function toJulian(ms: number): number {
  return ms / MS_PER_DAY + 2440587.5;
}

function fromJulian(jd: number): Date {
  return new Date((jd - 2440587.5) * MS_PER_DAY);
}

function julianCentury(jd: number): number {
  return (jd - J2000) / 36525;
}

/** Sun's apparent declination (deg) and the equation of time (minutes). */
function sunParams(T: number): { declination: number; equationOfTime: number; trueLongitude: number } {
  const meanLong = (280.46646 + T * (36000.76983 + T * 0.0003032)) % 360;
  const L0 = meanLong < 0 ? meanLong + 360 : meanLong;
  const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
  const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);

  const C =
    Math.sin(M * DEG) * (1.914602 - T * (0.004817 + 0.000014 * T)) +
    Math.sin(2 * M * DEG) * (0.019993 - 0.000101 * T) +
    Math.sin(3 * M * DEG) * 0.000289;

  const trueLong = L0 + C;
  // Nutation in longitude + aberration, giving the *apparent* longitude.
  const omega = 125.04 - 1934.136 * T;
  const appLong = trueLong - 0.00569 - 0.00478 * Math.sin(omega * DEG);

  const meanObliq = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
  const obliq = meanObliq + 0.00256 * Math.cos(omega * DEG);

  const declination = Math.asin(Math.sin(obliq * DEG) * Math.sin(appLong * DEG)) * RAD;

  const y = Math.tan((obliq / 2) * DEG) ** 2;
  const eqTime =
    4 *
    RAD *
    (y * Math.sin(2 * L0 * DEG) -
      2 * e * Math.sin(M * DEG) +
      4 * e * y * Math.sin(M * DEG) * Math.cos(2 * L0 * DEG) -
      0.5 * y * y * Math.sin(4 * L0 * DEG) -
      1.25 * e * e * Math.sin(2 * M * DEG));

  return { declination, equationOfTime: eqTime, trueLongitude: trueLong };
}

/**
 * Atmospheric refraction for an apparent-altitude correction, in degrees
 * (NOAA's piecewise fit to Bennett's formula; 0 for the Sun below ~−0.575°
 * where the fit stops being meaningful).
 */
function refraction(elevationDeg: number): number {
  if (elevationDeg > 85) return 0;
  const te = Math.tan(elevationDeg * DEG);
  let r: number;
  if (elevationDeg > 5) {
    r = 58.1 / te - 0.07 / te ** 3 + 0.000086 / te ** 5;
  } else if (elevationDeg > -0.575) {
    r = 1735 + elevationDeg * (-518.2 + elevationDeg * (103.4 + elevationDeg * (-12.79 + elevationDeg * 0.711)));
  } else {
    r = -20.772 / te;
  }
  return r / 3600;
}

/** Sun altitude/azimuth at a given instant, as seen from lat/lon. */
export function sunPosition(date: Date, lat: number, lon: number): SolarPosition {
  const jd = toJulian(date.getTime());
  const T = julianCentury(jd);
  const { declination, equationOfTime } = sunParams(T);

  const utcMinutes =
    date.getUTCHours() * 60 + date.getUTCMinutes() + date.getUTCSeconds() / 60 + date.getUTCMilliseconds() / 60000;
  let trueSolarTime = (utcMinutes + equationOfTime + 4 * lon) % 1440;
  if (trueSolarTime < 0) trueSolarTime += 1440;

  let hourAngle = trueSolarTime / 4 - 180;
  if (hourAngle < -180) hourAngle += 360;

  const latR = lat * DEG;
  const decR = declination * DEG;
  const haR = hourAngle * DEG;

  const cosZenith =
    Math.sin(latR) * Math.sin(decR) + Math.cos(latR) * Math.cos(decR) * Math.cos(haR);
  const zenith = Math.acos(Math.min(1, Math.max(-1, cosZenith))) * RAD;
  const geometricAltitude = 90 - zenith;

  // Azimuth measured clockwise from north.
  let azimuth: number;
  const denom = Math.cos(latR) * Math.sin(zenith * DEG);
  if (Math.abs(denom) > 1e-9) {
    const cosAz = (Math.sin(latR) * Math.cos(zenith * DEG) - Math.sin(decR)) / denom;
    azimuth = Math.acos(Math.min(1, Math.max(-1, cosAz))) * RAD;
    azimuth = hourAngle > 0 ? (azimuth + 180) % 360 : (540 - azimuth) % 360;
  } else {
    azimuth = lat > 0 ? 180 : 0;
  }

  return {
    altitude: geometricAltitude + refraction(geometricAltitude),
    altitudeGeometric: geometricAltitude,
    azimuth,
    declination,
    equationOfTime,
  };
}

/** Altitude threshold for sunrise/sunset, lowered by the horizon dip. */
export function horizonAltitude(elevationM?: number): number {
  const dip = elevationM && elevationM > 0 ? 0.0353 * Math.sqrt(elevationM) : 0;
  return EVENT_ALTITUDE.sunrise - dip;
}

/** Hour angle (deg) at which the Sun reaches `altitude`, or null if never. */
function hourAngle(altitude: number, lat: number, declination: number): number | null {
  const latR = lat * DEG;
  const decR = declination * DEG;
  const cosH =
    (Math.sin(altitude * DEG) - Math.sin(latR) * Math.sin(decR)) / (Math.cos(latR) * Math.cos(decR));
  if (cosH > 1 || cosH < -1) return null;
  return Math.acos(cosH) * RAD;
}

/**
 * Solar transit (true solar noon) as a UTC instant, for the day containing
 * `localNoonUtc` — the instant of 12:00 local time, which anchors every event
 * of that *local* calendar day even where the local day straddles 00:00 UTC.
 */
function transitFor(localNoonUtc: Date, lon: number): Date {
  let transit = localNoonUtc;
  // Two passes: the equation of time is evaluated at the transit it predicts.
  for (let i = 0; i < 2; i += 1) {
    const T = julianCentury(toJulian(transit.getTime()));
    const { equationOfTime } = sunParams(T);
    const dayStart = Math.floor(toJulian(transit.getTime()) - 0.5) + 0.5;
    const minutes = 720 - 4 * lon - equationOfTime;
    transit = fromJulian(dayStart + minutes / 1440);
  }
  return transit;
}

function solveEvent(
  transit: Date,
  lat: number,
  lon: number,
  altitude: number,
  morning: boolean,
): SolarEvent {
  const T0 = julianCentury(toJulian(transit.getTime()));
  const { declination: dec0 } = sunParams(T0);
  const h0 = hourAngle(altitude, lat, dec0);
  if (h0 === null) return { at: null, missing: noonSide(lat, dec0, altitude) };

  let guess = new Date(transit.getTime() + (morning ? -1 : 1) * h0 * 4 * 60_000);
  // Refine once with declination and equation of time taken at the event.
  const T1 = julianCentury(toJulian(guess.getTime()));
  const { declination: dec1, equationOfTime: eq1 } = sunParams(T1);
  const h1 = hourAngle(altitude, lat, dec1);
  if (h1 === null) return { at: null, missing: noonSide(lat, dec1, altitude) };

  const dayStart = Math.floor(toJulian(transit.getTime()) - 0.5) + 0.5;
  const refinedTransit = 720 - 4 * lon - eq1;
  guess = fromJulian(dayStart + (refinedTransit + (morning ? -1 : 1) * h1 * 4) / 1440);
  return { at: guess };
}

/** Which side of the threshold the Sun stays on when an event is missing. */
function noonSide(lat: number, declination: number, altitude: number): MissingReason {
  const noonAlt = 90 - Math.abs(lat - declination);
  return noonAlt > altitude ? 'always-above' : 'always-below';
}

export interface SolarDayInput {
  lat: number;
  lon: number;
  /** Local calendar date the almanac is for. */
  year: number;
  /** 1-12. */
  month: number;
  day: number;
  /** Minutes east of UTC for the trail's zone (Argentina: −180). */
  utcOffsetMinutes: number;
  /** Observer elevation in metres, when the trail data has it. */
  elevationM?: number;
}

/** Every sun event of one local calendar day at one coordinate. */
export function solarDay(input: SolarDayInput): SolarDay {
  const { lat, lon, year, month, day, utcOffsetMinutes, elevationM } = input;

  const localNoonUtc = new Date(
    Date.UTC(year, month - 1, day, 12, 0, 0) - utcOffsetMinutes * 60_000,
  );
  const transit = transitFor(localNoonUtc, lon);

  const T = julianCentury(toJulian(transit.getTime()));
  const { declination } = sunParams(T);
  const noonAltitude = 90 - Math.abs(lat - declination);

  const riseAlt = horizonAltitude(elevationM);
  const sunrise = solveEvent(transit, lat, lon, riseAlt, true);
  const sunset = solveEvent(transit, lat, lon, riseAlt, false);

  const daylightMinutes =
    sunrise.at && sunset.at ? (sunset.at.getTime() - sunrise.at.getTime()) / 60_000 : null;

  const polar: SolarDay['polar'] =
    sunrise.at ? 'none' : sunrise.missing === 'always-above' ? 'midnight-sun' : 'polar-night';

  return {
    astronomicalDawn: solveEvent(transit, lat, lon, EVENT_ALTITUDE.astronomical, true),
    nauticalDawn: solveEvent(transit, lat, lon, EVENT_ALTITUDE.nautical, true),
    civilDawn: solveEvent(transit, lat, lon, EVENT_ALTITUDE.civil, true),
    sunrise,
    solarNoon: transit,
    sunset,
    civilDusk: solveEvent(transit, lat, lon, EVENT_ALTITUDE.civil, false),
    nauticalDusk: solveEvent(transit, lat, lon, EVENT_ALTITUDE.nautical, false),
    astronomicalDusk: solveEvent(transit, lat, lon, EVENT_ALTITUDE.astronomical, false),
    daylightMinutes,
    noonAltitude,
    polar,
    horizonAltitude: riseAlt,
  };
}
