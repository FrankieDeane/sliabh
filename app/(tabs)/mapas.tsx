import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MapLeaflet } from '../../src/components/map/MapLeaflet';
import { ContributeForm } from '../../src/components/contribute/ContributeForm';
import { ThemeToggle } from '../../src/components/ui/ThemeToggle';
import { OfflineBadge } from '../../src/components/ui/OfflineBadge';
import { useTheme } from '../../src/hooks/useTheme';
import { useNetwork } from '../../src/hooks/useNetwork';

type MapLayer = 'dark' | 'topo' | 'osm';

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

export default function MapasScreen() {
  const { isDark } = useTheme();
  const { isOffline } = useNetwork();
  const [layer, setLayer] = useState<MapLayer>('dark');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [contributeOpen, setContributeOpen] = useState(false);
  const [coord, setCoord] = useState<{ lat: number; lon: number } | null>(null);

  const c = isDark
    ? { bg: '#070b14', surface: '#0f1724', elevated: '#162035', border: '#1e2d42', text: '#f0f9ff', muted: '#64748b' }
    : { bg: '#f8fafc', surface: '#ffffff', elevated: '#f1f5f9', border: '#e2e8f0', text: '#0f172a', muted: '#64748b' };

  const effectiveLayer: MapLayer = !isDark && layer === 'dark' ? 'osm' : layer;

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <MapLeaflet
        layer={effectiveLayer}
        height="100%"
        onMapPress={(lat, lon) => setCoord({ lat, lon })}
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

      <View style={styles.fabColumn} pointerEvents="box-none">
        <TouchableOpacity
          onPress={() => setContributeOpen(true)}
          style={[styles.fab, { backgroundColor: c.surface, borderColor: c.border, borderWidth: 1 }]}
        >
          <Ionicons name="add" size={26} color={c.text} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSheetOpen(true)} style={[styles.fab, { backgroundColor: '#16a34a' }]}>
          <Ionicons name="layers" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <Modal visible={sheetOpen} transparent animationType="slide" onRequestClose={() => setSheetOpen(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setSheetOpen(false)}>
          <TouchableOpacity activeOpacity={1} style={[styles.sheet, { backgroundColor: c.surface, borderColor: c.border }]}>
            <View style={[styles.handle, { backgroundColor: c.border }]} />

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

            <Text style={[styles.sheetTitle, { color: c.muted, marginTop: 20 }]}>LEYENDA</Text>
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

            <View style={styles.downloadNote}>
              <Ionicons name="download-outline" size={15} color="#64748b" />
              <Text style={styles.downloadNoteText}>
                Descarga de mapas offline — próximamente
              </Text>
            </View>

            {isOffline && (
              <View style={styles.offlineNote}>
                <Ionicons name="cloud-offline-outline" size={15} color="#fbbf24" />
                <Text style={styles.offlineNoteText}>Sin conexión · Los tiles del mapa requieren internet</Text>
              </View>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

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
  fabColumn: { position: 'absolute', right: 16, bottom: 32, gap: 12 },
  fab: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, padding: 20, paddingBottom: 36 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 18 },
  sheetTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 12 },
  layerRow: { flexDirection: 'row', gap: 10 },
  layerChip: { flex: 1, alignItems: 'center', gap: 6, paddingVertical: 14, borderRadius: 16, borderWidth: 1 },
  layerLabel: { fontSize: 12, fontWeight: '600' },
  legendGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8, width: '45%' },
  legendIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  legendLabel: { fontSize: 13, fontWeight: '500' },
  downloadNote: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20,
    backgroundColor: 'rgba(100,116,139,0.12)', borderRadius: 12, padding: 12,
  },
  downloadNoteText: { color: '#64748b', fontSize: 12, fontWeight: '500', flex: 1 },
  offlineNote: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8,
    backgroundColor: 'rgba(245,158,11,0.12)', borderRadius: 12, padding: 12,
  },
  offlineNoteText: { color: '#fbbf24', fontSize: 12, fontWeight: '500', flex: 1 },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 17, fontWeight: '700' },
});
