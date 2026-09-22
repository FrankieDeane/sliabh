/**
 * The web half of background recording — and the honest part of it.
 *
 * A browser tab is frozen when it is hidden. Lock the phone or switch to a
 * music app and `watchPosition` stops delivering; nothing in the platform
 * grants a page the right to keep reading GPS in the background. iOS Safari
 * has no way around it at all.
 *
 * On Android, Chrome exempts a tab that is *playing audio* from being frozen,
 * which is the one lever a web app has. This plays a continuous tone far below
 * hearing (0.0001 gain through Web Audio, not a media element) so it keeps the
 * page alive without taking audio focus — the walker's own music keeps
 * playing. It is a workaround, not a guarantee: whether it holds depends on
 * the phone, the browser and its battery settings, which is why the hike
 * screen measures any gap and reports the minutes it failed to record rather
 * than pretending.
 *
 * The guarantee lives in the native build (backgroundTrack.native.ts), where a
 * foreground service does this properly, the way Google Fit does.
 */

let ctx: AudioContext | null = null;
let osc: OscillatorNode | null = null;

export type BackgroundStartResult =
  | { started: true }
  | { started: false; reason: 'foreground-denied' | 'background-denied' | 'unavailable' };

export async function startBackgroundTrack(): Promise<BackgroundStartResult> {
  if (typeof window === 'undefined') return { started: false, reason: 'unavailable' };
  try {
    const Ctor = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctor) return { started: false, reason: 'unavailable' };
    if (!ctx) ctx = new Ctor();
    if (ctx!.state === 'suspended') await ctx!.resume();

    if (!osc) {
      const gain = ctx!.createGain();
      gain.gain.value = 0.0001; // inaudible, but not digital silence
      osc = ctx!.createOscillator();
      osc.frequency.value = 40;
      osc.connect(gain);
      gain.connect(ctx!.destination);
      osc.start();
    }
    return { started: true };
  } catch {
    return { started: false, reason: 'unavailable' };
  }
}

export async function stopBackgroundTrack(): Promise<void> {
  try {
    osc?.stop();
  } catch {
    // already stopped
  }
  osc = null;
  try {
    await ctx?.close();
  } catch {
    // nothing to close
  }
  ctx = null;
}

export async function isBackgroundTrackRunning(): Promise<boolean> {
  return !!osc;
}

/**
 * False on purpose: the audio trick above helps on some Android phones, but
 * the web cannot promise recording with the screen off, so nothing in the UI
 * may claim it does.
 */
export const BACKGROUND_TRACKING_SUPPORTED = false;
