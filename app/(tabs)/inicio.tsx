import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { OfflineAICard } from '../../src/components/ui/OfflineAICard';
import { useTheme } from '../../src/hooks/useTheme';
import { useAuthStore } from '../../src/store/authStore';
import { WebFooter } from '../../src/components/layout/WebFooter';

const MAX_CONTENT = 900;

const HERO_URI =
  'https://images.unsplash.com/photo-1469521669194-babb45599def?w=1400&q=85&fit=crop&auto=format';

const FEATURED = [
  {
    title: 'Circuito W',
    subtitle: 'Torres del Paine',
    distance: '80 km',
    days: '4–5 días',
    uri: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=700&q=80&fit=crop&auto=format',
    routeId: 'cerro-torre-base',
  },
  {
    title: 'Laguna de los Tres',
    subtitle: 'Los Glaciares',
    distance: '24 km',
    days: '1 día',
    uri: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=700&q=80&fit=crop&auto=format',
    routeId: 'fitz-roy-laguna-tres',
  },
  {
    title: 'Dientes de Navarino',
    subtitle: 'Isla Navarino',
    distance: '53 km',
    days: '4–5 días',
    uri: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=700&q=80&fit=crop&auto=format',
    routeId: 'lago-desierto-patagonia',
  },
  {
    title: 'Aconcagua',
    subtitle: 'Ruta Normal',
    distance: '110 km',
    days: '18–22 días',
    uri: 'https://images.unsplash.com/photo-1574068468668-a05a11f871da?w=700&q=80&fit=crop&auto=format',
    routeId: 'aconcagua-ruta-normal',
  },
];

const GALLERY = [
  'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=600&q=80&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1455156218388-5e61b526818b?w=600&q=80&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=600&q=80&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=600&q=80&fit=crop&auto=format',
];

const PACK_URI =
  'https://images.unsplash.com/photo-1548248823-ce16a73b6d49?w=900&q=80&fit=crop&auto=format';

