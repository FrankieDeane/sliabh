import { Platform } from 'react-native';
import { supabase, currentUserId, withTimeout } from './supabase';
import { storage } from '../store/mmkv';

/**
 * Crash reporting, for an app whose users are out of reach.
 *
 * Until this existed, a bug reached us only if Frankie happened to hit it
 * himself — which is how the three field bugs that mattered were found, and it
 * does not scale past one person. On a mountain there is nobody to notice, and
 * "it stopped working" hours later is not a bug report.
 *
 * Three things make this different from dropping in an SDK:
 *
 * - **It queues offline.** A crash on a trail with no signal is the one worth
 *   having most, so reports are written to device storage first and uploaded
 *   whenever a connection returns — the same shape as a recorded hike.
 * - **It never interrupts anything.** Every path here swallows its own
 *   failures. A reporter that throws while reporting turns one bug into two.
 * - **It is rate-limited and deduplicated.** A render loop can throw hundreds
 *   of times a second; without a cap the first real user to hit one would
 *   write a million rows.
 */

const QUEUE_KEY = 'error-queue-v1';
/** Beyond this the queue is dropping the oldest: a crash loop must not eat the disk. */
const MAX_QUEUED = 50;
/** The same message more than once in this window is the same bug, not new information. */
const DEDUPE_MS = 60_000;
/** Stacks longer than this are the same frames repeating; the top is what identifies it. */
const MAX_STACK = 4000;

export interface ErrorReport {
  kind: 'error' | 'unhandled-rejection' | 'render' | 'manual';
  message: string;
  stack?: string;
  route?: string;
  user_agent?: string;
  app_version?: string;
  online?: boolean;
}

const recent = new Map<string, number>();

function readQueue(): ErrorReport[] {
  try {
    const raw = storage.getString(QUEUE_KEY);
    return raw ? (JSON.parse(raw) as ErrorReport[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(items: ErrorReport[]): void {
  try {
    storage.set(QUEUE_KEY, JSON.stringify(items.slice(-MAX_QUEUED)));
  } catch {
    // Storage full or blocked. A report is not worth breaking the app over.
  }
}

function context(): Pick<ErrorReport, 'route' | 'user_agent' | 'app_version' | 'online'> {
  const ctx: Pick<ErrorReport, 'route' | 'user_agent' | 'app_version' | 'online'> = {
    app_version: process.env.EXPO_PUBLIC_APP_VERSION || undefined,
  };
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      // The path only — a query string can carry a share token, and a crash
      // report is not a place to put one.
      ctx.route = window.location?.pathname;
      ctx.user_agent = navigator?.userAgent;
      ctx.online = navigator?.onLine;
    } catch {
      // A locked-down browser; the report is still worth filing without this.
    }
  } else {
    ctx.user_agent = `native/${Platform.OS}`;
  }
  return ctx;
}

/**
 * Files a crash. Never throws, never blocks, never shows the user anything.
 */
export function reportError(
  error: unknown,
  kind: ErrorReport['kind'] = 'error',
  extra?: { route?: string },
): void {
  try {
    const message = String(
      (error as { message?: string })?.message ?? error ?? 'unknown error',
    ).slice(0, 500);
    if (!message) return;

    const now = Date.now();
    const last = recent.get(message);
    if (last && now - last < DEDUPE_MS) return;
    recent.set(message, now);
    // The map is the only thing here that grows; a crash loop with unique
    // messages would otherwise leak it.
    if (recent.size > 100) {
      for (const [key, at] of recent) if (now - at > DEDUPE_MS) recent.delete(key);
    }

    const stack = (error as { stack?: string })?.stack?.slice(0, MAX_STACK);
    const report: ErrorReport = { kind, message, stack, ...context(), ...extra };

    const queue = readQueue();
    queue.push(report);
    writeQueue(queue);
    // Best effort right now; whatever fails stays queued for next time.
    void flushErrors();
  } catch {
    // Reporting must never be the thing that breaks.
  }
}

/**
 * Sends whatever is queued. Called after each report and whenever the
 * connection comes back.
 */
export async function flushErrors(): Promise<void> {
  try {
    const queue = readQueue();
    if (!queue.length) return;

    const userId = await currentUserId();
    const rows = queue.map((r) => ({ ...r, user_id: userId ?? null }));
    const { error } = await withTimeout(supabase.from('app_errors').insert(rows), 8000);
    if (error) {
      // A missing table means the migration has not run yet. Anything else is
      // usually no signal. Either way the queue is kept, not lost — except for
      // a rejected row, which would otherwise be retried forever.
      const permanent = error.code === '42501' || error.code === '22P02';
      if (permanent) writeQueue([]);
      return;
    }
    writeQueue([]);
  } catch {
    // Offline, or the request timed out. The queue survives.
  }
}

/**
 * Catches what the app never sees: an exception that escaped every component,
 * and a promise nobody handled. Both are silent by default in a browser — the
 * user sees a blank screen and we see nothing at all.
 *
 * Idempotent, so a Fast Refresh does not stack handlers.
 */
let installed = false;
export function installErrorReporting(): void {
  if (installed) return;
  installed = true;

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      reportError(event.error ?? event.message, 'error');
    });
    window.addEventListener('unhandledrejection', (event) => {
      reportError(event.reason, 'unhandled-rejection');
    });
    // A queued report from a previous session goes out as soon as there is a
    // connection, which for an offline crash is the next time the walker is
    // back in signal.
    window.addEventListener('online', () => void flushErrors());
    void flushErrors();
    return;
  }

  const globalHandler = (global as { ErrorUtils?: {
    getGlobalHandler?: () => (e: unknown, fatal?: boolean) => void;
    setGlobalHandler?: (h: (e: unknown, fatal?: boolean) => void) => void;
  } }).ErrorUtils;
  if (globalHandler?.setGlobalHandler) {
    const previous = globalHandler.getGlobalHandler?.();
    globalHandler.setGlobalHandler((e, fatal) => {
      reportError(e, 'error');
      // Hand back to React Native's own handler, which is what shows the red
      // screen in development and ends the process on a fatal.
      previous?.(e, fatal);
    });
  }
  void flushErrors();
}
