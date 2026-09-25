import type { ArgentinaTrail } from '../data/argentinaTrails';

/**
 * One formatter for a trail's duration everywhere SEO copy shows it (meta
 * description, FAQ, JSON-LD, static noscript). "short" → "7–9 h" / "2–3 días";
 * "long" → "7–9 horas" / "1 day".
 */
export function formatDuration(d: ArgentinaTrail['duration'], lang: 'es' | 'en', style: 'short' | 'long' = 'long'): string {
  const { min, max, unit } = d;
  const plural = max !== 1;
  const days = unit === 'dias';
  const u = lang === 'en'
    ? days ? (plural ? 'days' : 'day') : style === 'short' ? 'h' : plural ? 'hours' : 'hour'
    : days ? (plural ? 'días' : 'día') : style === 'short' ? 'h' : plural ? 'horas' : 'hora';
  return min === max ? `${min} ${u}` : `${min}–${max} ${u}`;
}
