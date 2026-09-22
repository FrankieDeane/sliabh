/**
 * The web half of background recording — and the honest part of it.
 *
 * A browser tab is frozen when it is hidden. Lock the phone or switch to a
 * music app and `watchPosition` stops delivering; nothing in the platform
 * grants a page the right to keep reading GPS in the background.
 *
 * What a page *can* do differs per engine, so this applies each lever only
 * where it is known to help (see `backgroundCapability.web.ts`):
 *
 * - **Chromium on Android** exempts a tab that is *playing audio* from being
 *   frozen. A continuous tone far below hearing (0.0001 gain, through Web
 *   Audio rather than a media element) keeps the page alive without taking
 *   audio focus, so the walker's own music keeps playing.
 * - **iOS** gets no tone at all, deliberately. Safari suspends the page on
 *   lock regardless, so the tone would buy nothing — and an audio context on
 *   iOS can interrupt whatever the walker is listening to, which is the exact
 *   failure this is meant to fix. On iOS the lever is the screen wake lock.
 * - **Desktop** gets no tone: a foreground tab is not frozen this way, and
 *   running an oscillator for a whole walk is battery for nothing.
 *
 * The guarantee lives in the native build (`backgroundTrack.ts`), where a
 * foreground service does this properly, the way Google Fit does.
 */

import { backgroundCapability } from './backgroundCapability.web';

let ctx: AudioContext | null = null;
let osc: OscillatorNode | null = null;

export type BackgroundStartResult =
  | { started: true }
  | { started: false; reason: 'foreground-denied' | 'background-denied' | 'unavailable' | 'not-applicable' };

export async function startBackgroundTrack(): Promise<BackgroundStartResult> {
  if (typeof window === 'undefined') return { started: false, reason: 'unavailable' };
  // Everywhere but Chromium/Android the tone is useless or harmful; the hike
  // screen already tells the walker what this browser does instead.
  if (!backgroundCapability().audioKeepAlive) return { started: false, reason: 'not-applicable' };
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
 * False on purpose: the audio trick helps on some Android phones and nowhere
 * else, so no web build may claim recording with the screen off. What each
 * browser *can* promise is graded in `backgroundCapability.web.ts`, and the
 * hike screen says that out loud instead of this one flag.
 */
export const BACKGROUND_TRACKING_SUPPORTED = false;
