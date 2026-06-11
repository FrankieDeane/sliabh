import React, { useEffect } from 'react';
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
import { useLangStore } from '../../src/store/langStore';
import { WebFooter } from '../../src/components/layout/WebFooter';
import { injectWebStyles } from '../../src/utils/webStyles';
import { animateHeroEntrance, animateScrollReveal, animateParallaxHero } from '../../src/utils/gsapAnimations';
import { ARGENTINA_TRAILS } from '../../src/data/argentinaTrails';

const MAX_CONTENT = 900;

const HERO_URI =
  'https://images.unsplash.com/photo-1469521669194-babb45599def?w=1920&q=90&fit=crop&auto=format';

// Pixabay video 203407 — mountain volcano forest sky clouds
// Direct CDN URL requires Pixabay auth; we use their embed player muted+autoplay
const HERO_VIDEO_URL = 'https://assets.mixkit.co/videos/preview/mixkit-rocky-mountains-aerial-view-4k-4379-large.mp4';
const HERO_VIDEO_FALLBACK = 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-mountain-range-4048-large.mp4';
const PIXABAY_EMBED_ID = '203407';

// Featured routes — all Argentine
const FEATURED = [
  {
    titleEs: 'Laguna de los Tres',
    titleEn: 'Laguna de los Tres',
    subtitle: 'Parque Nacional Los Glaciares',
    distance: '24 km',
    daysEs: '1 día',
    daysEn: '1 day',
    uri: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=700&q=80&fit=crop&auto=format',
    routeId: 'fitz-roy-laguna-tres',
  },
  {
    titleEs: 'Aconcagua',
    titleEn: 'Aconcagua',
    subtitle: 'Parque Provincial Aconcagua',
    distance: '110 km',
    daysEs: '18–22 días',
    daysEn: '18–22 days',
    uri: 'https://images.unsplash.com/photo-1574068468668-a05a11f871da?w=700&q=80&fit=crop&auto=format',
    routeId: 'aconcagua-ruta-normal',
  },
  {
    titleEs: 'Los Alerces',
    titleEn: 'Los Alerces',
    subtitle: 'UNESCO — Chubut',
    distance: '18 km',
    daysEs: '1 día',
    daysEn: '1 day',
    uri: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=700&q=80&fit=crop&auto=format',
    routeId: 'alerces-cascada-arrayanes',
  },
  {
    titleEs: 'Tierra del Fuego',
    titleEn: 'Tierra del Fuego',
    subtitle: 'PN Tierra del Fuego',
    distance: '20 km',
    daysEs: '1 día',
    daysEn: '1 day',
    uri: 'https://images.unsplash.com/photo-1457131760772-7017c6180f05?w=700&q=80&fit=crop&auto=format',
    routeId: 'tierra-del-fuego-costera',
  },
];

// Six-region Argentina taxonomy
const REGIONS = [
  {
    id: 'patagonia-sur',
    nameEs: 'Patagonia Sur',
    nameEn: 'Southern Patagonia',
    regionEs: 'Santa Cruz · Tierra del Fuego',
    regionEn: 'Santa Cruz · Tierra del Fuego',
    trailCount: 5,
    photo: 'https://plus.unsplash.com/premium_photo-1671211755030-a90e6a3193cf?w=500&auto=format&fit=crop&q=60',
  },
  {
    id: 'patagonia-norte',
    nameEs: 'Patagonia Norte',
    nameEn: 'Northern Patagonia',
    regionEs: 'Río Negro · Neuquén · Chubut',
    regionEn: 'Río Negro · Neuquén · Chubut',
    trailCount: 6,
    photo: 'https://plus.unsplash.com/premium_photo-1671211755030-a90e6a3193cf?w=500&auto=format&fit=crop&q=60',
  },
  {
    id: 'cuyo',
    nameEs: 'Cuyo',
    nameEn: 'Cuyo',
    regionEs: 'Mendoza · San Juan · La Rioja',
    regionEn: 'Mendoza · San Juan · La Rioja',
    trailCount: 1,
    photo: 'https://images.unsplash.com/photo-1574068468668-a05a11f871da?w=500&q=80&fit=crop',
  },
  {
    id: 'norte',
    nameEs: 'Norte (NOA)',
    nameEn: 'Northwest (NOA)',
    regionEs: 'Jujuy · Salta · Tucumán',
    regionEn: 'Jujuy · Salta · Tucumán',
    trailCount: 1,
    photo: 'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/05/a5/19/21/quebrada-de-humahuaca.jpg?w=700&h=400&s=1',
  },
  {
    id: 'sierras-centrales',
    nameEs: 'Sierras Centrales',
    nameEn: 'Central Sierras',
    regionEs: 'Córdoba · San Luis',
    regionEn: 'Córdoba · San Luis',
    trailCount: 2,
    photo: 'https://images.unsplash.com/photo-1637707483880-6d680c36a322?w=500&auto=format&fit=crop&q=60',
  },
  {
    id: 'litoral',
    nameEs: 'Litoral',
    nameEn: 'Litoral',
    regionEs: 'Misiones · Corrientes · Entre Ríos',
    regionEn: 'Misiones · Corrientes · Entre Ríos',
    trailCount: 2,
    photo: 'https://images.unsplash.com/photo-1626288215937-747af7be5b7b?w=500&auto=format&fit=crop&q=60',
  },
];

