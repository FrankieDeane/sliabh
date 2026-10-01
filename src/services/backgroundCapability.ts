import { Platform } from 'react-native';

/**
 * The native answer to "what can this environment promise?".
 *
 * There is nothing to detect here. The Android build runs a foreground
 * service (the same mechanism Google Fit uses); the iOS build uses the
 * `location` background mode with "Always" access, which shows the blue
 * status-bar pill instead of a notification. Both keep recording with the
 * screen off, so the promise is the strong one. The web file next to this one
 * has the interesting job.
 */

export type Engine = 'native-android' | 'native-ios';
export type CaptureLevel = 'foreground-only' | 'screen-on' | 'guaranteed';

export interface BackgroundCapability {
  engine: Engine;
  browser: string;
  os: 'android' | 'ios' | 'desktop' | 'unknown';
  installed: boolean;
  wakeLock: boolean;
  level: CaptureLevel;
}

const IOS = Platform.OS === 'ios';

const NATIVE: BackgroundCapability = {
  engine: IOS ? 'native-ios' : 'native-android',
  browser: 'Sliabh',
  os: IOS ? 'ios' : 'android',
  installed: true,
  wakeLock: true,
  level: 'guaranteed',
};

export function detectBackgroundCapability(): BackgroundCapability {
  return NATIVE;
}

export function backgroundCapability(): BackgroundCapability {
  return NATIVE;
}

export function captureAdvice(_cap: BackgroundCapability): { es: string; en: string } {
  if (IOS) {
    return {
      es: 'Podés guardar el iPhone: la grabación sigue con la pantalla bloqueada y con música. Mientras graba vas a ver la barra azul de ubicación arriba.',
      en: 'Pocket the iPhone: recording continues with the screen locked and with music playing. The blue location pill stays up while it records.',
    };
  }
  return {
    es: 'Podés guardar el teléfono: la grabación sigue con la pantalla apagada y con música. Vas a ver la notificación de Sliabh mientras graba.',
    en: 'Pocket the phone: recording continues with the screen off and with music playing. Sliabh keeps a notification up while it records.',
  };
}

export function captureSetting(_cap: BackgroundCapability): { es: string; en: string } | null {
  return null;
}

export default backgroundCapability;
