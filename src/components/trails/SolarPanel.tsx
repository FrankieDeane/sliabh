import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { solarDay, sunPosition, type SolarDay, type SolarEvent } from '../../utils/solar';
import { toUtm, toDms } from '../../utils/utm';
import {
  zoneForProvince,
  utcOffsetMinutes,
  formatUtcOffset,
  zoneAbbreviation,
  formatLocalTime,
  localCalendarDate,
} from '../../utils/timezone';
import { useLangStore } from '../../store/langStore';

interface Colors {
  surface: string; elevated: string; border: string; text: string; muted: string; accent: string;
}

export interface SolarTrail {
  name: string;
  province?: string;
  coordinates: { lat: number; lon: number };
  gpxTrack?: Array<{ lat: number; lon: number; ele?: number }>;
  max_altitude_m?: number;
}

const MONTHS_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS_ES = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** Trailhead elevation — the observer's height, not the summit's. */
function trailheadElevation(trail: SolarTrail): number | undefined {
  const first = trail.gpxTrack?.[0];
  return typeof first?.ele === 'number' ? first.ele : undefined;
}

/**
 * Sun times, position and coordinates for a trail, computed on the device
 * from its own latitude and longitude — no API, so it keeps working with the
 * map downloaded and the phone in airplane mode.
 */