// Park spotlight cards — replaces Pack Activo / Torres del Paine
const PARK_SPOTS = [
  {
    id: 'alerces',
    nameEs: 'Los Alerces',
    nameEn: 'Los Alerces',
    tagEs: 'UNESCO · Patrimonio Mundial',
    tagEn: 'UNESCO · World Heritage',
    descEs: 'Bosques de alerces milenarios de hasta 2600 años, lagos turquesa y ecosistemas únicos en la Patagonia andina de Chubut.',
    descEn: 'Ancient alerce forests up to 2600 years old, turquoise lakes and unique ecosystems in the Andean Patagonia of Chubut.',
    photo: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80&fit=crop&auto=format',
    trailId: 'alerces-cascada-arrayanes',
    province: 'Chubut',
    trails: 3,
  },
  {
    id: 'lago-puelo',
    nameEs: 'Lago Puelo',
    nameEn: 'Lago Puelo',
    tagEs: 'Microclima único · El Bolsón',
    tagEn: 'Unique microclimate · El Bolsón',
    descEs: 'El único lago de la Patagonia con salida al océano Pacífico. Vegetación valdiviana, arrayanes y las temperaturas más cálidas de la región.',
    descEn: 'The only lake in Patagonia that flows to the Pacific Ocean. Valdivian vegetation, arrayán trees and the warmest temperatures in the region.',
    photo: 'https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=800&q=80&fit=crop&auto=format',
    trailId: 'lago-puelo-los-hitos',
    province: 'Chubut',
    trails: 2,
  },
  {
    id: 'pn-patagonia',
    nameEs: 'PN Patagonia',
    nameEn: 'Patagonia NP',
    tagEs: 'Estepa · Cóndores · Santa Cruz',
    tagEn: 'Steppe · Condors · Santa Cruz',
    descEs: 'El parque más nuevo de Argentina protege estepa patagónica virgen, guanacos y cóndores. Vistas al lago Cochrane y vientos épicos de la Patagonia.',
    descEn: "Argentina's newest park protects pristine Patagonian steppe, guanacos and condors. Views to Cochrane lake and the epic Patagonian winds.",
    photo: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80&fit=crop&auto=format',
    trailId: 'pn-patagonia-ascension',
    province: 'Santa Cruz',
    trails: 2,
  },
];

