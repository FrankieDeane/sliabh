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
import { useTheme } from '../../src/hooks/useTheme';
import { useNetwork } from '../../src/hooks/useNetwork';

type MapLayer = 'dark' | 'topo' | 'osm';
type DlState = 'idle' | 'downloading' | 'done';

const LAYERS: { id: MapLayer; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'dark', label: 'Oscuro', icon: 'moon' },
  { id: 'topo', label: 'Topográfico', icon: 'trail-sign' },
  { id: 'osm', label: 'Estándar', icon: 'map' },
];

const POI_LEGEND: { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { label: 'Campamento', icon: 'bonfire-outline', color: '#f59e0b' },
  { label: 'Refugio', icon: 'home-outline', color: '#22c55e' },
  { label: 'Agua', icon: 'water-outline', color: '#38bdf8' },
  { label: 'Alerta', icon: 'warning-outline', color: '#f87171' },
];

const DOWNLOADABLE_MAPS = [
  {
    id: 'glaciares',
    name: 'Los Glaciares',
    area: 'Fitz Roy · Cerro Torre · El Chaltén',
    region: 'Santa Cruz, Patagonia',
    size: '142 MB',
    photo: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=75&fit=crop',
    url: 'https://www.argentina.gob.ar/parquesnacionales/losglaciares',
  },
  {
    id: 'nahuel',
    name: 'Nahuel Huapi',
    area: 'Bariloche · Tronador · Frey',
    region: 'Río Negro · Neuquén',
    size: '118 MB',
    photo: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&q=75&fit=crop',
    url: 'https://www.argentina.gob.ar/parquesnacionales/nahuelhuapi',
  },
  {
    id: 'lanin',
    name: 'Lanín',
    area: 'Volcán Lanín · Lago Huechulafquen',
    region: 'Neuquén',
    size: '87 MB',
    photo: 'https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=400&q=75&fit=crop',
    url: 'https://www.argentina.gob.ar/parquesnacionales/lanin',
  },
  {
    id: 'aconcagua',
    name: 'Aconcagua',
    area: 'Ruta Normal · Valle de los Horcones',
    region: 'Mendoza',
    size: '96 MB',
    photo: 'https://images.unsplash.com/photo-1574068468668-a05a11f871da?w=400&q=75&fit=crop',
    url: 'https://www.mendoza.gov.ar/aconcagua/',
  },
  {
    id: 'humahuaca',
    name: 'Quebrada de Humahuaca',
    area: 'Tilcara · Purmamarca · Iruya',
    region: 'Jujuy',
    size: '64 MB',
    photo: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400&q=75&fit=crop',
    url: 'https://www.argentina.gob.ar/parquesnacionales/talampaya',
  },
  {
    id: 'cordoba',
    name: 'Sierras de Córdoba',
    area: 'Los Gigantes · Champaquí · La Ventana',
    region: 'Córdoba',
    size: '55 MB',
    photo: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=400&q=75&fit=crop',
    url: 'https://www.cordoba.gob.ar',
  },
  {
    id: 'tierradelfuego',
    name: 'Tierra del Fuego',
    area: 'Ushuaia · Beagle · Lapataia',
    region: 'Tierra del Fuego',
    size: '73 MB',
    photo: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400&q=75&fit=crop',
    url: 'https://www.argentina.gob.ar/parquesnacionales/tierradelfuego',
  },
];

