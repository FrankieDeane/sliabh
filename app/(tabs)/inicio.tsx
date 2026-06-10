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
import { ARGENTINA_TRAILS } from '../../src/data/argentinaTrails';

const MAX_CONTENT = 900;

const HERO_URI =
  'https://images.unsplash.com/photo-1469521669194-babb45599def?w=1920&q=90&fit=crop&auto=format';

// Silent looping mountain video for web hero
const HERO_VIDEO_URL = 'https://pixabay.com/videos/download/x-210926_medium.mp4';
const HERO_VIDEO_FALLBACK = 'https://assets.mixkit.co/videos/preview/mixkit-rocky-mountains-aerial-view-4k-4379-large.mp4';

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

const DESTINATIONS = [
  {
    id: 'patagonia',
    name: 'Patagonia',
    region: 'Santa Cruz · Tierra del Fuego',
    trailCount: 6,
    photo: 'https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=500&q=80&fit=crop&auto=format',
  },
  {
    id: 'bariloche',
    name: 'Bariloche',
    region: 'Río Negro · Neuquén',
    trailCount: 4,
    photo: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=500&q=80&fit=crop&auto=format',
  },
  {
    id: 'aconcagua',
    name: 'Aconcagua',
    region: 'Mendoza',
    trailCount: 1,
    photo: 'https://images.unsplash.com/photo-1574068468668-a05a11f871da?w=500&q=80&fit=crop&auto=format',
  },
  {
    id: 'noroeste',
    name: 'Noroeste',
    region: 'Jujuy · Salta',
    trailCount: 2,
    photo: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=500&q=80&fit=crop&auto=format',
  },
  {
    id: 'cordoba',
    name: 'Córdoba',
    region: 'Sierras',
    trailCount: 2,
    photo: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=500&q=80&fit=crop&auto=format',
  },
];

const PACK_URI =
  'https://images.unsplash.com/photo-1548248823-ce16a73b6d49?w=900&q=80&fit=crop&auto=format';

const AUTH_BG_URI =
  'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80&fit=crop&auto=format';

const FEATURE_CARDS = [
  {
    photo: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&q=80',
    icon: 'compass-outline' as const,
    titleEs: 'Explora',
    titleEn: 'Explore',
    descEs: 'Filtra por dificultad, distancia y actividad',
    descEn: 'Filter by difficulty, distance and activity',
    route: '/(tabs)/rutas' as const,
  },
  {
    photo: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
    icon: 'map-outline' as const,
    titleEs: 'Planifica',
    titleEn: 'Plan',
    descEs: 'Construye rutas con waypoints y analiza con IA',
    descEn: 'Build routes with waypoints and analyse with AI',
    route: '/(tabs)/planificar' as const,
  },
  {
    photo: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80',
    icon: 'cloud-offline-outline' as const,
    titleEs: 'Sin señal',
    titleEn: 'Offline',
    descEs: 'Navega y accede a mapas sin conexión',
    descEn: 'Navigate and access maps without signal',
    route: '/(tabs)/mapas' as const,
  },
];

function GalleryCell({
  item,
  index,
  width,
  height,
  onPress,
  t,
  isDark,
}: {
  item: { uri: string; labelEs: string; labelEn: string };
  index: number;
  width: number;
  height: number;
  onPress: (i: number) => void;
  t: (es: string, en: string) => string;
  isDark: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.galleryCell, { width, height, backgroundColor: isDark ? '#0f1724' : '#e2e8f0' }]}
      activeOpacity={0.9}
      onPress={() => onPress(index)}
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
          <Text style={styles.galleryLabelTxt}>{t(item.labelEs, item.labelEn)}</Text>
        </View>
        <View style={styles.galleryExpandIcon}>
          <Ionicons name="expand-outline" size={16} color="rgba(255,255,255,0.6)" />
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
}

function SectionDivider({ sidePad, isDark }: { sidePad: number; isDark: boolean }) {
  const borderColor = isDark ? '#1e2d42' : '#e2e8f0';
  if (Platform.OS !== 'web') {
    return <View style={[styles.divider, { marginHorizontal: sidePad, backgroundColor: borderColor }]} />;
  }
  return (
    <View
      style={[styles.divider, { marginHorizontal: sidePad, backgroundColor: borderColor }]}
      {...({ 'data-section-divider': true } as any)}
    />
  );
}

