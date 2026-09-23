import { Platform } from 'react-native';

const SITE_ORIGIN = 'https://sliabh.com.ar';

/**
 * A file from public/, as a URL this platform can load.
 *
 * The web serves public/ at the site root, so '/foo.webp' just works there. The
 * Android app has no site root to resolve against and silently shows nothing,
 * so it gets the production URL instead. Absolute URLs pass through untouched.
 */
export function asset(path: string): string {
  if (Platform.OS === 'web' || !path.startsWith('/')) return path;
  return `${SITE_ORIGIN}${path}`;
}
