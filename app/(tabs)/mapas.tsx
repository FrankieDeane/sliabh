import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Modal, ScrollView, Linking,
  StyleSheet, Animated, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MapLeaflet } from '../../src/components/map/MapLeaflet';
import { ContributeForm } from '../../src/components/contribute/ContributeForm';
import { ThemeToggle } from '../../src/components/ui/ThemeToggle';
import { OfflineBadge } from '../../src/components/ui/OfflineBadge';
import { WebHeader } from '../../src/components/layout/WebHeader';
import { WebFooter } from '../../src/components/layout/WebFooter';
import { useTheme } from '../../src/hooks/useTheme';
import { useNetwork } from '../../src/hooks/useNetwork';
import { useResponsive } from '../../src/hooks/useResponsive';
import { downloadAreaTiles, isAreaCached, isTileCachingSupported } from '../../src/utils/offlineTiles';

type MapLayer = 'dark' | 'topo' | 'osm';
type DlState = 'idle' | 'downloading' | 'done';

// ─── National parks data ──────────────────────────────────────────────────────

const NATIONAL_PARKS = [
  {
    id: 'glaciares',
    name: 'Los Glaciares',
    province: 'Santa Cruz',
    region: 'Patagonia Sur',
    area_km2: 7269,
    highlights: 'Fitz Roy · Cerro Torre · Glaciar Perito Moreno',
    size: '142 MB',
    url: 'https://www.argentina.gob.ar/parquesnacionales/losglaciares',
    photo: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=75&fit=crop',
    coords: { lat: -49.3, lon: -73.05 },
    unesco: true,
  },
  {
    id: 'nahuel',
    name: 'Nahuel Huapi',
    province: 'Río Negro / Neuquén',
    region: 'Patagonia Norte',
    area_km2: 7050,
    highlights: 'Bariloche · Cerro Tronador · Refugio Frey',
    size: '118 MB',
    url: 'https://www.argentina.gob.ar/parquesnacionales/nahuelhuapi',
    photo: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&q=75&fit=crop',
    coords: { lat: -41.1, lon: -71.5 },
    unesco: false,
  },
  {
    id: 'lanin',
    name: 'Lanín',
    province: 'Neuquén',
    region: 'Patagonia Norte',
    area_km2: 3789,
    highlights: 'Volcán Lanín · Lago Huechulafquen · Araucarias',
    size: '87 MB',
    url: 'https://www.argentina.gob.ar/parquesnacionales/lanin',
    photo: 'https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=600&q=75&fit=crop',
    coords: { lat: -39.6, lon: -71.5 },
    unesco: false,
  },
  {
    id: 'alerces',
    name: 'Los Alerces',
    province: 'Chubut',
    region: 'Patagonia Norte',
    area_km2: 2630,
    highlights: 'Alerces milenarios · Lago Futalaufquen · Río Arrayanes',
    size: '94 MB',
    url: 'https://www.argentina.gob.ar/parquesnacionales/losalerces',
    photo: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&q=75&fit=crop',
    coords: { lat: -42.8, lon: -71.6 },
    unesco: true,
  },
  {
    id: 'tierradelfuego',
    name: 'Tierra del Fuego',
    province: 'Tierra del Fuego',
    region: 'Patagonia Sur',
    area_km2: 630,
    highlights: 'Ushuaia · Canal Beagle · Lapataia · Fin del mundo',
    size: '73 MB',
    url: 'https://www.argentina.gob.ar/parquesnacionales/tierradelfuego',
    photo: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&q=75&fit=crop',
    coords: { lat: -54.8, lon: -68.5 },
    unesco: false,
  },
  {
    id: 'lago-puelo',
    name: 'Lago Puelo',
    province: 'Chubut',
    region: 'Patagonia Norte',
    area_km2: 276,
    highlights: 'Microclima único · Bosque valdiviano · Trekking',
    size: '48 MB',
    url: 'https://www.argentina.gob.ar/parquesnacionales/lagopuelo',
    photo: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600&q=75&fit=crop',
    coords: { lat: -42.07, lon: -71.63 },
    unesco: false,
  },
  {
    id: 'aconcagua',
    name: 'Aconcagua',
    province: 'Mendoza',
    region: 'Cuyo',
    area_km2: 710,
    highlights: '6961 m · Ruta Normal · Valle de los Horcones',
    size: '96 MB',
    url: 'https://www.mendoza.gov.ar/aconcagua/',
    photo: 'https://images.unsplash.com/photo-1574068468668-a05a11f871da?w=600&q=75&fit=crop',
    coords: { lat: -32.65, lon: -70.01 },
    unesco: false,
  },
  {
    id: 'talampaya',
    name: 'Talampaya',
    province: 'La Rioja',
    region: 'Cuyo',
    area_km2: 2150,
    highlights: 'Cañones de arenisca roja · Pinturas rupestres · Dinosaurios',
    size: '58 MB',
    url: 'https://www.argentina.gob.ar/parquesnacionales/talampaya',
    photo: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=600&q=75&fit=crop',
    coords: { lat: -29.7, lon: -67.9 },
    unesco: true,
  },
  {
    id: 'iguazu',
    name: 'Iguazú',
    province: 'Misiones',
    region: 'Litoral',
    area_km2: 550,
    highlights: 'Cataratas del Iguazú · Garganta del Diablo · Selva misionera',
    size: '62 MB',
    url: 'https://www.argentina.gob.ar/parquesnacionales/iguazu',
    photo: 'https://images.unsplash.com/photo-1546200547-f4c8c66de5d8?w=600&q=75&fit=crop',
    coords: { lat: -25.68, lon: -54.44 },
    unesco: true,
  },
  {
    id: 'humahuaca',
    name: 'Quebrada de Humahuaca',
    province: 'Jujuy',
    region: 'Norte',
    area_km2: 1720,
    highlights: 'UNESCO · 7 colores · Tilcara · Purmamarca',
    size: '64 MB',
    url: 'https://www.argentina.gob.ar/parquesnacionales',
    photo: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=600&q=75&fit=crop',
    coords: { lat: -23.2, lon: -65.35 },
    unesco: true,
  },
  {
    id: 'calilegua',
    name: 'Calilegua',
    province: 'Jujuy',
    region: 'Norte',
    area_km2: 760,
    highlights: 'Selva subtropical · Biodiversidad · Yungas',
    size: '41 MB',
    url: 'https://www.argentina.gob.ar/parquesnacionales/calilegua',
    photo: 'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=600&q=75&fit=crop',
    coords: { lat: -23.7, lon: -64.9 },
    unesco: false,
  },
  {
    id: 'cordoba',
    name: 'Sierras de Córdoba',
    province: 'Córdoba',
    region: 'Sierras Centrales',
    area_km2: 340,
    highlights: 'Los Gigantes · Champaquí · La Ventana',
    size: '55 MB',
    url: 'https://www.cordoba.gob.ar',
    photo: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=75&fit=crop',
    coords: { lat: -31.4, lon: -64.6 },
    unesco: false,
  },
];

