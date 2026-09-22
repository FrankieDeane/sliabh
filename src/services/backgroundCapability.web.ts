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
 * "Batería → Sin restricciones" means nothing on an iPhone.
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
 * - `best-effort`: a lever exists that often survives the screen going off,
 *   but it is not a guarantee on every phone or battery setting.
 * - `screen-on`: the page can hold the screen awake, so it is never hidden and
 *   never frozen — recording holds as long as the walker stays in the app.
 * - `guaranteed`: an OS foreground service records from a pocket. Native only.
 */
export type CaptureLevel = 'foreground-only' | 'best-effort' | 'screen-on' | 'guaranteed';

export interface BackgroundCapability {
  engine: Engine;
  /** For the walker's eyes: "Chrome", "Safari", "Firefox", "Samsung Internet". */
  browser: string;
  os: 'android' | 'ios' | 'desktop' | 'unknown';
  /** Running from the home screen rather than inside browser tabs. */
  installed: boolean;
  /** Screen Wake Lock API — the page can stop the screen from sleeping. */
  wakeLock: boolean;
  /**
   * Whether the inaudible-tone trick is worth doing here. True only on
   * Chromium/Android, where a tab that plays audio is exempt from freezing
   * *and* Web Audio does not take audio focus. Everywhere else it is either
   * useless (desktop, where the tab is not frozen this way) or risky (iOS,
   * where an audio context can interrupt the walker's own music — which is
   * exactly the failure we are trying to fix).
   */
  audioKeepAlive: boolean;
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

  const audioKeepAlive = engine === 'chromium-android';

  let level: CaptureLevel;
  if (audioKeepAlive) level = 'best-effort';
  else if (wakeLock) level = 'screen-on';
  else level = 'foreground-only';
  // A desktop tab is not frozen for having the lid open, but a sleeping laptop
  // stops it just the same, so the wake lock still decides the grade.

  return { engine, browser, os, installed, wakeLock, audioKeepAlive, level };
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
        es: 'Podés guardar el teléfono: la grabación sigue con la pantalla apagada y con música.',
        en: 'Pocket the phone: recording continues with the screen off and with music playing.',
      };
    case 'best-effort':
      return {
        es: `${cap.browser} mantiene la grabación con la pantalla apagada mientras la app siga sonando en segundo plano — no siempre lo permite el ahorro de batería. Si algo se pierde, abajo te decimos cuántos minutos.`,
        en: `${cap.browser} can keep recording with the screen off while the app stays alive in the background — battery saver does not always allow it. If anything is missed, the app says how many minutes below.`,
      };
    case 'screen-on':
      return cap.os === 'ios'
        ? {
            es: `En ${cap.browser} la pantalla se mantiene encendida sola mientras grabás. Si pasás a otra app o bloqueás el teléfono a mano, la grabación se corta: volvé acá y seguí.`,
            en: `In ${cap.browser} the screen is held awake while you record. If you switch apps or lock the phone by hand, recording stops: come back here and continue.`,
          }
        : {
            es: `${cap.browser} mantiene la pantalla encendida mientras grabás. Si bloqueás el teléfono o pasás a otra app, la grabación se corta.`,
            en: `${cap.browser} keeps the screen awake while you record. If you lock the phone or switch apps, recording stops.`,
          };
    default:
      return {
        es: `${cap.browser} congela la página apenas se oculta. Dejá esta pantalla abierta y el teléfono desbloqueado mientras grabás.`,
        en: `${cap.browser} freezes the page as soon as it is hidden. Keep this screen open and the phone unlocked while recording.`,
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
    return {
      es: `Ajustes → Aplicaciones → ${cap.browser} → Batería → Sin restricciones. Sin eso Android congela la pestaña igual.`,
      en: `Settings → Apps → ${cap.browser} → Battery → Unrestricted. Without it Android freezes the tab anyway.`,
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
