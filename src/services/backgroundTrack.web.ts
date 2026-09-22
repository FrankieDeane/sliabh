/**
 * The web half of background recording — which is to say, there is none.
 *
 * Every mobile browser stops delivering `watchPosition` once the page is
 * hidden: screen off, another app, another tab. Chrome does it by design
 * (crbug.com/506435), even for a page kept alive by playing audio — this file
 * used to play an inaudible tone for exactly that, and walkers lost minutes of
 * track trusting it. What the web can do is keep the screen on (the wake lock
 * in HikeMode) and say plainly what breaks the recording
 * (`backgroundCapability.web.ts`).
 *
 * The guarantee lives in the native build (`backgroundTrack.ts`), where a
 * foreground service does this properly, the way Google Fit does.
 */

export type BackgroundStartResult =
  | { started: true }
  | { started: false; reason: 'foreground-denied' | 'background-denied' | 'unavailable' | 'not-applicable' };

export async function startBackgroundTrack(_trailName?: string | null): Promise<BackgroundStartResult> {
  return { started: false, reason: 'not-applicable' };
}

export async function stopBackgroundTrack(): Promise<void> {}

export async function isBackgroundTrackRunning(): Promise<boolean> {
  return false;
}

export const BACKGROUND_TRACKING_SUPPORTED = false;
