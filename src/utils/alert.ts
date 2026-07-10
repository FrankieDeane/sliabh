import { Alert, Platform } from 'react-native';

/**
 * Cross-platform alert.
 *
 * React Native's `Alert` is a no-op on `react-native-web` (there is no native
 * `UIAlertController`/`AlertDialog` equivalent), so any `Alert.alert(...)` call
 * silently does nothing in the web build. That made every auth error and
 * validation message invisible on the deployed site — the login button and the
 * email-verification flow appeared "dead" because the user never saw the
 * feedback. This helper falls back to `window.alert` on web so the message is
 * always surfaced, on every platform.
 */
export function showAlert(title: string, message?: string): void {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && typeof window.alert === 'function') {
      window.alert(message ? `${title}\n\n${message}` : title);
    }
    return;
  }
  Alert.alert(title, message);
}

// ── Auth input hardening ─────────────────────────────────────────────

/**
 * Normalise an email before it ever reaches the auth backend: trim whitespace
 * and lowercase it. This prevents duplicate accounts that differ only by case
 * (`User@x.com` vs `user@x.com`) and keeps client-side checks consistent with
 * what Supabase stores.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Conservative email shape check. This is a client-side UX/guard rail only —
 * the real validation happens server-side — but rejecting obviously malformed
 * input early avoids leaking pointless requests and gives faster feedback.
 */
export function isValidEmail(email: string): boolean {
  // Single @, no spaces, at least one dot in the domain. Deliberately strict
  // enough to catch typos without trying to fully implement RFC 5322.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
