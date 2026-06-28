import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { animateScrollReveal } from '../../src/utils/gsapAnimations';
import { useTheme } from '../../src/hooks/useTheme';
import { useLangStore } from '../../src/store/langStore';
import {
  ARGENTINA_TRAILS,
  TRAIL_REGIONS,
  filterByRegion,
  type TrailRegion,
} from '../../src/data/argentinaTrails';
import { BARILOCHE_TRAILS } from '../../src/data/barilocheTreks';

const ALL_TRAILS = [...ARGENTINA_TRAILS, ...(BARILOCHE_TRAILS as typeof ARGENTINA_TRAILS)];
import { FeaturedTrailCard, TrailListCard } from '../../src/components/trails/TrailCard';
import { WebFooter } from '../../src/components/layout/WebFooter';

// Single 3D terrain map of the selected trail — .web / .native resolved by bundler
const TrailMap3D = Platform.OS === 'web'
  ? require('../../src/components/map/TrailMap3D.web').default
  : require('../../src/components/map/TrailMap3D.native').default;

const MAX_CONTENT = 900;
const SPLIT_BREAKPOINT = 900;

export default function RutasScreen() {
  const { isDark } = useTheme();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const params = useLocalSearchParams<{ region?: string }>();
  const [region, setRegion] = useState<TrailRegion>('Todas');

  // Deep link: /rutas?region=Patagonia%20Sur (from footer & home region cards)
  useEffect(() => {
    const requested = params.region;
    if (requested && (TRAIL_REGIONS as readonly string[]).includes(requested)) {
      setRegion(requested as TrailRegion);
    }
  }, [params.region]);

  // Keep region in URL so back-navigation from trail detail restores the filter
  function handleSetRegion(r: TrailRegion) {
    setRegion(r);
    router.setParams({ region: r });
  }
  const { t } = useLangStore();

  // Split layout state
  const isSplit = Platform.OS === 'web' && width >= SPLIT_BREAKPOINT;
  const [showMap, setShowMap] = useState(false); // mobile map toggle
  const [activeTrailId, setActiveTrailId] = useState<string | null>(null);

  // Filtered trails — declared before effects that reference them
  const filtered = useMemo(() => filterByRegion(ALL_TRAILS, region), [region]);

  // Debounce the trail that drives the 3D panel so sweeping the mouse across the
  // list doesn't remount the MapLibre map on every card; it loads when you pause.
  const [panelTrailId, setPanelTrailId] = useState<string | null>(null);
  useEffect(() => {
    const id = setTimeout(() => setPanelTrailId(activeTrailId), 220);
    return () => clearTimeout(id);
  }, [activeTrailId]);

  // The trail whose 3D terrain is shown in the map panel: the hovered/selected
  // trail if it has a GPX track, otherwise the first trail in view that has one.
  const hasTrack = (tr: any) => Array.isArray(tr?.gpxTrack) && tr.gpxTrack.length >= 2;
  const panelTrail = panelTrailId ? filtered.find((tr) => tr.id === panelTrailId) : null;
  const trackTrail =
    (panelTrail && hasTrack(panelTrail) && panelTrail) ||
    filtered.find((tr) => hasTrack(tr)) ||
    null;

  useEffect(() => {
    const timer = setTimeout(() => animateScrollReveal(), 400);
    return () => clearTimeout(timer);
  }, []);

  function goToTrail(id: string) {
    router.push({ pathname: '/(tabs)/ruta/[id]', params: { id } } as any);
  }

  const c = isDark
    ? {
        bg: '#070b14',
        surface: '#0f1724',
        elevated: '#162035',
        border: '#1e2d42',
        text: '#f0f9ff',
        muted: '#64748b',
      }
    : {
        bg: '#f8fafc',
        surface: '#ffffff',
        elevated: '#f1f5f9',
        border: '#e2e8f0',
        text: '#0f172a',
        muted: '#64748b',
      };

  const [featured, ...rest] = filtered;

  const contentW = Math.min(width, MAX_CONTENT);
  const sidePad = Math.max(16, (width - contentW) / 2);

  const isWide = width >= 768;

  // ── Single 3D map panel (shared by desktop split + mobile toggle) ──
  // Re-keyed by trail id so the terrain re-renders when the selection changes.
  const map3dPanel = trackTrail ? (
    <TrailMap3D
      key={trackTrail.id}
      track={(trackTrail as any).gpxTrack}
      trailName={trackTrail.name}
      height="100%"
    />
  ) : (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#070b14', padding: 24 }}>
      <Ionicons name="map-outline" size={40} color="#64748b" />
      <Text style={{ color: '#64748b', fontSize: 14, fontWeight: '600', textAlign: 'center', marginTop: 12 }}>
        {t('Seleccioná un sendero para ver su recorrido en 3D', 'Select a trail to see its route in 3D')}
      </Text>
    </View>
  );

  // ── Filter chips ──
  // On desktop split layout: wrap into a grid. On mobile: horizontal scroll.
  const filterChips = isSplit || isWide ? (
    <View style={[styles.chipsWrap, { paddingHorizontal: isSplit ? 16 : sidePad, paddingVertical: 14 }]}>
      {TRAIL_REGIONS.map((r) => {
        const active = region === r;
        return (
          <TouchableOpacity
            key={r}
            onPress={() => handleSetRegion(r)}
            style={[
              styles.chip,
              {
                backgroundColor: active ? '#16a34a' : c.surface,
                borderColor: active ? '#16a34a' : c.border,
              },
            ]}
          >
            <Text style={[styles.chipText, { color: active ? '#fff' : c.muted }]}>
              {r}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  ) : (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[
        styles.chips,
        { marginHorizontal: -sidePad, paddingHorizontal: sidePad },
      ]}
    >
      {TRAIL_REGIONS.map((r) => {
        const active = region === r;
        return (
          <TouchableOpacity
            key={r}
            onPress={() => handleSetRegion(r)}
            style={[
              styles.chip,
              {
                backgroundColor: active ? '#16a34a' : c.surface,
                borderColor: active ? '#16a34a' : c.border,
              },
            ]}
          >
            <Text style={[styles.chipText, { color: active ? '#fff' : c.muted }]}>
              {r}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );

  // ── Trail list content ──
  const trailListContent = (
    <>
      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="map-outline" size={40} color={c.muted} />
          <Text style={[styles.emptyText, { color: c.muted }]}>
            {t('Sin rutas para esta región aún', 'No trails for this region yet')}
          </Text>
        </View>
      ) : (
        <>
          {/* Featured trail */}
          {featured && !isSplit && (
            <View style={styles.section}>
              <FeaturedTrailCard trail={featured} onPress={() => goToTrail(featured.id)} />
            </View>
          )}

          {/* Trail list */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: c.muted }]}>
              {filtered.length} {t('RUTAS', 'TRAILS')}
            </Text>

            {isWide && !isSplit ? (
              // Two-column grid on tablet/desktop (non-split layout)
              <View style={styles.grid}>
                {(isSplit ? filtered : rest).map((trail) => (
                  <View key={trail.id} style={styles.gridCell} {...(Platform.OS === 'web' ? ({ id: `trail-card-${trail.id}` } as any) : {})}>
                    <TrailListCard
                      trail={trail}
                      onPress={() => goToTrail(trail.id)}
                      colors={c}
                    />
                  </View>
                ))}
              </View>
            ) : (
              (isSplit ? filtered : rest).map((trail) => (
                <TouchableOpacity
                  key={trail.id}
                  onPress={() => goToTrail(trail.id)}
                  {...(Platform.OS === 'web'
                    ? ({
                        id: `trail-card-${trail.id}`,
                        onMouseEnter: () => setActiveTrailId(trail.id),
                        onMouseLeave: () => setActiveTrailId(null),
                      } as any)
                    : {})}
                  style={[
                    styles.trailItemWrapper,
                    activeTrailId === trail.id && {
                      backgroundColor: isDark ? '#162035' : '#f0fdf4',
                      borderRadius: 12,
                    },
                  ]}
                  activeOpacity={0.85}
                >
                  <TrailListCard
                    trail={trail}
                    onPress={() => goToTrail(trail.id)}
                    colors={c}
                  />
                </TouchableOpacity>
              ))
            )}
          </View>
        </>
      )}

      {/* Attribution footer */}
      {!isSplit && (
        <View style={[styles.footer, { borderTopColor: c.border }]}>
          <Ionicons name="information-circle-outline" size={14} color={c.muted} />
          <Text style={[styles.footerText, { color: c.muted }]}>
            {t(
              'Senderos de Argentina curados por el equipo de Sliabh. Verifica siempre las condiciones locales antes de salir a la montaña.',
              'Argentina trails curated by the Sliabh team. Always verify local conditions before heading out.',
            )}
          </Text>
        </View>
      )}
    </>
  );

  // ── Desktop split layout ──
  if (isSplit) {
    return (
      <View style={[styles.container, { backgroundColor: c.bg, flexDirection: 'row' }]}>
        {/* Left panel: filters + trail list */}
        <View
          style={[
            styles.splitLeft,
            { borderRightWidth: 1, borderRightColor: c.border, backgroundColor: c.bg },
          ]}
        >
          {/* Left header */}
          <View style={[styles.splitHeader, { borderBottomColor: c.border }]}>
            <Text style={[styles.headerTitle, { color: c.text }]}>
              {t('Rutas', 'Trails')}
            </Text>
            <Text style={[styles.headerSub, { color: c.muted }]}>
              {filtered.length} {t('senderos', 'trails')}
            </Text>
          </View>

          {/* Chips */}
          {filterChips}

          {/* Scrollable list */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.splitListContent}
          >
            {trailListContent}
          </ScrollView>
        </View>

        {/* Right panel: single 3D terrain map of the selected trail */}
        <View style={{ flex: 1 }}>{map3dPanel}</View>
      </View>
    );
  }

  // ── Mobile / narrow layout ──
  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      {/* Mobile map toggle button */}
      {Platform.OS === 'web' && (
        <View style={[styles.mobileMapToggleBar, { borderBottomColor: c.border, backgroundColor: c.bg }]}>
          <TouchableOpacity
            onPress={() => setShowMap(false)}
            style={[
              styles.toggleBtn,
              !showMap && { backgroundColor: '#16a34a', borderColor: '#16a34a' },
              showMap && { borderColor: c.border },
            ]}
          >
            <Ionicons
              name="list-outline"
              size={14}
              color={!showMap ? '#fff' : c.muted}
            />
            <Text style={[styles.toggleBtnTxt, { color: !showMap ? '#fff' : c.muted }]}>
              {t('Lista', 'List')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowMap(true)}
            style={[
              styles.toggleBtn,
              showMap && { backgroundColor: '#16a34a', borderColor: '#16a34a' },
              !showMap && { borderColor: c.border },
            ]}
          >
            <Ionicons
              name="map-outline"
              size={14}
              color={showMap ? '#fff' : c.muted}
            />
            <Text style={[styles.toggleBtnTxt, { color: showMap ? '#fff' : c.muted }]}>
              {t('Ver mapa', 'View map')}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Map view (mobile toggle) */}
      {showMap && Platform.OS === 'web' ? (
        <View style={{ flex: 1 }}>{map3dPanel}</View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingHorizontal: sidePad }]}
        >
          {/* Header */}
          <View style={{ paddingTop: 24, paddingBottom: 8 }}>
            <Text style={[styles.headerTitle, { color: c.text }]}>
              {t('Rutas', 'Trails')}
            </Text>
            <Text style={[styles.headerSub, { color: c.muted }]}>
              {ALL_TRAILS.length} {t('senderos en Argentina', 'trails across Argentina')}
            </Text>
          </View>

          {filterChips}

          {trailListContent}

          {Platform.OS === 'web' && <WebFooter />}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  headerTitle: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  headerSub: { fontSize: 13, marginTop: 4 },

  scrollContent: { paddingBottom: 48 },

  chips: { flexDirection: 'row', gap: 8, paddingVertical: 16 },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: '600' },

  section: { marginTop: 4, marginBottom: 8 },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridCell: { flexBasis: '48%', flexGrow: 1, minWidth: 280 },

  trailItemWrapper: { marginBottom: 2 },

  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 14, fontWeight: '500' },

  footer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  footerText: { fontSize: 12, flex: 1, lineHeight: 18 },

  // Desktop split layout
  splitLeft: {
    width: 400,
    maxWidth: '45%' as any,
    flexShrink: 0,
    overflow: 'hidden',
  },
  splitHeader: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  splitListContent: {
    paddingHorizontal: 16,
    paddingBottom: 48,
  },

  // Mobile map toggle bar
  mobileMapToggleBar: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  toggleBtnTxt: { fontSize: 13, fontWeight: '600' },
});
