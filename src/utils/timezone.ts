/**
 * Local time for a trail, resolved offline.
 *
 * Argentina keeps a single offset, UTC−03:00 (ART), and has not observed DST
 * since 2009, but the country is still split across a dozen IANA zones
 * (America/Argentina/*) which differ only in their history. The zone is
 * picked from the trail's province, per tzdata's zone1970.tab, so a stored
 * timestamp stays correct if the country ever re-introduces DST unevenly.
 *
 * The offset itself is read from the JS engine's own tz database via Intl,
 * which needs no network. Where Intl has no tz data — some React Native
 * engine builds ship a cut-down ICU — it falls back to the zone's standard
 * offset from the table below, which for every zone listed here is the offset
 * actually in force year-round.
 */

/** Standard UTC offset in minutes east of UTC for each supported zone. */
const ZONE_STANDARD_OFFSET: Record<string, number> = {
  'America/Argentina/Buenos_Aires': -180,
  'America/Argentina/Catamarca': -180,
  'America/Argentina/Cordoba': -180,
  'America/Argentina/Jujuy': -180,
  'America/Argentina/La_Rioja': -180,
  'America/Argentina/Mendoza': -180,
  'America/Argentina/Rio_Gallegos': -180,
  'America/Argentina/Salta': -180,
  'America/Argentina/San_Juan': -180,
  'America/Argentina/San_Luis': -180,
  'America/Argentina/Tucuman': -180,
  'America/Argentina/Ushuaia': -180,
  'America/Punta_Arenas': -180,
};

/** Province (as spelled in the trail data) to its IANA zone. */
const PROVINCE_ZONE: Record<string, string> = {
  'Buenos Aires': 'America/Argentina/Buenos_Aires',
  'CABA': 'America/Argentina/Buenos_Aires',
  'Catamarca': 'America/Argentina/Catamarca',
  'Chaco': 'America/Argentina/Cordoba',
  'Chubut': 'America/Argentina/Catamarca',
  'Córdoba': 'America/Argentina/Cordoba',
  'Corrientes': 'America/Argentina/Cordoba',
  'Entre Ríos': 'America/Argentina/Cordoba',
  'Formosa': 'America/Argentina/Cordoba',
  'Jujuy': 'America/Argentina/Jujuy',
  'La Pampa': 'America/Argentina/Salta',
  'La Rioja': 'America/Argentina/La_Rioja',
  'Mendoza': 'America/Argentina/Mendoza',
  'Misiones': 'America/Argentina/Cordoba',
  'Neuquén': 'America/Argentina/Salta',
  'Río Negro': 'America/Argentina/Salta',
  'Salta': 'America/Argentina/Salta',
  'San Juan': 'America/Argentina/San_Juan',
  'San Luis': 'America/Argentina/San_Luis',
  'Santa Cruz': 'America/Argentina/Rio_Gallegos',
  'Santa Fe': 'America/Argentina/Cordoba',
  'Santiago del Estero': 'America/Argentina/Cordoba',
  'Tierra del Fuego': 'America/Argentina/Ushuaia',
  'Tucumán': 'America/Argentina/Tucuman',
  'Magallanes (Chile)': 'America/Punta_Arenas',
};

export const DEFAULT_ZONE = 'America/Argentina/Buenos_Aires';

export function zoneForProvince(province?: string): string {
  return (province && PROVINCE_ZONE[province]) || DEFAULT_ZONE;
}

/**
 * Minutes east of UTC for `zone` at `date`. Negative west of Greenwich, so
 * Argentina returns −180.
 */
export function utcOffsetMinutes(zone: string, date: Date = new Date()): number {
  try {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: zone,
      hour12: false,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    });
    const parts: Record<string, number> = {};
    for (const p of dtf.formatToParts(date)) {
      if (p.type !== 'literal') parts[p.type] = Number(p.value);
    }
    if (!parts.year || Number.isNaN(parts.year)) throw new Error('no tz data');
    // Hour 24 appears in some engines for midnight; normalise it.
    const hour = parts.hour === 24 ? 0 : parts.hour;
    const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, hour, parts.minute, parts.second);
    return Math.round((asUtc - date.getTime()) / 60_000);
  } catch {
    return ZONE_STANDARD_OFFSET[zone] ?? -180;
  }
}

/** "UTC−03:00" for an offset in minutes. */
export function formatUtcOffset(minutes: number): string {
  const sign = minutes < 0 ? '−' : '+';
  const abs = Math.abs(minutes);
  return `UTC${sign}${String(Math.floor(abs / 60)).padStart(2, '0')}:${String(abs % 60).padStart(2, '0')}`;
}

/** Short zone abbreviation shown next to times (ART for Argentina). */
export function zoneAbbreviation(zone: string): string {
  if (zone.startsWith('America/Argentina/')) return 'ART';
  if (zone === 'America/Punta_Arenas') return 'CLT';
  return '';
}

/** Wall-clock HH:MM in `offsetMinutes`, for a UTC instant. */
export function formatLocalTime(date: Date, offsetMinutes: number): string {
  const shifted = new Date(date.getTime() + offsetMinutes * 60_000);
  return `${String(shifted.getUTCHours()).padStart(2, '0')}:${String(shifted.getUTCMinutes()).padStart(2, '0')}`;
}

/** The local calendar date (y/m/d) that `date` falls on in `offsetMinutes`. */
export function localCalendarDate(date: Date, offsetMinutes: number): { year: number; month: number; day: number } {
  const shifted = new Date(date.getTime() + offsetMinutes * 60_000);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  };
}

/** Minutes as "9 h 47 min". */
export function formatDuration(minutes: number, lang: 'es' | 'en'): string {
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return lang === 'en' ? `${h} h ${m} min` : `${h} h ${m} min`;
}
