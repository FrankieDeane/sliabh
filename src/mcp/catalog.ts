/**
 * Consultas del servidor MCP de Sliabh sobre los 39 parques nacionales y las
 * rutas del sitio. Solo lectura, sin red: todo sale de src/data (los mismos
 * datos que publica sliabh.com.ar) y de src/mcp/parks.ts.
 *
 * Plain TS con imports relativos, sin React Native: lo cargan la función de
 * Netlify (netlify/functions/mcp.mts) y scripts/test-mcp.mjs.
 */
import type { ArgentinaTrail } from '../data/argentinaTrails';
import { difficultyLabel, activityLabel, seasonLabel } from '../data/argentinaTrails';
import { ALL_HUB_TRAILS, PARKS as HUB_PARKS } from '../data/hubs';
import { formatDuration } from '../utils/duration';
import { NATIONAL_PARKS, REGION_LABEL, parkAreaName, type NationalPark, type ParkRegion } from './parks';

export type Lang = 'es' | 'en';

export const SITE_URL = 'https://sliabh.com.ar';

export const DIFFICULTIES = { easy: 'facil', moderate: 'moderado', hard: 'dificil', extreme: 'extremo' } as const;
export const ACTIVITIES = { trekking: 'trekking', climbing: 'escalada', traverse: 'travesia', high_mountain: 'alta_montana' } as const;
export type DifficultyKey = keyof typeof DIFFICULTIES;
export type ActivityKey = keyof typeof ACTIVITIES;

