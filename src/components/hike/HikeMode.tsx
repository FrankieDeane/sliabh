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
import { recordTrack } from '../../services/trackSync';
import { useNetworkStore } from '../../store/networkStore';
import {
  beginLiveSession,
  appendLivePoint,
  clearLiveSession,
  resumeLiveSession,
  type LiveSession,
} from '../../services/liveTrack';
import type { MapLibreEsriHandle } from '../map/MapLibreEsri.native';
import {
  startBackgroundTrack,
  stopBackgroundTrack,
  BACKGROUND_TRACKING_SUPPORTED,
} from '../../services/backgroundTrack';
import { readLiveSession } from '../../services/liveTrack';
import { elevationStats, paceMinPerKm, formatPace, formatGain } from '../../utils/trackStats';
import {
  backgroundCapability,
  captureAdvice,
  captureSetting,
} from '../../services/backgroundCapability';

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

// Opaque on purpose: a translucent amber over whatever sits beneath left light
// text on a light wash, unreadable in daylight.
const WARN_BG = '#fef3c7';
const WARN_TEXT = '#78350f';
const WARN_ICON = '#b45309';

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
  /**
   * A recording read back from storage. Passing it picks that walk up where
   * it stopped — same start time, same points — instead of starting a new one.
   */
  resume?: LiveSession | null;
}

