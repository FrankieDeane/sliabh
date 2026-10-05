import React, { useMemo, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Modal, TextInput,
  StyleSheet, Share, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLangStore } from '../../store/langStore';
import {
  routablePlaces, suggestRoute, normalizeForSearch,
  type Place, type RouteResult, type RouteDifficulty,
} from '../../routing';
import { buildGpx } from '../../utils/gpx';
import { getQuickFix } from '../../services/quickFix';

// Phone app only: the web build gets RouteSuggest.web.tsx, which renders nothing.
const TrackMap = require('../map/MapLibreEsri.native').MapLibreEsri;

type Colors = { surface: string; elevated: string; border: string; text: string; muted: string };
type Endpoint = { kind: 'me'; lat: number; lon: number } | ({ kind: 'place' } & Place);

const GREEN = '#22c55e';
const DIFFS: Array<{ id: RouteDifficulty; es: string; en: string }> = [
  { id: 'facil', es: 'Fácil', en: 'Easy' },
  { id: 'moderado', es: 'Moderado', en: 'Moderate' },
  { id: 'dificil', es: 'Difícil', en: 'Hard' },
  { id: 'extremo', es: 'Todas', en: 'All' },
];

/** One position from the phone's GPS. Works with no signal: GPS needs none. */
async function currentPosition(): Promise<{ lat: number; lon: number } | null> {
  const fix = await getQuickFix();
  return fix.ok ? { lat: fix.coords.latitude, lon: fix.coords.longitude } : null;
}

function fmtKm(km: number, lang: 'es' | 'en') {
  const s = km < 10 ? km.toFixed(1) : String(Math.round(km));
  return `${lang === 'es' ? s.replace('.', ',') : s} km`;
}

function fmtHours(h: number) {
  const total = Math.max(5, Math.round((h * 60) / 5) * 5);
  const hh = Math.floor(total / 60);
  const mm = total % 60;
  return hh ? `${hh} h${mm ? ` ${mm} min` : ''}` : `${mm} min`;
}