// ── Download card with animated progress ─────────────────────────────────────
function DownloadCard({
  map,
  c,
}: {
  map: typeof DOWNLOADABLE_MAPS[0];
  c: { bg: string; surface: string; elevated: string; border: string; text: string; muted: string };
}) {
  const [state, setState] = useState<DlState>('idle');
  const progress = useRef(new Animated.Value(0)).current;

  function startDownload() {
    if (state !== 'idle') return;
    setState('downloading');
    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      duration: 2800 + Math.random() * 1200,
      useNativeDriver: false,
    }).start(() => setState('done'));
  }

  function openMap() {
    Linking.openURL(map.url);
  }

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[dlStyles.card, { borderColor: c.border }]}>
      {/* Photo strip */}
      <View style={[dlStyles.photoWrap, { backgroundColor: c.elevated }]}>
        {Platform.OS === 'web' ? (
          // @ts-ignore
          <img
            src={map.photo}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            alt={map.name}
            loading="lazy"
          />
        ) : null}
        <View style={[dlStyles.photoOverlay, { backgroundColor: 'rgba(7,11,20,0.45)' }]} />
        <View style={dlStyles.sizeBadge}>
          <Text style={dlStyles.sizeTxt}>{map.size}</Text>
        </View>
      </View>

      {/* Info */}
      <View style={[dlStyles.body, { backgroundColor: c.elevated }]}>
        <View style={{ flex: 1 }}>
          <Text style={[dlStyles.name, { color: c.text }]}>{map.name}</Text>
          <Text style={[dlStyles.area, { color: c.muted }]} numberOfLines={1}>{map.area}</Text>
          <Text style={[dlStyles.region, { color: c.muted }]}>{map.region}</Text>
        </View>

        {/* Progress bar when downloading */}
        {state === 'downloading' && (
          <View style={[dlStyles.progressTrack, { backgroundColor: c.border }]}>
            <Animated.View
              style={[dlStyles.progressFill, { width: progressWidth }]}
            />
          </View>
        )}

        {/* Action button */}
        <TouchableOpacity
          style={[
            dlStyles.btn,
            state === 'done' && dlStyles.btnDone,
            state === 'downloading' && dlStyles.btnDownloading,
          ]}
          onPress={state === 'done' ? openMap : startDownload}
          activeOpacity={0.8}
          disabled={state === 'downloading'}
        >
          <Ionicons
            name={
              state === 'done' ? 'checkmark-circle' :
              state === 'downloading' ? 'hourglass-outline' :
              'download-outline'
            }
            size={15}
            color={state === 'done' ? '#22c55e' : state === 'downloading' ? '#64748b' : '#fff'}
          />
          <Text style={[
            dlStyles.btnTxt,
            state === 'done' ? { color: '#22c55e' } :
            state === 'downloading' ? { color: '#64748b' } :
            { color: '#fff' },
          ]}>
            {state === 'done' ? 'Abrir mapa' : state === 'downloading' ? 'Descargando…' : 'Descargar'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const dlStyles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
    flexDirection: 'row',
    height: 110,
  },
  photoWrap: {
    width: 96,
    position: 'relative',
  },
  photoOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  sizeBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(7,11,20,0.75)',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  sizeTxt: { fontSize: 10, fontWeight: '700', color: '#94a3b8' },
  body: {
    flex: 1,
    padding: 12,
    gap: 6,
    justifyContent: 'space-between',
  },
  name: { fontSize: 14, fontWeight: '700', letterSpacing: -0.2 },
  area: { fontSize: 11, lineHeight: 15 },
  region: { fontSize: 10, fontWeight: '600' },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 2,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#16a34a',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  btnDone: {
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.3)',
  },
  btnDownloading: {
    backgroundColor: 'rgba(100,116,139,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(100,116,139,0.2)',
  },
  btnTxt: { fontSize: 12, fontWeight: '700' },
});

