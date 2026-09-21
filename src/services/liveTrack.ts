import { storage } from '../store/mmkv';
import type { TrackPoint } from './supabase';

/**
 * The hike currently being recorded, written to disk as it happens.
 *
 * Until this existed the track lived only in React state: a phone that ran out
 * of battery, a browser tab the OS reclaimed, or a stray swipe closing the app
 * took the whole walk with it, and the walker found out hours later. Every
 * accepted fix is now appended to device storage, so the worst case is losing
 * the last few seconds rather than the last six hours.
 *
 * Points are stored as flat [lat, lon, t] triples: a nine-hour hike at one fix
 * per second is roughly 700 KB that way, which fits in localStorage (~5 MB per
 * origin) with room to spare, and is nothing to MMKV on native.
 */

const KEY = 'live-hike-v1';

/** Fixes closer together than this are jitter, not walking. */
const MIN_MOVE_M = 4;
/** …unless this long has passed, so a rest stop still leaves a trace. */
const MAX_GAP_MS = 15_000;

export interface LiveSession {
  id: string;
  trailId: string | null;
  trailName: string | null;
  startedAt: string;
  updatedAt: string;
  points: TrackPoint[];
}

interface StoredSession {
  id: string;
  trailId: string | null;
  trailName: string | null;
  startedAt: string;
  updatedAt: string;
  p: Array<[number, number, number]>;
}

function metresBetween(a: TrackPoint, b: TrackPoint): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

function write(session: LiveSession): void {
  const stored: StoredSession = {
    id: session.id,
    trailId: session.trailId,
    trailName: session.trailName,
    startedAt: session.startedAt,
    updatedAt: session.updatedAt,
    p: session.points.map((pt) => [
      Math.round(pt.lat * 1e6) / 1e6,
      Math.round(pt.lon * 1e6) / 1e6,
      pt.t,
    ]),
  };
  try {
    storage.set(KEY, JSON.stringify(stored));
  } catch {
    // Storage full or blocked (private browsing). The in-memory track carries
    // on; the walk is not interrupted for a failed write.
  }
}

/** Starts a session and clears whatever was left behind. */
export function beginLiveSession(trailId: string | null, trailName: string | null): LiveSession {
  const now = new Date().toISOString();
  const session: LiveSession = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    trailId,
    trailName,
    startedAt: now,
    updatedAt: now,
    points: [],
  };
  write(session);
  return session;
}

/**
 * Appends a fix if it represents real movement, and persists it.
 * Returns the point when it was kept, so callers can mirror the same filtered
 * series they will eventually upload.
 */
export function appendLivePoint(session: LiveSession, point: TrackPoint): TrackPoint | null {
  const last = session.points[session.points.length - 1];
  if (last && metresBetween(last, point) < MIN_MOVE_M && point.t - last.t < MAX_GAP_MS) {
    return null;
  }
  session.points.push(point);
  session.updatedAt = new Date(point.t).toISOString();
  write(session);
  return point;
}

/** The unfinished session left on this device, if any. */
export function readLiveSession(): LiveSession | null {
  try {
    const raw = storage.getString(KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw) as StoredSession;
    if (!stored?.startedAt || !Array.isArray(stored.p)) return null;
    return {
      id: stored.id,
      trailId: stored.trailId ?? null,
      trailName: stored.trailName ?? null,
      startedAt: stored.startedAt,
      updatedAt: stored.updatedAt ?? stored.startedAt,
      points: stored.p
        .filter((pt) => Array.isArray(pt) && pt.length === 3)
        .map(([lat, lon, t]) => ({ lat, lon, t })),
    };
  } catch {
    return null;
  }
}

export function clearLiveSession(): void {
  try {
    storage.delete(KEY);
  } catch {
    // nothing to do — a stale session is offered for recovery, never replayed
  }
}

/** Total distance of a session in kilometres. */
export function liveDistanceKm(points: TrackPoint[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) total += metresBetween(points[i - 1], points[i]);
  return total / 1000;
}

/** Seconds between the first and last fix. */
export function liveDurationS(points: TrackPoint[]): number {
  if (points.length < 2) return 0;
  return Math.round((points[points.length - 1].t - points[0].t) / 1000);
}
