/**
 * What *this* browser, on *this* phone, can actually promise about recording.
 *
 * "It works in the browser" is not a single answer: Chrome on Android, Safari
 * on iPhone, Firefox and Samsung Internet each give a page a different set of
 * levers, and each takes them away in a different way. Guessing wrong is worse
 * than saying nothing, because the walker finds out on the mountain.
 *
 * So capabilities are **feature-detected** (that is the only honest way to know
 * whether a lever exists), and the browser is **named** only to phrase the
 * instruction — "Ajustes → Pantalla y brillo" means nothing on Android, and
 * "Tiempo de espera de la pantalla" means nothing on an iPhone.
 */

export type Engine =
  | 'chromium-android'
  | 'firefox-android'
  | 'safari-ios'
  | 'other-ios'
  | 'desktop'
  | 'unknown';

/**
 * How strong a promise this environment supports, worst to best:
 * - `foreground-only`: recording holds only while this screen is in front and
 *   the screen is awake, and nothing can keep the screen awake for the walker.
 * - `screen-on`: the page can hold the screen awake, so it is never hidden and
 *   never frozen — recording holds as long as the walker stays in the app.
 * - `guaranteed`: an OS foreground service records from a pocket. Native only.
 *
 * There is no web grade above `screen-on`. Every mobile browser stops
 * delivering `watchPosition` the moment the page is hidden — Chrome included,
 * by design (crbug.com/506435) — so no trick that keeps a hidden page alive
 * can keep it recording. A walker who locked the phone on our word lost
 * minutes of track to that.
 */
export type CaptureLevel = 'foreground-only' | 'screen-on' | 'guaranteed';

export interface BackgroundCapability {
  engine: Engine;
  /** For the walker's eyes: "Chrome", "Safari", "Firefox", "Samsung Internet". */
  browser: string;
  os: 'android' | 'ios' | 'desktop' | 'unknown';
  /** Running from the home screen rather than inside browser tabs. */
  installed: boolean;
  /** Screen Wake Lock API — the page can stop the screen from sleeping. */
  wakeLock: boolean;
  level: CaptureLevel;
}

function ua(): string {
  if (typeof navigator === 'undefined') return '';
  return navigator.userAgent || '';
}

function detectStandalone(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    return (
      (window.matchMedia?.('(display-mode: standalone)')?.matches ?? false) ||
      (navigator as any).standalone === true
    );
  } catch {
    return false;
  }
}

/**
 * iPadOS reports itself as a Mac. A touch-capable "Mac" is an iPad, and it
 * suspends pages the way an iPhone does, so it must not be graded as a desktop.
 */
function isIOS(s: string): boolean {
  if (/iPhone|iPad|iPod/i.test(s)) return true;
  return /Macintosh/i.test(s) && typeof navigator !== 'undefined' && (navigator as any).maxTouchPoints > 1;
}