function PlacePicker({
  visible, onClose, onPick, c,
}: { visible: boolean; onClose: () => void; onPick: (p: Place) => void; c: Colors }) {
  const { t } = useLangStore();
  const [q, setQ] = useState('');
  const all = useMemo(() => (visible ? routablePlaces() : []), [visible]);
  const shown = useMemo(() => {
    const nq = normalizeForSearch(q.trim());
    const hits = nq
      ? all.filter((p) => normalizeForSearch(`${p.name} ${p.trailName}`).includes(nq))
      : all;
    return hits.slice(0, 60);
  }, [q, all]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={ps.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={[ps.sheet, { backgroundColor: c.surface, borderColor: c.border }]}>
          <View style={[ps.handle, { backgroundColor: c.border }]} />
          <Text style={[ps.title, { color: c.text }]}>{t('Elegir un lugar', 'Choose a place')}</Text>
          <View style={[ps.searchWrap, { backgroundColor: c.elevated, borderColor: c.border }]}>
            <Ionicons name="search-outline" size={16} color={c.muted} />
            <TextInput
              testID="place-search"
              value={q}
              onChangeText={setQ}
              placeholder={t('Refugio, laguna, mirador…', 'Refugio, lake, viewpoint…')}
              placeholderTextColor={c.muted}
              autoCorrect={false}
              style={[ps.input, { color: c.text }]}
            />
          </View>
          <ScrollView style={{ maxHeight: 440 }} keyboardShouldPersistTaps="handled">
            {shown.map((p) => (
              <TouchableOpacity
                key={`${p.name}:${p.lat}`}
                testID="place-item"
                style={[ps.item, { borderBottomColor: c.border }]}
                onPress={() => { onPick(p); setQ(''); onClose(); }}
                activeOpacity={0.7}
              >
                <Ionicons name="location-outline" size={16} color={GREEN} />
                <View style={{ flex: 1 }}>
                  <Text style={[ps.itemName, { color: c.text }]} numberOfLines={1}>{p.name}</Text>
                  <Text style={[ps.itemSub, { color: c.muted }]} numberOfLines={1}>{p.trailName}</Text>
                </View>
              </TouchableOpacity>
            ))}
            {shown.length === 0 && (
              <Text style={{ color: c.muted, paddingVertical: 16, textAlign: 'center' }}>
                {t('No hay lugares con ese nombre en los senderos cargados.', 'No place by that name on the loaded trails.')}
              </Text>
            )}
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

/**
 * "Which way do I go?" — a suggested route between two points over the
 * trails the app carries, computed on the phone with no signal. Always shown
 * as a suggestion: the data can be out of date and nobody has walked it for
 * this answer.
 */
export function RouteSuggest({ c }: { c: Colors }) {
  const { t, lang } = useLangStore();
  const [from, setFrom] = useState<Endpoint | null>(null);
  const [to, setTo] = useState<Endpoint | null>(null);
  const [maxDiff, setMaxDiff] = useState<RouteDifficulty>('extremo');
  const [picking, setPicking] = useState<'from' | 'to' | null>(null);
  const [locating, setLocating] = useState(false);
  const [gpsError, setGpsError] = useState(false);
  const [result, setResult] = useState<RouteResult | null>(null);

  const label = (e: Endpoint | null) =>
    !e ? t('Elegir…', 'Choose…') : e.kind === 'me' ? t('Mi ubicación', 'My location') : e.name;

  async function useMyLocation() {
    setLocating(true);
    setGpsError(false);
    const pos = await currentPosition();
    setLocating(false);
    if (pos) { setFrom({ kind: 'me', ...pos }); setResult(null); } else setGpsError(true);
  }

  function run() {
    if (!from || !to) return;
    setResult(suggestRoute(from, to, { maxDifficulty: maxDiff }));
  }

  function exportGpx() {
    if (!result?.ok) return;
    const name = `${t('Sugerencia', 'Suggestion')} — ${label(from)} → ${label(to)}`;
    const desc = t(
      'Ruta sugerida por Sliabh sin conexión. Sin verificar en el terreno.',
      'Route suggested offline by Sliabh. Not verified on the ground.',
    ) + (result.usesOsm ? ' © OpenStreetMap' : '');
    Share.share({ message: buildGpx(name, result.points, desc) }).catch(() => {});
  }

  const failText: Record<string, { es: string; en: string }> = {
    'start-far': {
      es: 'El punto de partida está a más de 2 km de cualquier sendero cargado.',
      en: 'The starting point is more than 2 km from any loaded trail.',
    },
    'end-far': {
      es: 'El destino está a más de 2 km de cualquier sendero cargado.',
      en: 'The destination is more than 2 km from any loaded trail.',
    },
    'no-connection': {
      es: 'No hay conexión por senderos conocidos entre esos dos puntos con la dificultad elegida.',
      en: 'No known trail connects those two points at the chosen difficulty.',
    },
    'same-place': {
      es: 'Partida y destino son el mismo punto del sendero.',
      en: 'Start and destination are the same point on the trail.',
    },
  };

  return (
    <View style={[s.card, { backgroundColor: c.surface, borderColor: c.border }]}>
      <View style={s.headerRow}>
        <Ionicons name="git-branch-outline" size={18} color={GREEN} />
        <Text style={[s.title, { color: c.text }]}>{t('Sugerir por dónde ir', 'Suggest a way')}</Text>
        <View style={[s.offlinePill, { borderColor: c.border }]}>
          <Ionicons name="cloud-offline-outline" size={11} color={c.muted} />
          <Text style={[s.offlineTxt, { color: c.muted }]}>{t('sin señal', 'offline')}</Text>
        </View>
      </View>
      <Text style={[s.sub, { color: c.muted }]}>
        {t(
          'Busca el camino más conveniente por los senderos cargados en la app, directo en el teléfono.',
          'Finds the most convenient way along the trails loaded in the app, right on the phone.',
        )}
      </Text>

      {/* From / To */}
      <View style={s.endRow}>
        <Text style={[s.endLabel, { color: c.muted }]}>{t('Desde', 'From')}</Text>
        <TouchableOpacity
          testID="route-from"
          style={[s.endBtn, { backgroundColor: c.elevated, borderColor: c.border }]}
          onPress={() => setPicking('from')}
        >
          <Text style={[s.endTxt, { color: from ? c.text : c.muted }]} numberOfLines={1}>{label(from)}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          testID="route-gps"
          accessibilityLabel={t('Usar mi ubicación', 'Use my location')}
          style={[s.gpsBtn, { borderColor: c.border }]}
          onPress={useMyLocation}
          disabled={locating}
        >
          {locating
            ? <ActivityIndicator size="small" color={GREEN} />
            : <Ionicons name="locate-outline" size={18} color={GREEN} />}
        </TouchableOpacity>
      </View>
      {gpsError && (
        <Text style={[s.note, { color: '#f59e0b' }]}>
          {t('No se pudo leer el GPS. Revisá el permiso de ubicación o elegí un lugar.', 'Could not read the GPS. Check the location permission or pick a place.')}
        </Text>
      )}
      <View style={s.endRow}>
        <Text style={[s.endLabel, { color: c.muted }]}>{t('Hasta', 'To')}</Text>
        <TouchableOpacity
          testID="route-to"
          style={[s.endBtn, { backgroundColor: c.elevated, borderColor: c.border }]}
          onPress={() => setPicking('to')}
        >
          <Text style={[s.endTxt, { color: to ? c.text : c.muted }]} numberOfLines={1}>{label(to)}</Text>
        </TouchableOpacity>
      </View>

      {/* Difficulty */}
      <Text style={[s.endLabel, { color: c.muted, width: undefined }]}>{t('Dificultad máxima', 'Hardest trail allowed')}</Text>
      <View style={s.chips}>
        {DIFFS.map((d) => {
          const active = d.id === maxDiff;
          return (
            <TouchableOpacity
              key={d.id}
              style={[s.chip, { borderColor: active ? GREEN : c.border, backgroundColor: active ? 'rgba(34,197,94,0.12)' : 'transparent' }]}
              onPress={() => { setMaxDiff(d.id); setResult(null); }}
            >
              <Text style={{ color: active ? GREEN : c.text, fontSize: 12, fontWeight: '700' }}>{d[lang]}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        testID="route-run"
        style={[s.runBtn, (!from || !to) && { opacity: 0.5 }]}
        onPress={run}
        disabled={!from || !to}
        activeOpacity={0.8}
      >
        <Ionicons name="navigate-outline" size={16} color="#fff" />
        <Text style={s.runTxt}>{t('Sugerir ruta', 'Suggest route')}</Text>
      </TouchableOpacity>

      {result && !result.ok && (
        <Text testID="route-fail" style={[s.note, { color: '#f59e0b' }]}>{failText[result.reason][lang]}</Text>
      )}

      {result?.ok && (
        <View testID="route-result" style={{ gap: 10 }}>
          <View style={s.badge}>
            <Ionicons name="alert-circle-outline" size={13} color="#f59e0b" />
            <Text style={s.badgeTxt}>{t('Sugerencia · sin verificar en el terreno', 'Suggestion · not verified on the ground')}</Text>
          </View>

          <View style={[s.stats, { borderColor: c.border }]}>
            <Stat label={t('Distancia', 'Distance')} value={fmtKm(result.km, lang)} c={c} />
            <Stat
              label={t('Desnivel', 'Climb')}
              value={result.ascentM > 0 ? `${result.elevationComplete ? '' : '≥ '}+${result.ascentM} m` : result.elevationComplete ? '0 m' : '—'}
              c={c}
            />
            <Stat label={t('Caminando', 'Walking')} value={`≈ ${fmtHours(result.hours)}`} c={c} />
          </View>

          {result.offTrailStartM > 50 && (
            <Text style={[s.note, { color: c.muted }]}>
              {t(`Primero caminá ${result.offTrailStartM} m fuera de sendero hasta el inicio.`, `First walk ${result.offTrailStartM} m off-trail to reach the trail.`)}
            </Text>
          )}
          {result.legs.map((leg, i) => (
            <View key={i} style={[s.leg, { borderBottomColor: c.border }]}>
              <View style={s.legNum}><Text style={s.legNumTxt}>{i + 1}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={[s.legName, { color: c.text }]}>
                  {leg.link ? t('Tramo de unión entre senderos (sin traza)', 'Link between trails (no recorded line)') : leg.trailName}
                </Text>
                <Text style={[s.legSub, { color: c.muted }]}>
                  {fmtKm(leg.km, lang)}
                  {leg.toName ? ` · ${t('hasta', 'to')} ${leg.toName}` : ''}
                  {leg.osm ? ' · OpenStreetMap' : ''}
                </Text>
              </View>
            </View>
          ))}
          {result.offTrailEndM > 50 && (
            <Text style={[s.note, { color: c.muted }]}>
              {t(`Al final, ${result.offTrailEndM} m fuera de sendero hasta el destino.`, `At the end, ${result.offTrailEndM} m off-trail to the destination.`)}
            </Text>
          )}

          <View style={[s.mapWrap, { borderColor: c.border }]}>
            <TrackMap
              key={`${result.points.length}:${result.points[0].lat}:${result.points[result.points.length - 1].lat}`}
              center={[result.points[0].lat, result.points[0].lon]}
              zoom={13}
              height={240}
              showPolyline={false}
              routePoints={result.points}
              trackPoints={[]}
              fitToTrack
            />
          </View>

          <TouchableOpacity style={s.gpxBtn} onPress={exportGpx} activeOpacity={0.8}>
            <Ionicons name="download-outline" size={16} color={GREEN} />
            <Text style={s.gpxTxt}>{t('Exportar GPX', 'Export GPX')}</Text>
          </TouchableOpacity>

          <Text style={[s.note, { color: c.muted }]}>
            {t(
              'Tiempo calculado como en los carteles de sendero (4 km/h y 300 m/h de subida), sin paradas. Los senderos pueden estar cerrados o haber cambiado: confirmá con guardaparques antes de salir.',
              'Time worked out the way trail signs do (4 km/h and 300 m/h climbing), without stops. Trails may be closed or have changed: check with rangers before you go.',
            )}
          </Text>
          {result.usesOsm && (
            <Text testID="route-osm-credit" style={[s.credit, { color: c.muted }]}>
              {t('Datos de senderos', 'Trail data')} © OpenStreetMap {t('colaboradores', 'contributors')} (ODbL)
            </Text>
          )}
        </View>
      )}

      <PlacePicker
        visible={picking !== null}
        onClose={() => setPicking(null)}
        onPick={(p) => {
          if (picking === 'from') setFrom({ kind: 'place', ...p });
          else setTo({ kind: 'place', ...p });
          setResult(null);
        }}
        c={c}
      />
    </View>
  );
}

function Stat({ label, value, c }: { label: string; value: string; c: Colors }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 2 }}>
      <Text style={{ color: c.text, fontSize: 14, fontWeight: '800' }}>{value}</Text>
      <Text style={{ color: c.muted, fontSize: 10, fontWeight: '600' }}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  card: { marginHorizontal: 16, marginBottom: 12, borderRadius: 20, borderWidth: 1, padding: 16, gap: 10 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 15, fontWeight: '800', letterSpacing: -0.3, flex: 1 },
  offlinePill: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  offlineTxt: { fontSize: 10, fontWeight: '700' },
  sub: { fontSize: 13, lineHeight: 19 },
  endRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  endLabel: { width: 44, fontSize: 12, fontWeight: '700' },
  endBtn: { flex: 1, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10 },
  endTxt: { fontSize: 14 },
  gpsBtn: { width: 42, height: 42, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  runBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#16a34a', borderRadius: 999, paddingVertical: 12 },
  runTxt: { color: '#fff', fontSize: 14, fontWeight: '700' },
  note: { fontSize: 12, lineHeight: 18 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', backgroundColor: 'rgba(245,158,11,0.12)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  badgeTxt: { fontSize: 11, fontWeight: '700', color: '#f59e0b' },
  stats: { flexDirection: 'row', borderWidth: 1, borderRadius: 14, paddingVertical: 12 },
  leg: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1 },
  legNum: { width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(34,197,94,0.15)', alignItems: 'center', justifyContent: 'center' },
  legNumTxt: { fontSize: 12, fontWeight: '800', color: GREEN },
  legName: { fontSize: 13, fontWeight: '700' },
  legSub: { fontSize: 12 },
  mapWrap: { borderWidth: 1, borderRadius: 14, overflow: 'hidden' },
  gpxBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start',
    backgroundColor: 'rgba(34,197,94,0.1)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(34,197,94,0.25)',
    paddingHorizontal: 14, paddingVertical: 10,
  },
  gpxTxt: { fontSize: 13, fontWeight: '700', color: GREEN },
  credit: { fontSize: 11 },
});

const ps = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, padding: 20, paddingBottom: 36 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '800', letterSpacing: -0.4, marginBottom: 14 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 12 },
  input: { flex: 1, fontSize: 14, paddingVertical: 8 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1 },
  itemName: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  itemSub: { fontSize: 12 },
});
