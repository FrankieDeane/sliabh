import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../src/hooks/useTheme';
import { useLangStore } from '../../src/store/langStore';
import { fetchSharedTrack, type SavedTrack } from '../../src/services/supabase';
import { findTrailForHike } from '../../src/data/trailLookup';
import { FREE_TRACK_ID } from '../../src/components/hike/HikeMode';
import { downloadGpx } from '../../src/utils/gpx';
import { SeoHead } from '../../src/components/ui/SeoHead';
import { WebFooter } from '../../src/components/layout/WebFooter';

const TrackMap = Platform.OS === 'web'
  ? require('../../src/components/map/MapLibreEsri.web').MapLibreEsri
  : require('../../src/components/map/MapLibreEsri.native').MapLibreEsri;

import { elevationStats, paceMinPerKm, formatPace, formatGain } from '../../src/utils/trackStats';

function fmtDistance(km: number): string {
  return km >= 1 ? `${km.toFixed(2)} km` : `${Math.round(km * 1000)} m`;
}

function fmtDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h > 0 ? `${h} h ${m} min` : `${m} min`;
}

/**
 * A hike someone made public, opened by its share token. No account needed —
 * the link is meant to be sent to whoever the walker wants, inside the app or
 * anywhere else — and a track switched back to private stops resolving here.
 */
