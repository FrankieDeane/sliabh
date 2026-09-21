import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { fetchMyTrailTracks, isSupabaseConfigured, supabase, type SavedTrack } from '../../services/supabase';
import { syncPendingTracks } from '../../services/trackSync';
import { useTrackQueueStore } from '../../store/trackQueueStore';
import { useLangStore } from '../../store/langStore';

interface Colors { surface: string; elevated: string; border: string; text: string; muted: string; accent: string }

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h > 0 ? `${h} h ${m} min` : `${m} min`;
}

function formatDistance(km: number): string {
  return km >= 1 ? `${km.toFixed(2)} km` : `${Math.round(km * 1000)} m`;
}

/**
 * The signed-in user's own recorded hikes on this trail, read from their
 * account rather than from the device — a hike recorded on the phone shows up
 * on the desktop and vice versa. Hikes still waiting to reach the account
 * (recorded signed-out or offline) are listed as pending.
 */
export function MyTracksSection({ trailId, colors }: { trailId: string; colors: Colors }) {
  const { t, lang } = useLangStore();
  const router = useRouter();
  const [tracks, setTracks] = React.useState<SavedTrack[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [authed, setAuthed] = React.useState(false);
  const allPending = useTrackQueueStore((s) => s.pending);
  const pending = React.useMemo(
    () => allPending.filter((p) => p.trailId === trailId),
    [allPending, trailId],
  );
  const configured = isSupabaseConfigured();

  const load = React.useCallback(async () => {
    const { data } = await supabase.auth.getUser();
    setAuthed(!!data.user);
    setTracks(data.user ? await fetchMyTrailTracks(trailId) : []);
    setLoading(false);
  }, [trailId]);

  React.useEffect(() => {
    if (!configured) { setLoading(false); return; }
    // Push anything queued on this device first, so the list below is complete.
    syncPendingTracks().catch(() => {}).then(() => load());
    const { data: sub } = supabase.auth.onAuthStateChange(() => { load(); });
    return () => sub.subscription.unsubscribe();
  }, [configured, load]);

  if (!configured) return null;

  const locale = lang === 'en' ? 'en-GB' : 'es-AR';

  return (
    <View style={{
      backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1,
      borderRadius: 16, padding: 16, marginHorizontal: 16, marginBottom: 14, gap: 10,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Ionicons name="footsteps-outline" size={16} color={colors.accent} />
        <Text style={{ color: colors.text, fontWeight: '800', fontSize: 14, flex: 1 }}>
          {t('Mis recorridos', 'My recorded hikes')}
        </Text>
        {loading && <ActivityIndicator size="small" color={colors.muted} />}
      </View>

      <Text style={{ color: colors.muted, fontSize: 11.5, lineHeight: 16 }}>
        {t(
          'Se guardan en tu cuenta: los grabás en el celular y los ves en la compu (y al revés).',
          'Saved to your account: record on your phone, see them on your desktop (and the other way round).',
        )}
      </Text>

      {!loading && !authed && (
        <TouchableOpacity
          onPress={() => router.push('/(auth)/login' as any)}
          activeOpacity={0.85}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2,
            borderWidth: 1, borderColor: colors.border, borderRadius: 12,
            paddingHorizontal: 12, paddingVertical: 10, backgroundColor: colors.elevated,
          }}
        >
          <Ionicons name="log-in-outline" size={16} color={colors.accent} />
          <Text style={{ color: colors.text, fontSize: 12.5, fontWeight: '700', flex: 1 }}>
            {t('Iniciá sesión para sincronizar tus recorridos', 'Sign in to sync your hikes')}
          </Text>
        </TouchableOpacity>
      )}

      {!loading && authed && !tracks.length && !pending.length && (
        <Text style={{ color: colors.muted, fontSize: 12.5 }}>
          {t('Todavía no grabaste esta ruta.', "You haven't recorded this trail yet.")}
        </Text>
      )}

      {tracks.map((track) => (
        <View key={track.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Ionicons name="checkmark-circle" size={15} color={colors.accent} />
          <Text style={{ color: colors.text, fontSize: 12.5, flex: 1 }}>
            {new Date(track.started_at).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' })}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 12 }}>
            {formatDistance(track.distance_km)} · {formatDuration(track.duration_s)}
          </Text>
        </View>
      ))}

      {pending.map((track) => (
        <View key={track.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Ionicons name="cloud-upload-outline" size={15} color="#f59e0b" />
          <Text style={{ color: colors.text, fontSize: 12.5, flex: 1 }}>
            {new Date(track.startedAt).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' })}
          </Text>
          <Text style={{ color: '#f59e0b', fontSize: 11.5, fontWeight: '700' }}>
            {t('pendiente de sincronizar', 'waiting to sync')}
          </Text>
        </View>
      ))}
    </View>
  );
}

export default MyTracksSection;
