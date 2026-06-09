import React, { useEffect, useState } from 'react';
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
import { GalleryLightbox } from '../../src/components/ui/GalleryLightbox';
import { useTheme } from '../../src/hooks/useTheme';
import { useAuthStore } from '../../src/store/authStore';
import { useLangStore } from '../../src/store/langStore';
import { WebFooter } from '../../src/components/layout/WebFooter';
import { injectWebStyles } from '../../src/utils/webStyles';
import { animateHeroEntrance, animateScrollReveal, animateParallaxHero } from '../../src/utils/gsapAnimations';

const MAX_CONTENT = 900;

const HERO_URI =
  'https://images.unsplash.com/photo-1469521669194-babb45599def?w=1920&q=90&fit=crop&auto=format';

// Silent looping drone footage for web hero
const HERO_VIDEO_URL =
  'https://assets.mixkit.co/videos/preview/mixkit-rocky-mountains-aerial-view-4k-4379-large.mp4';

const FEATURED = [
  {
    titleEs: 'Circuito W',
    titleEn: 'W Circuit',
    subtitle: 'Torres del Paine',
    distance: '80 km',
    daysEs: '4–5 días',
    daysEn: '4–5 days',
    uri: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=700&q=80&fit=crop&auto=format',
    routeId: 'cerro-torre-base',
  },
  {
    titleEs: 'Laguna de los Tres',
    titleEn: 'Laguna de los Tres',
    subtitle: 'Los Glaciares',
    distance: '24 km',
    daysEs: '1 día',
    daysEn: '1 day',
    uri: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=700&q=80&fit=crop&auto=format',
    routeId: 'fitz-roy-laguna-tres',
  },
  {
    titleEs: 'Dientes de Navarino',
    titleEn: 'Dientes de Navarino',
    subtitle: 'Isla Navarino',
    distance: '53 km',
    daysEs: '4–5 días',
    daysEn: '4–5 days',
    uri: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=700&q=80&fit=crop&auto=format',
    routeId: 'lago-desierto-patagonia',
  },
  {
    titleEs: 'Aconcagua',
    titleEn: 'Aconcagua',
    subtitle: 'Ruta Normal',
    distance: '110 km',
    daysEs: '18–22 días',
    daysEn: '18–22 days',
    uri: 'https://images.unsplash.com/photo-1574068468668-a05a11f871da?w=700&q=80&fit=crop&auto=format',
    routeId: 'aconcagua-ruta-normal',
  },
];

const GALLERY: { uri: string; labelEs: string; labelEn: string }[] = [
  {
    uri: 'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=1920&q=90&fit=crop&auto=format',
    labelEs: 'Escalada en roca',
    labelEn: 'Rock climbing',
  },
  {
    uri: 'https://images.unsplash.com/photo-1455156218388-5e61b526818b?w=900&q=85&fit=crop&auto=format',
    labelEs: 'Paisajes de invierno',
    labelEn: 'Winter landscapes',
  },
  {
    uri: 'https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=900&q=85&fit=crop&auto=format',
    labelEs: 'Senderos remotos',
    labelEn: 'Remote trails',
  },
];

const PACK_URI =
  'https://images.unsplash.com/photo-1548248823-ce16a73b6d49?w=900&q=80&fit=crop&auto=format';

const AUTH_BG_URI =
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80&fit=crop&auto=format';

function SectionDivider({ sidePad }: { sidePad: number }) {
  if (Platform.OS !== 'web') {
    return <View style={[styles.divider, { marginHorizontal: sidePad }]} />;
  }
  return (
    <View
      style={[styles.divider, { marginHorizontal: sidePad }]}
      {...({ 'data-section-divider': true } as any)}
    />
  );
}