export function HikeMode({ visible, trail, onClose, colors: C, t, resume }: HikeModeProps) {
  const [elapsed, setElapsed] = useState(0);
  const [userPos, setUserPos] = useState<{ lat: number; lon: number } | null>(null);
  const [posHistory, setPosHistory] = useState<Array<{ lat: number; lon: number; t: number }>>([]);
  const [stopping, setStopping] = useState(false);
  const [satelliteView, setSatelliteView] = useState(false);
  const [gpsProblem, setGpsProblem] = useState<null | 'denied' | 'background-denied' | 'searching'>(null);
  const [result, setResult] = useState<null | 'synced' | 'queued' | 'too-short'>(null);
  const [recovered, setRecovered] = useState(false);
  /** How long the app was in the background, when that gap cost us fixes. */
  const [pausedGapMs, setPausedGapMs] = useState<number | null>(null);
  const hiddenAtRef = useRef<number | null>(null);
  const online = useNetworkStore((st) => st.isOnline);
  const startRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const mapRef = useRef<MapLibreEsriHandle>(null);
  const sessionRef = useRef<LiveSession | null>(null);
  const wakeLockRef = useRef<any>(null);
  /**
   * Whether this browser is actually holding the screen awake. Asked for, not
   * assumed: the API can exist and still refuse (low battery, a policy), and a
   * walker told "the screen stays on" when it does not is worse off than one
   * who was told to keep an eye on it.
   */
  const [screenHeld, setScreenHeld] = useState(false);
  // What this exact browser can promise. Fixed for the life of the screen.
  const cap = React.useMemo(() => backgroundCapability(), []);

  // The trail's own line, so the walker can compare it against where they are.
  const routePoints = React.useMemo(() => {
    const track = trail?.gpxTrack;
    return track && track.length >= 2 ? track.map((p) => ({ lat: p.lat, lon: p.lon })) : undefined;
  }, [trail]);

  const updatePosition = useCallback((lat: number, lon: number, alt?: number | null) => {
    setGpsProblem(null); // a fix arrived, so clear any earlier GPS warning
    setUserPos({ lat, lon });
    const session = sessionRef.current;
    if (!session) return;
    // Persist before rendering: what the screen shows is recoverable only
    // because it reached storage first.
    const point =
      typeof alt === 'number' && Number.isFinite(alt)
        ? { lat, lon, t: Date.now(), alt }
        : { lat, lon, t: Date.now() };
    const kept = appendLivePoint(session, point);
    if (kept) setPosHistory([...session.points]);
  }, []);

  useEffect(() => {
    if (!visible) return;
    setGpsProblem(null);
    setResult(null);
    setPausedGapMs(null);
    hiddenAtRef.current = null;

    if (resume) {
      // Continuity, not just recovery: the clock keeps running from the
      // original start and the track already walked is back on the map.
      sessionRef.current = resumeLiveSession(resume);
      startRef.current = new Date(resume.startedAt).getTime();
      setPosHistory([...resume.points]);
      const last = resume.points[resume.points.length - 1];
      setUserPos(last ? { lat: last.lat, lon: last.lon } : null);
      setRecovered(true);
    } else {
      sessionRef.current = beginLiveSession(trail?.id ?? null, trail?.name ?? null);
      startRef.current = Date.now();
      setPosHistory([]);
      setUserPos(null);
      setRecovered(false);
    }
    setElapsed(Date.now() - startRef.current);

    timerRef.current = setInterval(() => {
      setElapsed(Date.now() - startRef.current);
    }, 1000);

    let cancelled = false;
    let mirrorId: ReturnType<typeof setInterval> | null = null;

    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          // Altitude is what makes elevation gain possible, and a hike is
          // defined by its climb more than its length. The device returns null
          // for it on a 2D fix, which the point simply goes without.
          (pos) => updatePosition(pos.coords.latitude, pos.coords.longitude, pos.coords.altitude),
          (err) => {
            // A cold GPS fix under tree cover routinely takes longer than the
            // timeout. Only a denied permission is a dead end; the rest means
            // "still looking", and the watch stays alive either way.
            setGpsProblem(err?.code === 1 ? 'denied' : 'searching');
          },
          { enableHighAccuracy: true, maximumAge: 3000, timeout: 30000 },
        );
        // Without a wake lock the screen sleeps, the page is frozen and the
        // track simply stops — silently, mid-walk.
        (navigator as any).wakeLock?.request?.('screen')
          .then((lock: any) => { wakeLockRef.current = lock; setScreenHeld(true); })
          .catch(() => { setScreenHeld(false); /* unsupported or denied; recording still runs */ });
      } else {
        setGpsProblem('denied');
      }
    } else {
      // Native: a foreground service keeps reading the GPS with the screen
      // off, writing straight to the session on disk. The screen then mirrors
      // that file rather than owning the track itself.
      startBackgroundTrack(trail?.name ?? null).then((res: { started: boolean; reason?: string }) => {
        if (cancelled) return;
        if (!res.started) {
          setGpsProblem(res.reason === 'background-denied' ? 'background-denied' : 'denied');
          return;
        }
        mirrorId = setInterval(() => {
          const stored = readLiveSession();
          if (!stored || !stored.points.length) return;
          setPosHistory([...stored.points]);
          const last = stored.points[stored.points.length - 1];
          setUserPos({ lat: last.lat, lon: last.lon });
          setGpsProblem(null);
        }, 2000);
      });
    }

    const onVisible = () => {
      if (typeof document === 'undefined') return;
      if (document.visibilityState !== 'visible') {
        hiddenAtRef.current = Date.now();
        return;
      }
      // The browser freezes a hidden page, so no fixes arrive while the walker
      // is in another app or the screen is off. Rather than leave a silent
      // hole in the track, measure the gap and say it out loud.
      const hiddenAt = hiddenAtRef.current;
      hiddenAtRef.current = null;
      if (hiddenAt && Date.now() - hiddenAt > 20_000) setPausedGapMs(Date.now() - hiddenAt);
      // A wake lock is released automatically when the page is hidden, so it
      // has to be taken again every time the walker comes back.
      (navigator as any).wakeLock?.request?.('screen')
        .then((lock: any) => { wakeLockRef.current = lock; setScreenHeld(true); })
        .catch(() => { setScreenHeld(false); });
    };
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisible);
    }

    return () => {
      cancelled = true;
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisible);
      }
      if (mirrorId) clearInterval(mirrorId);
      if (timerRef.current) clearInterval(timerRef.current);
      if (Platform.OS === 'web' && watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      } else {
        stopBackgroundTrack().catch(() => {});
      }
      wakeLockRef.current?.release?.().catch?.(() => {});
      wakeLockRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, updatePosition, resume?.id]);

  const distanceCovered = posHistory.length >= 2
    ? posHistory.reduce((sum, p, i) => i === 0 ? 0 : sum + haversineKm(posHistory[i - 1], p), 0)
    : 0;

  // The two numbers a walker actually checks mid-hike, after the clock: how
  // much have I climbed, and am I going to make it back before dark. Both are
  // recomputed from the filtered series rather than accumulated as we go, so a
  // resumed hike shows the same figure as one that never stopped.
  const elevation = React.useMemo(() => elevationStats(posHistory), [posHistory]);
  const pace = paceMinPerKm(distanceCovered, Math.round(elapsed / 1000));

  // Recording is mandatory for signed-in users — never behind a toggle. When
  // there's no session or no connection the hike is queued locally and pushed
  // to the account later, so it still reaches the user's other devices.
  const handleStop = useCallback(async () => {
    if (posHistory.length < 2) {
      clearLiveSession();
      setResult('too-short');
      return;
    }
    setStopping(true);
    try {
      const { saved } = await recordTrack({
        trailId: trail?.id ?? FREE_TRACK_ID,
        points: posHistory,
        distanceKm: distanceCovered,
        durationS: Math.round(elapsed / 1000),
        startedAt: new Date(startRef.current).toISOString(),
      });
      // Say plainly where the hike ended up: in the account, or on this phone
      // waiting for signal. A walker who recorded offline should never have to
      // guess whether the last four hours survived.
      setResult(saved ? 'synced' : 'queued');
    } catch {
      setResult('queued');
    } finally {
      // recordTrack has written the hike to the upload queue, so the in-flight
      // copy has done its job and must not be offered for recovery later.
      clearLiveSession();
      setStopping(false);
    }
  }, [posHistory, distanceCovered, elapsed, trail]);

  const mapCenter: [number, number] | undefined = trail?.coordinates
    ? [trail.coordinates.lat, trail.coordinates.lon]
    : userPos ? [userPos.lat, userPos.lon] : undefined;

  if (result) {
    const copy =
      result === 'synced'
        ? {
            icon: 'cloud-done-outline' as const,
            tone: C.accent,
            title: t('Guardado en tu cuenta', 'Saved to your account'),
            body: t(
              'Ya podés verlo desde cualquier dispositivo donde inicies sesión.',
              'It is now visible on any device you sign in on.',
            ),
          }
        : result === 'queued'
          ? {
              icon: 'save-outline' as const,
              tone: '#f59e0b',
              title: t('Guardado en este dispositivo', 'Saved on this device'),
              body: t(
                'Sin señal o sin sesión iniciada. El recorrido queda acá y se sube solo cuando vuelva la conexión o inicies sesión — no hace falta que hagas nada.',
                'No signal, or not signed in. The track stays here and uploads itself once the connection returns or you sign in — nothing else to do.',
              ),
            }
          : {
              icon: 'alert-circle-outline' as const,
              tone: C.muted,
              title: t('Recorrido demasiado corto', 'Track too short'),
              body: t(
                'No se registraron suficientes posiciones para guardarlo.',
                'Not enough positions were recorded to save it.',
              ),
            };

    return (
      <Modal visible={visible} animationType="slide" statusBarTranslucent>
        <SafeAreaView style={[hikeS.root, { backgroundColor: C.bg }]}>
          <View style={hikeS.resultWrap}>
            <Ionicons name={copy.icon} size={44} color={copy.tone} />
            <Text style={[hikeS.resultTitle, { color: C.text }]}>{copy.title}</Text>
            <Text style={[hikeS.resultBody, { color: C.muted }]}>{copy.body}</Text>
            {result !== 'too-short' && (
              <Text style={[hikeS.resultStats, { color: C.text }]}>
                {distanceCovered >= 1
                  ? `${distanceCovered.toFixed(2)} km`
                  : `${Math.round(distanceCovered * 1000)} m`}
                {'  ·  '}
                {formatElapsed(elapsed)}
              </Text>
            )}
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.85}
              style={[hikeS.resultBtn, { backgroundColor: C.accent }]}
            >
              <Text style={hikeS.resultBtnTxt}>{t('Listo', 'Done')}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

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
            {!online && (
              <View style={[hikeS.offlineChip, { borderColor: C.border }]}>
                <Ionicons name="cloud-offline-outline" size={11} color="#f59e0b" />
                <Text style={hikeS.offlineChipTxt}>{t('sin señal', 'offline')}</Text>
              </View>
            )}
            {recovered && (
              <View style={[hikeS.resumedChip, { borderColor: C.border }]}>
                <Ionicons name="refresh" size={11} color={C.accent} />
                <Text style={[hikeS.resumedChipTxt, { color: C.accent }]}>
                  {t('retomada', 'resumed')}
                </Text>
              </View>
            )}
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
            onLocationError={() => setGpsProblem('searching')}
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

        {gpsProblem && (
          <View style={[hikeS.gpsWarn, { borderTopColor: C.border }]}>
            <Ionicons name="warning-outline" size={14} color={WARN_ICON} />
            <Text style={hikeS.gpsWarnText}>
              {gpsProblem === 'denied'
                ? t(
                    'Sin acceso al GPS. Activá la ubicación y volvé a iniciar la caminata para grabar tu recorrido.',
                    'No GPS access. Turn on location and restart the hike to record your track.',
                  )
                : gpsProblem === 'background-denied'
                ? t(
                    'Falta el permiso de ubicación "Permitir siempre". Sin eso la grabación se corta al apagar la pantalla.',
                    'The "Allow all the time" location permission is missing. Without it recording stops when the screen goes off.',
                  )
                : t(
                    'Buscando señal GPS. Puede tardar un minuto bajo el bosque o entre paredones; seguimos intentando.',
                    'Searching for a GPS fix. Under tree cover or between walls this can take a minute; still trying.',
                  )}
            </Text>
          </View>
        )}

        {pausedGapMs !== null && (
          <View style={[hikeS.gapWarn, { borderTopColor: C.border }]}>
            <Ionicons name="alert-circle" size={15} color={WARN_ICON} />
            <Text style={hikeS.gpsWarnText}>
              {t(
                `Estuviste ${Math.round(pausedGapMs / 60000) || 1} min fuera de la app: en ese rato no se grabó nada. El tramo queda cortado.`,
                `You were away from the app for ${Math.round(pausedGapMs / 60000) || 1} min: nothing was recorded then. That stretch is missing.`,
              )}
            </Text>
            <TouchableOpacity onPress={() => setPausedGapMs(null)} accessibilityLabel={t('Entendido', 'Got it')}>
              <Ionicons name="close" size={15} color={WARN_TEXT} />
            </TouchableOpacity>
          </View>
        )}

        {/*
          What happens if the walker pockets the phone — answered for the
          browser in their hand, not for "browsers" in general. Chrome on
          Android, Safari on an iPhone and the native build each get a
          different sentence, because each can promise something different and
          each needs a different setting changed.
        */}
        <View style={[hikeS.keepOpen, { borderTopColor: C.border, backgroundColor: C.surface }]}>
          <Ionicons
            name={
              BACKGROUND_TRACKING_SUPPORTED
                ? 'shield-checkmark-outline'
                : screenHeld
                  ? 'sunny-outline'
                  : 'phone-portrait-outline'
            }
            size={13}
            color={BACKGROUND_TRACKING_SUPPORTED ? C.accent : C.muted}
          />
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={[hikeS.keepOpenTxt, { color: C.muted }]}>
              {(() => {
                const advice = captureAdvice(cap);
                return t(advice.es, advice.en);
              })()}
            </Text>
            {(() => {
              // Only shown when the walker can actually do something about it,
              // and only while the lever is not already working.
              if (BACKGROUND_TRACKING_SUPPORTED || screenHeld) return null;
              const setting = captureSetting(cap);
              if (!setting) return null;
              return (
                <Text style={[hikeS.keepOpenTxt, { color: C.muted, opacity: 0.85 }]}>
                  {t(setting.es, setting.en)}
                </Text>
              );
            })()}
          </View>
        </View>

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
            icon="trending-up-outline"
            label={t('Desnivel', 'Climb')}
            value={formatGain(elevation)}
            accent={C.accent}
            text={C.text}
            muted={C.muted}
          />
          <View style={[hikeS.hudDivider, { backgroundColor: C.border }]} />
          <HikeStat
            icon="speedometer-outline"
            label={t('Ritmo', 'Pace')}
            value={formatPace(pace)}
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
      {/* One line each: a wrapped value reads as two numbers, and "Desnivel"
          breaking after "Des" is worse than being clipped. */}
      <Text style={[hikeS.statValue, { color: text }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={[hikeS.statLabel, { color: muted }]} numberOfLines={1}>{label}</Text>
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
  // Five figures on a 390 px phone: the type shrinks and the dividers thin
  // out rather than letting "12'30\"" wrap mid-value. Mobile is the case that
  // matters — nobody checks their climb on a laptop halfway up a mountain.
  hud: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  hudDivider: { width: 1, height: 34, marginHorizontal: 1 },
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
    backgroundColor: WARN_BG,
  },
  gpsWarnText: { fontSize: 11.5, flex: 1, lineHeight: 16, color: WARN_TEXT, fontWeight: '600' },
  gapWarn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1,
    backgroundColor: WARN_BG,
  },
  keepOpen: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 7,
    paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: 1,
  },
  keepOpenTxt: { fontSize: 10.5, lineHeight: 14 },
  statItem: { flex: 1, alignItems: 'center', gap: 3, minWidth: 0 },
  statValue: { fontSize: 14.5, fontWeight: '800', letterSpacing: -0.4 },
  statLabel: { fontSize: 8.5, fontWeight: '700', letterSpacing: 0.3, textTransform: 'uppercase' },
  footer: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  footerText: { fontSize: 12, flex: 1 },
  offlineChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2,
    backgroundColor: 'rgba(245,158,11,0.12)',
  },
  offlineChipTxt: { color: '#f59e0b', fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  resumedChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2,
    backgroundColor: 'rgba(34,197,94,0.12)',
  },
  resumedChipTxt: { fontSize: 10, fontWeight: '800', letterSpacing: 0.4 },
  resultWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 32 },
  resultTitle: { fontSize: 18, fontWeight: '800', textAlign: 'center' },
  resultBody: { fontSize: 13, lineHeight: 19, textAlign: 'center' },
  resultStats: { fontSize: 15, fontWeight: '700', letterSpacing: -0.3, marginTop: 4 },
  resultBtn: { borderRadius: 999, paddingHorizontal: 30, paddingVertical: 12, marginTop: 8 },
  resultBtnTxt: { color: '#04210f', fontSize: 14, fontWeight: '800' },
});

export default HikeMode;
