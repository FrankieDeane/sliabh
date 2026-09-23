import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { readLiveSession, appendLivePoints } from './liveTrack';

/**
 * Recording that survives a locked screen — the thing a browser tab can never
 * do.
 *
 * A web page is frozen the moment it is hidden: lock the phone, or switch to
 * a music app, and `watchPosition` simply stops. No flag, no API and no trick
 * changes that. Apps that record a walk with the screen off — Google Fit among
 * them — are native apps running a *foreground service*: an ongoing
 * notification that buys the process the right to keep reading the GPS.
 *
 * That is what this is. It runs only in the native build, keeps a visible
 * notification while recording, and appends each fix to the same on-disk
 * session the rest of the app already uses, so resuming, queueing, syncing and
 * sharing all keep working untouched.
 */

export const HIKE_LOCATION_TASK = 'sliabh-hike-location';

/**
 * Accuracy tuned for a long day out rather than a benchmark.
 *
 * `BestForNavigation` pins the GPS at its maximum rate, which is what turn-by-
 * turn driving needs and what flattens a phone battery in about three hours.
 * The walker this is built for is on a mountain for nine, with no way to
 * charge, and the track is the only thing that gets them back — a recording
 * that dies at noon is worse than one that samples every few seconds. `High`
 * still uses the GPS chip and is accurate to a handful of metres, which is
 * finer than the 4 m movement filter the session applies anyway.
 */
const ACCURACY = Location.Accuracy.High;
/** How often to ask, at rest. */
const INTERVAL_MS = 5000;
/** …and how far to move before a fix is worth the radio waking up. */
const DISTANCE_M = 8;

/**
 * `defineTask` must run in the module's global scope, before the app finishes
 * loading — Android restarts the process with no UI to deliver a background
 * fix, and an undefined task means the fix is dropped on the floor. The guard
 * is for Fast Refresh, which re-evaluates the module in development.
 */
if (!TaskManager.isTaskDefined(HIKE_LOCATION_TASK)) {
  TaskManager.defineTask(HIKE_LOCATION_TASK, async ({ data, error }) => {
    if (error || !data) return;
    const { locations } = data as { locations: Location.LocationObject[] };
    if (!locations?.length) return;

    // The task may wake with the app killed, so the session is read from disk
    // rather than from any in-memory state.
    const session = readLiveSession();
    if (!session || session.status !== 'recording') {
      // No live session means the walk was stopped while this process was
      // gone. Left alone the service would keep the GPS and the notification
      // running for the rest of the day, on a battery the walker needs — so it
      // shuts itself down rather than outliving the hike it was started for.
      await stopBackgroundTrack();
      return;
    }

    appendLivePoints(
      session,
      locations.map((loc) => {
        const base = {
          lat: loc.coords.latitude,
          lon: loc.coords.longitude,
          t: loc.timestamp || Date.now(),
        };
        // Altitude is what elevation gain is computed from. A 2D fix reports
        // none, so the point goes without rather than carrying a zero that
        // would read as sea level.
        const alt = loc.coords.altitude;
        const point = typeof alt === 'number' && Number.isFinite(alt) ? { ...base, alt } : base;
        return { point, accuracy: loc.coords.accuracy };
      }),
    );
  });
}

export type BackgroundStartResult =
  | { started: true }
  | { started: false; reason: 'foreground-denied' | 'services-off' | 'unavailable' };

export async function startBackgroundTrack(trailName?: string | null): Promise<BackgroundStartResult> {
  try {
    const fg = await Location.requestForegroundPermissionsAsync();
    if (fg.status !== 'granted') return { started: false, reason: 'foreground-denied' };
    if (!(await ensureLocationServices())) return { started: false, reason: 'services-off' };

    // No "Allow all the time" needed: a foreground service started while the
    // app is on screen keeps its while-in-use location access after the screen
    // goes off (Android's own rule, and expo-location skips the background
    // check when a foregroundService is given). Asking for it anyway sent the
    // walker to a settings page, and backing out of it cancelled the whole
    // recording, map dot included.
    if (await Location.hasStartedLocationUpdatesAsync(HIKE_LOCATION_TASK)) {
      return { started: true };
    }

    await Location.startLocationUpdatesAsync(HIKE_LOCATION_TASK, {
      accuracy: ACCURACY,
      timeInterval: INTERVAL_MS,
      distanceInterval: DISTANCE_M,
      // Tells the OS this is a walk, so its own filtering stops treating a
      // slow ascent as noise.
      activityType: Location.ActivityType.Fitness,
      // Android pauses updates when it decides the user is still; on a slow
      // ascent or a long rest that silently truncates the track.
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: trailName
          ? `Grabando: ${trailName}`
          : 'Sliabh está grabando tu recorrido',
        notificationBody: 'Sigue grabando con la pantalla apagada. Tocá para volver.',
        notificationColor: '#22c55e',
        // The walk outlives the screen: swiping the app away must not end the
        // recording, which is the whole point of the service.
        killServiceOnDestroy: false,
      },
    });
    return { started: true };
  } catch {
    return { started: false, reason: 'unavailable' };
  }
}

/**
 * The phone's location switch being off is the commonest "the app can't find
 * me": permission is granted, yet no fix ever comes. Android can show its own
 * one-tap "turn on location" dialog; accept its answer.
 */
export async function ensureLocationServices(): Promise<boolean> {
  try {
    if (await Location.hasServicesEnabledAsync()) return true;
    await Location.enableNetworkProviderAsync();
    return await Location.hasServicesEnabledAsync();
  } catch {
    return false;
  }
}

/**
 * Where the walker is, for the screen only. The recorded track keeps only
 * fixes that pass the accuracy filter, so under trees or indoors the first one
 * can take minutes, and a map that waits for it looks like a map that cannot
 * find you. This shows every fix as it comes, starting with the last known
 * one, and never writes to the track. Returns the function that stops it.
 */
export async function watchScreenPosition(onFix: (lat: number, lon: number) => void): Promise<() => void> {
  try {
    const last = await Location.getLastKnownPositionAsync({ maxAge: 5 * 60_000 });
    if (last) onFix(last.coords.latitude, last.coords.longitude);
    const sub = await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 3000, distanceInterval: 2 },
      (loc) => onFix(loc.coords.latitude, loc.coords.longitude),
    );
    return () => sub.remove();
  } catch {
    return () => {};
  }
}

export async function stopBackgroundTrack(): Promise<void> {
  try {
    if (await Location.hasStartedLocationUpdatesAsync(HIKE_LOCATION_TASK)) {
      await Location.stopLocationUpdatesAsync(HIKE_LOCATION_TASK);
    }
  } catch {
    // already stopped, or the task never started
  }
}

export async function isBackgroundTrackRunning(): Promise<boolean> {
  try {
    return await Location.hasStartedLocationUpdatesAsync(HIKE_LOCATION_TASK);
  } catch {
    return false;
  }
}

/** Native builds can record with the screen off; browsers cannot. */
export const BACKGROUND_TRACKING_SUPPORTED = true;