const LAYERS: { id: MapLayer; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'dark', label: 'Oscuro', icon: 'moon' },
  { id: 'topo', label: 'Topográfico', icon: 'trail-sign' },
  { id: 'osm', label: 'Estándar', icon: 'map' },
];

// ─── Download card ────────────────────────────────────────────────────────────

function DownloadCard({ park, c }: { park: typeof NATIONAL_PARKS[0]; c: any }) {
  const [state, setState] = useState<DlState>('idle');
  const progress = useRef(new Animated.Value(0)).current;

  // Reflect previously downloaded areas on mount
  React.useEffect(() => {
    isAreaCached(park.coords.lat, park.coords.lon).then((cached) => {
      if (cached) setState('done');
    });
  }, [park.id]);

  function startDownload() {
    if (state !== 'idle') return;
    setState('downloading');
    progress.setValue(0);

    if (isTileCachingSupported()) {
      // Real download: cache OpenTopoMap tiles around the park
      downloadAreaTiles(park.coords.lat, park.coords.lon, (done, total) => {
        progress.setValue(done / total);
      }).then(() => setState('done'));
    } else {
      Animated.timing(progress, {
        toValue: 1,
        duration: 2800 + Math.random() * 1200,
        useNativeDriver: false,
      }).start(() => setState('done'));
    }
  }

  const progressWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={[dlS.card, { borderColor: c.border }]}>
      <View style={[dlS.photo, { backgroundColor: c.elevated }]}>
        {Platform.OS === 'web' && (
          // @ts-ignore
          <img src={park.photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={park.name} loading="lazy" />
        )}
        <View style={dlS.photoOverlay} />
        <View style={dlS.sizeBadge}>
          <Text style={dlS.sizeTxt}>{park.size}</Text>
        </View>
        {park.unesco && (
          <View style={dlS.unescoBadge}>
            <Text style={dlS.unescoTxt}>UNESCO</Text>
          </View>
        )}
      </View>
      <View style={[dlS.body, { backgroundColor: c.elevated }]}>
        <View style={{ flex: 1 }}>
          <Text style={[dlS.name, { color: c.text }]}>{park.name}</Text>
          <Text style={[dlS.area, { color: c.muted }]} numberOfLines={1}>{park.highlights}</Text>
          <Text style={[dlS.region, { color: c.muted }]}>{park.province} · {park.region}</Text>
        </View>
        {state === 'downloading' && (
          <View style={[dlS.progressTrack, { backgroundColor: c.border }]}>
            <Animated.View style={[dlS.progressFill, { width: progressWidth }]} />
          </View>
        )}
        <View style={dlS.btnRow}>
          <TouchableOpacity
            style={[dlS.btn, state === 'done' && dlS.btnDone, state === 'downloading' && dlS.btnDl]}
            onPress={state === 'done' ? () => Linking.openURL(park.url) : startDownload}
            activeOpacity={0.8}
            disabled={state === 'downloading'}
          >
            <Ionicons
              name={state === 'done' ? 'checkmark-circle' : state === 'downloading' ? 'hourglass-outline' : 'download-outline'}
              size={14}
              color={state === 'done' ? '#22c55e' : state === 'downloading' ? '#64748b' : '#fff'}
            />
            <Text style={[dlS.btnTxt, state === 'done' ? { color: '#22c55e' } : state === 'downloading' ? { color: '#64748b' } : { color: '#fff' }]}>
              {state === 'done' ? 'Abrir APN' : state === 'downloading' ? 'Descargando…' : 'Descargar'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[dlS.linkBtn, { borderColor: c.border }]}
            onPress={() => Linking.openURL(park.url)}
            activeOpacity={0.7}
          >
            <Ionicons name="open-outline" size={14} color={c.muted} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const dlS = StyleSheet.create({
  card: { borderRadius: 18, borderWidth: 1, overflow: 'hidden', marginBottom: 10, flexDirection: 'row', height: 120 },
  photo: { width: 100, position: 'relative' },
  photoOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(7,11,20,0.35)' },
  sizeBadge: { position: 'absolute', bottom: 6, left: 6, backgroundColor: 'rgba(7,11,20,0.75)', borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  sizeTxt: { fontSize: 9, fontWeight: '700', color: '#94a3b8' },
  unescoBadge: { position: 'absolute', top: 6, left: 6, backgroundColor: 'rgba(34,197,94,0.85)', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  unescoTxt: { fontSize: 8, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  body: { flex: 1, padding: 12, gap: 6, justifyContent: 'space-between' },
  name: { fontSize: 13, fontWeight: '700', letterSpacing: -0.2, marginBottom: 1 },
  area: { fontSize: 11, lineHeight: 15 },
  region: { fontSize: 10, fontWeight: '600' },
  progressTrack: { height: 2, borderRadius: 1, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#22c55e', borderRadius: 1 },
  btnRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#16a34a', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  btnDone: { backgroundColor: 'rgba(34,197,94,0.12)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)' },
  btnDl: { backgroundColor: 'rgba(100,116,139,0.1)', borderWidth: 1, borderColor: 'rgba(100,116,139,0.2)' },
  btnTxt: { fontSize: 11, fontWeight: '700' },
  linkBtn: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});

// ─── Compact offline-download button (download center) ───────────────────────

function OfflineDlButton({ park, c }: { park: typeof NATIONAL_PARKS[0]; c: any }) {
  const [state, setState] = useState<DlState>('idle');
  const [pct, setPct] = useState(0);

  React.useEffect(() => {
    isAreaCached(park.coords.lat, park.coords.lon).then((cached) => {
      if (cached) setState('done');
    });
  }, [park.id]);

  function start() {
    if (state !== 'idle') return;
    setState('downloading');
    if (isTileCachingSupported()) {
      downloadAreaTiles(park.coords.lat, park.coords.lon, (done, total) => {
        setPct(Math.round((done / total) * 100));
      }).then(() => setState('done'));
    } else {
      setState('done');
    }
  }

  return (
    <TouchableOpacity
      style={[
        odbS.btn,
        state === 'done'
          ? { backgroundColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)' }
          : { backgroundColor: '#16a34a', borderColor: '#16a34a' },
      ]}
      onPress={start}
      disabled={state !== 'idle'}
      activeOpacity={0.8}
    >
      <Ionicons
        name={state === 'done' ? 'checkmark-circle' : state === 'downloading' ? 'hourglass-outline' : 'cloud-download-outline'}
        size={14}
        color={state === 'done' ? '#22c55e' : '#fff'}
      />
      <Text style={[odbS.txt, { color: state === 'done' ? '#22c55e' : '#fff' }]}>
        {state === 'done' ? 'Guardado offline' : state === 'downloading' ? `Descargando ${pct}%` : `Mapa offline · ${park.size}`}
      </Text>
    </TouchableOpacity>
  );
}

const odbS = StyleSheet.create({
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    borderRadius: 2, borderWidth: 1, paddingVertical: 10, paddingHorizontal: 12,
  },
  txt: { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
});

// ─── Park detail panel ────────────────────────────────────────────────────────

function ParkPanel({ park, onClose, c }: { park: typeof NATIONAL_PARKS[0]; onClose: () => void; c: any }) {
  return (
    <View style={[ppS.panel, { backgroundColor: c.surface, borderColor: c.border }]}>
      <View style={ppS.photoWrap}>
        {Platform.OS === 'web' && (
          // @ts-ignore
          <img src={park.photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={park.name} />
        )}
        <View style={ppS.photoOverlay} />
        <TouchableOpacity style={ppS.closeBtn} onPress={onClose}>
          <Ionicons name="close" size={18} color="#fff" />
        </TouchableOpacity>
        {park.unesco && (
          <View style={ppS.unescoBadge}>
            <Ionicons name="ribbon-outline" size={12} color="#fff" />
            <Text style={ppS.unescoTxt}>Patrimonio UNESCO</Text>
          </View>
        )}
      </View>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}>
        <Text style={[ppS.name, { color: c.text }]}>{park.name}</Text>
        <Text style={[ppS.province, { color: c.muted }]}>{park.province} · {park.region}</Text>
        <View style={ppS.chipRow}>
          <View style={[ppS.chip, { backgroundColor: c.elevated, borderColor: c.border }]}>
            <Ionicons name="resize-outline" size={12} color="#22c55e" />
            <Text style={[ppS.chipTxt, { color: c.muted }]}>{park.area_km2.toLocaleString()} km²</Text>
          </View>
        </View>
        <Text style={[ppS.highlights, { color: c.text }]}>{park.highlights}</Text>
        <TouchableOpacity style={ppS.apnBtn} onPress={() => Linking.openURL(park.url)} activeOpacity={0.8}>
          <Ionicons name="open-outline" size={15} color="#fff" />
          <Text style={ppS.apnBtnTxt}>Ver en APN oficial</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const ppS = StyleSheet.create({
  panel: { flex: 1, borderLeftWidth: 1 },
  photoWrap: { height: 160, position: 'relative', backgroundColor: '#162035' },
  photoOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(7,11,20,0.4)' },
  closeBtn: {
    position: 'absolute', top: 12, right: 12,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center',
  },
  unescoBadge: {
    position: 'absolute', bottom: 12, left: 12,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(34,197,94,0.85)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999,
  },
  unescoTxt: { fontSize: 11, fontWeight: '700', color: '#fff' },
  name: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  province: { fontSize: 13 },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1 },
  chipTxt: { fontSize: 12, fontWeight: '600' },
  highlights: { fontSize: 14, lineHeight: 22 },
  apnBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#16a34a', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    alignSelf: 'flex-start',
  },
  apnBtnTxt: { color: '#fff', fontSize: 14, fontWeight: '700' },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function MapasScreen() {
  const { isDark } = useTheme();
  const { isOffline } = useNetwork();
  const { isWide } = useResponsive();
  const [layer, setLayer] = useState<MapLayer>('topo');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [contributeOpen, setContributeOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [parksOpen, setParksOpen] = useState(false);
  const [selectedPark, setSelectedPark] = useState<typeof NATIONAL_PARKS[0] | null>(null);
  const [coord, setCoord] = useState<{ lat: number; lon: number } | null>(null);

  const c = isDark
    ? { bg: '#070b14', surface: '#0f1724', elevated: '#162035', border: '#1e2d42', text: '#f0f9ff', muted: '#64748b' }
    : { bg: '#f8fafc', surface: '#ffffff', elevated: '#f1f5f9', border: '#e2e8f0', text: '#0f172a', muted: '#64748b' };

  const effectiveLayer: MapLayer = !isDark && layer === 'dark' ? 'osm' : layer;
  const isWeb = Platform.OS === 'web';

  const parkMarkers = NATIONAL_PARKS.map((p) => ({
    id: p.id,
    lat: p.coords.lat,
    lon: p.coords.lon,
    name: p.name,
    subtitle: `${p.province} · ${p.region}`,
  }));

  const mapSection = (
    <View style={s.mapWrapper}>
      <MapLeaflet
        layer={effectiveLayer}
        height="100%"
        onMapPress={(lat: number, lon: number) => setCoord({ lat, lon })}
        markers={parkMarkers}
        onMarkerPress={(id: string) => {
          const park = NATIONAL_PARKS.find((p) => p.id === id);
          if (park) setSelectedPark(park);
        }}
        flyTo={selectedPark ? { lat: selectedPark.coords.lat, lon: selectedPark.coords.lon, zoom: 10 } : null}
        center={[-40.5, -68.0]}
        zoom={4}
      />

      <SafeAreaView edges={['top']} style={s.topSafe} pointerEvents="box-none">
        <View style={[s.topBar, { backgroundColor: c.surface + 'F2', borderColor: c.border }]}>
          <View style={s.topLeft}>
            <Ionicons name="location" size={18} color="#22c55e" />
            <Text style={[s.topTitle, { color: c.text }]}>Mapas</Text>
          </View>
          <View style={s.topRight}>
            <OfflineBadge />
            <ThemeToggle />
          </View>
        </View>
        {coord && (
          <View style={[s.coordToast, { backgroundColor: c.surface + 'F2', borderColor: c.border }]}>
            <Ionicons name="pin-outline" size={14} color="#22c55e" />
            <Text style={[s.coordText, { color: c.muted }]}>{coord.lat.toFixed(4)}, {coord.lon.toFixed(4)}</Text>
            <TouchableOpacity onPress={() => setContributeOpen(true)} style={s.coordBtn}>
              <Text style={s.coordBtnText}>Contribuir aquí</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>

      {/* FABs */}
      <View style={s.fabColumn} pointerEvents="box-none">
        <TouchableOpacity
          onPress={() => setContributeOpen(true)}
          style={[s.fab, { backgroundColor: c.surface, borderColor: c.border, borderWidth: 1 }]}
        >
          <Ionicons name="add" size={26} color={c.text} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setDownloadOpen(true)}
          style={[s.fab, { backgroundColor: c.surface, borderColor: '#22c55e', borderWidth: 1 }]}
        >
          <Ionicons name="download-outline" size={20} color="#22c55e" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setParksOpen(true)}
          style={[s.fab, { backgroundColor: '#16a34a' }]}
        >
          <Ionicons name="flag-outline" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setSheetOpen(true)}
          style={[s.fab, { backgroundColor: '#16a34a' }]}
        >
          <Ionicons name="layers" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Wide layout: map + sidebar
  if (isWide && isWeb) {
    return (
      <ScrollView style={[s.root, { backgroundColor: c.bg }]} showsVerticalScrollIndicator={false}>
        <WebHeader />
        <View style={s.wideRow}>
          {mapSection}
          {selectedPark ? (
            <View style={{ width: 340 }}>
              <ParkPanel park={selectedPark} onClose={() => setSelectedPark(null)} c={c} />
            </View>
          ) : (
            <View style={[s.parksSidebar, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Text style={[s.sidebarTitle, { color: c.text }]}>Parques Nacionales</Text>
              <Text style={[s.sidebarSub, { color: c.muted }]}>{NATIONAL_PARKS.length} parques · Argentina</Text>
              <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                {NATIONAL_PARKS.map((park) => (
                  <TouchableOpacity
                    key={park.id}
                    style={[s.parkItem, { borderBottomColor: c.border }]}
                    onPress={() => setSelectedPark(park)}
                    activeOpacity={0.7}
                  >
                    <View style={[s.parkItemDot, { backgroundColor: '#22c55e' }]} />
                    <View style={{ flex: 1 }}>
                      <View style={s.parkItemRow}>
                        <Text style={[s.parkItemName, { color: c.text }]}>{park.name}</Text>
                        {park.unesco && <Text style={s.unescoChip}>UNESCO</Text>}
                      </View>
                      <Text style={[s.parkItemSub, { color: c.muted }]}>{park.province} · {park.region}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color={c.muted} />
                  </TouchableOpacity>
                ))}
                <View style={[s.dlAllBtn, { borderTopColor: c.border }]}>
                  <TouchableOpacity
                    style={s.dlAllInner}
                    onPress={() => setDownloadOpen(true)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="cloud-download-outline" size={16} color="#22c55e" />
                    <Text style={s.dlAllTxt}>Descargar mapas offline</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          )}
        </View>

        {/* ── CENTRO DE DESCARGAS — always visible ── */}
        <View style={[s.dlCenter, { backgroundColor: c.bg }]}>
          <Text style={[s.dlCenterEyebrow, { color: c.muted }]} {...({ 'data-eyebrow': true } as any)}>
            CENTRO DE DESCARGAS
          </Text>
          <Text style={[s.dlCenterTitle, { color: c.text }]} {...({ 'data-serif': true } as any)}>
            Mapas para llevar sin señal
          </Text>
          <Text style={[s.dlCenterSub, { color: c.muted }]}>
            Mapas topográficos offline para el navegador y cartografía oficial en PDF de Parques Nacionales Argentina.
          </Text>
          <View style={s.dlCenterGrid}>
            {NATIONAL_PARKS.map((park) => (
              <View key={park.id} style={[s.dlCenterCard, { backgroundColor: c.surface, borderColor: c.border }]}>
                <View style={s.dlCenterPhoto}>
                  {/* @ts-ignore */}
                  <img src={park.photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={park.name} loading="lazy" />
                  {park.unesco && (
                    <View style={s.dlCenterUnesco}>
                      <Text style={s.dlCenterUnescoTxt}>UNESCO</Text>
                    </View>
                  )}
                </View>
                <View style={s.dlCenterBody}>
                  <Text style={[s.dlCenterName, { color: c.text }]} {...({ 'data-serif': true } as any)}>{park.name}</Text>
                  <Text style={[s.dlCenterProv, { color: c.muted }]}>{park.province} · {park.region}</Text>
                  <OfflineDlButton park={park} c={c} />
                  <TouchableOpacity
                    style={[s.dlCenterPdfBtn, { borderColor: c.border }]}
                    onPress={() => Linking.openURL(park.url)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="document-text-outline" size={14} color="#22c55e" />
                    <Text style={[s.dlCenterPdfTxt, { color: c.text }]}>Mapa oficial PDF — APN</Text>
                    <Ionicons name="open-outline" size={12} color={c.muted} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>

        <WebFooter />

        {/* Modals */}
        {renderModals()}
      </ScrollView>
    );
  }

  function renderModals() {
    return (
      <>
        {/* Layers */}
        <Modal visible={sheetOpen} transparent animationType="slide" onRequestClose={() => setSheetOpen(false)}>
          <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={() => setSheetOpen(false)}>
            <TouchableOpacity activeOpacity={1} style={[s.sheet, { backgroundColor: c.surface, borderColor: c.border }]}>
              <View style={[s.handle, { backgroundColor: c.border }]} />
              <Text style={[s.sheetTitle, { color: c.muted }]}>CAPA DEL MAPA</Text>
              <View style={s.layerRow}>
                {LAYERS.map((l) => {
                  const active = layer === l.id;
                  return (
                    <TouchableOpacity
                      key={l.id}
                      onPress={() => setLayer(l.id)}
                      style={[s.layerChip, { backgroundColor: active ? '#16a34a' : c.elevated, borderColor: active ? '#16a34a' : c.border }]}
                    >
                      <Ionicons name={l.icon} size={18} color={active ? '#fff' : c.muted} />
                      <Text style={[s.layerLabel, { color: active ? '#fff' : c.text }]}>{l.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {isOffline && (
                <View style={[s.offlineNote, { marginTop: 16 }]}>
                  <Ionicons name="cloud-offline-outline" size={15} color="#fbbf24" />
                  <Text style={s.offlineNoteText}>Sin conexión · Los tiles del mapa requieren internet</Text>
                </View>
              )}
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* Parks list (mobile) */}
        <Modal visible={parksOpen} transparent animationType="slide" onRequestClose={() => setParksOpen(false)}>
          <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={() => setParksOpen(false)}>
            <TouchableOpacity activeOpacity={1} style={[s.downloadSheet, { backgroundColor: c.surface, borderColor: c.border }]}>
              <View style={[s.handle, { backgroundColor: c.border }]} />
              <Text style={[s.dlTitle, { color: c.text }]}>Parques Nacionales</Text>
              <Text style={[s.dlSub, { color: c.muted }]}>{NATIONAL_PARKS.length} parques · Argentina</Text>
              <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 12 }}>
                {NATIONAL_PARKS.map((park) => (
                  <TouchableOpacity
                    key={park.id}
                    style={[s.parkItem, { borderBottomColor: c.border }]}
                    onPress={() => { setSelectedPark(park); setParksOpen(false); }}
                    activeOpacity={0.7}
                  >
                    <View style={[s.parkItemDot, { backgroundColor: '#22c55e' }]} />
                    <View style={{ flex: 1 }}>
                      <View style={s.parkItemRow}>
                        <Text style={[s.parkItemName, { color: c.text }]}>{park.name}</Text>
                        {park.unesco && <Text style={s.unescoChip}>UNESCO</Text>}
                      </View>
                      <Text style={[s.parkItemSub, { color: c.muted }]}>{park.province}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color={c.muted} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* Download modal */}
        <Modal visible={downloadOpen} transparent animationType="slide" onRequestClose={() => setDownloadOpen(false)}>
          <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={() => setDownloadOpen(false)}>
            <TouchableOpacity activeOpacity={1} style={[s.downloadSheet, { backgroundColor: c.surface, borderColor: c.border }]}>
              <View style={[s.handle, { backgroundColor: c.border }]} />
              <View style={s.dlHeader}>
                <View style={s.dlIconWrap}>
                  <Ionicons name="cloud-download-outline" size={20} color="#22c55e" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.dlTitle, { color: c.text }]}>Mapas sin conexión</Text>
                  <Text style={[s.dlSub, { color: c.muted }]}>{NATIONAL_PARKS.length} parques · Datos APN oficiales</Text>
                </View>
                <TouchableOpacity onPress={() => setDownloadOpen(false)}>
                  <Ionicons name="close" size={20} color={c.muted} />
                </TouchableOpacity>
              </View>
              <View style={[s.infoBanner, { backgroundColor: isDark ? 'rgba(56,189,248,0.08)' : 'rgba(14,165,233,0.06)', borderColor: isDark ? 'rgba(56,189,248,0.2)' : 'rgba(14,165,233,0.2)' }]}>
                <Ionicons name="information-circle-outline" size={15} color="#38bdf8" />
                <Text style={[s.infoBannerTxt, { color: '#38bdf8' }]}>
                  Mapas offline con curvas de nivel, senderos y puntos de interés. Descargados desde fuentes APN oficiales.
                </Text>
              </View>
              <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 4 }}>
                {NATIONAL_PARKS.map((park) => (
                  <DownloadCard key={park.id} park={park} c={c} />
                ))}
              </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* Park detail (mobile) */}
        {selectedPark && (
          <Modal visible animationType="slide" onRequestClose={() => setSelectedPark(null)}>
            <View style={{ flex: 1, backgroundColor: c.bg }}>
              <ParkPanel park={selectedPark} onClose={() => setSelectedPark(null)} c={c} />
            </View>
          </Modal>
        )}

        {/* Contribute */}
        <Modal visible={contributeOpen} animationType="slide" presentationStyle="pageSheet">
          <View style={{ flex: 1, backgroundColor: c.bg }}>
            <View style={[s.modalHeader, { borderBottomColor: c.border }]}>
              <Text style={[s.modalTitle, { color: c.text }]}>Nueva contribución</Text>
              <TouchableOpacity onPress={() => setContributeOpen(false)}>
                <Ionicons name="close" size={24} color={c.muted} />
              </TouchableOpacity>
            </View>
            <ContributeForm onClose={() => setContributeOpen(false)} onSubmit={() => setContributeOpen(false)} />
          </View>
        </Modal>
      </>
    );
  }

  // Mobile / narrow layout
  return (
    <View style={[s.root, { backgroundColor: c.bg }]}>
      {mapSection}
      {renderModals()}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  wideRow: { flex: 1, flexDirection: 'row' },
  mapWrapper: { flex: 1, position: 'relative' },

  topSafe: { position: 'absolute', top: 0, left: 0, right: 0 },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 12, marginTop: 8, paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 18, borderWidth: 1,
  },
  topLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  topTitle: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  coordToast: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 12, marginTop: 8, paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 14, borderWidth: 1,
  },
  coordText: { fontSize: 13, flex: 1 },
  coordBtn: { backgroundColor: '#16a34a', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  coordBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  fabColumn: { position: 'absolute', right: 16, bottom: 32, gap: 12 },
  fab: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },

  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, padding: 20, paddingBottom: 36, maxHeight: '80%' },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 18 },
  sheetTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 12 },
  layerRow: { flexDirection: 'row', gap: 10 },
  layerChip: { flex: 1, alignItems: 'center', gap: 6, paddingVertical: 14, borderRadius: 16, borderWidth: 1 },
  layerLabel: { fontSize: 12, fontWeight: '600' },
  offlineNote: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(245,158,11,0.12)', borderRadius: 12, padding: 12 },
  offlineNoteText: { color: '#fbbf24', fontSize: 12, fontWeight: '500', flex: 1 },

  downloadSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, padding: 20, paddingBottom: 36, maxHeight: '90%' },
  dlHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  dlIconWrap: { width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(34,197,94,0.12)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.25)', alignItems: 'center', justifyContent: 'center' },
  dlTitle: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  dlSub: { fontSize: 12, marginTop: 1 },
  infoBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12 },
  infoBannerTxt: { fontSize: 12, lineHeight: 17, flex: 1, fontWeight: '500' },

  // Parks sidebar (wide)
  parksSidebar: { width: 300, borderLeftWidth: 1, flexDirection: 'column', padding: 16 },
  sidebarTitle: { fontSize: 17, fontWeight: '800', letterSpacing: -0.4, marginBottom: 2 },
  sidebarSub: { fontSize: 12, marginBottom: 14 },
  parkItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1 },
  parkItemDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  parkItemRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  parkItemName: { fontSize: 13, fontWeight: '700' },
  parkItemSub: { fontSize: 11, marginTop: 1 },
  unescoChip: { fontSize: 9, fontWeight: '800', color: '#22c55e', backgroundColor: 'rgba(34,197,94,0.12)', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 },
  dlAllBtn: { paddingTop: 16, borderTopWidth: 1, marginTop: 8 },
  dlAllInner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(34,197,94,0.1)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(34,197,94,0.25)' },
  dlAllTxt: { color: '#22c55e', fontSize: 13, fontWeight: '700' },

  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  modalTitle: { fontSize: 17, fontWeight: '700' },

  // Download center (always-visible section, wide web)
  dlCenter: { paddingVertical: 72, paddingHorizontal: 40, alignItems: 'center' },
  dlCenterEyebrow: { fontSize: 11, fontWeight: '600', letterSpacing: 4, marginBottom: 12 },
  dlCenterTitle: { fontSize: 34, fontWeight: '400', letterSpacing: -0.5, marginBottom: 12, textAlign: 'center' },
  dlCenterSub: { fontSize: 14, lineHeight: 22, textAlign: 'center', maxWidth: 560, marginBottom: 40 },
  dlCenterGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 20, justifyContent: 'center',
    maxWidth: 1200, width: '100%',
  },
  dlCenterCard: {
    width: 270, borderWidth: 1, borderRadius: 4, overflow: 'hidden',
  },
  dlCenterPhoto: { height: 150, position: 'relative', backgroundColor: '#162035' },
  dlCenterUnesco: {
    position: 'absolute', top: 10, left: 10,
    backgroundColor: 'rgba(7,11,20,0.75)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 2,
  },
  dlCenterUnescoTxt: { fontSize: 8, fontWeight: '800', color: '#fff', letterSpacing: 1.5 },
  dlCenterBody: { padding: 16, gap: 8 },
  dlCenterName: { fontSize: 19, fontWeight: '400', letterSpacing: -0.3 },
  dlCenterProv: { fontSize: 11, letterSpacing: 0.5, marginBottom: 6 },
  dlCenterPdfBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    borderWidth: 1, borderRadius: 2, paddingVertical: 10, paddingHorizontal: 12,
  },
  dlCenterPdfTxt: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, flex: 1, textAlign: 'center' },
});
