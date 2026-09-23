import { Platform } from 'react-native';

/**
 * Who the Android app can be offered to on the website.
 * - 'android': install it now.
 * - 'desktop': suggest trying it on their phone.
 * - null: iPhone (there is no iOS app, so an offer is a dead end), a phone we
 *   cannot identify, or the app itself.
 */
export type AppPromoAudience = 'android' | 'desktop' | null;

export function appPromoAudience(width: number): AppPromoAudience {
  if (Platform.OS !== 'web' || typeof navigator === 'undefined') return null;
  const ua = navigator.userAgent || '';
  if (/Android/i.test(ua)) return 'android';
  const ios = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/i.test(ua) && (navigator as any).maxTouchPoints > 1);
  if (ios || width < 720) return null;
  return 'desktop';
}