/** Minúsculas y sin tildes, para comparar "Lanín" con "lanin". */
export function normalize(s: string): string {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

const prefix = (lang: Lang) => (lang === 'en' ? '/en' : '');

function parkOfTrail(t: ArgentinaTrail): NationalPark | undefined {
  return NATIONAL_PARKS.find((p) => parkAreaName(p) === t.area);
}

export function trailsInPark(p: NationalPark): ArgentinaTrail[] {
  return ALL_HUB_TRAILS.filter((t) => t.area === parkAreaName(p));
}

function parkPageUrl(p: NationalPark, lang: Lang): string | null {
  const hub = HUB_PARKS.find((h) => h.area === parkAreaName(p));
  return hub ? `${SITE_URL}${prefix(lang)}/parque/${hub.slug}` : null;
}

function durationHours(t: ArgentinaTrail): number {
  return t.duration.unit === 'dias' ? t.duration.max * 24 : t.duration.max;
}

function difficultyKey(d: string): DifficultyKey {
  return (Object.keys(DIFFICULTIES) as DifficultyKey[]).find((k) => DIFFICULTIES[k] === d) ?? 'moderate';
}

function activityKey(a: string): ActivityKey {
  return (Object.keys(ACTIVITIES) as ActivityKey[]).find((k) => ACTIVITIES[k] === a) ?? 'trekking';
}

// ─── Parques ──────────────────────────────────────────────────────────────────

export function parkSummary(p: NationalPark, lang: Lang) {
  const trails = trailsInPark(p);
  return {
    slug: p.slug,
    name: lang === 'en' ? `${p.name} National Park` : `Parque Nacional ${p.name}`,
    provinces: p.provinces,
    region: REGION_LABEL[p.region][lang],
    trail_count: trails.length,
    park_page: parkPageUrl(p, lang),
  };
}

export function listParks(opts: { region?: ParkRegion; province?: string; onlyWithTrails?: boolean }, lang: Lang) {
  const prov = opts.province ? normalize(opts.province) : null;
  const parks = NATIONAL_PARKS.filter((p) =>
    (!opts.region || p.region === opts.region) &&
    (!prov || p.provinces.some((x) => normalize(x).includes(prov))) &&
    (!opts.onlyWithTrails || trailsInPark(p).length > 0),
  );
  return {
    total_national_parks: NATIONAL_PARKS.length,
    matches: parks.length,
    parks: parks.map((p) => parkSummary(p, lang)),
  };
}

/** Por slug exacto, o por nombre con o sin tildes ("lanin", "Parque Nacional Lanín"). */
export function findPark(query: string): { park?: NationalPark; suggestions: string[] } {
  const q = normalize(query).replace(/^parque nacional\s+/, '').replace(/\s+national park$/, '');
  const exact = NATIONAL_PARKS.find((p) => p.slug === q || normalize(p.name) === q);
  if (exact) return { park: exact, suggestions: [] };
  const partial = NATIONAL_PARKS.filter((p) => normalize(p.name).includes(q) || q.includes(normalize(p.name)));
  if (partial.length === 1) return { park: partial[0], suggestions: [] };
  const words = q.split(/\s+/).filter((w) => w.length > 2);
  const loose = partial.length ? partial : NATIONAL_PARKS.filter((p) => words.some((w) => normalize(p.name).includes(w)));
  return { suggestions: loose.slice(0, 5).map((p) => p.slug) };
}

export function parkDetail(p: NationalPark, lang: Lang) {
  const trails = trailsInPark(p);
  return {
    ...parkSummary(p, lang),
    trails: trails.map((t) => trailSummary(t, lang)),
    note: trails.length
      ? undefined
      : lang === 'en'
        ? 'Sliabh has no mapped trails in this park yet.'
        : 'Sliabh todavía no tiene rutas mapeadas en este parque.',
  };
}

// ─── Rutas ────────────────────────────────────────────────────────────────────

export function trailSummary(t: ArgentinaTrail, lang: Lang) {
  const park = parkOfTrail(t);
  return {
    id: t.id,
    name: t.name,
    national_park: park ? park.slug : null,
    area: t.area,
    province: t.province,
    difficulty: difficultyKey(t.difficulty),
    difficulty_label: difficultyLabel(t.difficulty, lang),
    activity: activityKey(t.activity),
    distance_km: t.distance_km,
    elevation_gain_m: t.elevation_gain_m,
    max_altitude_m: t.max_altitude_m,
    duration: formatDuration(t.duration, lang, 'long'),
    best_season: seasonLabel(t.best_season, lang),
    permit_required: t.permits_required,
    url: `${SITE_URL}${prefix(lang)}/ruta/${t.id}`,
  };
}

export function findTrail(id: string): ArgentinaTrail | undefined {
  const q = normalize(id);
  return ALL_HUB_TRAILS.find((t) => t.id === q) ?? ALL_HUB_TRAILS.find((t) => normalize(t.name) === q);
}

export function trailDetail(t: ArgentinaTrail, lang: Lang) {
  const en = lang === 'en';
  const x = t as ArgentinaTrail & { access_notes_en?: string; parking_en?: string; water_sources_en?: string };
  const track = t.gpxTrack ?? [];
  return {
    ...trailSummary(t, lang),
    activity_label: activityLabel(t.activity, lang),
    description: en ? (t.description_en ?? t.description) : t.description,
    long_description: (en ? t.long_description_en : t.long_description) ?? undefined,
    trailhead: t.trailhead,
    trailhead_coordinates: t.coordinates,
    safety_warning: t.safety_warning ? t.safety_warning[lang] : undefined,
    access_notes: (en ? x.access_notes_en : undefined) ?? t.access_notes ?? undefined,
    parking: (en ? x.parking_en : undefined) ?? t.parking ?? undefined,
    water_sources: (en ? x.water_sources_en : undefined) ?? t.water_sources ?? undefined,
    landmarks: t.namedWaypoints?.map((w) => w.name),
    gps_track: track.length
      ? {
          points: track.length,
          start: { lat: track[0].lat, lon: track[0].lon },
          end: { lat: track[track.length - 1].lat, lon: track[track.length - 1].lon },
          gpx_download: en
            ? 'Download the full GPX track from the trail page (url).'
            : 'El track GPX completo se descarga desde la página de la ruta (url).',
        }
      : undefined,
    tags: t.tags,
    source: t.source,
  };
}

export interface TrailFilters {
  query?: string;
  park?: string;
  province?: string;
  difficulty?: DifficultyKey[];
  activity?: ActivityKey[];
  maxDistanceKm?: number;
  maxDurationHours?: number;
  maxElevationGainM?: number;
  nationalParksOnly?: boolean;
  sort?: 'relevance' | 'distance_asc' | 'distance_desc' | 'elevation_asc' | 'elevation_desc';
  limit?: number;
}

export function searchTrails(f: TrailFilters, lang: Lang) {
  let park: NationalPark | undefined;
  if (f.park) {
    const found = findPark(f.park);
    if (!found.park) return { error: 'unknown_park' as const, suggestions: found.suggestions };
    park = found.park;
  }
  const prov = f.province ? normalize(f.province) : null;
  const words = f.query ? normalize(f.query).split(/\s+/).filter(Boolean) : [];
  const diffs = f.difficulty?.map((d) => DIFFICULTIES[d]);
  const acts = f.activity?.map((a) => ACTIVITIES[a]);

  const scored = ALL_HUB_TRAILS.map((t) => {
    if (park && t.area !== parkAreaName(park)) return null;
    if (f.nationalParksOnly && !parkOfTrail(t)) return null;
    if (prov && !normalize(t.province).includes(prov)) return null;
    if (diffs && !(diffs as string[]).includes(t.difficulty)) return null;
    if (acts && !(acts as string[]).includes(t.activity)) return null;
    if (f.maxDistanceKm != null && t.distance_km > f.maxDistanceKm) return null;
    if (f.maxDurationHours != null && durationHours(t) > f.maxDurationHours) return null;
    if (f.maxElevationGainM != null && t.elevation_gain_m > f.maxElevationGainM) return null;
    let score = 0;
    if (words.length) {
      const name = normalize(t.name);
      const hay = normalize([t.area, t.province, t.trailhead, ...t.tags, t.description, t.description_en ?? ''].join(' '));
      for (const w of words) {
        if (name.includes(w)) score += 3;
        else if (hay.includes(w)) score += 1;
        else return null; // cada palabra tiene que aparecer en algún lado
      }
    }
    return { t, score };
  }).filter((x): x is { t: ArgentinaTrail; score: number } => x !== null);

  const sort = f.sort ?? 'relevance';
  scored.sort((a, b) => {
    switch (sort) {
      case 'distance_asc': return a.t.distance_km - b.t.distance_km;
      case 'distance_desc': return b.t.distance_km - a.t.distance_km;
      case 'elevation_asc': return a.t.elevation_gain_m - b.t.elevation_gain_m;
      case 'elevation_desc': return b.t.elevation_gain_m - a.t.elevation_gain_m;
      default: return b.score - a.score || a.t.name.localeCompare(b.t.name);
    }
  });
  const limit = f.limit ?? 10;
  return {
    total_matches: scored.length,
    returned: Math.min(limit, scored.length),
    trails: scored.slice(0, limit).map((x) => trailSummary(x.t, lang)),
  };
}

function distanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

export function trailsNear(
  point: { lat: number; lon: number }, radiusKm: number, limit: number, lang: Lang, difficulty?: DifficultyKey[],
) {
  const diffs = difficulty?.map((d) => DIFFICULTIES[d] as string);
  const hits = ALL_HUB_TRAILS
    .filter((t) => !diffs || diffs.includes(t.difficulty))
    .map((t) => ({ t, d: distanceKm(point, t.coordinates) }))
    .filter((x) => x.d <= radiusKm)
    .sort((a, b) => a.d - b.d);
  return {
    total_matches: hits.length,
    returned: Math.min(limit, hits.length),
    trails: hits.slice(0, limit).map((x) => ({ ...trailSummary(x.t, lang), distance_from_point_km: Math.round(x.d * 10) / 10 })),
  };
}
