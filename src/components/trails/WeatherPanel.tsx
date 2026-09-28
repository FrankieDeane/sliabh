import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLangStore } from '../../store/langStore';
import {
  fetchTrailForecast,
  readCachedForecast,
  isFresh,
  windLevel,
  describeWeather,
  compass,
  type TrailForecast,
  type WindLevel,
} from '../../services/weatherData';

interface Colors {
  surface: string; elevated: string; border: string; text: string; muted: string; accent: string;
}

export interface WeatherTrail {
  coordinates: { lat: number; lon: number };
  gpxTrack?: Array<{ lat: number; lon: number; ele?: number }>;
  max_altitude_m?: number;
}

const WEEKDAYS_ES = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const LEVEL_COLOR: Record<WindLevel, string> = {
  calm: '#22c55e',
  strong: '#eab308',
  dangerous: '#f97316',
  extreme: '#ef4444',
};

/**
 * The point the forecast is asked for: the track's highest recorded point,
 * else the trailhead at the trail's maximum altitude. The summit is where the
 * wind and the cold decide whether the day goes ahead.
 */
function highPoint(trail: WeatherTrail): { lat: number; lon: number; ele?: number } {
  const withEle = (trail.gpxTrack ?? []).filter((p) => typeof p.ele === 'number');
  if (withEle.length) {
    const top = withEle.reduce((a, b) => ((b.ele as number) > (a.ele as number) ? b : a));
    return { lat: top.lat, lon: top.lon, ele: top.ele };
  }
  return { ...trail.coordinates, ele: trail.max_altitude_m };
}

function ago(ms: number, t: (es: string, en: string) => string): string {
  const min = Math.max(0, Math.round(ms / 60000));
  if (min < 1) return t('recién', 'just now');
  if (min < 60) return t(`hace ${min} min`, `${min} min ago`);
  const h = Math.round(min / 60);
  if (h < 48) return t(`hace ${h} h`, `${h} h ago`);
  return t(`hace ${Math.round(h / 24)} días`, `${Math.round(h / 24)} days ago`);
}

/**
 * Wind and weather at the trail's highest point for the next three days
 * (Open-Meteo, no key). The last forecast is kept on the device and shown
 * with its age when there is no signal. Never a substitute for the official
 * forecast or the park rangers — the panel says so.
 */
