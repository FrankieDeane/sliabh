import { createClient } from '@supabase/supabase-js';

// Replace with your Supabase project values
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key';

/** True once real Supabase credentials are set (not the placeholders). */
export function isSupabaseConfigured(): boolean {
  return (
    !!SUPABASE_URL && !SUPABASE_URL.includes('placeholder') &&
    !!SUPABASE_ANON_KEY && !SUPABASE_ANON_KEY.includes('placeholder')
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ── Auth helpers ────────────────────────────────────────────────────

export async function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUp(email: string, password: string, displayName?: string) {
  // Code-based verification: instead of an email *link* (which broke when the
  // redirect URL didn't match Supabase's allow-list), the confirmation email
  // carries a 6-digit `{{ .Token }}` that the user types on the /codigo screen.
  // We therefore pass no `emailRedirectTo`; `display_name` is stashed in the
  // user's metadata so it survives until the profile row is created.
  return supabase.auth.signUp({
    email,
    password,
    options: displayName ? { data: { display_name: displayName } } : undefined,
  });
}

/**
 * Verifies the 6-digit code sent when a new account signs up. On success the
 * user is confirmed and a session is established.
 */
export async function verifySignupCode(email: string, token: string) {
  return supabase.auth.verifyOtp({ email, token, type: 'signup' });
}

/** Re-sends the signup confirmation code to a pending (unconfirmed) account. */
export async function resendSignupCode(email: string) {
  return supabase.auth.resend({ type: 'signup', email });
}

export async function signOut() {
  return supabase.auth.signOut();
}

/**
 * Fires a transactional account email (welcome / goodbye) via the
 * `send-account-email` Edge Function. Best-effort: callers should not block the
 * UI on it. The function only ever emails the authenticated user's own address.
 */
export async function sendAccountEmail(type: 'welcome' | 'goodbye') {
  return supabase.functions.invoke('send-account-email', { body: { type } });
}

export async function sendRecoveryCode(email: string) {
  // Uses Supabase OTP email — user receives 6-digit code
  return supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
}

export async function verifyRecoveryCode(email: string, token: string) {
  return supabase.auth.verifyOtp({ email, token, type: 'email' });
}

export async function updatePassword(password: string) {
  return supabase.auth.updateUser({ password });
}

// ── Profile helpers ─────────────────────────────────────────────────

export async function upsertProfile(id: string, data: { display_name?: string; avatar_url?: string }) {
  return supabase.from('profiles').upsert({ id, ...data, updated_at: new Date().toISOString() });
}

// ── Contributions ───────────────────────────────────────────────────

export async function submitContribution(c: {
  type: string;
  title: string;
  description: string;
  lat?: number;
  lon?: number;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');
  return supabase.from('trail_contributions').insert({ ...c, user_id: user.id });
}

/**
 * Community "sendero correction": a user marks where a trail actually is
 * (their GPS point) so the team can fix a mis-drawn route. Stored as a
 * moderated `edicion_ruta` contribution; the trail reference lives in metadata.
 */
export async function submitSenderoCorrection(opts: {
  trailId?: string;
  trailName?: string;
  lat: number;
  lon: number;
  note?: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');
  const title = opts.trailName
    ? `Corrección de sendero: ${opts.trailName}`
    : 'Corrección de sendero (ubicación reportada)';
  return supabase.from('trail_contributions').insert({
    type: 'edicion_ruta',
    title,
    description: opts.note ?? '',
    lat: opts.lat,
    lon: opts.lon,
    metadata: { kind: 'sendero_correction', trail_id: opts.trailId ?? null },
    user_id: user.id,
  });
}

// ── Trail condition reports (live, perishable) ──────────────────────

export type TrailCondition = 'ok' | 'nieve' | 'rio_crecido' | 'cerrado' | 'huella_perdida' | 'barro' | 'otro';

export interface TrailReport {
  id: string;
  trail_id: string;
  condition: TrailCondition;
  note: string;
  created_at: string;
  profiles?: { display_name: string | null } | null;
}

/** Recent (non-expired) condition reports for a trail, newest first. */
export async function fetchTrailReports(trailId: string, limit = 10): Promise<TrailReport[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await supabase
    .from('trail_reports')
    .select('id, trail_id, condition, note, created_at, profiles(display_name)')
    .eq('trail_id', trailId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data as any) ?? [];
}

/** Submit a condition report for a trail (requires an authenticated user). */
export async function submitTrailReport(trailId: string, condition: TrailCondition, note = '') {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');
  return supabase.from('trail_reports').insert({ trail_id: trailId, condition, note, user_id: user.id });
}