// Quick-action feature cards
const FEATURE_CARDS = [
  {
    photo: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&q=80',
    icon: 'compass-outline' as const,
    titleEs: 'Explorar',
    titleEn: 'Explore',
    descEs: 'Filtrá por región, dificultad y actividad',
    descEn: 'Filter by region, difficulty and activity',
    route: '/(tabs)/rutas' as const,
  },
  {
    photo: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=80',
    icon: 'map-outline' as const,
    titleEs: 'Mapas offline',
    titleEn: 'Offline maps',
    descEs: 'Descargá mapas de parques nacionales en PDF',
    descEn: 'Download national park maps in PDF',
    route: '/(tabs)/mapas' as const,
  },
  {
    photo: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80',
    icon: 'shield-checkmark-outline' as const,
    titleEs: 'Supervivencia',
    titleEn: 'Survival',
    descEs: 'Guías de emergencia para montaña. Funciona sin señal.',
    descEn: 'Mountain emergency guides. Works without signal.',
    route: '/(tabs)/supervivencia' as const,
  },
];

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
  const { t } = useLangStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const contentW = Math.min(width, MAX_CONTENT);
  const sidePad = Math.max(16, (width - contentW) / 2);
  const isWide = width >= 720;

  const CARD_W = Math.min(contentW * 0.62, 240);
  const CARD_H = Math.round(CARD_W * 0.65);

  const c = isDark
    ? { bg: '#070b14', surface: '#0f1724', elevated: '#162035', border: '#1e2d42', text: '#f0f9ff', muted: '#64748b' }
    : { bg: '#f8fafc', surface: '#ffffff', elevated: '#f1f5f9', border: '#e2e8f0', text: '#0f172a', muted: '#64748b' };

  const heroHeight = Platform.OS === 'web' ? undefined : 580;

  useEffect(() => {
    injectWebStyles();
    animateHeroEntrance('[data-hero]');
    animateParallaxHero('[data-hero]');
    const timer = setTimeout(() => animateScrollReveal(), 300);
    return () => clearTimeout(timer);
  }, []);

  const HERO_STATS = [
    `${ARGENTINA_TRAILS.length} ${t('rutas', 'trails')}`,
    '39 Parques Nacionales',
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
            {Platform.OS === 'web' && (
              // @ts-ignore
              <iframe
                src={`https://www.pixabay.com/videos/embed/${PIXABAY_EMBED_ID}/?autoplay=1&loop=1&muted=1&controls=0&title=0&byline=0&portrait=0`}
                style={{
                  position: 'absolute',
                  top: '50%', left: '50%',
                  width: '177.78vh', height: '56.25vw',
                  minWidth: '100%', minHeight: '100%',
                  transform: 'translate(-50%, -50%)',
                  border: 'none',
                  pointerEvents: 'none',
                }}
                allow="autoplay; fullscreen"
                title="Hero background video"
                data-hero-video
              />
            )}
            <View style={[StyleSheet.absoluteFillObject, styles.heroOverlay]} />
            <View style={styles.heroGradientBottom} />
          </ImageBackground>

          <View
            style={[
              styles.heroInner,
              { paddingTop: insets.top + 80, paddingHorizontal: sidePad },
              Platform.OS === 'web' ? ({ minHeight: '100vh' } as any) : { height: heroHeight },
            ]}
            {...(Platform.OS === 'web' ? ({ 'data-hero-content': true } as any) : {})}
          >
            <View style={styles.heroCenterBlock}>
              <Text
                style={styles.heroEyebrow}
                {...(Platform.OS === 'web' ? ({ 'data-hero-eyebrow': true, 'data-eyebrow': true } as any) : {})}
              >
                ARGENTINA — 22°S · 55°S
              </Text>

              <Text
                style={[
                  styles.heroTitle,
                  Platform.OS === 'web'
                    ? ({ fontSize: 'clamp(48px, 8vw, 110px)' } as any)
                    : { fontSize: 44 },
                ]}
                {...(Platform.OS === 'web' ? ({ 'data-hero-title': true, 'data-display-xl': true } as any) : {})}
              >
                {t('La montaña\nte espera.', 'The mountain\nawaits.')}
              </Text>

              <Text
                style={styles.heroSub}
                {...(Platform.OS === 'web' ? ({ 'data-hero-sub': true, 'data-serif': true } as any) : {})}
              >
                {t(
                  'Rutas, mapas offline y conocimiento de montaña\npara explorar la Argentina salvaje.',
                  'Trails, offline maps and mountain knowledge\nto explore wild Argentina.',
                )}
              </Text>

              <View style={styles.heroCtas}>
                <TouchableOpacity
                  style={styles.heroBtnPrimary}
                  onPress={() => router.push('/(tabs)/rutas')}
                  activeOpacity={0.85}
                  {...(Platform.OS === 'web' ? ({
                    'data-hero-cta': true,
                    'data-btn-primary': true,
                    'data-magnetic': true,
                  } as any) : {})}
                >
                  <Ionicons name="compass-outline" size={15} color="#0a0f1a" />
                  <Text style={styles.heroBtnPrimaryTxt}>
                    {t('Explorar rutas', 'Explore trails')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.heroBtnSecondary}
                  onPress={() => router.push('/(tabs)/mapas')}
                  activeOpacity={0.75}
                  {...(Platform.OS === 'web' ? ({ 'data-hero-cta': true } as any) : {})}
                >
                  <Ionicons name="map-outline" size={15} color="#fff" />
                  <Text style={styles.heroBtnSecondaryTxt}>
                    {t('Ver mapas offline', 'View offline maps')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View
              style={styles.heroStatsStrip}
              {...(Platform.OS === 'web' ? ({ 'data-hero-stats': true } as any) : {})}
            >
              {HERO_STATS.map((label, i) => (
                <React.Fragment key={label}>
                  {i > 0 && <View style={styles.heroStatDivider} />}
                  <Text
                    style={styles.heroStatText}
                    {...(Platform.OS === 'web' ? ({ 'data-coord': true } as any) : {})}
                  >
                    {label.toUpperCase()}
                  </Text>
                </React.Fragment>
              ))}
            </View>
          </View>
        </View>

        {/* ── FEATURE CARDS (Explorar / Mapas / Supervivencia) ── */}
        <View style={[styles.featureSection, { paddingHorizontal: sidePad }]}>
          <Text
            style={[styles.sectionLabel, { color: c.muted }]}
            {...(Platform.OS === 'web' ? ({ 'data-section-label': true, 'data-eyebrow': true } as any) : {})}
          >
            {t('TODO LO QUE NECESITÁS', 'EVERYTHING YOU NEED')}
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

        {/* ── EXPEDITION NUMBERS ── */}
        <View style={[styles.numbersBand, { paddingHorizontal: sidePad }]}>
          <View style={styles.numbersRow}>
            {[
              { value: '6.961', unit: 'm', labelEs: 'Cumbre más alta de América', labelEn: 'Highest peak in the Americas' },
              { value: '39', unit: '', labelEs: 'Parques Nacionales', labelEn: 'National Parks' },
              { value: '3.694', unit: 'km', labelEs: 'De norte a sur', labelEn: 'North to south' },
              { value: '6', unit: '', labelEs: 'Regiones de montaña', labelEn: 'Mountain regions' },
            ].map((n) => (
              <View key={n.labelEn} style={styles.numberItem}>
                <Text
                  style={[styles.numberValue, { color: c.text }]}
                  {...(Platform.OS === 'web' ? ({ 'data-bignum': true } as any) : {})}
                >
                  {n.value}
                  {n.unit ? <Text style={{ fontSize: 28, color: c.muted }}> {n.unit}</Text> : null}
                </Text>
                <Text style={[styles.numberLabel, { color: c.muted }]}>{t(n.labelEs, n.labelEn)}</Text>
              </View>
            ))}
          </View>
        </View>

        <SectionDivider sidePad={sidePad} isDark={isDark} />

        {/* ── RUTAS DESTACADAS ── */}
        <View style={styles.section}>
          <View style={[styles.sectionHeaderRow, { paddingHorizontal: sidePad }]}>
            <View>
              <Text
                style={[styles.sectionLabel, { color: c.muted }]}
                {...(Platform.OS === 'web' ? ({ 'data-section-label': true, 'data-eyebrow': true } as any) : {})}
              >
                {t('RUTAS DESTACADAS', 'FEATURED TRAILS')}
              </Text>
              <Text style={[styles.sectionSubtitle, { color: c.text }]} {...(Platform.OS === 'web' ? ({ 'data-serif': true } as any) : {})}>
                {t('Los circuitos más icónicos de Argentina', "Argentina's most iconic circuits")}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/rutas')}
              style={styles.seeAll}
              activeOpacity={0.7}
            >
              <Text style={styles.seeAllTxt}>{t('Ver todas', 'See all')}</Text>
              <Ionicons name="arrow-forward" size={13} color="#22c55e" />
            </TouchableOpacity>
          </View>

          {isWide ? (
            <View
              style={[styles.featuredGrid, { marginHorizontal: sidePad }]}
              {...(Platform.OS === 'web' ? ({ 'data-featured-grid': true } as any) : {})}
            >
              {FEATURED.map((r) => (
                <TouchableOpacity
                  key={r.titleEs}
                  style={styles.featuredGridCard}
                  onPress={() =>
                    router.push({ pathname: '/(tabs)/ruta/[id]', params: { id: r.routeId } } as any)
                  }
                  activeOpacity={0.88}
                  {...(Platform.OS === 'web' ? ({ 'data-interactive-card': true, 'data-reveal-card': true } as any) : {})}
                >
                  <ImageBackground source={{ uri: r.uri }} style={StyleSheet.absoluteFillObject} resizeMode="cover">
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
                  <ImageBackground source={{ uri: r.uri }} style={StyleSheet.absoluteFillObject} resizeMode="cover">
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

        {/* ── REGIÓN GRID — Ideas para tu próxima aventura ── */}
        <View style={styles.section} {...(Platform.OS === 'web' ? ({ id: 'region-section' } as any) : {})}>
          <View style={[styles.sectionHeaderRow, { paddingHorizontal: sidePad }]}>
            <View>
              <Text
                style={[styles.sectionLabel, { color: c.muted }]}
                {...(Platform.OS === 'web' ? ({ 'data-section-label': true, 'data-eyebrow': true } as any) : {})}
              >
                {t('IDEAS PARA TU PRÓXIMA AVENTURA', 'IDEAS FOR YOUR NEXT ADVENTURE')}
              </Text>
              <Text style={[styles.sectionSubtitle, { color: c.text }]} {...(Platform.OS === 'web' ? ({ 'data-serif': true } as any) : {})}>
                {t('Explorá Argentina por región', 'Explore Argentina by region')}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/rutas')}
              style={styles.seeAll}
              activeOpacity={0.7}
            >
              <Text style={styles.seeAllTxt}>{t('Ver todas', 'See all')}</Text>
              <Ionicons name="arrow-forward" size={13} color="#22c55e" />
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: sidePad, gap: 12, paddingBottom: 4 }}
          >
            {REGIONS.map((region) => (
              <TouchableOpacity
                key={region.id}
                style={styles.regionCard}
                activeOpacity={0.88}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/rutas',
                    params: { region: region.nameEs.replace(' (NOA)', '') },
                  } as any)
                }
                {...(Platform.OS === 'web' ? ({ 'data-interactive-card': true, 'data-dest-card': true } as any) : {})}
              >
                <ImageBackground
                  source={{ uri: region.photo }}
                  style={StyleSheet.absoluteFillObject}
                  resizeMode="cover"
                />
                <View style={styles.regionGradient} />
                <View style={styles.regionContent}>
                  <View style={styles.regionBadge}>
                    <Text style={styles.regionBadgeTxt}>{region.trailCount} {t('rutas', 'trails')}</Text>
                  </View>
                  <View style={{ flex: 1 }} />
                  <Text style={styles.regionName}>{t(region.nameEs, region.nameEn)}</Text>
                  <Text style={styles.regionSub}>{t(region.regionEs, region.regionEn)}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <SectionDivider sidePad={sidePad} isDark={isDark} />

        {/* ── PARQUES DESTACADOS (replaces Pack Activo) ── */}
        <View style={styles.section}>
          <Text
            style={[styles.sectionLabel, { marginHorizontal: sidePad, color: c.muted }]}
            {...(Platform.OS === 'web' ? ({ 'data-section-label': true, 'data-eyebrow': true } as any) : {})}
          >
            {t('PARQUES PARA DESCUBRIR', 'PARKS TO DISCOVER')}
          </Text>
          <View style={[styles.parkSpotsRow, { paddingHorizontal: sidePad }, isWide ? styles.parkSpotsWide : null]}>
            {PARK_SPOTS.map((park) => (
              <TouchableOpacity
                key={park.id}
                style={[styles.parkSpot, { backgroundColor: c.surface, borderColor: c.border }]}
                activeOpacity={0.88}
                onPress={() =>
                  router.push({ pathname: '/(tabs)/ruta/[id]', params: { id: park.trailId } } as any)
                }
                {...(Platform.OS === 'web' ? ({ 'data-reveal-card': true, 'data-interactive-card': true } as any) : {})}
              >
                <ImageBackground
                  source={{ uri: park.photo }}
                  style={styles.parkSpotPhoto}
                  resizeMode="cover"
                >
                  <View style={styles.parkSpotPhotoOverlay} />
                  <View style={[styles.parkSpotPhotoTag]}>
                    <Text style={styles.parkSpotTagTxt}>{park.province}</Text>
                  </View>
                </ImageBackground>
                <View style={styles.parkSpotBody}>
                  <Text style={[styles.parkSpotTag, { color: '#22c55e' }]}>{t(park.tagEs, park.tagEn)}</Text>
                  <Text style={[styles.parkSpotName, { color: c.text }]}>{t(park.nameEs, park.nameEn)}</Text>
                  <Text style={[styles.parkSpotDesc, { color: c.muted }]}>{t(park.descEs, park.descEn)}</Text>
                  <View style={styles.parkSpotFooter}>
                    <Text style={[styles.parkSpotTrails, { color: c.muted }]}>
                      {park.trails} {t('rutas disponibles', 'trails available')}
                    </Text>
                    <Ionicons name="arrow-forward" size={14} color="#22c55e" />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <SectionDivider sidePad={sidePad} isDark={isDark} />

        {/* ── MAPAS OFFLINE TEASER ── */}
        <TouchableOpacity
          style={[styles.mapTeaser, { marginHorizontal: sidePad, backgroundColor: c.surface, borderColor: c.border }]}
          activeOpacity={0.88}
          onPress={() => router.push('/(tabs)/mapas')}
          {...(Platform.OS === 'web' ? ({ 'data-reveal-card': true, 'data-interactive-card': true } as any) : {})}
        >
          <View style={styles.mapTeaserLeft}>
            <View style={styles.mapTeaserIcon}>
              <Ionicons name="map-outline" size={24} color="#22c55e" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.mapTeaserTitle, { color: c.text }]}>
                {t('Mapas offline para 39 parques', 'Offline maps for 39 parks')}
              </Text>
              <Text style={[styles.mapTeaserSub, { color: c.muted }]}>
                {t(
                  'Descargá los mapas oficiales de Parques Nacionales en PDF. Sin señal, sin problema.',
                  'Download official National Parks maps in PDF. No signal, no problem.',
                )}
              </Text>
            </View>
          </View>
          <View style={styles.mapTeaserArrow}>
            <Ionicons name="chevron-forward" size={20} color="#22c55e" />
          </View>
        </TouchableOpacity>

        <SectionDivider sidePad={sidePad} isDark={isDark} />

        {/* ── SUPERVIVENCIA BAND ── */}
        <TouchableOpacity
          style={[styles.survivalBand, { marginHorizontal: sidePad }]}
          activeOpacity={0.88}
          onPress={() => router.push('/(tabs)/supervivencia')}
          {...(Platform.OS === 'web' ? ({ 'data-reveal-card': true } as any) : {})}
        >
          <View style={styles.survivalBandInner}>
            <View style={styles.survivalBandIcon}>
              <Ionicons name="shield-checkmark-outline" size={22} color="#ef4444" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.survivalBandTitle}>
                {t('Cuando no hay señal, hay preparación', 'When there is no signal, there is preparation')}
              </Text>
              <Text style={styles.survivalBandSub}>
                {t(
                  '8 guías de supervivencia para montaña • Disponibles sin conexión',
                  '8 mountain survival guides • Available offline',
                )}
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={18} color="rgba(240,249,255,0.6)" />
          </View>
        </TouchableOpacity>

        <SectionDivider sidePad={sidePad} isDark={isDark} />

        {/* ── ASISTENTE IA ── */}
        <View
          style={[styles.section, { marginHorizontal: sidePad }]}
          {...(Platform.OS === 'web' ? ({ 'data-reveal-card': true } as any) : {})}
        >
          <OfflineAICard />
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
              source={{ uri: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80&fit=crop&auto=format' }}
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
                    'Guardá rutas, contribuí y accedé sin límites',
                    'Save routes, contribute and access without limits',
                  )}
                </Text>
              </View>
              <View style={styles.authBannerCta}>
                <Text style={styles.authBannerCtaTxt}>{t('Entrar', 'Sign in')}</Text>
                <Ionicons name="arrow-forward" size={14} color="#fff" />
              </View>
            </View>
          </TouchableOpacity>
        )}

        {Platform.OS === 'web' && <WebFooter />}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 48 },

  // Hero
  heroWrapper: { width: '100%', overflow: 'hidden', position: 'relative' },
  heroOverlay: { backgroundColor: 'rgba(7,11,20,0.48)' },
  heroGradientBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 260, backgroundColor: 'rgba(7,11,20,0.65)',
  },
  heroInner: { justifyContent: 'space-between', paddingBottom: 0 },
  heroCenterBlock: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 24, paddingBottom: 80,
  },
  heroEyebrow: {
    fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.65)',
    letterSpacing: 5, textTransform: 'uppercase', marginBottom: 26, textAlign: 'center',
  },
  heroTitle: {
    fontWeight: '400', color: '#fff', letterSpacing: -1,
    marginBottom: 22, textAlign: 'center',
  },
  heroSub: {
    fontSize: 18, color: 'rgba(255,255,255,0.78)', lineHeight: 28,
    marginBottom: 44, textAlign: 'center', fontStyle: 'italic',
  },
  heroCtas: { flexDirection: 'row', gap: 14, flexWrap: 'wrap', justifyContent: 'center' },
  heroBtnPrimary: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#ffffff', paddingHorizontal: 34, paddingVertical: 17,
    borderRadius: 2,
  },
  heroBtnPrimaryTxt: {
    color: '#0a0f1a', fontSize: 12, fontWeight: '700',
    letterSpacing: 2.5, textTransform: 'uppercase',
  },
  heroBtnSecondary: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 34, paddingVertical: 17, borderRadius: 2,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.45)',
    backgroundColor: 'transparent',
  },
  heroBtnSecondaryTxt: {
    color: '#fff', fontSize: 12, fontWeight: '600',
    letterSpacing: 2.5, textTransform: 'uppercase',
  },
  heroStatsStrip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(7,11,20,0.55)', paddingVertical: 14, paddingHorizontal: 20,
    flexWrap: 'wrap', gap: 4,
  },
  heroStatText: {
    fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.72)',
    letterSpacing: 0.5, paddingHorizontal: 8,
  },
  heroStatDivider: { width: 1, height: 14, backgroundColor: 'rgba(255,255,255,0.2)' },

  // Feature cards
  featureSection: { paddingTop: 48, paddingBottom: 4 },
  featureRow: { flexDirection: 'column', gap: 14, marginTop: 14 },
  featureRowWide: { flexDirection: 'row' },
  featureCard: { borderRadius: 20, overflow: 'hidden', height: 220, flex: 1 },
  featureCardWide: { flex: 1 },
  featureCardPhoto: { flex: 1 },
  featureCardOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(7,11,20,0.48)' },
  featureCardContent: { flex: 1, padding: 18, justifyContent: 'flex-end' },
  featureCardIconWrap: {
    position: 'absolute', top: 16, left: 16,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(22,163,74,0.85)', alignItems: 'center', justifyContent: 'center',
  },
  featureCardTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 6 },
  featureCardDesc: { fontSize: 13, color: 'rgba(255,255,255,0.68)', lineHeight: 18 },

  // Section helpers
  section: { paddingTop: 0 },
  sectionHeaderRow: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 10, fontWeight: '600', letterSpacing: 4,
    textTransform: 'uppercase', marginBottom: 10,
  },
  sectionSubtitle: { fontSize: 30, fontWeight: '400', letterSpacing: -0.5 },

  // Big numbers band (expedition log)
  numbersBand: { paddingVertical: 72, alignItems: 'center' },
  numbersRow: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center',
    gap: 56, rowGap: 40, maxWidth: 1000,
  },
  numberItem: { alignItems: 'center', minWidth: 150 },
  numberValue: { fontSize: 64, fontWeight: '300', letterSpacing: -2 },
  numberLabel: {
    fontSize: 10, fontWeight: '600', letterSpacing: 3,
    textTransform: 'uppercase', marginTop: 10, textAlign: 'center',
  },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingBottom: 2 },
  seeAllTxt: { fontSize: 13, fontWeight: '600', color: '#22c55e' },
  divider: { height: 1, marginVertical: 32, opacity: 0.5 },

  // Featured grid
  featuredGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  featuredGridCard: { width: '48.5%', aspectRatio: 1.55, borderRadius: 20, overflow: 'hidden' },
  featuredCard: { borderRadius: 20, overflow: 'hidden' },
  featuredOverlay: { backgroundColor: 'rgba(0,0,0,0.32)' },
  featuredContent: { flex: 1, padding: 14 },
  featuredBadge: {
    alignSelf: 'flex-start', backgroundColor: 'rgba(22,163,74,0.88)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
  },
  featuredBadgeTxt: { color: '#fff', fontSize: 11, fontWeight: '700' },
  featuredTitle: { fontSize: 18, fontWeight: '800', color: '#fff', marginBottom: 3 },
  featuredSub: { fontSize: 12, color: 'rgba(255,255,255,0.68)', marginBottom: 8 },
  featuredMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  featuredMetaTxt: { fontSize: 11, color: 'rgba(255,255,255,0.58)' },

  // Region cards
  regionCard: { width: 160, height: 200, borderRadius: 18, overflow: 'hidden' },
  regionGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7,11,20,0.45)',
  },
  regionContent: { flex: 1, padding: 12 },
  regionBadge: {
    alignSelf: 'flex-start', backgroundColor: 'rgba(22,163,74,0.85)',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999,
  },
  regionBadgeTxt: { color: '#fff', fontSize: 10, fontWeight: '700' },
  regionName: { fontSize: 14, fontWeight: '800', color: '#fff', marginBottom: 2 },
  regionSub: { fontSize: 10, color: 'rgba(255,255,255,0.6)' },

  // Park spotlights
  parkSpotsRow: { gap: 16 },
  parkSpotsWide: { flexDirection: 'row' },
  parkSpot: {
    flex: 1, borderRadius: 20, borderWidth: 1, overflow: 'hidden',
  },
  parkSpotPhoto: { height: 160 },
  parkSpotPhotoOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(7,11,20,0.25)' },
  parkSpotPhotoTag: {
    position: 'absolute', bottom: 10, left: 12,
    backgroundColor: 'rgba(7,11,20,0.65)', borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  parkSpotTagTxt: { color: '#fff', fontSize: 10, fontWeight: '700' },
  parkSpotBody: { padding: 14, gap: 4 },
  parkSpotTag: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  parkSpotName: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  parkSpotDesc: { fontSize: 12, lineHeight: 18 },
  parkSpotFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  parkSpotTrails: { fontSize: 11, fontWeight: '600' },

  // Map teaser
  mapTeaser: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 20, borderWidth: 1, padding: 18, gap: 14,
  },
  mapTeaserLeft: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  mapTeaserIcon: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: 'rgba(34,197,94,0.1)',
    borderWidth: 1, borderColor: 'rgba(34,197,94,0.25)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  mapTeaserTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  mapTeaserSub: { fontSize: 12, lineHeight: 18 },
  mapTeaserArrow: { flexShrink: 0 },

  // Survival band
  survivalBand: {
    borderRadius: 20, overflow: 'hidden',
    backgroundColor: '#0f0a14',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
  },
  survivalBandInner: {
    flexDirection: 'row', alignItems: 'center',
    padding: 20, gap: 14,
  },
  survivalBandIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  survivalBandTitle: {
    fontSize: 15, fontWeight: '800', color: '#f0f9ff',
    marginBottom: 4, letterSpacing: -0.3,
  },
  survivalBandSub: { fontSize: 12, color: 'rgba(240,249,255,0.5)', lineHeight: 17 },

  // Auth banner
  authBanner: {
    marginTop: 16, marginBottom: 8, borderRadius: 22, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(22,163,74,0.28)', minHeight: 90,
  },
  authBannerOverlay: { backgroundColor: 'rgba(7,11,20,0.72)' },
  authBannerInner: { flexDirection: 'row', alignItems: 'center', padding: 18, gap: 14 },
  authBannerIcon: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(22,163,74,0.15)',
    borderWidth: 1, borderColor: 'rgba(22,163,74,0.3)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  authBannerTitle: { fontSize: 15, fontWeight: '800', color: '#f0f9ff', marginBottom: 3 },
  authBannerSub: { fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 17 },
  authBannerCta: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#16a34a', borderRadius: 999,
    paddingHorizontal: 16, paddingVertical: 9, flexShrink: 0,
  },
  authBannerCtaTxt: { fontSize: 13, fontWeight: '700', color: '#fff' },
});
