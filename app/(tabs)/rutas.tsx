import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
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
  const [region, setRegion] = useState<TrailRegion>('Todas');

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

  const openTrail = (url: string) => {
    Linking.openURL(url).catch(() =>
      Alert.alert('Error', 'No se pudo abrir el enlace.')
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={['top']}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { borderBottomColor: c.border, paddingHorizontal: sidePad },
        ]}
      >
        <View>
          <Text style={[styles.headerTitle, { color: c.text }]}>Rutas Argentina</Text>
          <Text style={[styles.headerSub, { color: c.muted }]}>
            {ARGENTINA_TRAILS.length} senderos · thecrag.com
          </Text>
        </View>
        <View style={[styles.sourceBadge, { backgroundColor: c.elevated, borderColor: c.border }]}>
          <Ionicons name="earth-outline" size={13} color="#22c55e" />
          <Text style={[styles.sourceText, { color: c.muted }]}>thecrag.com</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: sidePad }]}
      >
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
                <Text style={[styles.sectionLabel, { color: c.muted }]}>DESTACADA</Text>
                <FeaturedTrailCard
                  trail={featured}
                  onPress={() => openTrail(featured.thecrag_url)}
                />

                {/* Trail description */}
                <View
                  style={[
                    styles.descCard,
                    { backgroundColor: c.surface, borderColor: c.border },
                  ]}
                >
                  <Text style={[styles.descText, { color: c.muted }]}>
                    {featured.description}
                  </Text>
                  <View style={styles.descMeta}>
                    <Ionicons name="location-outline" size={13} color={c.muted} />
                    <Text style={[styles.descMetaText, { color: c.muted }]}>
                      {featured.trailhead}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.cragLink}
                    onPress={() => openTrail(featured.thecrag_url)}
                  >
                    <Ionicons name="open-outline" size={13} color="#22c55e" />
                    <Text style={styles.cragLinkText}>Ver en thecrag.com</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Rest of trails */}
            {rest.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, { color: c.muted }]}>
                  TODAS LAS RUTAS ({filtered.length})
                </Text>

                {isWide ? (
                  // Two-column grid on tablet/desktop
                  <View style={styles.grid}>
                    {rest.map((t) => (
                      <View key={t.id} style={styles.gridCell}>
                        <TrailListCard
                          trail={t}
                          onPress={() => openTrail(t.thecrag_url)}
                          colors={c}
                        />
                      </View>
                    ))}
                  </View>
                ) : (
                  rest.map((t) => (
                    <TrailListCard
                      key={t.id}
                      trail={t}
                      onPress={() => openTrail(t.thecrag_url)}
                      colors={c}
                    />
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
            Datos curados de{' '}
            <Text
              style={{ color: '#22c55e' }}
              onPress={() =>
                Linking.openURL('https://www.thecrag.com/en/climbing/argentina')
              }
            >
              thecrag.com/argentina
            </Text>
            . Solo Argentina.
          </Text>
        </View>

        {Platform.OS === 'web' && <WebFooter />}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
  headerSub: { fontSize: 12, marginTop: 2 },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  sourceText: { fontSize: 11, fontWeight: '600' },

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

  descCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginTop: 10,
    gap: 8,
  },
  descText: { fontSize: 13, lineHeight: 20 },
  descMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  descMetaText: { fontSize: 12 },
  cragLink: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  cragLinkText: { fontSize: 12, color: '#22c55e', fontWeight: '600' },

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