export default function SharedTrackScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { isDark } = useTheme();
  const { t, lang } = useLangStore();
  const router = useRouter();
  const { width } = useWindowDimensions();

  const c = isDark
    ? { bg: '#070b14', surface: '#0f1724', elevated: '#162035', border: '#1e2d42', text: '#f0f9ff', muted: '#64748b', accent: '#22c55e' }
    : { bg: '#f8fafc', surface: '#ffffff', elevated: '#f1f5f9', border: '#e2e8f0', text: '#0f172a', muted: '#64748b', accent: '#16a34a' };

  const [track, setTrack] = React.useState<SavedTrack | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let alive = true;
    fetchSharedTrack(String(token ?? '')).then((found) => {
      if (!alive) return;
      setTrack(found);
      setLoading(false);
    });
    return () => { alive = false; };
  }, [token]);

  const trail = track ? findTrailForHike(track.trail_id) : null;
  const label = track
    ? track.title || (track.trail_id === FREE_TRACK_ID ? t('Recorrido libre', 'Free track') : trail?.name ?? track.trail_id)
    : '';

  const sidePad = Math.max(16, (width - 900) / 2);
  const locale = lang === 'en' ? 'en-GB' : 'es-AR';
  const center: [number, number] | undefined = track?.points?.length
    ? [track.points[0].lat, track.points[0].lon]
    : undefined;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <SeoHead
        title={track ? `${label} — Sliabh` : 'Recorrido — Sliabh'}
        description={
          track
            ? (() => {
                const climb = elevationStats(track.points);
                const base = `Recorrido de ${fmtDistance(track.distance_km)} en ${fmtDuration(track.duration_s)}`;
                return climb
                  ? `${base}, con ${climb.gain} m de desnivel, grabado con GPS en Sliabh.`
                  : `${base}, grabado con GPS en Sliabh.`;
              })()
            : 'Recorrido compartido en Sliabh.'
        }
        path={`/recorrido/${String(token ?? '')}`}
      />
      <ScrollView contentContainerStyle={{ paddingHorizontal: sidePad, paddingBottom: 60 }}>
        {loading && (
          <View style={{ paddingVertical: 60, alignItems: 'center', gap: 10 }}>
            <ActivityIndicator color={c.accent} />
            <Text style={{ color: c.muted, fontSize: 13 }}>{t('Cargando recorrido…', 'Loading hike…')}</Text>
          </View>
        )}

        {!loading && !track && (
          <View style={{ paddingVertical: 60, alignItems: 'center', gap: 12 }}>
            <Ionicons name="lock-closed-outline" size={36} color={c.muted} />
            <Text style={{ color: c.text, fontSize: 17, fontWeight: '800', textAlign: 'center' }}>
              {t('Este recorrido no está disponible', 'This hike is not available')}
            </Text>
            <Text style={{ color: c.muted, fontSize: 13, textAlign: 'center', maxWidth: 380, lineHeight: 19 }}>
              {t(
                'El link puede estar mal, o quien lo grabó lo volvió privado. También puede ser que no tengas conexión: un recorrido compartido se lee del servidor.',
                'The link may be wrong, or whoever recorded it made it private again. You may also be offline: a shared hike is read from the server.',
              )}
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/rutas' as any)}
              activeOpacity={0.85}
              style={{ backgroundColor: c.accent, borderRadius: 999, paddingHorizontal: 20, paddingVertical: 10, marginTop: 4 }}
            >
              <Text style={{ color: '#04210f', fontWeight: '800', fontSize: 13 }}>
                {t('Ver senderos', 'Browse trails')}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {!loading && track && (
          <>
            <View style={{ paddingTop: 24, paddingBottom: 12 }}>
              <Text style={{ color: c.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1.2 }}>
                {t('RECORRIDO COMPARTIDO', 'SHARED HIKE')}
              </Text>
              <Text style={{ color: c.text, fontSize: 28, fontWeight: '900', letterSpacing: -0.8, marginTop: 4 }}>
                {label}
              </Text>
              <Text style={{ color: c.muted, fontSize: 13, marginTop: 4 }}>
                {new Date(track.started_at).toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' })}
                {' · '}
                {new Date(track.started_at).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
              {[
                { icon: 'walk-outline' as const, label: t('Distancia', 'Distance'), value: fmtDistance(track.distance_km) },
                { icon: 'time-outline' as const, label: t('Tiempo', 'Time'), value: fmtDuration(track.duration_s) },
                // Climb comes before the raw point count: it is what a reader
                // wants to know about someone else's walk, and the point count
                // never was.
                { icon: 'trending-up-outline' as const, label: t('Desnivel', 'Climb'), value: formatGain(elevationStats(track.points)) },
                { icon: 'speedometer-outline' as const, label: t('Ritmo', 'Pace'), value: formatPace(paceMinPerKm(track.distance_km, track.duration_s)) },
              ].map((stat) => (
                <View
                  key={stat.label}
                  style={{ flex: 1, minWidth: 100, backgroundColor: c.surface, borderColor: c.border, borderWidth: 1, borderRadius: 14, padding: 12, gap: 4 }}
                >
                  <Ionicons name={stat.icon} size={16} color={c.accent} />
                  <Text style={{ color: c.text, fontSize: 16, fontWeight: '800', letterSpacing: -0.4 }}>{stat.value}</Text>
                  <Text style={{ color: c.muted, fontSize: 10.5, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {stat.label}
                  </Text>
                </View>
              ))}
            </View>

            <View style={{ borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: c.border, marginBottom: 14 }}>
              <TrackMap
                center={center}
                zoom={13}
                height={360}
                layer="esri-topo"
                showPolyline={false}
                showHikingRoute={false}
                trackPoints={track.points}
                routePoints={trail?.gpxTrack}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
              {trail && (
                <TouchableOpacity
                  onPress={() => router.push({ pathname: '/(tabs)/ruta/[id]', params: { id: track.trail_id } } as any)}
                  activeOpacity={0.85}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.accent, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 10 }}
                >
                  <Ionicons name="trail-sign-outline" size={15} color="#04210f" />
                  <Text style={{ color: '#04210f', fontWeight: '800', fontSize: 13 }}>
                    {t('Ver este sendero', 'See this trail')}
                  </Text>
                </TouchableOpacity>
              )}
              {Platform.OS === 'web' && (
                <TouchableOpacity
                  onPress={() => downloadGpx(label, track.points.map((p) => ({ lat: p.lat, lon: p.lon })))}
                  activeOpacity={0.85}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: c.border, borderRadius: 999, paddingHorizontal: 18, paddingVertical: 10 }}
                >
                  <Ionicons name="download-outline" size={15} color={c.text} />
                  <Text style={{ color: c.text, fontWeight: '700', fontSize: 13 }}>{t('Descargar GPX', 'Download GPX')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

        {Platform.OS === 'web' && <WebFooter />}
      </ScrollView>
    </View>
  );
}
