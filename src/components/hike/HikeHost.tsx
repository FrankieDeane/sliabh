import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HikeMode, FREE_TRACK_ID, type HikeColors } from './HikeMode';
import {
  readLiveSession,
  clearLiveSession,
  liveDistanceKm,
  liveDurationS,
  type LiveSession,
} from '../../services/liveTrack';
import { recordTrack } from '../../services/trackSync';
import { useHikeStore } from '../../store/hikeStore';
import { findTrailForHike } from '../../data/trailLookup';
import { useLangStore } from '../../store/langStore';
import { useThemeStore } from '../../store/themeStore';

/**
 * A recording that went quiet this long ago was interrupted hours back — the
 * walk is over and only the data is worth rescuing. Anything fresher is a walk
 * still in progress and is picked straight back up.
 */
const STALE_AFTER_MS = 6 * 60 * 60_000;

function colorsFor(isDark: boolean): HikeColors {
  return isDark
    ? { bg: '#070b14', surface: '#0f1724', border: '#1e2d42', text: '#f0f9ff', muted: '#64748b', accent: '#22c55e' }
    : { bg: '#f8fafc', surface: '#ffffff', border: '#e2e8f0', text: '#0f172a', muted: '#64748b', accent: '#16a34a' };
}

/**
 * Owns the recording screen for the whole app.
 *
 * Killing the browser mid-walk used to end the recording: the screen belonged
 * to a page that no longer existed, so reopening the app left the walker
 * looking at a trail page while nothing was being recorded. The session is on
 * disk marked `recording`, so on launch it is reopened and continued — same
 * clock, same track — before anything else happens.
 */
export function HikeHost() {
  const { t } = useLangStore();
  const { theme } = useThemeStore();
  const colors = colorsFor(theme === 'dark');

  const open = useHikeStore((s) => s.open);
  const trail = useHikeStore((s) => s.trail);
  const resume = useHikeStore((s) => s.resume);
  const resumeRecording = useHikeStore((s) => s.resumeRecording);
  const close = useHikeStore((s) => s.close);

  const [stale, setStale] = React.useState<LiveSession | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    const session = readLiveSession();
    if (!session || session.status !== 'recording') return;
    const idle = Date.now() - new Date(session.updatedAt).getTime();
    if (idle < STALE_AFTER_MS) {
      resumeRecording(session, findTrailForHike(session.trailId) ?? undefined);
    } else {
      setStale(session);
    }
  }, [resumeRecording]);

  const saveStale = React.useCallback(async () => {
    if (!stale) return;
    setBusy(true);
    try {
      await recordTrack({
        trailId: stale.trailId ?? FREE_TRACK_ID,
        points: stale.points,
        distanceKm: liveDistanceKm(stale.points),
        durationS: liveDurationS(stale.points),
        startedAt: stale.startedAt,
      });
      clearLiveSession();
      setSaved(true);
      setTimeout(() => setStale(null), 2600);
    } finally {
      setBusy(false);
    }
  }, [stale]);

  const continueStale = React.useCallback(() => {
    if (!stale) return;
    resumeRecording(stale, findTrailForHike(stale.trailId) ?? undefined);
    setStale(null);
  }, [stale, resumeRecording]);

  return (
    <>
      <HikeMode
        visible={open}
        trail={trail ?? undefined}
        resume={resume}
        colors={colors}
        t={t}
        onClose={close}
      />

      {stale && stale.points.length >= 2 && (
        <View style={s.wrap} pointerEvents="box-none">
          <View style={s.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons
                name={saved ? 'checkmark-circle' : 'alert-circle-outline'}
                size={18}
                color={colors.accent}
              />
              <Text style={s.title}>
                {saved
                  ? t('Caminata recuperada', 'Hike recovered')
                  : t('Quedó una caminata sin cerrar', 'A hike was left unfinished')}
              </Text>
            </View>
            <Text style={s.body}>
              {saved
                ? t('Ya está guardada. Sin señal, se sube sola cuando vuelva.', 'It is saved. With no signal it uploads itself once one returns.')
                : `${stale.trailName ?? t('Recorrido libre', 'Free track')} · ${
                    liveDistanceKm(stale.points) >= 1
                      ? `${liveDistanceKm(stale.points).toFixed(2)} km`
                      : `${Math.round(liveDistanceKm(stale.points) * 1000)} m`
                  } · ${Math.round(liveDurationS(stale.points) / 60)} min`}
            </Text>
            {!saved && (
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                <TouchableOpacity
                  onPress={saveStale}
                  disabled={busy}
                  activeOpacity={0.85}
                  style={[s.primary, { backgroundColor: colors.accent, opacity: busy ? 0.6 : 1 }]}
                >
                  <Text style={s.primaryTxt}>{busy ? t('Guardando…', 'Saving…') : t('Guardarla', 'Save it')}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={continueStale} disabled={busy} activeOpacity={0.85} style={s.secondary}>
                  <Text style={s.secondaryTxt}>{t('Seguir grabando', 'Keep recording')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => { clearLiveSession(); setStale(null); }}
                  disabled={busy}
                  activeOpacity={0.85}
                  style={s.secondary}
                >
                  <Text style={s.secondaryTxt}>{t('Descartar', 'Discard')}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      )}
    </>
  );
}

const s = StyleSheet.create({
  wrap: {
    position: Platform.OS === 'web' ? ('fixed' as any) : 'absolute',
    left: 12, right: 12, bottom: 84, zIndex: 70, alignItems: 'center',
  },
  card: {
    width: '100%', maxWidth: 460, gap: 10,
    backgroundColor: 'rgba(15,23,36,0.97)',
    borderWidth: 1, borderColor: 'rgba(34,197,94,0.35)',
    borderRadius: 16, padding: 14,
  },
  title: { color: '#f0f9ff', fontWeight: '800', fontSize: 14, flex: 1 },
  body: { color: '#94a3b8', fontSize: 12, lineHeight: 17 },
  primary: { borderRadius: 999, paddingHorizontal: 18, paddingVertical: 9 },
  primaryTxt: { color: '#04210f', fontWeight: '800', fontSize: 13 },
  secondary: {
    borderRadius: 999, paddingHorizontal: 16, paddingVertical: 9,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
  },
  secondaryTxt: { color: '#e2e8f0', fontWeight: '700', fontSize: 13 },
});

export default HikeHost;
