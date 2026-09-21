import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  readLiveSession,
  clearLiveSession,
  liveDistanceKm,
  liveDurationS,
  type LiveSession,
} from '../../services/liveTrack';
import { recordTrack } from '../../services/trackSync';
import { FREE_TRACK_ID } from './HikeMode';
import { useLangStore } from '../../store/langStore';

/** A session still open after this long was interrupted, not left running. */
const STALE_AFTER_MS = 5 * 60_000;

/**
 * Offers back a hike whose recording was cut short — the battery died, the OS
 * reclaimed the tab, the app was swiped away. The track was being written to
 * storage as it happened, so it is still here; without this it would sit there
 * unseen and the walker would assume the walk was lost.
 */
export function UnfinishedHikeBanner({ accent = '#22c55e' }: { accent?: string }) {
  const { t } = useLangStore();
  const [session, setSession] = React.useState<LiveSession | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [done, setDone] = React.useState<null | 'saved'>(null);

  React.useEffect(() => {
    const found = readLiveSession();
    if (!found || found.points.length < 2) return;
    // A session touched seconds ago belongs to a recording still in progress
    // in this very app; only an abandoned one is offered back.
    if (Date.now() - new Date(found.updatedAt).getTime() < STALE_AFTER_MS) return;
    setSession(found);
  }, []);

  const save = React.useCallback(async () => {
    if (!session) return;
    setBusy(true);
    try {
      await recordTrack({
        trailId: session.trailId ?? FREE_TRACK_ID,
        points: session.points,
        distanceKm: liveDistanceKm(session.points),
        durationS: liveDurationS(session.points),
        startedAt: session.startedAt,
      });
      clearLiveSession();
      setDone('saved');
      setTimeout(() => setSession(null), 2600);
    } finally {
      setBusy(false);
    }
  }, [session]);

  const discard = React.useCallback(() => {
    clearLiveSession();
    setSession(null);
  }, []);

  if (!session) return null;

  const km = liveDistanceKm(session.points);
  const mins = Math.round(liveDurationS(session.points) / 60);
  const when = new Date(session.startedAt);
  const stamp = `${String(when.getDate()).padStart(2, '0')}/${String(when.getMonth() + 1).padStart(2, '0')} ${String(when.getHours()).padStart(2, '0')}:${String(when.getMinutes()).padStart(2, '0')}`;

  return (
    <View style={s.wrap} pointerEvents="box-none">
      <View style={s.card}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name={done ? 'checkmark-circle' : 'alert-circle-outline'} size={18} color={accent} />
          <Text style={s.title}>
            {done
              ? t('Caminata recuperada', 'Hike recovered')
              : t('Quedó una caminata sin cerrar', 'A hike was left unfinished')}
          </Text>
        </View>

        <Text style={s.body}>
          {done
            ? t('Ya está guardada. Si no había señal, se sube sola cuando vuelva.', 'It is saved. With no signal it uploads itself once one returns.')
            : `${session.trailName ?? t('Recorrido libre', 'Free track')} · ${stamp} · ${
                km >= 1 ? `${km.toFixed(2)} km` : `${Math.round(km * 1000)} m`
              } · ${mins} min`}
        </Text>

        {!done && (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={save}
              disabled={busy}
              activeOpacity={0.85}
              style={[s.primary, { backgroundColor: accent, opacity: busy ? 0.6 : 1 }]}
            >
              <Text style={s.primaryTxt}>{busy ? t('Guardando…', 'Saving…') : t('Guardarla', 'Save it')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={discard} disabled={busy} activeOpacity={0.85} style={s.secondary}>
              <Text style={s.secondaryTxt}>{t('Descartar', 'Discard')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
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

export default UnfinishedHikeBanner;
