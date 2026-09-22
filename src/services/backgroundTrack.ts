import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { readLiveSession, appendLivePoint } from './liveTrack';

/**
 * Recording that survives a locked screen — the thing a browser tab can never
 * do.
 *
 * A web page is frozen the moment it is hidden: lock the phone, or switch to
 * a music app, and `watchPosition` simply stops. No flag, no API and no trick
 * changes that on iOS, and on Android it holds for anything the browser
 * decides to freeze. Apps that record a walk with the screen off — Google Fit
 * among them — are native apps running a *foreground service*: an ongoing
 * notification that buys the process the right to keep reading the GPS.
 *
 * That is what this is. It runs only in the native build, keeps a visible
 * notification while recording, and appends each fix to the same on-disk
 * session the rest of the app already uses, so resuming, queueing, syncing and
 * sharing all keep working untouched.
 */

export const HIKE_LOCATION_TASK = 'sliabh-hike-location';

TaskManager.defineTask(HIKE_LOCATION_TASK, async ({ data, error }) => {
  if (error || !data) return;
  const { locations } = data as { locations: Location.LocationObject[] };
  if (!locations?.length) return;

  // The task may wake with the app killed, so the session is read from disk
  // rather than from any in-memory state.
  const session = readLiveSession();
  if (!session || session.status !== 'recording') return;

  for (const loc of locations) {
    appendLivePoint(session, {
      lat: loc.coords.latitude,
      lon: loc.coords.longitude,
      t: loc.timestamp || Date.now(),
    });
  }
});

export type BackgroundStartResult =
  | { started: true }
  | { started: false; reason: 'foreground-denied' | 'background-denied' | 'unavailable' };

export async function startBackgroundTrack(trailName?: string | null): Promise<BackgroundStartResult> {
  try {
    const fg = await Location.requestForegroundPermissionsAsync();
    if (fg.status !== 'granted') return { started: false, reason: 'foreground-denied' };

    // "Allow all the time" — without it Android stops the updates as soon as
    // the app leaves the screen, which is exactly the case this exists for.
    const bg = await Location.requestBackgroundPermissionsAsync();
    if (bg.status !== 'granted') return { started: false, reason: 'background-denied' };

    if (await Location.hasStartedLocationUpdatesAsync(HIKE_LOCATION_TASK)) {
      return { started: true };
    }

    await Location.startLocationUpdatesAsync(HIKE_LOCATION_TASK, {
      accuracy: Location.Accuracy.BestForNavigation,
      timeInterval: 3000,
      distanceInterval: 5,
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
        killServiceOnDestroy: false,
      },
    });
    return { started: true };
  } catch {
    return { started: false, reason: 'unavailable' };
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