export function SolarPanel({ trail, colors }: { trail: SolarTrail; colors: Colors }) {
  const { t, lang } = useLangStore();
  const [glossaryOpen, setGlossaryOpen] = React.useState(false);
  const [now, setNow] = React.useState(() => new Date());

  const zone = zoneForProvince(trail.province);
  const offset = React.useMemo(() => utcOffsetMinutes(zone, now), [zone, now]);
  const today = React.useMemo(() => localCalendarDate(now, offset), [now, offset]);

  const [date, setDate] = React.useState(() => localCalendarDate(new Date(), utcOffsetMinutes(zone)));

  // The live altitude readout would freeze on the minute the screen opened.
  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const elevation = trailheadElevation(trail);

  const day: SolarDay = React.useMemo(
    () =>
      solarDay({
        lat: trail.coordinates.lat,
        lon: trail.coordinates.lon,
        year: date.year,
        month: date.month,
        day: date.day,
        utcOffsetMinutes: offset,
        elevationM: elevation,
      }),
    [trail.coordinates.lat, trail.coordinates.lon, date, offset, elevation],
  );

  const utm = React.useMemo(
    () => toUtm(trail.coordinates.lat, trail.coordinates.lon),
    [trail.coordinates.lat, trail.coordinates.lon],
  );

  const isToday = date.year === today.year && date.month === today.month && date.day === today.day;
  const livePosition = React.useMemo(
    () => (isToday ? sunPosition(now, trail.coordinates.lat, trail.coordinates.lon) : null),
    [isToday, now, trail.coordinates.lat, trail.coordinates.lon],
  );

  function shiftDay(delta: number) {
    const base = Date.UTC(date.year, date.month - 1, date.day) + delta * 86_400_000;
    const d = new Date(base);
    setDate({ year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() });
  }

  const months = lang === 'en' ? MONTHS_EN : MONTHS_ES;
  const weekdays = lang === 'en' ? WEEKDAYS_EN : WEEKDAYS_ES;
  const weekday = weekdays[new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay()];
  const dateLabel = `${weekday} ${date.day} ${months[date.month - 1]} ${date.year}`;

  const abbr = zoneAbbreviation(zone);
  const offsetLabel = formatUtcOffset(offset);

  function eventTime(event: SolarEvent): string {
    if (event.at) return formatLocalTime(event.at, offset);
    return event.missing === 'always-above'
      ? t('no ocurre', 'does not occur')
      : t('no ocurre', 'does not occur');
  }

  function eventNote(event: SolarEvent, kind: 'dark' | 'light'): string | null {
    if (event.at) return null;
    if (event.missing === 'always-above') {
      return kind === 'dark'
        ? t('el sol no baja tanto', 'the Sun never sinks that low')
        : t('el sol no se pone', 'the Sun never sets');
    }
    return kind === 'dark'
      ? t('el sol no sube tanto', 'the Sun never climbs that high')
      : t('el sol no sale', 'the Sun never rises');
  }

  const rows: Array<{ key: string; label: string; event?: SolarEvent; time?: string; kind: 'dark' | 'light'; strong?: boolean }> = [
    { key: 'astroDawn', label: t('Amanecer astronómico', 'Astronomical dawn'), event: day.astronomicalDawn, kind: 'dark' },
    { key: 'nautDawn', label: t('Amanecer náutico', 'Nautical dawn'), event: day.nauticalDawn, kind: 'dark' },
    { key: 'civilDawn', label: t('Amanecer civil', 'Civil dawn'), event: day.civilDawn, kind: 'dark' },
    { key: 'sunrise', label: t('Salida del sol', 'Sunrise'), event: day.sunrise, kind: 'light', strong: true },
    { key: 'noon', label: t('Mediodía solar', 'Solar noon'), time: formatLocalTime(day.solarNoon, offset), kind: 'light', strong: true },
    { key: 'sunset', label: t('Puesta del sol', 'Sunset'), event: day.sunset, kind: 'light', strong: true },
    { key: 'civilDusk', label: t('Ocaso civil', 'Civil dusk'), event: day.civilDusk, kind: 'dark' },
    { key: 'nautDusk', label: t('Ocaso náutico', 'Nautical dusk'), event: day.nauticalDusk, kind: 'dark' },
    { key: 'astroDusk', label: t('Ocaso astronómico', 'Astronomical dusk'), event: day.astronomicalDusk, kind: 'dark' },
  ];

  const daylight =
    day.daylightMinutes !== null
      ? `${Math.floor(day.daylightMinutes / 60)} h ${Math.round(day.daylightMinutes % 60)} min`
      : day.polar === 'midnight-sun'
        ? t('24 h — sol de medianoche', '24 h — midnight sun')
        : t('0 h — noche polar', '0 h — polar night');

  return (
    <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={s.headerRow}>
        <Ionicons name="sunny-outline" size={16} color={colors.accent} />
        <Text style={[s.title, { color: colors.text }]}>
          {t('Sol y coordenadas', 'Sun and coordinates')}
        </Text>
        <View style={[s.offlinePill, { borderColor: colors.border }]}>
          <Ionicons name="cloud-offline-outline" size={11} color={colors.muted} />
          <Text style={[s.offlineTxt, { color: colors.muted }]}>{t('offline', 'offline')}</Text>
        </View>
      </View>

      {/* Date navigation */}
      <View style={[s.dateBar, { borderColor: colors.border, backgroundColor: colors.elevated }]}>
        <TouchableOpacity
          onPress={() => shiftDay(-1)}
          style={s.dateBtn}
          accessibilityRole="button"
          accessibilityLabel={t('Día anterior', 'Previous day')}
        >
          <Ionicons name="chevron-back" size={18} color={colors.accent} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[s.dateTxt, { color: colors.text }]}>{dateLabel}</Text>
          {!isToday && (
            <TouchableOpacity onPress={() => setDate(today)}>
              <Text style={[s.todayLink, { color: colors.accent }]}>{t('Volver a hoy', 'Back to today')}</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          onPress={() => shiftDay(1)}
          style={s.dateBtn}
          accessibilityRole="button"
          accessibilityLabel={t('Día siguiente', 'Next day')}
        >
          <Ionicons name="chevron-forward" size={18} color={colors.accent} />
        </TouchableOpacity>
      </View>

      <Text style={[s.localNote, { color: colors.muted }]}>
        {t(
          `Todas las horas en hora local ${abbr} (${offsetLabel}) · ${zone}`,
          `All times in local time ${abbr} (${offsetLabel}) · ${zone}`,
        )}
      </Text>

      {/* Sun events */}
      <View style={{ gap: 2 }}>
        {rows.map((row) => {
          const value = row.time ?? (row.event ? eventTime(row.event) : '');
          const note = row.event ? eventNote(row.event, row.kind) : null;
          return (
            <View key={row.key} style={s.row}>
              <View style={[s.dot, { backgroundColor: row.kind === 'light' ? colors.accent : colors.muted }]} />
              <Text style={[s.rowLabel, { color: row.strong ? colors.text : colors.muted }]} numberOfLines={1}>
                {row.label}
              </Text>
              <Text
                style={[
                  s.rowValue,
                  { color: note ? colors.muted : colors.text, fontWeight: row.strong ? '800' : '600' },
                ]}
              >
                {value}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Any event that simply does not happen on this date gets a sentence. */}
      {rows.some((r) => r.event && !r.event.at) && (
        <View style={[s.notice, { borderColor: colors.border, backgroundColor: colors.elevated }]}>
          <Ionicons name="information-circle-outline" size={14} color={colors.accent} />
          <Text style={[s.noticeTxt, { color: colors.text }]}>
            {rows
              .filter((r) => r.event && !r.event.at)
              .map((r) => `${r.label}: ${eventNote(r.event!, r.kind)}`)
              .join(' · ')}
          </Text>
        </View>
      )}

      <View style={[s.divider, { backgroundColor: colors.border }]} />

      <Fact label={t('Duración del día', 'Daylight duration')} value={daylight} colors={colors} />
      <Fact
        label={t('Altura solar máxima', 'Maximum solar altitude')}
        value={`${day.noonAltitude.toFixed(1)}° ${t('sobre el horizonte', 'above the horizon')}`}
        colors={colors}
      />
      {livePosition && (
        <Fact
          label={t('Altura solar ahora', 'Solar altitude now')}
          value={`${livePosition.altitude.toFixed(1)}° · ${t('azimut', 'azimuth')} ${livePosition.azimuth.toFixed(0)}°`}
          colors={colors}
        />
      )}

      <View style={[s.divider, { backgroundColor: colors.border }]} />

      <Fact
        label={t('Latitud', 'Latitude')}
        value={`${trail.coordinates.lat.toFixed(5)}°  ·  ${toDms(trail.coordinates.lat, 'lat')}`}
        colors={colors}
      />
      <Fact
        label={t('Longitud', 'Longitude')}
        value={`${trail.coordinates.lon.toFixed(5)}°  ·  ${toDms(trail.coordinates.lon, 'lon')}`}
        colors={colors}
      />
      {elevation !== undefined && (
        <Fact
          label={t('Elevación (cabecera)', 'Elevation (trailhead)')}
          value={`${Math.round(elevation)} m`}
          colors={colors}
        />
      )}
      <Fact
        label={t('UTM (WGS-84)', 'UTM (WGS-84)')}
        value={`${utm.zone}${utm.band} ${utm.hemisphere}  ·  E ${utm.easting}  N ${utm.northing}`}
        colors={colors}
      />
      <Fact
        label={t('Zona horaria', 'Time zone')}
        value={`${zone}  ·  ${abbr} ${offsetLabel}`}
        colors={colors}
      />

      <Text style={[s.footnote, { color: colors.muted }]}>
        {t(
          `Calculado en el dispositivo con las coordenadas exactas del sendero (algoritmo NOAA/Meeus), para horizonte despejado${
            elevation !== undefined ? ' y con la depresión del horizonte por altura' : ''
          }. Un cordón al este puede retrasar la salida real del sol varios minutos.`,
          `Computed on the device from the trail's own coordinates (NOAA/Meeus algorithm), for a flat, unobstructed horizon${
            elevation !== undefined ? ', with the horizon dip for elevation applied' : ''
          }. A ridge to the east can delay the visible sunrise by several minutes.`,
        )}
      </Text>

      {/* Glossary */}
      <TouchableOpacity
        onPress={() => setGlossaryOpen((v) => !v)}
        activeOpacity={0.8}
        style={[s.glossaryBtn, { borderColor: colors.border }]}
      >
        <Ionicons name="book-outline" size={14} color={colors.accent} />
        <Text style={[s.glossaryBtnTxt, { color: colors.text }]}>
          {t('Glosario ES/EN', 'Glossary ES/EN')}
        </Text>
        <Ionicons name={glossaryOpen ? 'chevron-up' : 'chevron-down'} size={14} color={colors.muted} />
      </TouchableOpacity>

      {glossaryOpen && (
        <View style={{ gap: 10, marginTop: 4 }}>
          {GLOSSARY.map((entry) => (
            <View key={entry.es}>
              <Text style={[s.glossaryTerm, { color: colors.text }]}>
                {entry.es} <Text style={{ color: colors.muted }}>· {entry.en}</Text>
              </Text>
              <Text style={[s.glossaryDef, { color: colors.muted }]}>
                {lang === 'en' ? entry.defEn : entry.defEs}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function Fact({ label, value, colors }: { label: string; value: string; colors: Colors }) {
  return (
    <View style={s.factRow}>
      <Text style={[s.factLabel, { color: colors.muted }]}>{label}</Text>
      <Text style={[s.factValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const GLOSSARY: Array<{ es: string; en: string; defEs: string; defEn: string }> = [
  {
    es: 'Amanecer astronómico', en: 'Astronomical dawn',
    defEs: 'El sol está 18° bajo el horizonte. Termina la noche cerrada: desde acá el cielo empieza a clarear y se pierden las estrellas más débiles.',
    defEn: 'The Sun is 18° below the horizon. True night ends: the sky starts to brighten and the faintest stars fade.',
  },
  {
    es: 'Amanecer náutico', en: 'Nautical dawn',
    defEs: 'El sol está 12° bajo el horizonte. Ya se distingue la línea del horizonte, que es lo que necesitaba un navegante para medir con sextante.',
    defEn: 'The Sun is 12° below the horizon. The horizon line becomes visible — what a navigator needed to take a sextant sight.',
  },
  {
    es: 'Amanecer civil', en: 'Civil dawn',
    defEs: 'El sol está 6° bajo el horizonte. Alcanza la luz para caminar y leer un mapa sin linterna.',
    defEn: 'The Sun is 6° below the horizon. There is enough light to walk and read a map without a headlamp.',
  },
  {
    es: 'Salida del sol', en: 'Sunrise',
    defEs: 'El borde superior del sol asoma sobre el horizonte. Incluye la refracción de la atmósfera, que lo hace visible un par de minutos antes de que esté geométricamente arriba.',
    defEn: "The Sun's upper limb appears over the horizon. Includes atmospheric refraction, which makes it visible a couple of minutes before it is geometrically up.",
  },
  {
    es: 'Mediodía solar', en: 'Solar noon',
    defEs: 'El sol cruza el meridiano del lugar: su punto más alto del día. Rara vez coincide con las 12:00 del reloj.',
    defEn: 'The Sun crosses the local meridian — its highest point of the day. It rarely falls at 12:00 on the clock.',
  },
  {
    es: 'Puesta del sol', en: 'Sunset',
    defEs: 'El borde superior del sol desaparece bajo el horizonte.',
    defEn: "The Sun's upper limb disappears below the horizon.",
  },
  {
    es: 'Ocaso civil / náutico / astronómico', en: 'Civil / nautical / astronomical dusk',
    defEs: 'Los mismos umbrales (6°, 12° y 18°) pero de tarde. Con el ocaso astronómico empieza la noche cerrada.',
    defEn: 'The same thresholds (6°, 12°, 18°) in the evening. Astronomical dusk is when true night begins.',
  },
  {
    es: 'Duración del día', en: 'Daylight duration',
    defEs: 'Tiempo entre la salida y la puesta del sol. No incluye los crepúsculos, así que la luz útil para caminar es bastante más.',
    defEn: 'Time between sunrise and sunset. It excludes twilight, so usable walking light lasts noticeably longer.',
  },
  {
    es: 'Altura solar', en: 'Solar altitude',
    defEs: 'Ángulo del sol sobre el horizonte. Negativo significa que está abajo. Cuanto más bajo, más larga la sombra y más débil la radiación.',
    defEn: 'Angle of the Sun above the horizon; negative means below it. The lower it is, the longer the shadows and the weaker the radiation.',
  },
  {
    es: 'Azimut', en: 'Azimuth',
    defEs: 'Dirección del sol medida en grados desde el norte, en sentido horario: 90° es este, 180° sur, 270° oeste.',
    defEn: 'Compass direction of the Sun in degrees clockwise from north: 90° east, 180° south, 270° west.',
  },
  {
    es: 'Latitud', en: 'Latitude',
    defEs: 'Distancia angular al ecuador. En Argentina siempre es sur (negativa).',
    defEn: 'Angular distance from the equator. In Argentina it is always south (negative).',
  },
  {
    es: 'Longitud', en: 'Longitude',
    defEs: 'Distancia angular al meridiano de Greenwich. En Argentina siempre es oeste (negativa).',
    defEn: 'Angular distance from the Greenwich meridian. In Argentina it is always west (negative).',
  },
  {
    es: 'UTM', en: 'UTM',
    defEs: 'Coordenadas en metros sobre una cuadrícula plana, divididas en husos de 6°. Es lo que usan las cartas del IGN y la mayoría de los GPS de montaña: más fácil de medir con regla que grados y minutos.',
    defEn: 'Coordinates in metres on a flat grid, split into 6° zones. What IGN topographic sheets and most mountain GPS units use — easier to measure with a ruler than degrees and minutes.',
  },
  {
    es: 'Zona horaria', en: 'Time zone',
    defEs: 'La región que comparte la misma hora oficial. Argentina usa una sola, sin horario de verano desde 2009.',
    defEn: 'The region sharing one official clock time. Argentina uses a single one, with no daylight saving since 2009.',
  },
  {
    es: 'Desfase UTC', en: 'UTC offset',
    defEs: 'Diferencia entre la hora local y la hora universal. Argentina es UTC−03:00: cuando acá son las 06:00, en UTC son las 09:00.',
    defEn: 'Difference between local time and Universal Time. Argentina is UTC−03:00: 06:00 here is 09:00 UTC.',
  },
];

const s = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 16, padding: 16, marginHorizontal: 16, marginBottom: 14, gap: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 14, fontWeight: '800', flex: 1 },
  offlinePill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  offlineTxt: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  dateBar: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingVertical: 6, paddingHorizontal: 4 },
  dateBtn: { padding: 8 },
  dateTxt: { fontSize: 13.5, fontWeight: '700' },
  todayLink: { fontSize: 11, fontWeight: '700', marginTop: 1 },
  localNote: { fontSize: 11, lineHeight: 15 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 3 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  rowLabel: { fontSize: 12.5, flex: 1 },
  rowValue: { fontSize: 13, fontVariant: ['tabular-nums'] },
  notice: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', borderWidth: 1, borderRadius: 12, padding: 10 },
  noticeTxt: { fontSize: 11.5, lineHeight: 16, flex: 1 },
  divider: { height: 1, marginVertical: 4 },
  factRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 3 },
  factLabel: { fontSize: 12, flex: 1 },
  factValue: { fontSize: 12.5, fontWeight: '700', flexShrink: 1, textAlign: 'right' },
  footnote: { fontSize: 10.5, lineHeight: 15, marginTop: 2 },
  glossaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  glossaryBtnTxt: { fontSize: 12.5, fontWeight: '700', flex: 1 },
  glossaryTerm: { fontSize: 12.5, fontWeight: '700' },
  glossaryDef: { fontSize: 11.5, lineHeight: 16, marginTop: 2 },
});

export default SolarPanel;
