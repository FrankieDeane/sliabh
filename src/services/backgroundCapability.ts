/**
 * The native answer to "what can this environment promise?".
 *
 * There is nothing to detect here: the Android build runs a foreground
 * service, which is the same mechanism Google Fit uses, so the promise is the
 * strong one. The web file next to this one has the interesting job.
 */

export type Engine = 'native-android';
export type CaptureLevel = 'foreground-only' | 'best-effort' | 'screen-on' | 'guaranteed';

export interface BackgroundCapability {
  engine: Engine;
  browser: string;
  os: 'android' | 'ios' | 'desktop' | 'unknown';
  installed: boolean;
  wakeLock: boolean;
  audioKeepAlive: boolean;
  level: CaptureLevel;
}

const NATIVE: BackgroundCapability = {
  engine: 'native-android',
  browser: 'Sliabh',
  os: 'android',
  installed: true,
  wakeLock: true,
  audioKeepAlive: false,
  level: 'guaranteed',
};

export function detectBackgroundCapability(): BackgroundCapability {
  return NATIVE;
}

export function backgroundCapability(): BackgroundCapability {
  return NATIVE;
}

export function captureAdvice(_cap: BackgroundCapability): { es: string; en: string } {
  return {
    es: 'Podés guardar el teléfono: la grabación sigue con la pantalla apagada y con música. Vas a ver la notificación de Sliabh mientras graba.',
    en: 'Pocket the phone: recording continues with the screen off and with music playing. Sliabh keeps a notification up while it records.',
  };
}

export function captureSetting(_cap: BackgroundCapability): { es: string; en: string } | null {
  return null;
}

export default backgroundCapability;
