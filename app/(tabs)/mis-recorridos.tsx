import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/hooks/useTheme';
import { useLangStore } from '../../src/store/langStore';
import { useTrackQueueStore } from '../../src/store/trackQueueStore';
import { useHikeStore } from '../../src/store/hikeStore';
import {
  fetchMyTrailTracks,
  isSupabaseConfigured,
  supabase,
  type SavedTrack,
} from '../../src/services/supabase';
import { syncPendingTracks } from '../../src/services/trackSync';
import {
  readLiveSession,
  liveDistanceKm,
  liveDurationS,
  type LiveSession,
} from '../../src/services/liveTrack';
import { findTrailForHike } from '../../src/data/trailLookup';
import { FREE_TRACK_ID } from '../../src/components/hike/HikeMode';
import { ShareTrackRow } from '../../src/components/hike/ShareTrackRow';
import { TrackMapPreview } from '../../src/components/hike/TrackMapPreview';
import { SeoHead } from '../../src/components/ui/SeoHead';
import { WebFooter } from '../../src/components/layout/WebFooter';

function fmtDistance(km: number): string {
  return km >= 1 ? `${km.toFixed(2)} km` : `${Math.round(km * 1000)} m`;
}

function fmtDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h > 0 ? `${h} h ${m} min` : `${m} min`;
}

/**
 * Every hike the walker has recorded, in one place they can find from the
 * menu: the one recording right now, the ones still on this phone waiting for
 * signal, and the ones already in the account — which is what shows up when
 * they sign in on a different phone.
 */