export function WeatherPanel({ trail, colors }: { trail: WeatherTrail; colors: Colors }) {
  const { t, lang } = useLangStore();
  const point = React.useMemo(() => highPoint(trail), [trail]);
  const [forecast, setForecast] = React.useState<TrailForecast | null>(() =>
    readCachedForecast(point.lat, point.lon),
  );
  const [loading, setLoading] = React.useState(false);
  const [failed, setFailed] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setFailed(false);
    const f = await fetchTrailForecast(point.lat, point.lon, point.ele);
    if (f) setForecast(f);
    else setFailed(true);
    setLoading(false);
  }, [point.lat, point.lon, point.ele]);

  React.useEffect(() => {
    const cached = readCachedForecast(point.lat, point.lon);
    setForecast(cached);
    if (!cached || !isFresh(cached)) load();
  }, [point.lat, point.lon, load]);

  const weekday = (iso: string) => {
    const [y, m, d] = iso.split('-').map(Number);
    const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
    return (lang === 'en' ? WEEKDAYS_EN : WEEKDAYS_ES)[wd];
  };
  const dayLabel = (i: number, iso: string) =>
    i === 0 ? t('Hoy', 'Today') : i === 1 ? t('Mañana', 'Tomorrow') : weekday(iso);

  const levelText = (l: WindLevel) =>
    ({
      calm: t('Viento tranquilo', 'Light wind'),
      strong: t('Viento fuerte en zonas expuestas', 'Strong wind on exposed ground'),
      dangerous: t('Ráfagas peligrosas en crestas y pasos', 'Dangerous gusts on ridges and passes'),
      extreme: t('Ráfagas extremas: evaluá postergar', 'Extreme gusts: consider postponing'),
    })[l];

  const today = forecast?.days[0];
  const todayLevel = today ? windLevel(today.gustMaxKmh) : null;
  const stale = forecast ? !isFresh(forecast) : false;
  const elevation = point.ele ?? forecast?.elevationM ?? null;

  return (
    <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={s.headerRow}>
        <Ionicons name="cloudy-night-outline" size={16} color={colors.accent} />
        <Text style={[s.title, { color: colors.text }]}>{t('Viento y clima', 'Wind & weather')}</Text>
        <TouchableOpacity
          onPress={load}
          disabled={loading}
          style={[s.refreshBtn, { borderColor: colors.border }]}
          accessibilityRole="button"
          accessibilityLabel={t('Actualizar pronóstico', 'Refresh forecast')}
        >
          <Ionicons name="refresh" size={13} color={loading ? colors.muted : colors.accent} />
        </TouchableOpacity>
      </View>

      <Text style={[s.subtitle, { color: colors.muted }]}>
        {elevation
          ? t(
              `Pronóstico en el punto más alto de la ruta (${Math.round(elevation).toLocaleString('es-AR')} m)`,
              `Forecast at the trail's highest point (${Math.round(elevation).toLocaleString('en-US')} m)`,
            )
          : t('Pronóstico en el inicio de la ruta', 'Forecast at the trailhead')}
      </Text>

      {!forecast && (
        <Text style={[s.empty, { color: colors.muted }]}>
          {loading
            ? t('Cargando pronóstico…', 'Loading forecast…')
            : t(
                'No se pudo cargar el pronóstico. Revisá tu conexión y tocá actualizar.',
                'Could not load the forecast. Check your connection and tap refresh.',
              )}
        </Text>
      )}

      {forecast && today && todayLevel && (
        <>
          {/* Today's wind verdict — the line that decides the day */}
          <View style={[s.verdict, { borderColor: LEVEL_COLOR[todayLevel], backgroundColor: colors.elevated }]}>
            <Ionicons
              name={todayLevel === 'calm' ? 'checkmark-circle' : 'warning'}
              size={18}
              color={LEVEL_COLOR[todayLevel]}
            />
            <View style={{ flex: 1 }}>
              <Text style={[s.verdictTitle, { color: colors.text }]}>{levelText(todayLevel)}</Text>
              <Text style={[s.verdictSub, { color: colors.muted }]}>
                {t(
                  `Hoy: ráfagas de hasta ${Math.round(today.gustMaxKmh)} km/h`,
                  `Today: gusts up to ${Math.round(today.gustMaxKmh)} km/h`,
                )}
                {today.windDirDeg !== null
                  ? t(` del ${compass(today.windDirDeg, 'es')}`, ` from the ${compass(today.windDirDeg, 'en')}`)
                  : ''}
              </Text>
            </View>
          </View>

          {/* Three days side by side */}
          <View style={s.daysRow}>
            {forecast.days.map((d, i) => {
              const w = describeWeather(d.weatherCode);
              const lvl = windLevel(d.gustMaxKmh);
              return (
                <View key={d.date} style={[s.day, { borderColor: colors.border, backgroundColor: colors.elevated }]}>
                  <Text style={[s.dayName, { color: colors.text }]}>{dayLabel(i, d.date)}</Text>
                  <Ionicons name={w.icon as any} size={24} color={colors.accent} />
                  <Text style={[s.dayWeather, { color: colors.muted }]} numberOfLines={1}>
                    {lang === 'en' ? w.en : w.es}
                  </Text>
                  <Text style={[s.temps, { color: colors.text }]}>
                    {Math.round(d.tempMaxC)}° <Text style={{ color: colors.muted }}>/ {Math.round(d.tempMinC)}°</Text>
                  </Text>
                  <View style={s.windRow}>
                    <View style={[s.windDot, { backgroundColor: LEVEL_COLOR[lvl] }]} />
                    <Text style={[s.windTxt, { color: colors.text }]}>{Math.round(d.gustMaxKmh)} km/h</Text>
                  </View>
                  {d.precipProbMax !== null && (
                    <Text style={[s.rain, { color: colors.muted }]}>
                      <Ionicons name="water-outline" size={11} color={colors.muted} /> {Math.round(d.precipProbMax)}%
                    </Text>
                  )}
                </View>
              );
            })}
          </View>

          <Text style={[s.legend, { color: colors.muted }]}>
            {t(
              'km/h = ráfaga máxima del día · % = probabilidad de lluvia o nieve',
              'km/h = peak gust of the day · % = chance of rain or snow',
            )}
          </Text>

          <Text style={[s.updated, { color: stale ? '#eab308' : colors.muted }]}>
            {t('Actualizado ', 'Updated ')}
            {ago(Date.now() - forecast.fetchedAt, t)}
            {stale && failed
              ? t(' · sin conexión, mostrando el último guardado', ' · offline, showing the last saved one')
              : ''}
          </Text>
        </>
      )}

      <View style={[s.notice, { borderColor: colors.border, backgroundColor: colors.elevated }]}>
        <Ionicons name="information-circle-outline" size={14} color={colors.accent} />
        <Text style={[s.noticeTxt, { color: colors.muted }]}>
          {t(
            'Pronóstico automático de Open-Meteo. No reemplaza el pronóstico oficial ni las indicaciones de guardaparques: consultalos antes de salir.',
            'Automatic forecast from Open-Meteo. It does not replace the official forecast or park rangers’ advice: check them before you go.',
          )}
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 16, padding: 16, marginHorizontal: 16, marginBottom: 14, gap: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 14, fontWeight: '800', flex: 1 },
  refreshBtn: { borderWidth: 1, borderRadius: 999, padding: 6 },
  subtitle: { fontSize: 11.5, lineHeight: 15, marginTop: -4 },
  empty: { fontSize: 12.5, lineHeight: 17 },
  verdict: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderRadius: 12, padding: 12 },
  verdictTitle: { fontSize: 13.5, fontWeight: '800' },
  verdictSub: { fontSize: 12, marginTop: 2 },
  daysRow: { flexDirection: 'row', gap: 8 },
  day: { flex: 1, alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 4, gap: 3 },
  dayName: { fontSize: 12, fontWeight: '800', textTransform: 'capitalize' },
  dayWeather: { fontSize: 10.5 },
  temps: { fontSize: 13, fontWeight: '800', fontVariant: ['tabular-nums'] },
  windRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  windDot: { width: 7, height: 7, borderRadius: 4 },
  windTxt: { fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },
  rain: { fontSize: 11 },
  legend: { fontSize: 10.5, lineHeight: 14 },
  updated: { fontSize: 11, fontWeight: '600' },
  notice: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', borderWidth: 1, borderRadius: 12, padding: 10 },
  noticeTxt: { fontSize: 11.5, lineHeight: 16, flex: 1 },
});

export default WeatherPanel;
