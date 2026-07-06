import { Platform, Share, Linking } from 'react-native';

export const SITE_URL = 'https://sliabh.netlify.app/';

/** URL of the page currently on screen (web); falls back to the site root. */
export function currentPageUrl(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.location.href;
  }
  return SITE_URL;
}

/**
 * Open WhatsApp with a pre-filled message. The message carries the site
 * description alongside the link, so the recipient sees what Sliabh is even
 * if their client doesn't render a link preview.
 */
export async function shareOnWhatsApp(message: string): Promise<void> {
  const encoded = encodeURIComponent(message);
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') {
      // wa.me routes to the app on mobile and WhatsApp Web on desktop
      window.open(`https://wa.me/?text=${encoded}`, '_blank', 'noopener,noreferrer');
    }
    return;
  }
  try {
    await Linking.openURL(`whatsapp://send?text=${encoded}`);
  } catch {
    // WhatsApp not installed — fall back to the native share sheet
    await Share.share({ message });
  }
}