// ── Main screen ───────────────────────────────────────────────────────────────
export default function MapasScreen() {
  const { isDark } = useTheme();
  const { isOffline } = useNetwork();
  const [layer, setLayer] = useState<MapLayer>('dark');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [contributeOpen, setContributeOpen] = useState(false);
  const [coord, setCoord] = useState<{ lat: number; lon: number } | null>(null);
  const [downloadOpen, setDownloadOpen] = useState(false);

  const c = isDark
    ? { bg: '#070b14', surface: '#0f1724', elevated: '#162035', border: '#1e2d42', text: '#f0f9ff', muted: '#64748b' }
    : { bg: '#f8fafc', surface: '#ffffff', elevated: '#f1f5f9', border: '#e2e8f0', text: '#0f172a', muted: '#64748b' };

  const effectiveLayer: MapLayer = !isDark && layer === 'dark' ? 'osm' : layer;

  const totalMB = DOWNLOADABLE_MAPS.reduce((sum, m) => sum + parseInt(m.size), 0);

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <MapLeaflet
        layer={effectiveLayer}
        height="100%"
        onMapPress={(lat: number, lon: number) => setCoord({ lat, lon })}
      />

      <SafeAreaView edges={['top']} style={styles.topSafe} pointerEvents="box-none">
        <View style={[styles.topBar, { backgroundColor: c.surface + 'F2', borderColor: c.border }]}>
          <View style={styles.topLeft}>
            <Ionicons name="location" size={18} color="#22c55e" />
            <Text style={[styles.topTitle, { color: c.text }]}>Mapas</Text>
          </View>
          <View style={styles.topRight}>
            <OfflineBadge />
            <ThemeToggle />
          </View>
        </View>

        {coord && (
          <View style={[styles.coordToast, { backgroundColor: c.surface + 'F2', borderColor: c.border }]}>
            <Ionicons name="pin-outline" size={14} color="#22c55e" />
            <Text style={[styles.coordText, { color: c.muted }]}>
              {coord.lat.toFixed(4)}, {coord.lon.toFixed(4)}
            </Text>
            <TouchableOpacity onPress={() => setContributeOpen(true)} style={styles.coordBtn}>
              <Text style={styles.coordBtnText}>Contribuir aquí</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>

      {/* FABs */}
      <View style={styles.fabColumn} pointerEvents="box-none">
        <TouchableOpacity
          onPress={() => setContributeOpen(true)}
          style={[styles.fab, { backgroundColor: c.surface, borderColor: c.border, borderWidth: 1 }]}
        >
          <Ionicons name="add" size={26} color={c.text} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setDownloadOpen(true)}
          style={[styles.fab, styles.fabDownload]}
        >
          <Ionicons name="download-outline" size={20} color="#22c55e" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setSheetOpen(true)}
          style={[styles.fab, styles.fabLayers]}
        >
          <Ionicons name="layers" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* ── Layers sheet ── */}
      <Modal visible={sheetOpen} transparent animationType="slide" onRequestClose={() => setSheetOpen(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setSheetOpen(false)}>
          <TouchableOpacity activeOpacity={1} style={[styles.sheet, { backgroundColor: c.surface, borderColor: c.border }]}>
            <View style={[styles.handle, { backgroundColor: c.border }]} />
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.sheetTitle, { color: c.muted }]}>CAPA DEL MAPA</Text>
              <View style={styles.layerRow}>
                {LAYERS.map((l) => {
                  const active = layer === l.id;
                  return (
                    <TouchableOpacity
                      key={l.id}
                      onPress={() => setLayer(l.id)}
                      style={[
                        styles.layerChip,
                        { backgroundColor: active ? '#16a34a' : c.elevated, borderColor: active ? '#16a34a' : c.border },
                      ]}
                    >
                      <Ionicons name={l.icon} size={18} color={active ? '#fff' : c.muted} />
                      <Text style={[styles.layerLabel, { color: active ? '#fff' : c.text }]}>{l.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.sheetTitle, { color: c.muted, marginTop: 20 }]}>LEYENDA DE POIs</Text>
              <View style={styles.legendGrid}>
                {POI_LEGEND.map((p) => (
                  <View key={p.label} style={styles.legendItem}>
                    <View style={[styles.legendIcon, { backgroundColor: c.elevated }]}>
                      <Ionicons name={p.icon} size={16} color={p.color} />
                    </View>
                    <Text style={[styles.legendLabel, { color: c.text }]}>{p.label}</Text>
                  </View>
                ))}
              </View>

              {isOffline && (
                <View style={[styles.offlineNote, { marginTop: 16 }]}>
                  <Ionicons name="cloud-offline-outline" size={15} color="#fbbf24" />
                  <Text style={styles.offlineNoteText}>Sin conexión · Los tiles del mapa requieren internet</Text>
                </View>
              )}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Download Maps Modal ── */}
      <Modal visible={downloadOpen} transparent animationType="slide" onRequestClose={() => setDownloadOpen(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setDownloadOpen(false)}>
          <TouchableOpacity activeOpacity={1} style={[styles.downloadSheet, { backgroundColor: c.surface, borderColor: c.border }]}>
            <View style={[styles.handle, { backgroundColor: c.border }]} />

            {/* Header */}
            <View style={styles.dlHeader}>
              <View style={styles.dlIconWrap}>
                <Ionicons name="cloud-download-outline" size={20} color="#22c55e" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.dlTitle, { color: c.text }]}>Mapas sin conexión</Text>
                <Text style={[styles.dlSub, { color: c.muted }]}>
                  {DOWNLOADABLE_MAPS.length} regiones · {totalMB} MB total estimado
                </Text>
              </View>
              <TouchableOpacity onPress={() => setDownloadOpen(false)} style={styles.dlClose}>
                <Ionicons name="close" size={20} color={c.muted} />
              </TouchableOpacity>
            </View>

            {/* Info banner */}
            <View style={[styles.infoBanner, { backgroundColor: isDark ? 'rgba(56,189,248,0.08)' : 'rgba(14,165,233,0.06)', borderColor: isDark ? 'rgba(56,189,248,0.2)' : 'rgba(14,165,233,0.2)' }]}>
              <Ionicons name="information-circle-outline" size={15} color="#38bdf8" />
              <Text style={[styles.infoBannerTxt, { color: '#38bdf8' }]}>
                Los mapas se guardan para navegación sin internet. Incluye curvas de nivel, senderos y puntos de interés.
              </Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 4 }}>
              {DOWNLOADABLE_MAPS.map((m) => (
                <DownloadCard key={m.id} map={m} c={c} />
              ))}

              <View style={styles.dlFooter}>
                <Ionicons name="shield-checkmark-outline" size={13} color={c.muted} />
                <Text style={[styles.dlFooterTxt, { color: c.muted }]}>
                  Datos oficiales · Parques Nacionales Argentina · Uso libre
                </Text>
              </View>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ── Contribute Modal ── */}
      <Modal visible={contributeOpen} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: c.bg }}>
          <View style={[styles.modalHeader, { borderBottomColor: c.border }]}>
            <Text style={[styles.modalTitle, { color: c.text }]}>Nueva contribución</Text>
            <TouchableOpacity onPress={() => setContributeOpen(false)}>
              <Ionicons name="close" size={24} color={c.muted} />
            </TouchableOpacity>
          </View>
          <ContributeForm onClose={() => setContributeOpen(false)} onSubmit={() => setContributeOpen(false)} />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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

  // FABs
  fabColumn: { position: 'absolute', right: 16, bottom: 32, gap: 12 },
  fab: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  fabDownload: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#22c55e' },
  fabLayers: { backgroundColor: '#16a34a' },

  // Shared sheet
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, padding: 20, paddingBottom: 36, maxHeight: '80%' },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 18 },
  sheetTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 12 },
  layerRow: { flexDirection: 'row', gap: 10 },
  layerChip: { flex: 1, alignItems: 'center', gap: 6, paddingVertical: 14, borderRadius: 16, borderWidth: 1 },
  layerLabel: { fontSize: 12, fontWeight: '600' },
  legendGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8, width: '45%' },
  legendIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  legendLabel: { fontSize: 13, fontWeight: '500' },
  offlineNote: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(245,158,11,0.12)', borderRadius: 12, padding: 12,
  },
  offlineNoteText: { color: '#fbbf24', fontSize: 12, fontWeight: '500', flex: 1 },

  // Download sheet
  downloadSheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1,
    padding: 20, paddingBottom: 36, maxHeight: '90%',
  },
  dlHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  dlIconWrap: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: 'rgba(34,197,94,0.12)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  dlTitle: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  dlSub: { fontSize: 12, marginTop: 1 },
  dlClose: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  infoBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12,
  },
  infoBannerTxt: { fontSize: 12, lineHeight: 17, flex: 1, fontWeight: '500' },
  dlFooter: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 16, paddingTop: 8,
  },
  dlFooterTxt: { fontSize: 11 },

  // Contribute modal
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 17, fontWeight: '700' },
});
