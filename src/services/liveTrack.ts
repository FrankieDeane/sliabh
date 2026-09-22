import { storage } from '../store/mmkv';
import type { TrackPoint } from './supabase';
import { filterFix, metresBetween } from '../utils/fixFilter';

/**
 * The hike currently being recorded, written to disk as it happens.
 *
 * Until this existed the track lived only in React state: a phone that ran out
 * of battery, a browser tab the OS reclaimed, or a stray swipe closing the app
 * took the whole walk with it, and the walker found out hours later. Every
 * accepted fix is now appended to device storage, so the worst case is losing
 * the last few seconds rather than the last six hours.
 *
 * Points are stored as flat [lat, lon, t, alt?] tuples: a nine-hour hike at one
 * fix per second is roughly 700 KB that way, which fits in localStorage (~5 MB
 * per origin) with room to spare, and is nothing to MMKV on native. The
 * altitude is a fourth slot rather than a key so the cost stays a number, and
 * it is dropped entirely when the device did not report one — which is common
 * enough that readers must handle a 3-element tuple forever, including every
 * session recorded before altitude was captured at all.
 */

const KEY = 'live-hike-v1';

export interface LiveSession {
  id: string;
  trailId: string | null;
  trailName: string | null;
  startedAt: string;
  updatedAt: string;
  /**
   * `recording` means the walk is still under way. It survives the app being
   * killed, which is the point: a session found in this state on the next
   * launch is a recording that was interrupted, and must be picked back up
   * rather than merely mourned.
   */
  status: 'recording' | 'stopped';
  points: TrackPoint[];
}

interface StoredSession {
  id: string;
  trailId: string | null;
  trailName: string | null;
  startedAt: string;
  updatedAt: string;
  status?: 'recording' | 'stopped';
  p: Array<[number, number, number] | [number, number, number, number]>;
}

function write(session: LiveSession): void {
  const stored: StoredSession = {
    id: session.id,
    trailId: session.trailId,
    trailName: session.trailName,
    startedAt: session.startedAt,
    updatedAt: session.updatedAt,
    status: session.status,
    p: session.points.map((pt) => {
      // Six decimals is about 10 cm of latitude — far finer than any phone
      // GPS — and altitude to the metre is finer than its vertical error.
      const lat = Math.round(pt.lat * 1e6) / 1e6;
      const lon = Math.round(pt.lon * 1e6) / 1e6;
      return typeof pt.alt === 'number' && Number.isFinite(pt.alt)
        ? ([lat, lon, pt.t, Math.round(pt.alt)] as [number, number, number, number])
        : ([lat, lon, pt.t] as [number, number, number]);
    }),
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
    status: 'recording',
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
export function appendLivePoint(
  session: LiveSession,
  fix: TrackPoint,
  accuracy?: number | null,
): TrackPoint | null {
  const point = filterFix(session.points[session.points.length - 1], fix, accuracy);
  if (!point) return null;
  session.points.push(point);
  session.updatedAt = new Date(point.t).toISOString();
  write(session);
  return point;
}

/**
 * The same filter for a batch of fixes, with a single write at the end.
 *
 * The background service delivers locations in groups, and writing the whole
 * session once per fix would mean several serialisations of the same growing
 * array for one wake-up — on a nine-hour walk that is battery spent for
 * nothing. Durability is unchanged: the write happens before the task hands
 * control back, so a kill between wake-ups still loses only what the GPS had
 * not yet delivered.
 */
export function appendLivePoints(
  session: LiveSession,
  fixes: Array<{ point: TrackPoint; accuracy?: number | null }>,
): TrackPoint[] {
  const kept: TrackPoint[] = [];
  for (const fix of fixes) {
    const point = filterFix(session.points[session.points.length - 1], fix.point, fix.accuracy);
    if (!point) continue;
    session.points.push(point);
    session.updatedAt = new Date(point.t).toISOString();
    kept.push(point);
  }
  if (kept.length) write(session);
  return kept;
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
      status: stored.status ?? 'recording',
      points: stored.p
        // `>= 3`, not `=== 3`: a session written before altitude was captured
        // has three slots and must keep loading, and one with altitude has
        // four. Pinning the length would have silently dropped every point.
        .filter((pt) => Array.isArray(pt) && pt.length >= 3)
        .map(([lat, lon, t, alt]) =>
          typeof alt === 'number' ? { lat, lon, t, alt } : { lat, lon, t },
        ),
    };
  } catch {
    return null;
  }
}

/** Re-opens a session read back from storage so appends keep persisting. */
export function resumeLiveSession(session: LiveSession): LiveSession {
  const resumed: LiveSession = { ...session, status: 'recording' };
  write(resumed);
  return resumed;
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
