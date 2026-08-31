import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

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
    // On web we let supabase-js parse the recovery token from the URL when the
    // user opens the password-reset link (see sendRecoveryCode + the
    // /nueva-clave screen). Native uses a code flow, so it stays off there.
    detectSessionInUrl: Platform.OS === 'web',
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

/**
 * Permanently deletes the signed-in user's account via the `delete-account`
 * Edge Function: sends the goodbye email, then deletes the auth user, which
 * cascades (on delete cascade) to their profile, contributions, reports and
 * hike tracks. Does not sign the local session out — callers should do that
 * once the deletion succeeds.
 */
export async function deleteAccount() {
  return supabase.functions.invoke('delete-account', { body: {} });
}

export async function sendRecoveryCode(email: string) {
  // Password recovery via the reset *link* (not a typed code). This works with
  // Supabase's DEFAULT "Reset password" email template — whose body is the
  // `{{ .ConfirmationURL }}` link — so it needs no template editing (the
  // template editor is locked until custom SMTP is configured). The link lands
  // the user on /nueva-clave, where detectSessionInUrl has already exchanged
  // the token for a recovery session, and they set a new password.
  const redirectTo =
    typeof window !== 'undefined' && window.location
      ? `${window.location.origin}/nueva-clave`
      : undefined;
  return supabase.auth.resetPasswordForEmail(email, redirectTo ? { redirectTo } : undefined);
}

export async function verifyRecoveryCode(email: string, token: string) {
  // Retained for the native code-based path. On web the link flow above
  // establishes the recovery session directly, so this isn't used there.
  return supabase.auth.verifyOtp({ email, token, type: 'recovery' });
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

// ── Hike tracks ("Modo Caminata" GPS recording) ──────────────────────

export interface TrackPoint {
  lat: number;
  lon: number;
  t: number; // ms epoch
}

/**
 * Persists a completed hike's GPS track. Called automatically when a
 * signed-in user stops "Modo Caminata" — recording is mandatory for logged-in
 * users, not an opt-in choice. Silently no-ops when there's no authenticated
 * user (anonymous hikes are never saved).
 */
export async function saveTrailTrack(opts: {
  trailId: string;
  points: TrackPoint[];
  distanceKm: number;
  durationS: number;
  startedAt: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: null };
  return supabase.from('trail_tracks').insert({
    user_id: user.id,
    trail_id: opts.trailId,
    points: opts.points,
    distance_km: opts.distanceKm,
    duration_s: opts.durationS,
    started_at: opts.startedAt,
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

// ── Quick poll (anonymous, web) ──────────────────────────────────────

/** Postgres unique_violation — thrown when this browser already voted. */
const UNIQUE_VIOLATION = '23505';

/**
 * Casts one anonymous vote for a quick-poll option. `voterKey` is a random id
 * the caller generates and persists in localStorage so the same browser can't
 * vote twice — enforced server-side by a unique(poll_id, voter_key) index.
 * A repeat vote from the same voterKey is treated as a no-op, not an error.
 */
export async function submitPollVote(pollId: string, optionId: string, voterKey: string) {
  const { error } = await supabase
    .from('poll_votes')
    .insert({ poll_id: pollId, option_id: optionId, voter_key: voterKey });
  if (error && (error as { code?: string }).code !== UNIQUE_VIOLATION) throw error;
}

/**
 * Submits the respondent's name/last name/email alongside their vote.
 * Stored in poll_leads — a separate table from poll_votes (which stays
 * anonymous) precisely because this one holds PII; poll_leads has no public
 * select policy, so this data is never readable via the anon key, only from
 * the Supabase dashboard.
 */
export async function submitPollLead(
  pollId: string,
  optionId: string,
  voterKey: string,
  lead: { firstName: string; lastName: string; email: string },
) {
  const { error } = await supabase.from('poll_leads').insert({
    poll_id: pollId,
    option_id: optionId,
    voter_key: voterKey,
    first_name: lead.firstName,
    last_name: lead.lastName,
    email: lead.email,
  });
  if (error) throw error;
}

/** Vote counts per option for a poll, plus the total. */
export async function fetchPollResults(pollId: string): Promise<{ counts: Record<string, number>; total: number }> {
  const { data, error } = await supabase.from('poll_votes').select('option_id').eq('poll_id', pollId);
  if (error || !data) return { counts: {}, total: 0 };
  const counts: Record<string, number> = {};
  for (const row of data as { option_id: string }[]) {
    counts[row.option_id] = (counts[row.option_id] ?? 0) + 1;
  }
  return { counts, total: data.length };
}