export default function MisRecorridosScreen() {
  const { isDark } = useTheme();
  const { t, lang } = useLangStore();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const c = isDark
    ? { bg: '#070b14', surface: '#0f1724', elevated: '#162035', border: '#1e2d42', text: '#f0f9ff', muted: '#64748b', accent: '#22c55e' }
    : { bg: '#f8fafc', surface: '#ffffff', elevated: '#f1f5f9', border: '#e2e8f0', text: '#0f172a', muted: '#64748b', accent: '#16a34a' };

  const pending = useTrackQueueStore((s) => s.pending);
  const resumeRecording = useHikeStore((s) => s.resumeRecording);

  const [live, setLive] = React.useState<LiveSession | null>(null);
  const [tracks, setTracks] = React.useState<SavedTrack[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [authed, setAuthed] = React.useState(false);
  const [syncing, setSyncing] = React.useState(false);

  const load = React.useCallback(async () => {
    setLive(readLiveSession());
    if (!isSupabaseConfigured()) { setLoading(false); return; }
    const { data } = await supabase.auth.getSession();
    const signedIn = !!data.session?.user;
    setAuthed(signedIn);
    setTracks(signedIn ? await fetchMyTrailTracks(undefined, 50) : []);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    load();
    if (!isSupabaseConfigured()) return;
    // Signing in on this device is exactly when the account's hikes — recorded
    // on some other phone — should appear.
    const { data: sub } = supabase.auth.onAuthStateChange(() => { load(); });
    return () => sub.subscription.unsubscribe();
  }, [load]);

  const syncNow = React.useCallback(async () => {
    setSyncing(true);
    try {
      await syncPendingTracks();
      await load();
    } finally {
      setSyncing(false);
    }
  }, [load]);

  const locale = lang === 'en' ? 'en-GB' : 'es-AR';
  const sidePad = Math.max(16, (width - 900) / 2);

  function trackLabel(trailId: string): string {
    if (trailId === FREE_TRACK_ID) return t('Recorrido libre', 'Free track');
    return findTrailForHike(trailId)?.name ?? trailId;
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <SeoHead
        title="Mis recorridos — Sliabh"
        description="Todos tus recorridos grabados con GPS: el que estás grabando ahora, los que esperan señal y los guardados en tu cuenta."
        path="/mis-recorridos"
      />
      <ScrollView contentContainerStyle={{ paddingHorizontal: sidePad, paddingBottom: 60 }}>
        <View style={{ paddingTop: 24, paddingBottom: 12 }}>
          <Text style={{ color: c.text, fontSize: 32, fontWeight: '900', letterSpacing: -1 }}>
            {t('Mis recorridos', 'My hikes')}
          </Text>
          <Text style={{ color: c.muted, fontSize: 13, marginTop: 4, lineHeight: 19 }}>
            {t(
              'Todo lo que grabaste con GPS. Lo que está en tu cuenta te sigue a cualquier teléfono donde inicies sesión.',
              'Everything you recorded with GPS. What is in your account follows you to any phone you sign in on.',
            )}
          </Text>
        </View>

        {/* Recording right now */}
        {live && live.status === 'recording' && (
          <View style={{ backgroundColor: c.surface, borderColor: c.accent, borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 14, gap: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e' }} />
              <Text style={{ color: c.accent, fontWeight: '800', fontSize: 12, letterSpacing: 1.2 }}>
                {t('GRABANDO AHORA', 'RECORDING NOW')}
              </Text>
            </View>
            <Text style={{ color: c.text, fontSize: 14, fontWeight: '700' }}>
              {live.trailName ?? t('Recorrido libre', 'Free track')}
            </Text>
            <Text style={{ color: c.muted, fontSize: 12.5 }}>
              {fmtDistance(liveDistanceKm(live.points))} · {fmtDuration(liveDurationS(live.points))} · {live.points.length} {t('puntos', 'points')}
            </Text>
            <TouchableOpacity
              onPress={() => resumeRecording(live, findTrailForHike(live.trailId) ?? undefined)}
              activeOpacity={0.85}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', backgroundColor: c.accent, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 10, marginTop: 4 }}
            >
              <Ionicons name="play" size={15} color="#04210f" />
              <Text style={{ color: '#04210f', fontWeight: '800', fontSize: 13 }}>
                {t('Volver a la grabación', 'Back to the recording')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Waiting to reach the account */}
        {pending.length > 0 && (
          <View style={{ backgroundColor: c.surface, borderColor: c.border, borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 14, gap: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="cloud-upload-outline" size={16} color="#f59e0b" />
              <Text style={{ color: c.text, fontWeight: '800', fontSize: 14, flex: 1 }}>
                {t('En este teléfono, esperando subir', 'On this phone, waiting to upload')}
              </Text>
            </View>
            <Text style={{ color: c.muted, fontSize: 11.5, lineHeight: 16 }}>
              {t(
                'Se grabaron sin señal o sin sesión iniciada. No se pierden: suben solos cuando haya conexión.',
                'Recorded with no signal or not signed in. They are not lost: they upload themselves once there is a connection.',
              )}
            </Text>
            {pending.map((p) => (
              <View key={p.id} style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Ionicons name="time-outline" size={15} color="#f59e0b" />
                  <Text style={{ color: c.text, fontSize: 12.5, flex: 1 }} numberOfLines={1}>
                    {trackLabel(p.trailId)}
                  </Text>
                  <Text style={{ color: c.muted, fontSize: 12 }}>
                    {fmtDistance(p.distanceKm)} · {fmtDuration(p.durationS)}
                  </Text>
                </View>
                <TrackMapPreview
                  points={p.points}
                  colors={c}
                  routePoints={findTrailForHike(p.trailId)?.gpxTrack}
                />
              </View>
            ))}
            <TouchableOpacity
              onPress={syncNow}
              disabled={syncing}
              activeOpacity={0.85}
              style={{ alignSelf: 'flex-start', borderWidth: 1, borderColor: c.border, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 9, opacity: syncing ? 0.6 : 1 }}
            >
              <Text style={{ color: c.text, fontWeight: '700', fontSize: 12.5 }}>
                {syncing ? t('Sincronizando…', 'Syncing…') : t('Sincronizar ahora', 'Sync now')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* In the account — the part that travels between devices */}
        <View style={{ backgroundColor: c.surface, borderColor: c.border, borderWidth: 1, borderRadius: 16, padding: 16, gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="cloud-done-outline" size={16} color={c.accent} />
            <Text style={{ color: c.text, fontWeight: '800', fontSize: 14, flex: 1 }}>
              {t('En tu cuenta', 'In your account')}
            </Text>
            {loading && <ActivityIndicator size="small" color={c.muted} />}
          </View>

          {!loading && !authed && (
            <>
              <Text style={{ color: c.muted, fontSize: 12.5, lineHeight: 17 }}>
                {t(
                  'Iniciá sesión para que tus recorridos se guarden en la cuenta y aparezcan en cualquier teléfono o en la compu.',
                  'Sign in so your hikes are kept in your account and show up on any phone or on your desktop.',
                )}
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(auth)/login' as any)}
                activeOpacity={0.85}
                style={{ alignSelf: 'flex-start', backgroundColor: c.accent, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 10 }}
              >
                <Text style={{ color: '#04210f', fontWeight: '800', fontSize: 13 }}>
                  {t('Iniciar sesión', 'Sign in')}
                </Text>
              </TouchableOpacity>
            </>
          )}

          {!loading && authed && tracks.length === 0 && (
            <Text style={{ color: c.muted, fontSize: 12.5 }}>
              {t('Todavía no hay recorridos guardados en tu cuenta.', 'No hikes saved to your account yet.')}
            </Text>
          )}

          {tracks.map((track) => (
            <View key={track.id} style={{ paddingVertical: 8, borderTopWidth: 1, borderTopColor: c.border }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Ionicons name="footsteps-outline" size={16} color={c.accent} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.text, fontSize: 13, fontWeight: '700' }} numberOfLines={1}>
                    {track.title || trackLabel(track.trail_id)}
                  </Text>
                  <Text style={{ color: c.muted, fontSize: 11.5 }}>
                    {new Date(track.started_at).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' })}
                    {' · '}
                    {new Date(track.started_at).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
                <Text style={{ color: c.muted, fontSize: 12, textAlign: 'right' }}>
                  {fmtDistance(track.distance_km)}
                  {'\n'}
                  {fmtDuration(track.duration_s)}
                </Text>
              </View>
              <TrackMapPreview
                points={track.points}
                colors={c}
                routePoints={findTrailForHike(track.trail_id)?.gpxTrack}
              />
              <ShareTrackRow
                track={track}
                colors={c}
                label={track.title || trackLabel(track.trail_id)}
                onChanged={load}
              />
            </View>
          ))}
        </View>

        {Platform.OS === 'web' && <WebFooter />}
      </ScrollView>
    </View>
  );
}
