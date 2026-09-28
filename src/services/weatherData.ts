// Open-Meteo — free, public forecast API, no signup or key required.
// Used to show wind and weather at a trail's highest point for the next days,
// which is the question hikers actually ask before heading out ("can I go up
// tomorrow?"). In Patagonia it is the wind, more than rain, that turns people
// back.
//
// Docs: https://open-meteo.com/en/docs
//
// The last forecast for each trail is kept on the device, so it can still be
// read once the signal is gone, together with the time it was fetched.

import { storage } from '../store/mmkv';

export interface ForecastDay {
  /** Local calendar date, YYYY-MM-DD. */
  date: string;
  weatherCode: number;
  tempMaxC: number;
  tempMinC: number;
  /** 0–100. */
  precipProbMax: number | null;
  windMaxKmh: number;
  gustMaxKmh: number;
  /** Degrees the wind blows from (0 = north). */
  windDirDeg: number | null;
}

export interface TrailForecast {
  lat: number;
  lon: number;
  /** Elevation the forecast was downscaled to, in metres. */
  elevationM: number | null;
  days: ForecastDay[];
  /** ms since epoch when the forecast was fetched. */
  fetchedAt: number;
}

const CACHE_PREFIX = 'forecast:';
/** A cached forecast younger than this is shown without refetching. */
const FRESH_MS = 30 * 60 * 1000;

function cacheKey(lat: number, lon: number) {
  return `${CACHE_PREFIX}${lat.toFixed(3)},${lon.toFixed(3)}`;
}

/** Last forecast stored on the device for this point, if any. */
export function readCachedForecast(lat: number, lon: number): TrailForecast | null {
  try {
    const raw = storage.getString(cacheKey(lat, lon));
    return raw ? (JSON.parse(raw) as TrailForecast) : null;
  } catch {
    return null;
  }
}

export function isFresh(f: TrailForecast, now = Date.now()) {
  return now - f.fetchedAt < FRESH_MS;
}

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/**
 * Three-day forecast for a point, downscaled to `elevationM` when given
 * (temperature follows altitude; a trailhead forecast would be too warm for
 * the summit). Returns null on any failure — this is supplementary data and
 * must never block the trail screen from rendering.
 */
export async function fetchTrailForecast(
  lat: number,
  lon: number,
  elevationM?: number,
): Promise<TrailForecast | null> {
  const params = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lon.toFixed(4),
    daily: [
      'weather_code',
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_probability_max',
      'wind_speed_10m_max',
      'wind_gusts_10m_max',
      'wind_direction_10m_dominant',
    ].join(','),
    timezone: 'auto',
    forecast_days: '3',
    wind_speed_unit: 'kmh',
  });
  if (typeof elevationM === 'number' && Number.isFinite(elevationM)) {
    params.set('elevation', String(Math.round(elevationM)));
  }
  const url = `https://api.open-meteo.com/v1/forecast?${params}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[weatherData] Open-Meteo returned ${res.status} for`, url);
      return null;
    }
    const data = await res.json();
    const d = data?.daily;
    const dates: string[] = Array.isArray(d?.time) ? d.time : [];
    const days: ForecastDay[] = dates
      .map((date, i): ForecastDay | null => {
        const tMax = num(d.temperature_2m_max?.[i]);
        const tMin = num(d.temperature_2m_min?.[i]);
        const wind = num(d.wind_speed_10m_max?.[i]);
        const gust = num(d.wind_gusts_10m_max?.[i]);
        if (tMax === null || tMin === null || wind === null || gust === null) return null;
        return {
          date,
          weatherCode: num(d.weather_code?.[i]) ?? 0,
          tempMaxC: tMax,
          tempMinC: tMin,
          precipProbMax: num(d.precipitation_probability_max?.[i]),
          windMaxKmh: wind,
          gustMaxKmh: gust,
          windDirDeg: num(d.wind_direction_10m_dominant?.[i]),
        };
      })
      .filter((x): x is ForecastDay => x !== null);
    if (!days.length) return null;

    const forecast: TrailForecast = {
      lat,
      lon,
      elevationM: num(data?.elevation),
      days,
      fetchedAt: Date.now(),
    };
    try {
      storage.set(cacheKey(lat, lon), JSON.stringify(forecast));
    } catch {
      // storage full or unavailable: the forecast still shows this session
    }
    return forecast;
  } catch (err) {
    console.warn('[weatherData] fetch failed', err);
    return null;
  }
}

export type WindLevel = 'calm' | 'strong' | 'dangerous' | 'extreme';

/**
 * How exposed terrain (ridges, passes, lagoon viewpoints) feels at a given
 * peak gust. Thresholds follow the usual mountain guidance: above ~60 km/h
 * walking gets unsteady; above ~80 km/h a gust can knock a hiker over.
 */
export function windLevel(gustKmh: number): WindLevel {
  if (gustKmh >= 80) return 'extreme';
  if (gustKmh >= 60) return 'dangerous';
  if (gustKmh >= 40) return 'strong';
  return 'calm';
}

/** WMO weather code → icon and short label. */
export function describeWeather(code: number): { icon: string; es: string; en: string } {
  if (code === 0) return { icon: 'sunny', es: 'Despejado', en: 'Clear' };
  if (code === 1 || code === 2) return { icon: 'partly-sunny', es: 'Parcialmente nublado', en: 'Partly cloudy' };
  if (code === 3) return { icon: 'cloudy', es: 'Nublado', en: 'Overcast' };
  if (code === 45 || code === 48) return { icon: 'cloudy', es: 'Niebla', en: 'Fog' };
  if (code >= 51 && code <= 57) return { icon: 'rainy', es: 'Llovizna', en: 'Drizzle' };
  if (code >= 61 && code <= 67) return { icon: 'rainy', es: 'Lluvia', en: 'Rain' };
  if (code >= 71 && code <= 77) return { icon: 'snow', es: 'Nieve', en: 'Snow' };
  if (code >= 80 && code <= 82) return { icon: 'rainy', es: 'Chaparrones', en: 'Showers' };
  if (code === 85 || code === 86) return { icon: 'snow', es: 'Nevadas', en: 'Snow showers' };
  if (code >= 95) return { icon: 'thunderstorm', es: 'Tormenta', en: 'Thunderstorm' };
  return { icon: 'partly-sunny', es: 'Variable', en: 'Mixed' };
}

const COMPASS_ES = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
const COMPASS_EN = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

/** Where the wind comes from, as an 8-point compass label. */
export function compass(deg: number, lang: 'es' | 'en'): string {
  const i = Math.round((((deg % 360) + 360) % 360) / 45) % 8;
  return (lang === 'en' ? COMPASS_EN : COMPASS_ES)[i];
}