export default function InicioScreen() {
  useTheme();
  const { user } = useAuthStore();
  const { lang, t } = useLangStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const contentW = Math.min(width, MAX_CONTENT);
  const sidePad = Math.max(16, (width - contentW) / 2);
  const isWide = width >= 720;

  const CARD_W = Math.min(contentW * 0.62, 240);
  const CARD_H = Math.round(CARD_W * 0.65);

  const galleryGap = 10;
  const galleryInnerW = width - 2 * sidePad;
  const cellW = (galleryInnerW - galleryGap) / 2;
  const cellH = Math.round(cellW * 0.68);
  const fullW = galleryInnerW;
  const fullH = Math.round(fullW * 0.44);

  useEffect(() => {
    injectWebStyles();
    animateHeroEntrance('[data-hero]');
    animateParallaxHero('[data-hero]');
    const timer = setTimeout(() => animateScrollReveal(), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        {...(Platform.OS === 'web' ? ({ 'data-page-content': true } as any) : {})}
      >
        {/* ── HERO ── */}
        <View
          style={styles.heroWrapper}
          {...(Platform.OS === 'web' ? ({ 'data-hero': true } as any) : {})}
        >
          {/* Native: ImageBackground | Web: video with image fallback */}
          <ImageBackground
            source={{ uri: HERO_URI }}
            style={styles.hero}
            resizeMode="cover"
            imageStyle={Platform.OS !== 'web' ? undefined : { opacity: 0 }}
            {...(Platform.OS === 'web' ? ({ 'data-hero-bg': true } as any) : {})}
          >
            {/* Web: silent looping drone video */}
            {Platform.OS === 'web' && (
              // @ts-ignore — video is web-only
              <video
                src={HERO_VIDEO_URL}
                autoPlay
                muted
                loop
                playsInline
                poster={HERO_URI}
                data-hero-video
                data-hero-bg
                style={{
                  position: 'absolute',
                  top: 0, left: 0,
                  width: '100%', height: '100%',
                  objectFit: 'cover',
                  pointerEvents: 'none',
                }}
              />
            )}

            <View style={[StyleSheet.absoluteFillObject, styles.heroOverlay]} />
            <View style={[StyleSheet.absoluteFillObject, styles.heroGradientBottom]} />

            <View
              style={[
                styles.heroInner,
                { paddingTop: insets.top + 28, paddingHorizontal: sidePad },
              ]}
              {...(Platform.OS === 'web' ? ({ 'data-hero-content': true } as any) : {})}
            >
              <View
                style={styles.heroBrand}
                {...(Platform.OS === 'web' ? ({ 'data-hero-brand': true } as any) : {})}
              >
                <Text style={{ fontSize: 13 }}>🏔️</Text>
                <Text style={styles.heroBrandText}>SLIABH</Text>
                <View style={styles.heroBrandDivider} />
                <Text style={styles.heroBrandTagline}>PATAGONIA</Text>
              </View>

              <Text
                style={styles.heroTitle}
                {...(Platform.OS === 'web' ? ({ 'data-hero-title': true } as any) : {})}
              >
                {t('Explora\nsin límites', 'Explore\nwithout limits')}
              </Text>

              <Text
                style={styles.heroSub}
                {...(Platform.OS === 'web' ? ({ 'data-hero-sub': true } as any) : {})}
              >
                {t(
                  'TORRES DEL PAINE · FITZ ROY · ACONCAGUA · IA OFFLINE',
                  'TORRES DEL PAINE · FITZ ROY · ACONCAGUA · OFFLINE AI',
                )}
              </Text>

              <View style={styles.heroCtas}>
                <TouchableOpacity
                  style={styles.heroBtnPrimary}
                  onPress={() => router.push('/(tabs)/planificar')}
                  activeOpacity={0.85}
                  accessibilityLabel={t('Planificar ruta', 'Plan route')}
                  {...(Platform.OS === 'web' ? ({
                    'data-hero-cta': true,
                    'data-btn-primary': true,
                  } as any) : {})}
                >
                  <Ionicons name="map-outline" size={15} color="#fff" />
                  <Text style={styles.heroBtnPrimaryTxt}>
                    {t('Planificar ruta', 'Plan a route')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.heroBtnSecondary}
                  onPress={() => router.push('/(tabs)/mapas')}
                  activeOpacity={0.75}
                  accessibilityLabel={t('Ver mapas', 'View maps')}
                  {...(Platform.OS === 'web' ? ({ 'data-hero-cta': true } as any) : {})}
                >
                  <Text style={styles.heroBtnSecondaryTxt}>
                    {t('Ver mapas', 'View maps')}
                  </Text>
                </TouchableOpacity>
              </View>

              {Platform.OS === 'web' && (
                <View style={styles.scrollIndicator}>
                  <Ionicons name="chevron-down" size={18} color="rgba(255,255,255,0.35)" />
                </View>
              )}
            </View>
          </ImageBackground>
        </View>

        {/* ── STATS ── */}
        <View style={[styles.statsRow, { marginHorizontal: sidePad }]}>
          {[
            ['100+', t('Rutas', 'Trails')],
            ['12', t('Campamentos', 'Camps')],
            ['8', t('Refugios', 'Huts')],
          ].map(([n, l]) => (
            <View
              key={l}
              style={styles.statCard}
              {...(Platform.OS === 'web' ? ({ 'data-stat-card': true } as any) : {})}
            >
              <Text style={styles.statNum}>{n}</Text>
              <Text style={styles.statLbl}>{l}</Text>
            </View>
          ))}
        </View>

        <SectionDivider sidePad={sidePad} />

        {/* ── FEATURED ROUTES ── */}
        <View style={styles.mt4}>
          <Text
            style={[styles.sectionLabel, { marginHorizontal: sidePad }]}
            {...(Platform.OS === 'web' ? ({ 'data-section-label': true } as any) : {})}
          >
            {t('RUTAS DESTACADAS', 'FEATURED TRAILS')}
          </Text>

          {/* Desktop: 2×2 grid | Mobile: horizontal scroll */}
          {isWide ? (
            <View
              style={[styles.featuredGrid, { marginHorizontal: sidePad }]}
              {...(Platform.OS === 'web' ? ({ 'data-featured-grid': true } as any) : {})}
            >
              {FEATURED.map((r) => (
                <TouchableOpacity
                  key={r.titleEs}
                  style={[styles.featuredGridCard]}
                  onPress={() =>
                    router.push({ pathname: '/(tabs)/ruta/[id]', params: { id: r.routeId } } as any)
                  }
                  activeOpacity={0.88}
                  {...(Platform.OS === 'web' ? ({ 'data-interactive-card': true } as any) : {})}
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
                      <Text style={styles.featuredTitle}>{t(r.titleEs, r.titleEn)}</Text>
                      <Text style={styles.featuredSub}>{r.subtitle}</Text>
                      <View style={styles.featuredMeta}>
                        <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.65)" />
                        <Text style={styles.featuredMetaTxt}>{t(r.daysEs, r.daysEn)}</Text>
                      </View>
                    </View>
                  </ImageBackground>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: sidePad, gap: 12 }}
            >
              {FEATURED.map((r) => (
                <TouchableOpacity
                  key={r.titleEs}
                  style={[styles.featuredCard, { width: CARD_W, height: CARD_H }]}
                  onPress={() =>
                    router.push({ pathname: '/(tabs)/ruta/[id]', params: { id: r.routeId } } as any)
                  }
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
                      <Text style={styles.featuredTitle}>{t(r.titleEs, r.titleEn)}</Text>
                      <Text style={styles.featuredSub}>{r.subtitle}</Text>
                      <View style={styles.featuredMeta}>
                        <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.65)" />
                        <Text style={styles.featuredMetaTxt}>{t(r.daysEs, r.daysEn)}</Text>
                      </View>
                    </View>
                  </ImageBackground>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        <SectionDivider sidePad={sidePad} />

        {/* ── OFFLINE AI ── */}
        <View
          style={[styles.mt4, { marginHorizontal: sidePad }]}
          {...(Platform.OS === 'web' ? ({ 'data-reveal-card': true } as any) : {})}
        >
          <OfflineAICard />
        </View>

        <SectionDivider sidePad={sidePad} />

        {/* ── GALLERY ── */}
        <View style={styles.mt4}>
          <Text
            style={[styles.sectionLabel, { marginHorizontal: sidePad }]}
            {...(Platform.OS === 'web' ? ({ 'data-section-label': true } as any) : {})}
          >
            {t('GALERÍA', 'GALLERY')}
          </Text>
          <View style={[styles.galleryGrid, { marginHorizontal: sidePad, gap: galleryGap }]}>
            {GALLERY.map((item, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.galleryCell,
                  i === 0
                    ? { width: fullW, height: fullH }
                    : { width: cellW, height: cellH },
                ]}
                activeOpacity={0.9}
                onPress={() => setLightboxIndex(i)}
                {...(Platform.OS === 'web' ? ({ 'data-interactive-card': true } as any) : {})}
              >
                <ImageBackground
                  source={{ uri: item.uri }}
                  style={StyleSheet.absoluteFillObject}
                  resizeMode="cover"
                >
                  <View style={[StyleSheet.absoluteFillObject, styles.galleryOverlay]} />
                  <View
                    style={styles.galleryLabel}
                    {...(Platform.OS === 'web' ? ({ 'data-gallery-label': true } as any) : {})}
                  >
                    <Text style={styles.galleryLabelTxt}>
                      {t(item.labelEs, item.labelEn)}
                    </Text>
                  </View>
                  {/* Expand icon */}
                  <View style={styles.galleryExpandIcon}>
                    <Ionicons name="expand-outline" size={16} color="rgba(255,255,255,0.6)" />
                  </View>
                </ImageBackground>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <SectionDivider sidePad={sidePad} />

        {/* ── QUICK ACTIONS ── */}
        <View style={[styles.mt4, { marginHorizontal: sidePad }]}>
          <Text
            style={styles.sectionLabel}
            {...(Platform.OS === 'web' ? ({ 'data-section-label': true } as any) : {})}
          >
            {t('EXPLORAR', 'EXPLORE')}
          </Text>
          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.78}
            onPress={() => router.push('/(tabs)/planificar')}
            {...(Platform.OS === 'web' ? ({
              'data-reveal-card': true,
              'data-interactive-card': true,
            } as any) : {})}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="map-outline" size={22} color="#fff" />
            </View>
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>{t('Planificar caminata', 'Plan a hike')}</Text>
              <Text style={styles.actionDesc}>
                {t(
                  'Traza tu próxima ruta y analízala con IA',
                  'Map your next route and analyse it with AI',
                )}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#4a5568" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionCard, styles.mt3]}
            activeOpacity={0.78}
            onPress={() => router.push('/(tabs)/contribuir')}
            {...(Platform.OS === 'web' ? ({
              'data-reveal-card': true,
              'data-interactive-card': true,
            } as any) : {})}
          >
            <View style={styles.actionIcon}>
              <Ionicons name="pencil-outline" size={22} color="#fff" />
            </View>
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>
                {t('Contribuir al mapa', 'Contribute to the map')}
              </Text>
              <Text style={styles.actionDesc}>
                {t(
                  'Ayuda a la comunidad con datos de senderos',
                  'Help the community with trail data',
                )}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#4a5568" />
          </TouchableOpacity>
        </View>

        <SectionDivider sidePad={sidePad} />

        {/* ── PACK ACTIVO ── */}
        <View
          style={[styles.mt4, { marginHorizontal: sidePad }]}
          {...(Platform.OS === 'web' ? ({ 'data-reveal-card': true } as any) : {})}
        >
          <Text
            style={styles.sectionLabel}
            {...(Platform.OS === 'web' ? ({ 'data-section-label': true } as any) : {})}
          >
            {t('PACK ACTIVO', 'ACTIVE PACK')}
          </Text>
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
                <Text style={styles.packRegion}>{t('Patagonia, Chile', 'Patagonia, Chile')}</Text>
              </View>
              <View style={styles.packBadge}>
                <Ionicons name="cloud-done-outline" size={13} color="#34d399" />
                <Text style={styles.packBadgeTxt}>Offline</Text>
              </View>
            </View>
            <View style={styles.packDivider} />
            <Text style={styles.packMeta}>
              v2.4.1 · {t('Región sur', 'Southern Region')} · 1.2 GB
            </Text>
          </View>
        </View>

        {/* ── AUTH BANNER ── */}
        {!user && (
          <TouchableOpacity
            style={[styles.authBanner, { marginHorizontal: sidePad }]}
            activeOpacity={0.85}
            onPress={() => router.push('/(auth)/login')}
            {...(Platform.OS === 'web' ? ({ 'data-auth-banner': true } as any) : {})}
          >
            <ImageBackground
              source={{ uri: AUTH_BG_URI }}
              style={StyleSheet.absoluteFillObject}
              resizeMode="cover"
            >
              <View style={[StyleSheet.absoluteFillObject, styles.authBannerOverlay]} />
            </ImageBackground>
            <View style={styles.authBannerInner}>
              <View style={styles.authBannerIcon}>
                <Ionicons name="person-outline" size={20} color="#22c55e" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.authBannerTitle}>
                  {t('Únete a la comunidad', 'Join the community')}
                </Text>
                <Text style={styles.authBannerSub}>
                  {t(
                    'Guarda rutas, contribuye y accede sin límites',
                    'Save routes, contribute and access without limits',
                  )}
                </Text>
              </View>
              <View style={styles.authBannerCta}>
                <Text style={styles.authBannerCtaTxt}>
                  {t('Entrar', 'Sign in')}
                </Text>
                <Ionicons name="arrow-forward" size={14} color="#fff" />
              </View>
            </View>
          </TouchableOpacity>
        )}

        {Platform.OS === 'web' && <WebFooter />}
      </ScrollView>

      {/* ── GALLERY LIGHTBOX ── */}
      <GalleryLightbox
        items={GALLERY}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        lang={lang}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#070b14' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 48 },

  // Hero
  heroWrapper: { width: '100%', overflow: 'hidden' },
  hero: { width: '100%', minHeight: 520, maxHeight: 700 },
  heroOverlay: { backgroundColor: 'rgba(7,11,20,0.42)' },
  heroGradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 220,
    backgroundColor: 'transparent',
    // On web webStyles injects a proper CSS gradient; on native this is a soft fade
    opacity: 0.85,
  },
  heroInner: {
    minHeight: 520,
    maxHeight: 700,
    justifyContent: 'flex-end',
    paddingBottom: 52,
  },
  heroBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 22,
  },
  heroBrandText: { fontSize: 11, fontWeight: '800', color: '#22c55e', letterSpacing: 3.5 },
  heroBrandDivider: { width: 1, height: 12, backgroundColor: 'rgba(255,255,255,0.2)' },
  heroBrandTagline: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 2,
  },
  heroTitle: {
    fontSize: 52,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -2.5,
    lineHeight: 56,
    marginBottom: 12,
  },
  heroSub: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.42)',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 30,
  },
  heroCtas: { flexDirection: 'row', gap: 12 },
  heroBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#16a34a',
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 999,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  heroBtnPrimaryTxt: { color: '#fff', fontSize: 14, fontWeight: '700' },
  heroBtnSecondary: {
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  heroBtnSecondaryTxt: { color: '#fff', fontSize: 14, fontWeight: '600' },
  scrollIndicator: { marginTop: 20, alignItems: 'center', opacity: 0.6 },

  // Stats
  statsRow: { flexDirection: 'row', marginTop: 28, gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: '#0f1724',
    borderWidth: 1,
    borderColor: '#1e2d42',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  statNum: { fontSize: 24, fontWeight: '800', color: '#4ade80', letterSpacing: -0.5 },
  statLbl: { fontSize: 11, color: '#78716c', marginTop: 3, fontWeight: '500' },

  // Divider
  divider: {
    height: 1,
    backgroundColor: '#1e2d42',
    marginVertical: 32,
    opacity: 0.5,
  },

  // Shared
  mt4: { marginTop: 0 },
  mt3: { marginTop: 12 },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#78716c',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 14,
  },

  // Featured — desktop 2×2 grid
  featuredGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featuredGridCard: {
    width: '48.5%',
    aspectRatio: 1.55,
    borderRadius: 20,
    overflow: 'hidden',
  },

  // Featured — mobile horizontal card
  featuredCard: { borderRadius: 20, overflow: 'hidden' },
  featuredOverlay: { backgroundColor: 'rgba(0,0,0,0.32)' },
  featuredContent: { flex: 1, padding: 14 },
  featuredBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(22,163,74,0.88)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  featuredBadgeTxt: { color: '#fff', fontSize: 11, fontWeight: '700' },
  featuredTitle: { fontSize: 17, fontWeight: '800', color: '#fff', marginBottom: 3 },
  featuredSub: { fontSize: 12, color: 'rgba(255,255,255,0.68)', marginBottom: 8 },
  featuredMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  featuredMetaTxt: { fontSize: 11, color: 'rgba(255,255,255,0.58)' },

  // Gallery
  galleryGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  galleryCell: { borderRadius: 16, overflow: 'hidden', backgroundColor: '#0f1724' },
  galleryOverlay: { backgroundColor: 'rgba(7,11,20,0.15)' },
  galleryLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'flex-end',
  },
  galleryLabelTxt: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  galleryExpandIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },

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
    width: 44,
    height: 44,
    borderRadius: 22,
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
  packCard: { borderRadius: 22, overflow: 'hidden', padding: 20, backgroundColor: '#0f1724' },
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

  // Auth banner — premium card with bg image
  authBanner: {
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(22,163,74,0.28)',
    minHeight: 90,
  },
  authBannerOverlay: { backgroundColor: 'rgba(7,11,20,0.72)' },
  authBannerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    gap: 14,
  },
  authBannerIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(22,163,74,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(22,163,74,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  authBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 2,
  },
  authBannerSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 17,
  },
  authBannerCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#16a34a',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    flexShrink: 0,
  },
  authBannerCtaTxt: { fontSize: 13, fontWeight: '700', color: '#fff' },
});