export default function InicioScreen() {
  useTheme();
  const { user } = useAuthStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const contentW = Math.min(width, MAX_CONTENT);
  const sidePad = Math.max(16, (width - contentW) / 2);

  // Card size: capped so they don't get massive on desktop
  const CARD_W = Math.min(contentW * 0.62, 240);
  const CARD_H = Math.round(CARD_W * 0.65);

  // Gallery cell sizes — use actual container inner width (contentW minus horizontal padding)
  const galleryGap = 8;
  const galleryInnerW = width - 2 * sidePad;
  const cellW = (galleryInnerW - galleryGap) / 2;
  const cellH = Math.round(cellW * 0.56);
  const fullW = galleryInnerW;
  const fullH = Math.round(fullW * 0.42);

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── HERO ── */}
        <ImageBackground source={{ uri: HERO_URI }} style={styles.hero} resizeMode="cover">
          <View style={[StyleSheet.absoluteFillObject, styles.heroOverlay]} />
          <View
            style={[
              styles.heroInner,
              { paddingTop: insets.top + 28, paddingHorizontal: sidePad },
            ]}
          >
            <View style={styles.heroBrand}>
              <Text style={{ fontSize: 13 }}>🏔️</Text>
              <Text style={styles.heroBrandText}>SLIABH</Text>
            </View>
            <Text style={styles.heroTitle}>{'Explora\nsin límites'}</Text>
            <Text style={styles.heroSub}>PATAGONIA · TORRES DEL PAINE · IA OFFLINE</Text>
            <View style={styles.heroCtas}>
              <TouchableOpacity
                style={styles.heroBtnPrimary}
                onPress={() => router.push('/(tabs)/planificar')}
                activeOpacity={0.85}
              >
                <Ionicons name="map-outline" size={15} color="#fff" />
                <Text style={styles.heroBtnPrimaryTxt}>Planificar ruta</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.heroBtnSecondary}
                onPress={() => router.push('/(tabs)/mapas')}
                activeOpacity={0.75}
              >
                <Text style={styles.heroBtnSecondaryTxt}>Ver mapas</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ImageBackground>

        {/* ── STATS ── */}
        <View style={[styles.statsRow, { marginHorizontal: sidePad }]}>
          {[['23', 'Rutas'], ['12', 'Campamentos'], ['8', 'Refugios']].map(([n, l]) => (
            <View key={l} style={styles.statCard}>
              <Text style={styles.statNum}>{n}</Text>
              <Text style={styles.statLbl}>{l}</Text>
            </View>
          ))}
        </View>

        {/* ── FEATURED ROUTES ── */}
        <View style={styles.mt8}>
          <Text style={[styles.sectionLabel, { marginHorizontal: sidePad }]}>RUTAS DESTACADAS</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: sidePad, gap: 12 }}
          >
            {FEATURED.map((r) => (
              <TouchableOpacity
                key={r.title}
                style={[styles.featuredCard, { width: CARD_W, height: CARD_H }]}
                onPress={() => router.push({ pathname: '/(tabs)/ruta/[id]', params: { id: r.routeId } } as any)}
                activeOpacity={0.88}
              >
                <ImageBackground
                  source={{ uri: r.uri }}
                  style={StyleSheet.absoluteFillObject}
                  resizeMode="cover"
                >
                  <View style={[StyleSheet.absoluteFillObject, styles.featuredOverlay]} />
                  <View style={styles.featuredContent}>
                    <View style={styles.featuredBadge}>
                      <Text style={styles.featuredBadgeTxt}>{r.distance}</Text>
                    </View>
                    <View style={{ flex: 1 }} />
                    <Text style={styles.featuredTitle}>{r.title}</Text>
                    <Text style={styles.featuredSub}>{r.subtitle}</Text>
                    <View style={styles.featuredMeta}>
                      <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.65)" />
                      <Text style={styles.featuredMetaTxt}>{r.days}</Text>
                    </View>
                  </View>
                </ImageBackground>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── OFFLINE AI ── */}
        <View style={[styles.mt8, { marginHorizontal: sidePad }]}>
          <OfflineAICard />
        </View>

        {/* ── GALLERY ── */}
        <View style={styles.mt8}>
          <Text style={[styles.sectionLabel, { marginHorizontal: sidePad }]}>GALERÍA</Text>
          <View style={[styles.galleryGrid, { marginHorizontal: sidePad, gap: galleryGap }]}>
            {GALLERY.map((uri, i) => (
              <View
                key={i}
                style={[
                  styles.galleryCell,
                  i === 0
                    ? { width: fullW, height: fullH }
                    : { width: cellW, height: cellH },
                ]}
              >
                <ImageBackground
                  source={{ uri }}
                  style={StyleSheet.absoluteFillObject}
                  resizeMode="cover"
                >
                  <View style={[StyleSheet.absoluteFillObject, styles.galleryOverlay]} />
                </ImageBackground>
              </View>
            ))}
          </View>
        </View>

        {/* ── QUICK ACTIONS ── */}
        <View style={[styles.mt8, { marginHorizontal: sidePad }]}>
          <Text style={styles.sectionLabel}>EXPLORAR</Text>
          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.78}
            onPress={() => router.push('/(tabs)/planificar')}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="map-outline" size={22} color="#fff" />
            </View>
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>Planificar caminata</Text>
              <Text style={styles.actionDesc}>Traza tu próxima ruta y analízala con IA</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#4a5568" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionCard, styles.mt3]}
            activeOpacity={0.78}
            onPress={() => router.push('/(tabs)/contribuir')}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="pencil-outline" size={22} color="#fff" />
            </View>
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>Contribuir al mapa</Text>
              <Text style={styles.actionDesc}>Ayuda a la comunidad con datos de senderos</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#4a5568" />
          </TouchableOpacity>
        </View>

        {/* ── PACK ACTIVO ── */}
        <View style={[styles.mt8, { marginHorizontal: sidePad }]}>
          <Text style={styles.sectionLabel}>PACK ACTIVO</Text>
          <View style={styles.packCard}>
            <ImageBackground
              source={{ uri: PACK_URI }}
              style={StyleSheet.absoluteFillObject}
              resizeMode="cover"
            >
              <View style={[StyleSheet.absoluteFillObject, styles.packOverlay]} />
            </ImageBackground>
            <View style={styles.packRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.packName}>Torres del Paine</Text>
                <Text style={styles.packRegion}>Patagonia, Chile</Text>
              </View>
              <View style={styles.packBadge}>
                <Ionicons name="cloud-done-outline" size={13} color="#34d399" />
                <Text style={styles.packBadgeTxt}>Offline</Text>
              </View>
            </View>
            <View style={styles.packDivider} />
            <Text style={styles.packMeta}>v2.4.1 · Región sur · 1.2 GB</Text>
          </View>
        </View>

        {/* ── AUTH BANNER ── */}
        {!user && (
          <TouchableOpacity
            style={[styles.authBanner, { marginHorizontal: sidePad }]}
            activeOpacity={0.8}
            onPress={() => router.push('/(auth)/login')}
          >
            <Ionicons name="person-circle-outline" size={28} color="#16a34a" />
            <Text style={styles.authText}>Inicia sesión para guardar tus rutas</Text>
            <Ionicons name="chevron-forward" size={18} color="#4a5568" />
          </TouchableOpacity>
        )}

        {Platform.OS === 'web' && <WebFooter />}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#070b14' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 48 },

  // Hero — capped height so it doesn't fill a 27" monitor
  hero: { width: '100%', minHeight: 460, maxHeight: 640 },
  heroOverlay: { backgroundColor: 'rgba(7,11,20,0.52)' },
  heroInner: {
    minHeight: 460,
    maxHeight: 640,
    justifyContent: 'flex-end',
    paddingBottom: 40,
  },
  heroBrand: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  heroBrandText: { fontSize: 11, fontWeight: '800', color: '#22c55e', letterSpacing: 3.5 },
  heroTitle: {
    fontSize: 48,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -2,
    lineHeight: 52,
    marginBottom: 10,
  },
  heroSub: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginBottom: 28,
  },
  heroCtas: { flexDirection: 'row', gap: 10 },
  heroBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#16a34a',
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 999,
  },
  heroBtnPrimaryTxt: { color: '#fff', fontSize: 14, fontWeight: '700' },
  heroBtnSecondary: {
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  heroBtnSecondaryTxt: { color: '#fff', fontSize: 14, fontWeight: '600' },

  // Stats
  statsRow: { flexDirection: 'row', marginTop: 20, gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: '#0f1724',
    borderWidth: 1,
    borderColor: '#1e2d42',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  statNum: { fontSize: 22, fontWeight: '700', color: '#4ade80', letterSpacing: -0.5 },
  statLbl: { fontSize: 11, color: '#78716c', marginTop: 3, fontWeight: '500' },

  // Shared
  mt8: { marginTop: 32 },
  mt3: { marginTop: 12 },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#78716c',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 14,
  },

  // Featured cards (width/height set inline)
  featuredCard: { borderRadius: 20, overflow: 'hidden' },
  featuredOverlay: { backgroundColor: 'rgba(0,0,0,0.38)' },
  featuredContent: { flex: 1, padding: 14 },
  featuredBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(22,163,74,0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  featuredBadgeTxt: { color: '#fff', fontSize: 11, fontWeight: '700' },
  featuredTitle: { fontSize: 17, fontWeight: '800', color: '#fff', marginBottom: 3 },
  featuredSub: { fontSize: 12, color: 'rgba(255,255,255,0.68)', marginBottom: 8 },
  featuredMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  featuredMetaTxt: { fontSize: 11, color: 'rgba(255,255,255,0.58)' },

  // Gallery (width/height set inline)
  galleryGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  galleryCell: { borderRadius: 16, overflow: 'hidden', backgroundColor: '#0f1724' },
  galleryOverlay: { backgroundColor: 'rgba(7,11,20,0.12)' },

  // Action cards
  actionCard: {
    backgroundColor: '#0f1724',
    borderWidth: 1,
    borderColor: '#1e2d42',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    flexShrink: 0,
  },
  actionText: { flex: 1 },
  actionTitle: { fontSize: 15, fontWeight: '700', color: '#f1f5f9', marginBottom: 2 },
  actionDesc: { fontSize: 12, color: '#78716c', lineHeight: 17 },

  // Pack activo
  packCard: {
    borderRadius: 22,
    overflow: 'hidden',
    padding: 20,
    backgroundColor: '#0f1724',
  },
  packOverlay: { backgroundColor: 'rgba(7,11,20,0.68)' },
  packRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  packName: { fontSize: 16, fontWeight: '700', color: '#f1f5f9', marginBottom: 2 },
  packRegion: { fontSize: 12, color: 'rgba(255,255,255,0.55)' },
  packBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52,211,153,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.28)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 5,
  },
  packBadgeTxt: { fontSize: 11, fontWeight: '600', color: '#34d399' },
  packDivider: {
    marginTop: 14,
    marginBottom: 10,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  packMeta: { fontSize: 11, color: 'rgba(255,255,255,0.35)' },

  // Auth banner
  authBanner: {
    marginTop: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(22,163,74,0.22)',
    backgroundColor: 'rgba(22,163,74,0.06)',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  authText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#d1d5db' },
});
