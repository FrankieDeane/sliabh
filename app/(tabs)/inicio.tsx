import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  useWindowDimensions,
  Platform,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { useAuthStore } from '../../src/store/authStore';
import { useLangStore } from '../../src/store/langStore';
import { WebFooter } from '../../src/components/layout/WebFooter';
import { SeoHead } from '../../src/components/ui/SeoHead';
import { MERCADOPAGO_URL } from '../../src/constants/links';
import { injectWebStyles } from '../../src/utils/webStyles';
import { animateHeroEntrance, animateScrollReveal, animateParallaxHero } from '../../src/utils/gsapAnimations';
import { ARGENTINA_TRAILS } from '../../src/data/argentinaTrails';

const MAX_CONTENT = 900;

const HERO_URI =
  'https://images.unsplash.com/photo-1469521669194-babb45599def?w=1920&q=90&fit=crop&auto=format';

// ?v=2 — file was re-muxed in place (faststart); busts the 30-day media cache
const HERO_VIDEO_URL = '/hero-patagonia.mp4?v=2';

// Small, low-weight thumbnail for the cafecito CTA band
const CAFECITO_IMG_URI =
  'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=112&q=60&fit=crop&auto=format';

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
    uri: '/sliabh-aconcagua-.webp',
    routeId: 'aconcagua-ruta-normal',
  },
  {
    titleEs: 'Los Alerces',
    titleEn: 'Los Alerces',
    subtitle: 'UNESCO — Chubut',
    distance: '18 km',
    daysEs: '1 día',
    daysEn: '1 day',
    uri: '/sliabh-los-alerces.webp',
    routeId: 'alerces-cascada-arrayanes',
  },
  {
    titleEs: 'Tierra del Fuego',
    titleEn: 'Tierra del Fuego',
    subtitle: 'PN Tierra del Fuego',
    distance: '20 km',
    daysEs: '1 día',
    daysEn: '1 day',
    uri: Platform.OS === 'web' ? '/tierra-del-fuego.webp' : 'https://images.unsplash.com/photo-1457131760772-7017c6180f05?w=700&q=80&fit=crop&auto=format',
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
    photo: '/tierra-del-fuego.webp',
  },
  {
    id: 'patagonia-norte',
    nameEs: 'Patagonia Norte',
    nameEn: 'Northern Patagonia',
    regionEs: 'Río Negro · Neuquén · Chubut',
    regionEn: 'Río Negro · Neuquén · Chubut',
    trailCount: 6,
    photo: '/sliabh-explore-explorar.webp',
  },
  {
    id: 'cuyo',
    nameEs: 'Cuyo',
    nameEn: 'Cuyo',
    regionEs: 'Mendoza · San Juan · La Rioja',
    regionEn: 'Mendoza · San Juan · La Rioja',
    trailCount: 1,
    photo: '/sliabh-aconcagua-.webp',
  },
  {
    id: 'norte',
    nameEs: 'Norte (NOA)',
    nameEn: 'Northwest (NOA)',
    regionEs: 'Jujuy · Salta · Tucumán',
    regionEn: 'Jujuy · Salta · Tucumán',
    trailCount: 1,
    photo: '/sliabh-humahuaca.webp',
  },
  {
    id: 'sierras-centrales',
    nameEs: 'Sierras Centrales',
    nameEn: 'Central Sierras',
    regionEs: 'Córdoba · San Luis',
    regionEn: 'Córdoba · San Luis',
    trailCount: 2,
    photo: '/sliabh-sierras-de-cordoba.webp',
  },
  {
    id: 'litoral',
    nameEs: 'Litoral',
    nameEn: 'Litoral',
    regionEs: 'Misiones · Corrientes · Entre Ríos',
    regionEn: 'Misiones · Corrientes · Entre Ríos',
    trailCount: 2,
    photo: '/sliabh-ibera.webp',
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
    photo: '/sliabh-los-alerces.webp',
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
    photo: '/sliabh-lago-puelo.webp',
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
    photo: '/tierra-del-fuego.webp',
    trailId: 'pn-patagonia-ascension',
    province: 'Santa Cruz',
    trails: 2,
  },
];

