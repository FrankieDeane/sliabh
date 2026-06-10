import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../src/components/layout/ScreenHeader';
import { WaypointList } from '../../src/components/planner/WaypointList';
import { RouteStats } from '../../src/components/planner/RouteStats';
import { Button } from '../../src/components/ui/Button';
import { MapLeaflet } from '../../src/components/map/MapLeaflet';
import { usePlannerStore } from '../../src/store/plannerStore';
import { useResponsive } from '../../src/hooks/useResponsive';
import { useTheme } from '../../src/hooks/useTheme';

type MobileTab = 'mapa' | 'puntos';

// ─── National parks data ───────────────────────────────────────────────────────
const NATIONAL_PARKS = [
  { name: 'Los Glaciares', location: 'Santa Cruz', fact: 'Fitz Roy, Cerro Torre, glaciares' },
  { name: 'Nahuel Huapi', location: 'Río Negro', fact: 'Bariloche, lago, cerro Tronador' },
  { name: 'Lanín', location: 'Neuquén', fact: 'Volcán Lanín, bosque araucaria' },
  { name: 'Aconcagua', location: 'Mendoza', fact: 'Cerro más alto del hemisferio, 6961m' },
  { name: 'Quebrada de Humahuaca', location: 'Jujuy', fact: 'UNESCO, 7 colores, puna' },
  { name: 'Sierras de Córdoba', location: 'Córdoba', fact: 'Los Gigantes, La Ventana' },
  { name: 'Torres del Paine', location: 'Chile', fact: 'Circuito W, refugios' },
  { name: 'Tierra del Fuego', location: 'Ushuaia', fact: 'Fin del mundo, Ushuaia' },
];

type ThemeColors = { bg: string; surface: string; elevated: string; border: string; text: string; muted: string };

