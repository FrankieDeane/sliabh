import { createClient } from '@supabase/supabase-js';

// Replace with your Supabase project values
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key';

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

export async function signUp(email: string, password: string) {
  return supabase.auth.signUp({ email, password });
}

export async function signOut() {
  return supabase.auth.signOut();
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