export default function InicioScreen() {
  const { isDark } = useTheme();
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

  const c = isDark
    ? { bg: '#070b14', surface: '#0f1724', elevated: '#162035', border: '#1e2d42', text: '#f0f9ff', muted: '#64748b' }
    : { bg: '#f8fafc', surface: '#ffffff', elevated: '#f1f5f9', border: '#e2e8f0', text: '#0f172a', muted: '#64748b' };

  const galleryGap = 10;
  const galleryInnerW = width - 2 * sidePad;
  // Use Math.floor to prevent sub-pixel overflow that causes item 2 to wrap to a new row
  const cellW = Math.floor((galleryInnerW - galleryGap) / 2);
  const cellH = Math.round(cellW * 0.68);
  const fullW = galleryInnerW;
  const fullH = Math.round(fullW * 0.44);

  // Hero height: 580 mobile, full viewport on web
  const heroHeight = Platform.OS === 'web' ? undefined : 580;

  useEffect(() => {
    injectWebStyles();
    animateHeroEntrance('[data-hero]');
    animateParallaxHero('[data-hero]');
    const timer = setTimeout(() => animateScrollReveal(), 300);
    return () => clearTimeout(timer);
  }, []);

  const HERO_STATS = [
    `${ARGENTINA_TRAILS.length} ${t('senderos', 'trails')}`,
    'Patagonia',
    t('IA integrada', 'AI built-in'),
    t('Sin señal', 'Offline'),
  ];

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        {...(Platform.OS === 'web' ? ({ 'data-page-content': true } as any) : {})}
      >
        {/* ── HERO ── */}
        <View
          style={[styles.heroWrapper, Platform.OS === 'web' ? ({ minHeight: '100vh' } as any) : { height: heroHeight }]}
          {...(Platform.OS === 'web' ? ({ 'data-hero': true } as any) : {})}
        >
          <ImageBackground
            source={{ uri: HERO_URI }}
            style={[StyleSheet.absoluteFillObject]}
            resizeMode="cover"
            imageStyle={Platform.OS !== 'web' ? undefined : { opacity: 0 }}
            {...(Platform.OS === 'web' ? ({ 'data-hero-bg': true } as any) : {})}
          >
            {/* Web: silent looping drone video */}
            {Platform.OS === 'web' && (
              // @ts-ignore — video is web-only
              <video
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
                onError={(e: any) => { e.target.src = HERO_VIDEO_FALLBACK; }}
              >
                <source src={HERO_VIDEO_URL} type="video/mp4" />
                <source src={HERO_VIDEO_FALLBACK} type="video/mp4" />
              </video>
            )}

            <View style={[StyleSheet.absoluteFillObject, styles.heroOverlay]} />
            {/* Bottom gradient fade */}
            <View style={styles.heroGradientBottom} />
          </ImageBackground>

          {/* Hero content — centered */}
          <View
            style={[
              styles.heroInner,
              { paddingTop: insets.top + 80, paddingHorizontal: sidePad },
              Platform.OS === 'web' ? ({ minHeight: '100vh' } as any) : { height: heroHeight },
            ]}
            {...(Platform.OS === 'web' ? ({ 'data-hero-content': true } as any) : {})}
          >
            {/* Centered text block */}
            <View style={styles.heroCenterBlock}>
              {/* Eyebrow */}
              <Text
                style={styles.heroEyebrow}
                {...(Platform.OS === 'web' ? ({ 'data-hero-eyebrow': true } as any) : {})}
              >ARGENTINA · PATAGONIA · ANDES</Text>

              {/* Giant display title */}
              <Text
                style={[
                  styles.heroTitle,
                  Platform.OS === 'web'
                    ? ({ fontSize: 'clamp(38px, 5.5vw, 64px)' } as any)
                    : { fontSize: 38 },
                ]}
                {...(Platform.OS === 'web' ? ({ 'data-hero-title': true } as any) : {})}
              >
                {t('Tu próxima\naventura.', 'Your next\nadventure.')}
              </Text>

              {/* Subtitle */}
              <Text
                style={styles.heroSub}
                {...(Platform.OS === 'web' ? ({ 'data-hero-sub': true } as any) : {})}
              >
                {t(
                  'Descubre senderos. Construye tu ruta.\nExplora sin señal.',
                  'Discover trails. Build your route.\nExplore without signal.',
                )}
              </Text>

              {/* CTAs */}
              <View style={styles.heroCtas}>
                <TouchableOpacity
                  style={styles.heroBtnPrimary}
                  onPress={() => router.push('/(tabs)/rutas')}
                  activeOpacity={0.85}
                  accessibilityLabel={t('Explorar rutas', 'Explore trails')}
                  {...(Platform.OS === 'web' ? ({
                    'data-hero-cta': true,
                    'data-btn-primary': true,
                  } as any) : {})}
                >
                  <Ionicons name="compass-outline" size={15} color="#fff" />
                  <Text style={styles.heroBtnPrimaryTxt}>
                    {t('Explorar rutas', 'Explore trails')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.heroBtnSecondary}
                  onPress={() => router.push('/(tabs)/planificar')}
                  activeOpacity={0.75}
                  accessibilityLabel={t('Construir ruta', 'Build a route')}
                  {...(Platform.OS === 'web' ? ({ 'data-hero-cta': true } as any) : {})}
                >
                  <Text style={styles.heroBtnSecondaryTxt}>
                    {t('Construir ruta', 'Build a route')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Bottom stats strip — inside hero */}
            <View
              style={styles.heroStatsStrip}
              {...(Platform.OS === 'web' ? ({ 'data-hero-stats': true } as any) : {})}
            >
              {HERO_STATS.map((label, i) => (
                <React.Fragment key={label}>
                  {i > 0 && <View style={styles.heroStatDivider} />}
                  <Text style={styles.heroStatText}>{label}</Text>
                </React.Fragment>
              ))}
            </View>
          </View>
        </View>

        {/* ── FEATURE BLOCKS ── */}
        <View style={[styles.featureSection, { paddingHorizontal: sidePad }]}>
          <Text
            style={[styles.sectionLabel, { color: c.muted }]}
            {...(Platform.OS === 'web' ? ({ 'data-section-label': true } as any) : {})}
          >
            {t('TODO LO QUE NECESITAS', 'EVERYTHING YOU NEED')}
          </Text>
          <View style={[styles.featureRow, isWide ? styles.featureRowWide : null]}>
            {FEATURE_CARDS.map((card) => (
              <TouchableOpacity
                key={card.titleEn}
                style={[styles.featureCard, isWide ? styles.featureCardWide : null]}
                activeOpacity={0.88}
                onPress={() => router.push(card.route as any)}
                {...(Platform.OS === 'web' ? ({ 'data-interactive-card': true } as any) : {})}
              >
                <ImageBackground
                  source={{ uri: card.photo }}
                  style={styles.featureCardPhoto}
                  resizeMode="cover"
                >
                  <View style={styles.featureCardOverlay} />
                  <View style={styles.featureCardContent}>
                    <View style={styles.featureCardIconWrap}>
                      <Ionicons name={card.icon} size={20} color="#fff" />
                    </View>
                    <View style={{ flex: 1 }} />
                    <Text style={styles.featureCardTitle}>{t(card.titleEs, card.titleEn)}</Text>
                    <Text style={styles.featureCardDesc}>{t(card.descEs, card.descEn)}</Text>
                  </View>
                </ImageBackground>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <SectionDivider sidePad={sidePad} isDark={isDark} />

        {/* ── FEATURED ROUTES ── */}
        <View style={styles.mt4}>
          <Text
            style={[styles.sectionLabel, { marginHorizontal: sidePad, color: c.muted }]}
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

        <SectionDivider sidePad={sidePad} isDark={isDark} />

        {/* ── ARGENTINA DESTINATION HUB ── */}
        <View style={styles.mt4}>
          <View style={[styles.hubHeader, { paddingHorizontal: sidePad }]}>
            <View>
              <Text
                style={[styles.sectionLabel, { color: c.muted }]}
                {...(Platform.OS === 'web' ? ({ 'data-section-label': true } as any) : {})}
              >
                {t('DESTINOS EN ARGENTINA', 'DESTINATIONS IN ARGENTINA')}
              </Text>
              <Text style={[styles.hubSubtitle, { color: c.muted }]}>
                {t('Explora por provincia y parque nacional', 'Explore by province and national park')}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/rutas')}
              style={styles.hubSeeAll}
              activeOpacity={0.7}
            >
              <Text style={styles.hubSeeAllTxt}>{t('Ver todas', 'See all')}</Text>
              <Ionicons name="arrow-forward" size={13} color="#22c55e" />
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: sidePad, gap: 12, paddingBottom: 4 }}
          >
            {DESTINATIONS.map((dest) => (
              <TouchableOpacity
                key={dest.id}
                style={styles.destCard}
                activeOpacity={0.88}
                onPress={() => router.push('/(tabs)/rutas')}
                {...(Platform.OS === 'web' ? ({ 'data-interactive-card': true, 'data-dest-card': true } as any) : {})}
              >
                <ImageBackground
                  source={{ uri: dest.photo }}
                  style={StyleSheet.absoluteFillObject}
                  resizeMode="cover"
                />
                <View style={styles.destGradient} />
                <View style={styles.destContent}>
                  <View style={styles.destBadge}>
                    <Text style={styles.destBadgeTxt}>{dest.trailCount} {t('rutas', 'trails')}</Text>
                  </View>
                  <View style={{ flex: 1 }} />
                  <Text style={styles.destName}>{dest.name}</Text>
                  <Text style={styles.destRegion}>{dest.region}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <SectionDivider sidePad={sidePad} isDark={isDark} />

        {/* ── GALLERY ── */}
        <View style={styles.mt4}>
          <Text
            style={[styles.sectionLabel, { marginHorizontal: sidePad, color: c.muted }]}
            {...(Platform.OS === 'web' ? ({ 'data-section-label': true } as any) : {})}
          >
            {t('GALERÍA', 'GALLERY')}
          </Text>
          {/* Explicit 2-row structure — avoids sub-pixel flexWrap bugs */}
          <View style={{ marginHorizontal: sidePad }}>
            {/* Row 1: full-width image */}
            <GalleryCell item={GALLERY[0]} index={0} width={fullW} height={fullH} onPress={setLightboxIndex} t={t} isDark={isDark} />
            {/* Row 2: two half-width images side by side */}
            <View style={{ flexDirection: 'row', gap: galleryGap, marginTop: galleryGap }}>
              <GalleryCell item={GALLERY[1]} index={1} width={cellW} height={cellH} onPress={setLightboxIndex} t={t} isDark={isDark} />
              <GalleryCell item={GALLERY[2]} index={2} width={cellW} height={cellH} onPress={setLightboxIndex} t={t} isDark={isDark} />
            </View>
          </View>
        </View>

        <SectionDivider sidePad={sidePad} isDark={isDark} />

        {/* ── OFFLINE AI ── */}
        <View
          style={[styles.mt4, { marginHorizontal: sidePad }]}
          {...(Platform.OS === 'web' ? ({ 'data-reveal-card': true } as any) : {})}
        >
          <OfflineAICard />
        </View>

        <SectionDivider sidePad={sidePad} isDark={isDark} />

        {/* ── QUICK ACTIONS ── */}
        <View style={[styles.mt4, { marginHorizontal: sidePad }]}>
          <Text
            style={[styles.sectionLabel, { color: c.muted }]}
            {...(Platform.OS === 'web' ? ({ 'data-section-label': true } as any) : {})}
          >
            {t('EXPLORAR', 'EXPLORE')}
          </Text>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: c.surface, borderColor: c.border }]}
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
              <Text style={[styles.actionTitle, { color: c.text }]}>{t('Planificar caminata', 'Plan a hike')}</Text>
              <Text style={[styles.actionDesc, { color: c.muted }]}>
                {t(
                  'Traza tu próxima ruta y analízala con IA',
                  'Map your next route and analyse it with AI',
                )}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={c.muted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionCard, styles.mt3, { backgroundColor: c.surface, borderColor: c.border }]}
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
              <Text style={[styles.actionTitle, { color: c.text }]}>
                {t('Contribuir al mapa', 'Contribute to the map')}
              </Text>
              <Text style={[styles.actionDesc, { color: c.muted }]}>
                {t(
                  'Ayuda a la comunidad con datos de senderos',
                  'Help the community with trail data',
                )}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={c.muted} />
          </TouchableOpacity>
        </View>

        <SectionDivider sidePad={sidePad} isDark={isDark} />

        {/* ── PACK ACTIVO ── */}
        <View
          style={[styles.mt4, { marginHorizontal: sidePad }]}
          {...(Platform.OS === 'web' ? ({ 'data-reveal-card': true } as any) : {})}
        >
          <Text
            style={[styles.sectionLabel, { color: c.muted }]}
            {...(Platform.OS === 'web' ? ({ 'data-section-label': true } as any) : {})}
          >
            {t('PACK ACTIVO', 'ACTIVE PACK')}
          </Text>
          <View style={[styles.packCard, { backgroundColor: c.surface }]}>
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
  root: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 48 },

  // Hero
  heroWrapper: {
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  heroOverlay: { backgroundColor: 'rgba(7,11,20,0.5)' },
  heroGradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 260,
    backgroundColor: 'rgba(7,11,20,0.65)',
  },
  heroInner: {
    justifyContent: 'space-between',
    paddingBottom: 0,
  },
  heroCenterBlock: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 80,
  },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 18,
    textAlign: 'center',
  },
  heroTitle: {
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -2,
    lineHeight: undefined,
    marginBottom: 16,
    textAlign: 'center',
  },
  heroSub: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 22,
    marginBottom: 36,
    textAlign: 'center',
  },
  heroCtas: { flexDirection: 'row', gap: 12, flexWrap: 'wrap', justifyContent: 'center' },
  heroBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#16a34a',
    paddingHorizontal: 26,
    paddingVertical: 15,
    borderRadius: 999,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  heroBtnPrimaryTxt: { color: '#fff', fontSize: 15, fontWeight: '700' },
  heroBtnSecondary: {
    paddingHorizontal: 26,
    paddingVertical: 15,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroBtnSecondaryTxt: { color: '#fff', fontSize: 15, fontWeight: '600' },

  // Hero stats strip
  heroStatsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(7,11,20,0.55)',
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexWrap: 'wrap',
    gap: 4,
  },
  heroStatText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.72)',
    letterSpacing: 0.5,
    paddingHorizontal: 8,
  },
  heroStatDivider: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },

  // Feature cards section
  featureSection: { paddingTop: 48, paddingBottom: 4 },
  featureRow: { flexDirection: 'column', gap: 14, marginTop: 14 },
  featureRowWide: { flexDirection: 'row' },
  featureCard: {
    borderRadius: 20,
    overflow: 'hidden',
    height: 220,
    flex: 1,
  },
  featureCardWide: { flex: 1 },
  featureCardPhoto: { flex: 1 },
  featureCardOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7,11,20,0.48)',
  },
  featureCardContent: {
    flex: 1,
    padding: 18,
    justifyContent: 'flex-end',
  },
  featureCardIconWrap: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(22,163,74,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureCardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 6,
  },
  featureCardDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.68)',
    lineHeight: 18,
  },

  // Divider
  divider: {
    height: 1,
    marginVertical: 32,
    opacity: 0.5,
  },

  // Shared
  mt4: { marginTop: 0 },
  mt3: { marginTop: 12 },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 2.5,
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
  featuredTitle: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 3 },
  featuredSub: { fontSize: 12, color: 'rgba(255,255,255,0.68)', marginBottom: 8 },
  featuredMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  featuredMetaTxt: { fontSize: 11, color: 'rgba(255,255,255,0.58)' },

  // Gallery
  galleryCell: { borderRadius: 16, overflow: 'hidden' },
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
    borderWidth: 1,
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
  actionTitle: { fontSize: 15, fontWeight: '700', color: '#f0f9ff', marginBottom: 2 },
  actionDesc: { fontSize: 12, color: '#64748b', lineHeight: 17 },

  // Pack activo
  packCard: { borderRadius: 22, overflow: 'hidden', padding: 20 },
  packOverlay: { backgroundColor: 'rgba(7,11,20,0.68)' },
  packRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  packName: { fontSize: 16, fontWeight: '700', color: '#f0f9ff', marginBottom: 2 },
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
    color: '#f0f9ff',
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

  // Argentina hub
  hubHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  hubSubtitle: { fontSize: 12, marginTop: 3 },
  hubSeeAll: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingBottom: 2 },
  hubSeeAllTxt: { fontSize: 12, fontWeight: '700', color: '#22c55e' },
  destCard: {
    width: 160,
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
  },
  destGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7,11,20,0.52)',
    top: '35%',
  },
  destContent: {
    flex: 1,
    padding: 14,
  },
  destBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(22,163,74,0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  destBadgeTxt: { fontSize: 10, fontWeight: '700', color: '#fff' },
  destName: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  destRegion: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
});