function ParquesNacionalesSection({ c }: { c: ThemeColors }) {
  return (
    <View style={[parkStyles.container, { backgroundColor: c.surface, borderColor: c.border }]}>
      <Text style={[parkStyles.title, { color: c.text }]}>Parques Nacionales Argentina</Text>
      <Text style={[parkStyles.subtitle, { color: c.muted }]}>Información para planificar tu visita</Text>

      <View style={parkStyles.cards}>
        {NATIONAL_PARKS.map((park) => (
          <View key={park.name} style={parkStyles.card}>
            <View style={parkStyles.dot} />
            <View style={parkStyles.cardText}>
              <Text style={[parkStyles.parkName, { color: c.text }]}>{park.name}</Text>
              <Text style={[parkStyles.parkFact, { color: c.muted }]}>{park.location} · {park.fact}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={[parkStyles.note, { borderTopColor: c.border }]}>
        <Ionicons name="map-outline" size={14} color={c.muted} />
        <Text style={[parkStyles.noteText, { color: c.muted }]}>
          Descarga mapas en Mapas → capas del mapa
        </Text>
      </View>
    </View>
  );
}

const parkStyles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    marginBottom: 14,
  },
  cards: {
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
    marginTop: 5,
    flexShrink: 0,
  },
  cardText: {
    flex: 1,
  },
  parkName: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  parkFact: {
    fontSize: 12,
    lineHeight: 17,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  noteText: {
    fontSize: 12,
  },
});

export default function PlanificarScreen() {
  const router = useRouter();
  const { isWide } = useResponsive();
  const { isDark } = useTheme();
  const { waypoints, planName, setPlanName, addWaypoint, clearPlan } = usePlannerStore();
  const [mobileTab, setMobileTab] = useState<MobileTab>('mapa');

  const c: ThemeColors = isDark
    ? { bg: '#070b14', surface: '#0f1724', elevated: '#162035', border: '#1e2d42', text: '#f0f9ff', muted: '#64748b' }
    : { bg: '#f8fafc', surface: '#ffffff', elevated: '#f1f5f9', border: '#e2e8f0', text: '#0f172a', muted: '#64748b' };

  function handleMapPress(lat: number, lon: number) {
    addWaypoint({
      id: Date.now().toString(),
      lat,
      lon,
      name: `Punto ${waypoints.length + 1}`,
    });
  }

  function handleAnalyzeWithAI() {
    if (waypoints.length < 2) {
      Alert.alert(
        'Puntos insuficientes',
        'Añade al menos 2 puntos de ruta para analizar con IA.',
        [{ text: 'Entendido' }],
      );
      return;
    }
    router.push('/(tabs)/asistente');
  }

  function handleClearRoute() {
    Alert.alert(
      'Limpiar ruta',
      '¿Eliminar todos los puntos de ruta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Limpiar', style: 'destructive', onPress: clearPlan },
      ],
    );
  }

  function handleExportGPX() {
    Alert.alert('Próximamente', 'La exportación GPX estará disponible en la próxima versión.');
  }

  // Plan name input
  const planNameInput = (
    <View style={styles.nameInputWrapper}>
      <Ionicons name="pencil-outline" size={16} color={c.muted} style={{ marginRight: 8 }} />
      <TextInput
        value={planName}
        onChangeText={setPlanName}
        placeholder="Nombre de la ruta"
        placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
        style={[styles.nameInput, { color: c.text, borderBottomColor: c.border }]}
      />
    </View>
  );

  // Sidebar action buttons
  const actionButtons = (
    <View style={styles.actionButtons}>
      <Button
        label="Analizar con IA"
        onPress={handleAnalyzeWithAI}
        variant="primary"
        leftIcon="sparkles"
        fullWidth
      />
      <View style={styles.actionButtonSpacer} />
      <Button
        label="Exportar GPX"
        onPress={handleExportGPX}
        variant="secondary"
        leftIcon="download-outline"
        fullWidth
      />
      <View style={styles.actionButtonSpacer} />
      <Button
        label="Limpiar ruta"
        onPress={handleClearRoute}
        variant="ghost"
        leftIcon="trash-outline"
        fullWidth
      />
    </View>
  );

  // Empty state shown over map area when no waypoints
  const emptyState = (
    <View style={styles.emptyState} pointerEvents="none">
      <View style={styles.emptyIconWrap}>
        <Ionicons name="location-outline" size={32} color="#22c55e" />
      </View>
      <Text style={styles.emptyTitle}>Construye tu ruta</Text>
      <Text style={styles.emptyText}>Toca cualquier punto del mapa{'\n'}para añadir un waypoint</Text>
    </View>
  );

  // ── WIDE LAYOUT (tablet / desktop) ──────────────────────────────
  if (isWide) {
    return (
      <View style={[styles.root, { backgroundColor: c.bg }]}>
        <ScreenHeader
          title="Planificar"
          subtitle="Diseña tu caminata"
        />
        <View style={styles.wideContainer}>
          {/* Sidebar */}
          <View style={[styles.sidebar, { backgroundColor: c.surface, borderRightColor: c.border }]}>
            {/* Premium sidebar header */}
            <View style={[styles.sidebarHeader, { borderBottomColor: c.border }]}>
              <View style={styles.sidebarHeaderTop}>
                <View style={styles.sidebarIconWrap}>
                  <Ionicons name="map-outline" size={18} color="#22c55e" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sidebarTitle, { color: c.text }]}>Constructor de ruta</Text>
                  <Text style={[styles.sidebarSubtitle, { color: c.muted }]}>
                    {waypoints.length === 0
                      ? 'Toca el mapa para añadir puntos'
                      : `${waypoints.length} punto${waypoints.length !== 1 ? 's' : ''} añadido${waypoints.length !== 1 ? 's' : ''}`}
                  </Text>
                </View>
              </View>
              {planNameInput}
            </View>

            <RouteStats />
            <View style={styles.sidebarList}>
              <WaypointList />
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
            >
              {actionButtons}
              <ParquesNacionalesSection c={c} />
            </ScrollView>
          </View>

          {/* Map */}
          <View style={styles.mapFlex}>
            <MapLeaflet
              onMapPress={handleMapPress}
              waypoints={waypoints}
              height="100%"
              layer="topo"
            />
            {waypoints.length === 0 && emptyState}
          </View>
        </View>
      </View>
    );
  }

  // ── MOBILE LAYOUT ────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: c.bg }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader
        title="Planificar"
        subtitle="Diseña tu caminata"
      />

      {planNameInput}

      {/* Tab switcher */}
      <View style={[styles.tabRow, { backgroundColor: c.surface, borderColor: c.border }]}>
        <TouchableOpacity
          onPress={() => setMobileTab('mapa')}
          style={[styles.tabPill, mobileTab === 'mapa' && [styles.tabPillActive, { backgroundColor: c.elevated }]]}
          activeOpacity={0.8}
        >
          <Ionicons
            name="map-outline"
            size={14}
            color={mobileTab === 'mapa' ? c.text : c.muted}
          />
          <Text style={[styles.tabLabel, { color: mobileTab === 'mapa' ? c.text : c.muted }]}>
            Mapa
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setMobileTab('puntos')}
          style={[styles.tabPill, mobileTab === 'puntos' && [styles.tabPillActive, { backgroundColor: c.elevated }]]}
          activeOpacity={0.8}
        >
          <Ionicons
            name="location-outline"
            size={14}
            color={mobileTab === 'puntos' ? c.text : c.muted}
          />
          <Text style={[styles.tabLabel, { color: mobileTab === 'puntos' ? c.text : c.muted }]}>
            Puntos ({waypoints.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.mapFlex}>
        {mobileTab === 'mapa' ? (
          <>
            <MapLeaflet
              onMapPress={handleMapPress}
              waypoints={waypoints}
              height="100%"
              layer="topo"
            />
            {waypoints.length === 0 && emptyState}
          </>
        ) : (
          <ScrollView
            style={styles.mapFlex}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1 }}
          >
            <WaypointList />
            {actionButtons}
            <ParquesNacionalesSection c={c} />
          </ScrollView>
        )}
      </View>

      {/* Stats always visible */}
      <RouteStats />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  // Name input
  nameInputWrapper: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  nameInput: {
    fontSize: 20,
    fontWeight: '700',
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    paddingVertical: 8,
    letterSpacing: -0.3,
  },

  // Tab switcher
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  tabPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
  },
  tabPillActive: {},
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabLabelActive: {},

  // Map
  mapFlex: {
    flex: 1,
    position: 'relative',
  },

  // Empty state
  emptyState: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(34,197,94,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.2)',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f0f9ff',
    letterSpacing: -0.3,
  },
  emptyText: {
    fontSize: 14,
    color: '#57534e',
    fontWeight: '500',
    textAlign: 'center',
  },

  // Action buttons
  actionButtons: {
    padding: 16,
  },
  actionButtonSpacer: {
    height: 8,
  },

  // Sidebar header
  sidebarHeader: {
    padding: 16,
    borderBottomWidth: 1,
  },
  sidebarHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  sidebarIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(34,197,94,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.2)',
  },
  sidebarTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f0f9ff',
    letterSpacing: -0.2,
  },
  sidebarSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 1,
  },

  // Wide layout
  wideContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 320,
    borderRightWidth: 1,
    flexDirection: 'column',
  },
  sidebarList: {
    flex: 1,
  },
});
