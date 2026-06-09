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
import { useRouter } from 'expo-router';
import { animateScrollReveal } from '../../src/utils/gsapAnimations';
import { useTheme } from '../../src/hooks/useTheme';
import { useLangStore } from '../../src/store/langStore';
import {
  ARGENTINA_TRAILS,
  TRAIL_REGIONS,
  filterByRegion,
  type TrailRegion,
} from '../../src/data/argentinaTrails';
import { FeaturedTrailCard, TrailListCard } from '../../src/components/trails/TrailCard';
import { WebFooter } from '../../src/components/layout/WebFooter';

const MAX_CONTENT = 900;

export default function RutasScreen() {
  const { isDark } = useTheme();
  const { width } = useWindowDimensions();
  const router = useRouter();
  const [region, setRegion] = useState<TrailRegion>('Todas');
  const { t } = useLangStore();

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

  const filtered = useMemo(() => filterByRegion(ARGENTINA_TRAILS, region), [region]);
  const [featured, ...rest] = filtered;

  const contentW = Math.min(width, MAX_CONTENT);
  const sidePad = Math.max(16, (width - contentW) / 2);

  const isWide = width >= 768;

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: sidePad }]}
      >
        {/* Header — scrolls with content */}
        <View style={{ paddingTop: 24, paddingBottom: 8 }}>
          <Text style={[styles.headerTitle, { color: c.text }]}>
            {t('Rutas', 'Trails')}
          </Text>
          <Text style={[styles.headerSub, { color: c.muted }]}>
            {ARGENTINA_TRAILS.length} {t('senderos en Argentina', 'trails across Argentina')}
          </Text>
        </View>

        {/* Region filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.chips, { marginHorizontal: -sidePad, paddingHorizontal: sidePad }]}
        >
          {TRAIL_REGIONS.map((r) => {
            const active = region === r;
            return (
              <TouchableOpacity
                key={r}
                onPress={() => setRegion(r)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? '#16a34a' : c.surface,
                    borderColor: active ? '#16a34a' : c.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: active ? '#fff' : c.muted },
                  ]}
                >
                  {r}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="map-outline" size={40} color={c.muted} />
            <Text style={[styles.emptyText, { color: c.muted }]}>
              Sin rutas para esta región aún
            </Text>
          </View>
        ) : (
          <>
            {/* Featured trail */}
            {featured && (
              <View style={styles.section}>
                <FeaturedTrailCard trail={featured} onPress={() => goToTrail(featured.id)} />
              </View>
            )}

            {/* Rest of trails */}
            {rest.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: c.muted }]}>
                  {filtered.length} {t('RUTAS', 'TRAILS')}
                </Text>

                {isWide ? (
                  // Two-column grid on tablet/desktop
                  <View style={styles.grid}>
                    {rest.map((t) => (
                      <View key={t.id} style={styles.gridCell}>
                        <TrailListCard trail={t} onPress={() => goToTrail(t.id)} colors={c} />
                      </View>
                    ))}
                  </View>
                ) : (
                  rest.map((t) => (
                    <TrailListCard key={t.id} trail={t} onPress={() => goToTrail(t.id)} colors={c} />
                  ))
                )}
              </View>
            )}
          </>
        )}

        {/* Attribution footer */}
        <View style={[styles.footer, { borderTopColor: c.border }]}>
          <Ionicons name="information-circle-outline" size={14} color={c.muted} />
          <Text style={[styles.footerText, { color: c.muted }]}>
            Senderos de Argentina curados por el equipo de Sliabh. Verifica siempre
            las condiciones locales antes de salir a la montaña.
          </Text>
        </View>

        {Platform.OS === 'web' && <WebFooter />}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    paddingVertical: 14,
  },
  headerTitle: { fontSize: 32, fontWeight: '900', letterSpacing: -1 },
  headerSub: { fontSize: 13, marginTop: 4 },

  scrollContent: { paddingBottom: 48 },

  chips: { flexDirection: 'row', gap: 8, paddingVertical: 16 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: '600' },

  section: { marginTop: 4, marginBottom: 8 },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    marginBottom: 12,
  },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  gridCell: { width: '48.5%' },

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
});