function browserName(s: string): string {
  if (/SamsungBrowser/i.test(s)) return 'Samsung Internet';
  if (/FxiOS|Firefox/i.test(s)) return 'Firefox';
  if (/EdgiOS|Edg\//i.test(s)) return 'Edge';
  if (/OPiOS|OPR\//i.test(s)) return 'Opera';
  // Order matters: Chrome's UA contains "Safari", so Safari is what is left.
  if (/CriOS|Chrome/i.test(s)) return 'Chrome';
  if (/Safari/i.test(s)) return 'Safari';
  return 'tu navegador';
}

export function detectBackgroundCapability(): BackgroundCapability {
  const s = ua();
  const ios = isIOS(s);
  const android = /Android/i.test(s);
  const browser = browserName(s);
  const installed = detectStandalone();

  // Detected, never assumed from the name: Safari gained Wake Lock in 16.4 and
  // Firefox on Android in 126, so the same browser answers differently
  // depending on the version the walker actually has.
  const wakeLock =
    typeof navigator !== 'undefined' && typeof (navigator as any).wakeLock?.request === 'function';

  let engine: Engine;
  let os: BackgroundCapability['os'];
  if (ios) {
    // Every iOS browser is Safari's engine underneath, so they all suspend the
    // same way — Chrome on an iPhone is not Chrome on Android.
    engine = browser === 'Safari' ? 'safari-ios' : 'other-ios';
    os = 'ios';
  } else if (android) {
    engine = /Firefox/i.test(s) ? 'firefox-android' : 'chromium-android';
    os = 'android';
  } else if (s) {
    engine = 'desktop';
    os = 'desktop';
  } else {
    engine = 'unknown';
    os = 'unknown';
  }

  // A desktop tab is not frozen for having the lid open, but a sleeping laptop
  // stops it just the same, so the wake lock still decides the grade.
  const level: CaptureLevel = wakeLock ? 'screen-on' : 'foreground-only';

  return { engine, browser, os, installed, wakeLock, level };
}

/** Cached: the environment cannot change mid-hike, and this runs on render. */
let cached: BackgroundCapability | null = null;
export function backgroundCapability(): BackgroundCapability {
  if (!cached) cached = detectBackgroundCapability();
  return cached;
}

/**
 * The one sentence to show while recording — what will happen here, in this
 * browser, if the walker pockets the phone. Written per engine because the
 * useful half is the instruction, and the instruction is different everywhere.
 */
export function captureAdvice(cap: BackgroundCapability): { es: string; en: string } {
  switch (cap.level) {
    case 'guaranteed':
      return {
        es: 'Podés guardar el teléfono: la grabación sigue con la pantalla apagada y con música. No hace falta que hagas nada.',
        en: 'Pocket the phone: recording continues with the screen off and with music playing. Nothing to do.',
      };
    case 'screen-on':
      return {
        es: `${cap.browser} mantiene la pantalla encendida sola. No bloquees el teléfono, no cambies de app ni de pestaña: ${cap.browser} deja de recibir el GPS apenas esta pantalla queda atrás, y ese tramo no se graba. Podés bajar el brillo, y la música de otra app sigue sonando.`,
        en: `${cap.browser} is keeping the screen awake on its own. Don't lock the phone or switch apps or tabs: ${cap.browser} stops receiving GPS as soon as this screen is behind something, and that stretch isn't recorded. You can dim the brightness, and music from another app keeps playing.`,
      };
    default:
      return {
        es: `Dejá esta pantalla visible y el teléfono desbloqueado: si se apaga la pantalla o cambiás de app, ${cap.browser} deja de recibir el GPS y ese tramo no se graba.`,
        en: `Keep this screen visible and the phone unlocked: if the screen goes off or you switch apps, ${cap.browser} stops receiving GPS and that stretch isn't recorded.`,
      };
  }
}

/**
 * The setting the walker can change *themselves* to make this browser behave.
 * Null when there is nothing useful to change — a fake instruction is worse
 * than none.
 */
export function captureSetting(cap: BackgroundCapability): { es: string; en: string } | null {
  if (cap.level === 'guaranteed') return null;
  if (cap.os === 'android') {
    // Battery settings do not help here: the GPS stops because the page is
    // hidden, not because Android froze it. What helps is the screen staying on
    // when the wake lock is refused (battery saver does that).
    return {
      es: 'Si igual se apaga la pantalla: Ajustes → Pantalla → Tiempo de espera de la pantalla → el máximo.',
      en: 'If the screen still sleeps: Settings → Display → Screen timeout → the longest option.',
    };
  }
  if (cap.os === 'ios') {
    return cap.wakeLock
      ? {
          es: 'Si igual se apaga la pantalla: Ajustes → Pantalla y brillo → Bloqueo automático → Nunca.',
          en: 'If the screen still sleeps: Settings → Display & Brightness → Auto-Lock → Never.',
        }
      : {
          es: 'Tu versión de iOS no deja que la web mantenga la pantalla encendida. Ajustes → Pantalla y brillo → Bloqueo automático → Nunca, antes de salir.',
          en: 'Your iOS version will not let a web page hold the screen awake. Settings → Display & Brightness → Auto-Lock → Never, before you leave.',
        };
  }
  return null;
}

export default backgroundCapability;
