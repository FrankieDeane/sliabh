import * as Location from 'expo-location';
import { ensureLocationServices } from './backgroundTrack';

/** Shaped like a browser GeolocationPosition / GeolocationPositionError. */
export type QuickFix =
  | { ok: true; coords: { latitude: number; longitude: number; accuracy: number | null; altitude: number | null }; timestamp: number }
  | { ok: false; code: 1 | 2 | 3; message: string };

const TIMEOUT_MS = 20_000;

/**
 * One position, fast, for a "where am I" button. Uses the phone's own fused
 * location instead of the WebView's, which on Android often waits out its
 * timeout without a fix. A recent last-known position answers at once; else
 * a fresh fix, up to 20 s.
 */
export async function getQuickFix(): Promise<QuickFix> {
  try {
    let perm = await Location.getForegroundPermissionsAsync();
    if (perm.status !== 'granted') perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status !== 'granted') return { ok: false, code: 1, message: 'permission denied' };
    if (!(await ensureLocationServices())) return { ok: false, code: 2, message: 'location services off' };

    const loc =
      (await Location.getLastKnownPositionAsync({ maxAge: 2 * 60_000, requiredAccuracy: 150 })) ??
      (await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), TIMEOUT_MS)),
      ]));
    if (!loc) return { ok: false, code: 3, message: 'timeout' };
    return {
      ok: true,
      coords: {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        accuracy: loc.coords.accuracy ?? null,
        altitude: loc.coords.altitude ?? null,
      },
      timestamp: loc.timestamp || Date.now(),
    };
  } catch (e) {
    return { ok: false, code: 2, message: String((e as Error)?.message ?? e) };
  }
}