// Quick-action feature cards
const FEATURE_CARDS = [
  {
    photo: '/sliabh-lanin.webp',
    icon: 'compass-outline' as const,
    titleEs: 'Explorar',
    titleEn: 'Explore',
    descEs: 'Filtrá por región, dificultad y actividad',
    descEn: 'Filter by region, difficulty and activity',
    route: '/(tabs)/rutas' as const,
  },
  {
    photo: '/sliabh-explore-explorar.webp',
    icon: 'map-outline' as const,
    titleEs: 'Mapas offline',
    titleEn: 'Offline maps',
    descEs: 'Descargá mapas offline',
    descEn: 'Download offline maps',
    route: '/(tabs)/mapas' as const,
  },
  {
    photo: '/sliabh-talampaya.webp',
    icon: 'shield-checkmark-outline' as const,
    titleEs: 'Supervivencia',
    titleEn: 'Survival',
    descEs: 'Guías de emergencia para montaña. Funciona sin señal.',
    descEn: 'Mountain emergency guides. Works without signal.',
    route: '/(tabs)/supervivencia' as const,
  },
];

// Sliabh vs. plataformas de trekking extranjeras (AllTrails, Wikiloc, Hiiker)
const COMPARISON_ROWS = [
  {
    id: 'foco',
    labelEs: 'Enfoque',
    labelEn: 'Focus',
    sliabhEs: 'Rutas y refugios de Argentina, curados a mano',
    sliabhEn: 'Argentine trails & refuges, hand-curated',
    othersEs: 'Catálogo global, rutas mezcladas de +190 países',
    othersEn: 'Global catalog, trails mixed from 190+ countries',
    kind: 'partial' as const,
  },
  {
    id: 'contexto',
    labelEs: 'Contexto local',
    labelEn: 'Local context',
    sliabhEs: 'Guardaparques, permisos y normativa de cada Parque Nacional',
    sliabhEn: 'Rangers, permits and regulations for each National Park',
    othersEs: 'Sin datos oficiales locales, solo tracks de usuarios',
    othersEn: 'No official local data, just user-submitted tracks',
    kind: 'none' as const,
  },
  {
    id: 'supervivencia',
    labelEs: 'Supervivencia sin señal',
    labelEn: 'Offline survival guides',
    sliabhEs: 'Incluidas — funcionan sin conexión',
    sliabhEn: 'Included — work fully offline',
    othersEs: 'No ofrecen guías de emergencia',
    othersEn: 'No emergency guides offered',
    kind: 'none' as const,
  },
  {
    id: 'mapas',
    labelEs: 'Mapas y rutas offline',
    labelEn: 'Offline maps & trails',
    sliabhEs: 'Gratis, sin límites',
    sliabhEn: 'Free, no limits',
    othersEs: 'De pago en la mayoría (AllTrails+, Wikiloc Premium)',
    othersEn: 'Paywalled on most (AllTrails+, Wikiloc Premium)',
    kind: 'partial' as const,
  },
  {
    id: 'anuncios',
    labelEs: 'Publicidad',
    labelEn: 'Advertising',
    sliabhEs: 'Sin anuncios',
    sliabhEn: 'No ads',
    othersEs: 'Con publicidad en el plan gratuito',
    othersEn: 'Ads on the free plan',
    kind: 'none' as const,
  },
  {
    id: 'precio',
    labelEs: 'Precio',
    labelEn: 'Price',
    sliabhEs: 'Gratis, sostenido por la comunidad',
    sliabhEn: 'Free, community-supported',
    othersEs: 'Planes pagos de ~US$20 a US$50/año',
    othersEn: 'Paid plans of ~US$20–50/year',
    kind: 'partial' as const,
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
    t('GPX gratis', 'Free GPX'),
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
        <SeoHead
          title="Sliabh — Senderismo y trekking en Argentina | Rutas, mapas 3D y GPS offline"
          description="Sliabh: la plataforma de senderismo para explorar los Parques Nacionales de Argentina. Rutas y senderos con mapas 3D, GPS y mapas offline, planificación y guías de supervivencia. El Chaltén, Bariloche, Tierra del Fuego y más."
          path="/inicio"
        />

        {/* ── HERO ── */}
        <View
          style={[styles.heroWrapper, Platform.OS === 'web' ? ({ minHeight: '100vh' } as any) : { height: heroHeight }]}
          {...(Platform.OS === 'web' ? ({ 'data-hero': true } as any) : {})}
        >
          <ImageBackground
            source={{ uri: HERO_URI }}
            style={[StyleSheet.absoluteFillObject]}
            resizeMode="cover"
            {...(Platform.OS === 'web' ? ({ 'data-hero-bg': true } as any) : {})}
          >
            {/* Hero video on every web viewport, mobile included — the
                faststart remux keeps it ~3 MB, light enough for phones.
                Reduced-motion users still get the static poster (see ref). */}
            {Platform.OS === 'web' && (
              // @ts-ignore — raw DOM <video> via react-native-web (react-dom)
              <video
                data-hero-video=""
                autoPlay
                loop
                playsInline
                preload="metadata"
                poster={HERO_URI}
                ref={(el: any) => {
                  if (!el) return;
                  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
                    el.removeAttribute('autoplay');
                    return; // leave the static poster for reduced-motion users
                  }
                  el.muted = true; // set as property — React doesn't apply the `muted` attribute reliably
                  const p = el.play();
                  if (p && typeof p.catch === 'function') p.catch(() => {});
                }}
              >
                <source src={HERO_VIDEO_URL} type="video/mp4" />
              </video>
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
                {t('La montaña\nte espera', 'The mountain\nawaits')}
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
                    <View style={styles.featureCardTop}>
                      <View style={styles.featureCardIconWrap}>
                        <Ionicons name={card.icon} size={20} color="#fff" />
                      </View>
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
                  <ImageBackground source={{ uri: r.uri }} style={StyleSheet.absoluteFillObject} resizeMode="cover" {...(Platform.OS === 'web' ? ({ loading: 'lazy' } as any) : {})}>
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
                  <ImageBackground source={{ uri: r.uri }} style={StyleSheet.absoluteFillObject} resizeMode="cover" {...(Platform.OS === 'web' ? ({ loading: 'lazy' } as any) : {})}>
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

          <View style={[styles.regionGrid, { paddingHorizontal: sidePad }]}>
            {REGIONS.map((region) => (
              <TouchableOpacity
                key={region.id}
                style={[styles.regionGridCard, isWide ? styles.regionGridCardWide : styles.regionGridCardNarrow]}
                activeOpacity={0.88}
                onPress={() =>
                  router.push({
                    pathname: '/(tabs)/rutas',
                    params: { region: region.nameEs.replace(' (NOA)', '') },
                  } as any)
                }
                {...(Platform.OS === 'web' ? ({ 'data-interactive-card': true, 'data-reveal-card': true } as any) : {})}
              >
                <ImageBackground
                  source={{ uri: region.photo }}
                  style={StyleSheet.absoluteFillObject}
                  resizeMode="cover"
                  {...(Platform.OS === 'web' ? ({ loading: 'lazy' } as any) : {})}
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
          </View>
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
                  {...(Platform.OS === 'web' ? ({ loading: 'lazy' } as any) : {})}
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

        {/* ── GPS SIN SEÑAL — hero band ── */}
        <TouchableOpacity
          style={[styles.gpsHero, { marginHorizontal: sidePad }]}
          activeOpacity={0.92}
          onPress={() => router.push('/(tabs)/mapas')}
          {...(Platform.OS === 'web' ? ({ 'data-reveal-card': true, 'data-interactive-card': true } as any) : {})}
        >
          <ImageBackground
            source={{ uri: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=1400&q=85&fit=crop' }}
            style={styles.gpsHeroBg}
            resizeMode="cover"
          >
            <View style={styles.gpsHeroOverlay} />
            <View style={styles.gpsHeroContent}>
              <View style={styles.gpsHeroBadge}>
                <Ionicons name="navigate" size={13} color="#22c55e" />
                <Text style={styles.gpsHeroBadgeTxt}>{t('GPS OFFLINE', 'GPS OFFLINE')}</Text>
              </View>
              <Text style={styles.gpsHeroTitle}>
                {t('Sin señal.\nTu posición, igual.', 'No signal.\nYour position, still.')}
              </Text>
              <Text style={styles.gpsHeroSub}>
                {t(
                  'El chip GPS de tu celular recibe señal de satélites sin necesitar internet. Descargá el mapa en casa y navegás en tiempo real desde cualquier cumbre o valle.',
                  "Your phone's GPS chip receives satellite signals without internet. Download the map at home and navigate in real time from any summit or valley.",
                )}
              </Text>
              <View style={styles.gpsHeroSteps}>
                {([
                  { num: '1', es: 'Descargá el mapa del parque con Wi-Fi', en: 'Download the park map on Wi-Fi' },
                  { num: '2', es: 'Salí a la montaña — sin señal, sin problema', en: 'Head to the mountain — no signal, no problem' },
                  { num: '3', es: 'Tu punto azul se mueve en tiempo real', en: 'Your blue dot moves in real time' },
                ] as const).map((step) => (
                  <View key={step.num} style={styles.gpsHeroStep}>
                    <View style={styles.gpsHeroStepNum}>
                      <Text style={styles.gpsHeroStepNumTxt}>{step.num}</Text>
                    </View>
                    <Text style={styles.gpsHeroStepTxt}>{t(step.es, step.en)}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.gpsHeroCta}>
                <Text style={styles.gpsHeroCtaTxt}>{t('Descargar mapas', 'Download maps')}</Text>
                <Ionicons name="arrow-forward" size={14} color="#0a0f1a" />
              </View>
            </View>
          </ImageBackground>
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

        {/* ── SLIABH VS OTRAS APPS ── */}
        <View style={[styles.section, { paddingHorizontal: sidePad }]}>
          <Text
            style={[styles.sectionLabel, { color: c.muted }]}
            {...(Platform.OS === 'web' ? ({ 'data-section-label': true, 'data-eyebrow': true } as any) : {})}
          >
            {t('SLIABH VS EL RESTO', 'SLIABH VS THE REST')}
          </Text>
          <Text style={[styles.sectionSubtitle, { color: c.text }]} {...(Platform.OS === 'web' ? ({ 'data-serif': true } as any) : {})}>
            {t('¿Por qué no usar una app genérica?', 'Why not just use a generic app?')}
          </Text>
          <View style={styles.compareChips}>
            <Text style={[styles.compareChipsLede, { color: c.muted }]}>
              {t('Comparado con', 'Compared to')}
            </Text>
            {['AllTrails', 'Wikiloc', 'Hiiker'].map((name) => (
              <View key={name} style={[styles.compareChip, { borderColor: c.border, backgroundColor: c.surface }]}>
                <Text style={[styles.compareChipTxt, { color: c.muted }]}>{name}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.compareTable, { borderColor: c.border, backgroundColor: c.surface }]}>
            <View style={[styles.compareHeaderRow, { borderBottomColor: c.border }, isWide ? styles.compareRowWide : styles.compareRowNarrow]}>
              {isWide && <View style={styles.compareLabelCol} />}
              <View style={styles.compareValCol}>
                <Text style={[styles.compareHeaderTxt, { color: '#22c55e' }]}>SLIABH</Text>
              </View>
              <View style={styles.compareValCol}>
                <Text style={[styles.compareHeaderTxt, { color: c.muted }]}>
                  {t('OTRAS APPS', 'OTHER APPS')}
                </Text>
              </View>
            </View>

            {COMPARISON_ROWS.map((row, i) => (
              <View
                key={row.id}
                style={[
                  styles.compareRow,
                  isWide ? styles.compareRowWide : styles.compareRowNarrow,
                  i < COMPARISON_ROWS.length - 1 ? { borderBottomWidth: 1, borderBottomColor: c.border } : null,
                ]}
              >
                {isWide && (
                  <View style={styles.compareLabelCol}>
                    <Text style={[styles.compareLabelTxt, { color: c.text }]}>{t(row.labelEs, row.labelEn)}</Text>
                  </View>
                )}
                {!isWide && (
                  <Text style={[styles.compareLabelTxtNarrow, { color: c.text }]}>{t(row.labelEs, row.labelEn)}</Text>
                )}
                <View style={styles.compareValCol}>
                  <View style={styles.compareCell}>
                    <Ionicons name="checkmark-circle" size={16} color="#22c55e" style={styles.compareCellIcon} />
                    <Text style={[styles.compareCellTxt, { color: c.text }]}>{t(row.sliabhEs, row.sliabhEn)}</Text>
                  </View>
                </View>
                <View style={styles.compareValCol}>
                  <View style={styles.compareCell}>
                    <Ionicons
                      name={row.kind === 'none' ? 'close-circle-outline' : 'remove-circle-outline'}
                      size={16}
                      color={row.kind === 'none' ? 'rgba(239,68,68,0.65)' : c.muted}
                      style={styles.compareCellIcon}
                    />
                    <Text style={[styles.compareCellTxt, { color: c.muted }]}>{t(row.othersEs, row.othersEn)}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          <Text style={[styles.compareFootnote, { color: c.muted }]}>
            {t(
              'Comparación general en base a los planes y funciones publicados por cada app (sept. 2026). Verificá siempre los detalles actualizados en el sitio oficial de cada plataforma.',
              "General comparison based on each app's published plans and features (Sep 2026). Always check each platform's official site for current details.",
            )}
          </Text>
        </View>

        <SectionDivider sidePad={sidePad} isDark={isDark} />

        {/* ── CAFECITO / CROWDFUNDING ── */}
        <View
          style={[
            styles.cafecitoBand,
            isWide ? styles.cafecitoBandWide : styles.cafecitoBandNarrow,
            { marginHorizontal: sidePad, backgroundColor: c.surface, borderColor: c.border },
          ]}
        >
          <View style={styles.cafecitoHead}>
            <Image
              source={{ uri: CAFECITO_IMG_URI }}
              style={styles.cafecitoImg}
              resizeMode="cover"
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.cafecitoTitle, { color: c.text }]}>
                {t('¿Te sirvió Sliabh?', 'Did Sliabh help you?')}
              </Text>
              <Text style={[styles.cafecitoSub, { color: c.muted }]}>
                {t(
                  'Sliabh es un proyecto independiente y gratuito. Si querés apoyarlo, invitanos un cafecito.',
                  'Sliabh is an independent, free project. If you want to support it, invite us for a coffee.',
                )}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.cafecitoBtn, !isWide && styles.cafecitoBtnFull]}
            activeOpacity={0.85}
            onPress={() => Linking.openURL(MERCADOPAGO_URL)}
          >
            <Ionicons name="cafe" size={15} color="#0f172a" />
            <Text style={styles.cafecitoBtnTxt}>{t('Invitame un cafecito', 'Buy me a coffee')}</Text>
          </TouchableOpacity>
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
    paddingBottom: 48,
  },
  heroEyebrow: {
    fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.65)',
    letterSpacing: 5, textTransform: 'uppercase', marginBottom: 20, textAlign: 'center',
  },
  heroTitle: {
    fontWeight: '400', color: '#fff', letterSpacing: -1,
    marginBottom: 18, textAlign: 'center',
  },
  heroSub: {
    fontSize: 15, color: 'rgba(255,255,255,0.78)', lineHeight: 24,
    marginBottom: 36, textAlign: 'center', fontStyle: 'italic',
  },
  heroCtas: { flexDirection: 'row', gap: 12, flexWrap: 'wrap', justifyContent: 'center' },
  heroBtnPrimary: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#ffffff', paddingHorizontal: 28, paddingVertical: 15,
    borderRadius: 2,
  },
  heroBtnPrimaryTxt: {
    color: '#0a0f1a', fontSize: 11, fontWeight: '700',
    letterSpacing: 2, textTransform: 'uppercase',
  },
  heroBtnSecondary: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 28, paddingVertical: 15, borderRadius: 2,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.45)',
    backgroundColor: 'transparent',
  },
  heroBtnSecondaryTxt: {
    color: '#fff', fontSize: 11, fontWeight: '600',
    letterSpacing: 2, textTransform: 'uppercase',
  },
  heroStatsStrip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(7,11,20,0.55)', paddingVertical: 12, paddingHorizontal: 16,
    flexWrap: 'wrap', gap: 4,
  },
  heroStatText: {
    fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.72)',
    letterSpacing: 0.5, paddingHorizontal: 6,
  },
  heroStatDivider: { width: 1, height: 12, backgroundColor: 'rgba(255,255,255,0.2)' },

  // Feature cards
  featureSection: { paddingTop: 48, paddingBottom: 4 },
  featureRow: { flexDirection: 'column', gap: 14, marginTop: 14 },
  featureRowWide: { flexDirection: 'row' },
  featureCard: { borderRadius: 20, overflow: 'hidden', minHeight: 180, flex: 1 },
  featureCardWide: { flex: 1, minHeight: 220 },
  featureCardPhoto: { flex: 1 },
  featureCardOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(7,11,20,0.48)' },
  featureCardContent: { flex: 1, padding: 18, justifyContent: 'flex-end' },
  featureCardTop: { flexDirection: 'row' },
  featureCardIconWrap: {
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
  regionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  regionGridCard: { height: 200, borderRadius: 18, overflow: 'hidden' },
  regionGridCardWide: { width: '31.5%', minWidth: 220 },
  regionGridCardNarrow: { width: '47%', minWidth: 150 },
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

  // GPS offline hero band
  gpsHero: { borderRadius: 20, overflow: 'hidden', minHeight: 340 },
  gpsHeroBg: { minHeight: 340 },
  gpsHeroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(7,11,20,0.68)' },
  gpsHeroContent: { padding: 28, gap: 14 },
  gpsHeroBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    backgroundColor: 'rgba(34,197,94,0.15)', borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.3)', borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  gpsHeroBadgeTxt: { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: '#22c55e' },
  gpsHeroTitle: { fontSize: 34, fontWeight: '800', color: '#f0f9ff', letterSpacing: -0.8, lineHeight: 40 },
  gpsHeroSub: { fontSize: 14, color: 'rgba(240,249,255,0.72)', lineHeight: 22, maxWidth: 460 },
  gpsHeroSteps: { gap: 10, marginTop: 6 },
  gpsHeroStep: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  gpsHeroStepNum: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: '#22c55e',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  gpsHeroStepNumTxt: { fontSize: 12, fontWeight: '800', color: '#000' },
  gpsHeroStepTxt: { fontSize: 13, color: 'rgba(240,249,255,0.85)', flex: 1, lineHeight: 19 },
  gpsHeroCta: {
    flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start',
    backgroundColor: '#22c55e', paddingHorizontal: 20, paddingVertical: 11,
    borderRadius: 999, marginTop: 10,
  },
  gpsHeroCtaTxt: { fontSize: 13, fontWeight: '700', color: '#0a0f1a' },

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

  // Cafecito / crowdfunding band
  cafecitoBand: {
    borderRadius: 20, borderWidth: 1, padding: 18,
    marginTop: 16, gap: 16,
  },
  cafecitoBandWide: { flexDirection: 'row', alignItems: 'center' },
  cafecitoBandNarrow: { flexDirection: 'column', alignItems: 'stretch' },
  cafecitoHead: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 },
  cafecitoImg: {
    width: 52, height: 52, borderRadius: 16, flexShrink: 0,
  },
  cafecitoTitle: { fontSize: 15, fontWeight: '800', marginBottom: 3, letterSpacing: -0.3 },
  cafecitoSub: { fontSize: 12, lineHeight: 17 },
  cafecitoBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    backgroundColor: '#fbbf24', borderRadius: 999,
    paddingHorizontal: 16, paddingVertical: 10, flexShrink: 0,
  },
  cafecitoBtnFull: { alignSelf: 'stretch' },
  cafecitoBtnTxt: { fontSize: 13, fontWeight: '700', color: '#0f172a' },

  // Comparison — Sliabh vs otras apps
  compareChips: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginTop: 14, marginBottom: 20 },
  compareChipsLede: { fontSize: 12, fontWeight: '600', marginRight: 2 },
  compareChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  compareChipTxt: { fontSize: 12, fontWeight: '700' },
  compareTable: { borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  compareHeaderRow: { borderBottomWidth: 1, paddingVertical: 12 },
  compareRow: { paddingVertical: 14 },
  compareRowWide: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 18, gap: 12 },
  compareRowNarrow: { flexDirection: 'column', paddingHorizontal: 16, gap: 8 },
  compareLabelCol: { width: 150, flexShrink: 0 },
  compareLabelTxt: { fontSize: 13, fontWeight: '700' },
  compareLabelTxtNarrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', opacity: 0.6 },
  compareValCol: { flex: 1, minWidth: 0 },
  compareHeaderTxt: { fontSize: 11, fontWeight: '800', letterSpacing: 2, textAlign: 'center' },
  compareCell: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  compareCellIcon: { marginTop: 1, flexShrink: 0 },
  compareCellTxt: { fontSize: 13, lineHeight: 18, flex: 1 },
  compareFootnote: { fontSize: 11, lineHeight: 16, marginTop: 14, fontStyle: 'italic' },
});
