import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { isSupabaseConfigured } from '../../services/supabase';
import { recordTrack } from '../../services/trackSync';
import type { MapLibreEsriHandle } from '../map/MapLibreEsri.native';

// Platform-specific flat map — both platforms use MapLibreEsri
const HikeMap = Platform.OS === 'web'
  ? require('../map/MapLibreEsri.web').MapLibreEsri
  : require('../map/MapLibreEsri.native').MapLibreEsri;

export interface HikeColors {
  bg: string; surface: string; border: string; text: string; muted: string; accent: string;
}

export interface HikeTrail {
  id: string;
  name: string;
  coordinates?: { lat: number; lon: number };
  gpxTrack?: Array<{ lat: number; lon: number }>;
}

/** Hikes recorded without picking a trail are filed under this id. */
export const FREE_TRACK_ID = 'recorrido-libre';

function formatElapsed(ms: number): string {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

/** Android needs the runtime location grant before the WebView can get a fix. */
async function requestLocationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

interface HikeModeProps {
  visible: boolean;
  onClose: () => void;
  colors: HikeColors;
  t: (es: string, en: string) => string;
  /** Omit to record a free track that is not tied to any trail. */
  trail?: HikeTrail;
}

export function HikeMode({ visible, trail, onClose, colors: C, t }: HikeModeProps) {
  const [elapsed, setElapsed] = useState(0);
  const [userPos, setUserPos] = useState<{ lat: number; lon: number } | null>(null);
  const [posHistory, setPosHistory] = useState<Array<{ lat: number; lon: number; t: number }>>([]);
  const [stopping, setStopping] = useState(false);
  const [satelliteView, setSatelliteView] = useState(false);
  const [gpsDenied, setGpsDenied] = useState(false);
  const startRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const mapRef = useRef<MapLibreEsriHandle>(null);

  // The trail's own line, so the walker can compare it against where they are.
  const routePoints = React.useMemo(() => {
    const track = trail?.gpxTrack;
    return track && track.length >= 2 ? track.map((p) => ({ lat: p.lat, lon: p.lon })) : undefined;
  }, [trail]);

  const updatePosition = useCallback((lat: number, lon: number) => {
    setGpsDenied(false); // a fix arrived, so clear any earlier GPS warning
    setUserPos({ lat, lon });
    setPosHistory((prev) => [...prev, { lat, lon, t: Date.now() }]);
  }, []);

  useEffect(() => {
    if (!visible) return;
    startRef.current = Date.now();
    setElapsed(0);
    setUserPos(null);
    setPosHistory([]);
    setGpsDenied(false);

    timerRef.current = setInterval(() => {
      setElapsed(Date.now() - startRef.current);
    }, 1000);

    let cancelled = false;
    let retryId: ReturnType<typeof setTimeout> | null = null;

    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => updatePosition(pos.coords.latitude, pos.coords.longitude),
          () => setGpsDenied(true),
          { enableHighAccuracy: true, maximumAge: 3000, timeout: 20000 },
        );
      } else {
        setGpsDenied(true);
      }
    } else {
      // Android WebView geolocation stays silent unless the app itself holds
      // the runtime permission, so ask before handing tracking to the map.
      requestLocationPermission().then((granted) => {
        if (cancelled) return;
        if (!granted) { setGpsDenied(true); return; }
        (mapRef.current as any)?.startHikeTracking?.();
        // The WebView may still be loading; the second call is a no-op once
        // tracking is already running.
        retryId = setTimeout(() => {
          if (!cancelled) (mapRef.current as any)?.startHikeTracking?.();
        }, 1500);
      });
    }

    return () => {
      cancelled = true;
      if (retryId) clearTimeout(retryId);
      if (timerRef.current) clearInterval(timerRef.current);
      if (Platform.OS === 'web' && watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      } else {
        (mapRef.current as any)?.stopHikeTracking?.();
      }
    };
  }, [visible, updatePosition]);

  const distanceCovered = posHistory.length >= 2
    ? posHistory.reduce((sum, p, i) => i === 0 ? 0 : sum + haversineKm(posHistory[i - 1], p), 0)
    : 0;

  // Recording is mandatory for signed-in users — never behind a toggle. When
  // there's no session or no connection the hike is queued locally and pushed
  // to the account later, so it still reaches the user's other devices.
  const handleStop = useCallback(async () => {
    if (posHistory.length >= 2 && isSupabaseConfigured()) {
      setStopping(true);
      try {
        await recordTrack({
          trailId: trail?.id ?? FREE_TRACK_ID,
          points: posHistory,
          distanceKm: distanceCovered,
          durationS: Math.round(elapsed / 1000),
          startedAt: new Date(startRef.current).toISOString(),
        });
      } catch {
        // best-effort — never block the user from stopping their hike
      } finally {
        setStopping(false);
      }
    }
    onClose();
  }, [posHistory, distanceCovered, elapsed, trail, onClose]);

  const mapCenter: [number, number] | undefined = trail?.coordinates
    ? [trail.coordinates.lat, trail.coordinates.lon]
    : userPos ? [userPos.lat, userPos.lon] : undefined;

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <SafeAreaView style={[hikeS.root, { backgroundColor: C.bg }]}>
        {/* Header */}
        <View style={[hikeS.header, { borderBottomColor: C.border }]}>
          <View style={hikeS.headerLeft}>
            <View style={hikeS.activeDot} />
            <Text style={[hikeS.headerTitle, { color: C.accent }]}>
              {t('CAMINATA ACTIVA', 'ACTIVE HIKE')}
            </Text>
          </View>
          <TouchableOpacity
            style={[hikeS.stopBtn, { borderColor: '#ef4444', opacity: stopping ? 0.6 : 1 }]}
            onPress={handleStop}
            disabled={stopping}
            activeOpacity={0.8}
          >
            <Ionicons name="stop-circle-outline" size={16} color="#ef4444" />
            <Text style={hikeS.stopBtnText}>
              {stopping ? t('Guardando…', 'Saving…') : t('Detener', 'Stop')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Map */}
        <View style={{ flex: 1 }}>
          <HikeMap
            ref={mapRef}
            center={mapCenter}
            zoom={13}
            height="100%"
            layer={satelliteView ? 'esri-satellite' : 'esri-topo'}
            showPolyline={false}
            showHikingRoute={false}
            userPosition={userPos}
            routePoints={routePoints}
            trackPoints={posHistory}
            onLocationUpdate={updatePosition}
            onLocationError={() => setGpsDenied(true)}
          />
          <TouchableOpacity
            onPress={() => setSatelliteView((v) => !v)}
            activeOpacity={0.85}
            style={{
              position: 'absolute',
              top: 14,
              right: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: 'rgba(15,23,42,0.85)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.2)',
              borderRadius: 20,
              paddingVertical: 8,
              paddingHorizontal: 14,
            }}
          >
            <Ionicons name={satelliteView ? 'map-outline' : 'globe-outline'} size={16} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 12.5, fontWeight: '700' }}>
              {satelliteView ? t('Mapa', 'Map') : t('Satélite', 'Satellite')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Map legend — which line is the trail and which one is yours */}
        <View style={[hikeS.legend, { backgroundColor: C.surface, borderTopColor: C.border }]}>
          <View style={hikeS.legendItem}>
            <View style={[hikeS.legendLine, { backgroundColor: '#3b82f6' }]} />
            <Text style={[hikeS.legendText, { color: C.text }]}>
              {t('Tu recorrido', 'Your track')}
            </Text>
          </View>
          {!!routePoints && (
            <View style={hikeS.legendItem}>
              <View style={[hikeS.legendLine, { backgroundColor: '#22c55e' }]} />
              <Text style={[hikeS.legendText, { color: C.muted }]}>
                {t('Ruta sugerida', 'Suggested route')}
              </Text>
            </View>
          )}
        </View>

        {gpsDenied && (
          <View style={[hikeS.gpsWarn, { borderTopColor: C.border }]}>
            <Ionicons name="warning-outline" size={14} color="#f59e0b" />
            <Text style={[hikeS.gpsWarnText, { color: C.text }]}>
              {t(
                'Sin acceso al GPS. Activá la ubicación y volvé a iniciar la caminata para grabar tu recorrido.',
                'No GPS access. Turn on location and restart the hike to record your track.',
              )}
            </Text>
          </View>
        )}

        {/* Stats HUD */}
        <View style={[hikeS.hud, { backgroundColor: C.surface, borderTopColor: C.border }]}>
          <HikeStat
            icon="time-outline"
            label={t('Tiempo', 'Time')}
            value={formatElapsed(elapsed)}
            accent={C.accent}
            text={C.text}
            muted={C.muted}
          />
          <View style={[hikeS.hudDivider, { backgroundColor: C.border }]} />
          <HikeStat
            icon="walk-outline"
            label={t('Distancia', 'Distance')}
            value={distanceCovered >= 1
              ? `${distanceCovered.toFixed(2)} km`
              : `${Math.round(distanceCovered * 1000)} m`}
            accent={C.accent}
            text={C.text}
            muted={C.muted}
          />
          <View style={[hikeS.hudDivider, { backgroundColor: C.border }]} />
          <HikeStat
            icon="location-outline"
            label={t('GPS', 'GPS')}
            value={userPos ? t('Activo', 'Active') : t('Buscando…', 'Searching…')}
            accent={userPos ? C.accent : C.muted}
            text={C.text}
            muted={C.muted}
          />
        </View>

        {/* Trail name footer */}
        <View style={[hikeS.footer, { backgroundColor: C.bg }]}>
          <Ionicons name="map-outline" size={13} color={C.muted} />
          <Text style={[hikeS.footerText, { color: C.muted }]} numberOfLines={1}>
            {trail?.name ?? t('Recorrido libre — sin sendero', 'Free track — no trail')}
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function HikeStat({
  icon, label, value, accent, text, muted,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  accent: string;
  text: string;
  muted: string;
}) {
  return (
    <View style={hikeS.statItem}>
      <Ionicons name={icon} size={18} color={accent} />
      <Text style={[hikeS.statValue, { color: text }]}>{value}</Text>
      <Text style={[hikeS.statLabel, { color: muted }]}>{label}</Text>
    </View>
  );
}

const hikeS = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  activeDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e',
  },
  headerTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },
  stopBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: 'rgba(239,68,68,0.1)',
  },
  stopBtnText: { fontSize: 13, fontWeight: '700', color: '#ef4444' },
  hud: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  hudDivider: { width: 1, height: 40, marginHorizontal: 4 },
  legend: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: 1,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendLine: { width: 18, height: 3, borderRadius: 2 },
  legendText: { fontSize: 11.5, fontWeight: '600' },
  gpsWarn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1,
    backgroundColor: 'rgba(245,158,11,0.12)',
  },
  gpsWarnText: { fontSize: 11.5, flex: 1, lineHeight: 16 },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 17, fontWeight: '800', letterSpacing: -0.5 },
  statLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
  footer: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  footerText: { fontSize: 12, flex: 1 },
});

export default HikeMode;
