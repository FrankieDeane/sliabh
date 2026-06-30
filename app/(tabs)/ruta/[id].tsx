import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  useWindowDimensions,
  Platform,
  Linking,
  Modal,
  SafeAreaView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  ARGENTINA_TRAILS,
  DIFFICULTY_LABEL,
  DIFFICULTY_COLOR,
} from '../../../src/data/argentinaTrails';
import { BARILOCHE_TRAILS } from '../../../src/data/barilocheTreks';
import { useLangStore } from '../../../src/store/langStore';
import { useThemeStore } from '../../../src/store/themeStore';
import { downloadGpx, buildGpx } from '../../../src/utils/gpx';
import type { TrailDifficulty, TrailActivity } from '../../../src/data/argentinaTrails';
// Platform-specific 3D map — .web.tsx / .native.tsx resolved by bundler
const TrailMap3D = Platform.OS === 'web'
  ? require('../../../src/components/map/TrailMap3D.web').default
  : require('../../../src/components/map/TrailMap3D.native').default;

// Cinematic satellite fly-through (web only, opt-in per trail)
const TrailMap3DCinematic = Platform.OS === 'web'
  ? require('../../../src/components/map/TrailMap3DCinematic.web').default
  : null;


// Platform-specific flat map for hike mode — both platforms use MapLibreEsri
const HikeMap = Platform.OS === 'web'
  ? require('../../../src/components/map/MapLibreEsri.web').MapLibreEsri
  : require('../../../src/components/map/MapLibreEsri.native').MapLibreEsri;
import type { MapLibreEsriHandle } from '../../../src/components/map/MapLibreEsri.native';
import { TrailReports } from '../../../src/components/contribute/TrailReports';

const ALL_TRAILS = [...ARGENTINA_TRAILS, ...(BARILOCHE_TRAILS as typeof ARGENTINA_TRAILS)];

// ─── Theme context (avoids prop-drilling through all sub-components) ──────────
type ThemeColors = { bg: string; surface: string; elevated: string; border: string; text: string; muted: string; accent: string };
const TrailThemeCtx = React.createContext<ThemeColors>({
  bg: '#070b14', surface: '#0f1724', elevated: '#162035', border: '#1e2d42',
  text: '#f0f9ff', muted: '#64748b', accent: '#22c55e',
});
function useC() { return React.useContext(TrailThemeCtx); }

// ─── Trail videos ─────────────────────────────────────────────────────────────
const TRAIL_VIDEOS: Record<string, string> = {
  'aconcagua-ruta-normal':      'smv2WXDzG5I',
  'fitz-roy-laguna-tres':       'ZFtM28xYy14',
  'cerro-torre-base':           'uoMaOmEvbmc',
  'refugio-frey-bariloche':     'xK1eo4hKJVM',
  'cerro-lopez-bariloche':      'h52dog4oaoA',
  'cerro-tronador-bariloche':   'O8ynDxVg9lU',
  'volcan-lanin':               '3VfsFSm3AbA',
  'cerro-champaqui':            'uVeO6fr81kk',
  'los-gigantes-cordoba':       'mGsNkTL6vEQ',
  'cerro-la-ventana':           '3807z2eqStg',
  'quebrada-humahuaca-trek':    '_0k0NG0R6jc',
  'lago-desierto-patagonia':    'Wr0Go7gmQQE',
  'sierra-valdivieso-circuit':  '0opI29Sgcn4',
};

// ─── Colors ───────────────────────────────────────────────────────────────────
const C = {
  bg: '#070b14',
  surface: '#0f1724',
  elevated: '#162035',
  border: '#1e2d42',
  text: '#f0f9ff',
  muted: '#64748b',
  accent: '#22c55e',
};

// ─── Tabs ─────────────────────────────────────────────────────────────────────
type TabKey = 'overview' | 'logistics' | 'safety' | 'gear';

// ─── Content generators (bilingual) ──────────────────────────────────────────
function getLogisticsContent(
  trail: (typeof ARGENTINA_TRAILS)[0],
  lang: 'es' | 'en',
): string[] {
  if (lang === 'en') {
    const lines = [
      `The trailhead is located at ${trail.trailhead}.`,
      `Province: ${trail.province}. The trail lies within ${trail.area}.`,
    ];
    if (trail.subarea) lines.push(`Access point: ${trail.subarea}.`);
    lines.push(
      `The recommended season is ${trail.best_season}. Outside these months weather conditions can be severe and trail access may be restricted.`,
    );
    if (trail.permits_required) {
      lines.push(
        'A permit is required before entering the park. Purchase it in advance through the provincial or national park authority to avoid being turned away at the entrance.',
      );
    } else {
      lines.push(
        'No permit is required for this trail. Registration at the ranger station before departure is strongly recommended for safety tracking.',
      );
    }
    lines.push(
      `Total distance: ${trail.distance_km} km with ${trail.elevation_gain_m} m of elevation gain. Maximum altitude reached: ${trail.max_altitude_m} m.`,
    );
    lines.push(
      `Estimated time: ${trail.duration.min}–${trail.duration.max} ${trail.duration.unit === 'dias' ? 'days' : 'hours'}.`,
    );
    return lines;
  }
  // Spanish
  const lines = [
    `El punto de inicio se encuentra en ${trail.trailhead}.`,
    `Provincia: ${trail.province}. La ruta se desarrolla dentro de ${trail.area}.`,
  ];
  if (trail.subarea) lines.push(`Localidad de acceso: ${trail.subarea}.`);
  lines.push(
    `La temporada recomendada es ${trail.best_season}. Fuera de estos meses las condiciones pueden ser extremas y el acceso puede estar restringido.`,
  );
  if (trail.permits_required) {
    lines.push(
      'Se requiere permiso previo para ingresar al parque. Adquiérelo con anticipación a través de la autoridad provincial o nacional correspondiente para evitar que te rechacen en la entrada.',
    );
  } else {
    lines.push(
      'Esta ruta no requiere permiso. Se recomienda registrarse en el guardaparque antes de partir para control de seguridad.',
    );
  }
  lines.push(
    `Distancia total: ${trail.distance_km} km con ${trail.elevation_gain_m} m de desnivel positivo. Altitud máxima: ${trail.max_altitude_m} m.`,
  );
  lines.push(
    `Tiempo estimado: ${trail.duration.min}–${trail.duration.max} ${trail.duration.unit}.`,
  );
  return lines;
}

function getSafetyBullets(
  difficulty: TrailDifficulty,
  activity: TrailActivity,
  lang: 'es' | 'en',
): string[] {
  const isEs = lang === 'es';

  const base: Record<TrailDifficulty, string[]> = {
    facil: isEs
      ? [
          'Lleva al menos 2 litros de agua por persona aunque la caminata sea corta.',
          'Informa a alguien de confianza tu plan de ruta y hora estimada de regreso.',
          'Usa calzado con suela antideslizante; el terreno puede volverse resbaladizo con lluvia.',
          'Nunca abandones el sendero marcado; la orientación puede ser difícil en zonas boscosas.',
          'Lleva ropa extra en capas: el tiempo en la montaña cambia rápidamente.',
        ]
      : [
          'Carry at least 2 litres of water per person even for short hikes.',
          'Let someone know your route plan and estimated return time.',
          'Wear non-slip soles; trails become slippery when wet.',
          'Never leave the marked trail; navigation in forested areas can be difficult.',
          'Dress in layers — mountain weather changes quickly.',
        ],
    moderado: isEs
      ? [
          'Lleva abundante agua y alimentos de alta energía; el esfuerzo es prolongado.',
          'Consulta el pronóstico meteorológico el día anterior y en la mañana de la salida.',
          'El viento patagónico puede ser imprevisto; lleva ropa cortaviento impermeable.',
          'Inicia temprano para evitar quedar atrapado en ascenso con luz insuficiente.',
          'Lleva un silbato y manta de emergencia como mínimo de equipo de seguridad.',
          'Si hay hielo o nieve, considera crampones de microspikes para mayor estabilidad.',
        ]
      : [
          'Carry plenty of water and high-energy snacks for the extended effort.',
          'Check the weather forecast the evening before and on the morning of departure.',
          'Patagonian winds can be severe; carry a waterproof windbreaker.',
          'Start early to avoid being caught on ascent in poor light.',
          'Carry a whistle and emergency blanket as minimum safety equipment.',
          'In icy or snowy conditions, consider microspike crampons for stability.',
        ],
    dificil: isEs
      ? [
          'Experiencia previa en terreno técnico es indispensable.',
          'Nunca salgas en solitario; un grupo de al menos tres personas es lo recomendado.',
          'Lleva GPS o mapa topográfico descargado offline; la señal de celular es escasa.',
          'La hipotermia es un riesgo real: lleva ropa seca de recambio en bolsa impermeable.',
          'Conoce los síntomas del mal de altura (AMS) si la ruta supera los 3000 m.',
          'Planifica puntos de giro predefinidos; no tomes decisiones de retorno bajo presión de cima.',
        ]
      : [
          'Prior experience in technical terrain is essential.',
          'Never hike alone; a group of at least three is recommended.',
          'Carry a GPS or downloaded offline topo map; cell signal is unreliable.',
          'Hypothermia is a real risk: keep dry spare clothing in a waterproof bag.',
          'Know the symptoms of Acute Mountain Sickness (AMS) if the trail exceeds 3000 m.',
          'Set predefined turnaround points; do not make descent decisions under summit pressure.',
        ],
    extremo: isEs
      ? [
          'Esta ruta es solo para montañistas con experiencia probada en alta montaña.',
          'La aclimatación progresiva es obligatoria; no aceleres el perfil de ascenso.',
          'El edema cerebral o pulmonar de altitud (HACE/HACE) puede ser fatal: descende inmediatamente ante síntomas graves.',
          'Lleva radio de emergencia o dispositivo satelital (SPOT/InReach) como equipamiento mínimo.',
          'Las condiciones de nieve y hielo requieren conocimiento de uso de piolet y crampones.',
          'Contrata un guía certificado por el organismo provincial si no tienes experiencia en la zona.',
          'Registra tu expedición ante el organismo correspondiente y notifica la fecha de retorno.',
        ]
      : [
          'This route is for experienced high-altitude mountaineers only.',
          'Progressive acclimatisation is mandatory; do not rush the ascent profile.',
          'High-altitude cerebral or pulmonary oedema (HACE/HAPE) can be fatal: descend immediately at severe symptoms.',
          'Carry an emergency radio or satellite device (SPOT/InReach) as minimum equipment.',
          'Snow and ice conditions require competence with ice axe and crampons.',
          'Hire a guide certified by the provincial authority if you lack experience in the area.',
          'Register your expedition with the relevant authority and specify your return deadline.',
        ],
  };

  const extraActivity: Partial<Record<TrailActivity, string[]>> = {
    escalada: isEs
      ? ['Inspecciona los anclajes fijos; no confíes en material de origen desconocido.']
      : ['Inspect fixed anchors; never trust gear of unknown origin.'],
    travesia: isEs
      ? ['Distribuye el peso del bivaque de manera equitativa; revisa el estado del grupo cada hora.']
      : ['Distribute bivouac weight evenly; check the group status every hour.'],
    alta_montana: isEs
      ? ['Monitorea el pronóstico de ventana climática durante toda la expedición.']
      : ['Monitor the weather window forecast throughout the entire expedition.'],
  };

  const bullets = [...base[difficulty]];
  const extra = extraActivity[activity];
  if (extra) bullets.push(...extra);
  return bullets;
}

function getGearList(
  difficulty: TrailDifficulty,
  activity: TrailActivity,
  lang: 'es' | 'en',
): { category: string; items: string[] }[] {
  const isEs = lang === 'es';

  const base = [
    {
      category: isEs ? 'Indumentaria' : 'Clothing',
      items:
        difficulty === 'facil' || difficulty === 'moderado'
          ? isEs
            ? [
                'Camiseta técnica de secado rápido',
                'Polar o forro polar mid-layer',
                'Cortavientos o chaqueta ligera impermeable',
                'Pantalón de trekking resistente',
                'Medias de lana merino',
                'Gorro y guantes livianos',
              ]
            : [
                'Quick-dry technical base layer',
                'Fleece or mid-layer',
                'Lightweight waterproof wind jacket',
                'Durable hiking pants',
                'Merino wool socks',
                'Light hat and gloves',
              ]
          : isEs
          ? [
              'Capa base térmica (peso ligero o medio según temporada)',
              'Forro polar grueso (300 g/m²)',
              'Chaqueta hardshell impermeable y transpirable',
              'Pantalón softshell o hardshell',
              'Medias de lana merino (dos pares)',
              'Polainas impermeables',
              'Gorro de lana, buff y guantes impermeables',
            ]
          : [
              'Thermal base layer (light or mid depending on season)',
              'Heavyweight fleece (300 g/m²)',
              'Waterproof breathable hardshell jacket',
              'Softshell or hardshell pants',
              'Merino wool socks (two pairs)',
              'Waterproof gaiters',
              'Wool hat, buff, and waterproof gloves',
            ],
    },
    {
      category: isEs ? 'Calzado' : 'Footwear',
      items:
        activity === 'escalada'
          ? isEs
            ? ['Pies de gato para escalada en roca', 'Botas de montaña para aproximación']
            : ['Rock climbing shoes', 'Approach mountain boots']
          : difficulty === 'facil'
          ? isEs
            ? ['Zapatillas de trail running o botas livianas de trekking']
            : ['Trail running shoes or light hiking boots']
          : isEs
          ? [
              'Botas de trekking de media o alta caña con membrana impermeable',
              'Sandalias de campamento (opcional, para multi-día)',
            ]
          : [
              'Mid or high-cut waterproof trekking boots',
              'Camp sandals (optional, for multi-day)',
            ],
    },
    {
      category: isEs ? 'Mochila y carga' : 'Pack & Load',
      items:
        difficulty === 'facil'
          ? isEs
            ? ['Mochila de 20–30 L', 'Funda impermeable para la mochila']
            : ['20–30 L daypack', 'Waterproof pack cover']
          : difficulty === 'moderado'
          ? isEs
            ? ['Mochila de 30–45 L', 'Funda impermeable para la mochila']
            : ['30–45 L pack', 'Waterproof pack cover']
          : isEs
          ? [
              'Mochila de 50–70 L con buen sistema de carga lumbar',
              'Funda impermeable o bolsas dry-bag internas',
            ]
          : [
              '50–70 L pack with good hip-belt load transfer',
              'Waterproof cover or internal dry bags',
            ],
    },
    {
      category: isEs ? 'Navegación y seguridad' : 'Navigation & Safety',
      items: isEs
        ? [
            'GPS o aplicación offline con mapa topográfico descargado',
            'Brújula y mapa físico de respaldo',
            'Linterna frontal con pilas de repuesto',
            'Silbato de emergencia',
            'Manta de emergencia (bivouac de aluminio)',
            difficulty === 'extremo' || difficulty === 'dificil'
              ? 'Dispositivo de comunicación satelital (SPOT/Garmin InReach)'
              : 'Botiquín de primeros auxilios básico',
          ]
        : [
            'GPS or offline app with downloaded topo map',
            'Compass and physical map as backup',
            'Headlamp with spare batteries',
            'Emergency whistle',
            'Emergency bivouac blanket',
            difficulty === 'extremo' || difficulty === 'dificil'
              ? 'Satellite communication device (SPOT/Garmin InReach)'
              : 'Basic first-aid kit',
          ],
    },
    {
      category: isEs ? 'Hidratación y nutrición' : 'Hydration & Nutrition',
      items: isEs
        ? [
            'Mínimo 2 litros de agua por persona por día (más en calor)',
            'Filtro o pastillas purificadoras de agua',
            'Snacks de alta energía: frutos secos, barritas, chocolate',
            'Comidas liofilizadas o racionadas para multi-día',
          ]
        : [
            'Minimum 2 litres of water per person per day (more in heat)',
            'Water filter or purification tablets',
            'High-energy snacks: nuts, bars, chocolate',
            'Freeze-dried or ration meals for multi-day trips',
          ],
    },
  ];

  // Add activity-specific category
  if (activity === 'escalada') {
    base.push({
      category: isEs ? 'Equipo técnico de escalada' : 'Technical Climbing Gear',
      items: isEs
        ? [
            'Arnés de escalada homologado CE',
            'Casco de escalada',
            'Cintas exprés y cintas planas',
            'Freno (Grigri o ATC) y mosquetones de seguro',
            'Cuerda dinámica (según longitud del sector)',
          ]
        : [
            'CE-certified climbing harness',
            'Climbing helmet',
            'Quickdraws and slings',
            'Belay device (Grigri or ATC) and locking carabiners',
            'Dynamic rope (length per the sector)',
          ],
    });
  }

  if (activity === 'alta_montana' || difficulty === 'extremo') {
    base.push({
      category: isEs ? 'Material de alta montaña' : 'High-Altitude Equipment',
      items: isEs
        ? [
            'Crampones de 12 puntas compatibles con las botas',
            'Piolet técnico o de travesía',
            'Gafas de glaciar (filtro solar 4)',
            'Protector solar SPF 50+ y labial protector',
            'Tienda de campaña para cuatro estaciones o bivy',
            'Saco de dormir para temperaturas extremas (-15 °C o menos)',
          ]
        : [
            '12-point crampons compatible with your boots',
            'Technical or mountaineering ice axe',
            'Glacier sunglasses (category 4 filter)',
            'SPF 50+ sunscreen and protective lip balm',
            'Four-season tent or bivy',
            'Sleeping bag rated for extreme temperatures (-15 °C or lower)',
          ],
    });
  }

  if (activity === 'travesia') {
    base.push({
      category: isEs ? 'Equipo de vivac' : 'Bivouac Equipment',
      items: isEs
        ? [
            'Tienda ligera o tarp con estacas',
            'Esterilla aislante (R-value ≥ 3)',
            'Saco de dormir adecuado a la temporada',
            'Cocina de gas con cartucho de repuesto',
            'Kit de cocina ultraligero (olla, cuchara, encendedor)',
          ]
        : [
            'Lightweight tent or tarp with stakes',
            'Sleeping pad (R-value ≥ 3)',
            'Season-appropriate sleeping bag',
            'Gas stove with spare canister',
            'Ultralight cook kit (pot, spoon, lighter)',
          ],
    });
  }

  return base;
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function TrailDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  function goBack() {
    router.replace('/(tabs)/rutas' as any);
  }
  const { width, height } = useWindowDimensions();
  const { lang, t } = useLangStore();
  const isDark = useThemeStore((s) => s.theme === 'dark');

  const C: ThemeColors = isDark
    ? { bg: '#070b14', surface: '#0f1724', elevated: '#162035', border: '#1e2d42', text: '#f0f9ff', muted: '#64748b', accent: '#22c55e' }
    : { bg: '#f8fafc', surface: '#ffffff', elevated: '#f1f5f9', border: '#e2e8f0', text: '#0f172a', muted: '#64748b', accent: '#22c55e' };

  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [isHiking, setIsHiking] = useState(false);

  const trail = ALL_TRAILS.find((tr) => tr.id === id);

  const MAX_CONTENT = 800;
  const sidePad = Math.max(16, (width - Math.min(width, MAX_CONTENT)) / 2);
  const heroHeight = Platform.OS === 'web' ? height : Math.round(height * 0.62);

  // ── Not found ───────────────────────────────────────────────────────────────
  if (!trail) {
    return (
      <View style={[styles.notFound, { paddingTop: insets.top + 16, backgroundColor: C.bg }]}>
        <Ionicons name="map-outline" size={52} color={C.muted} />
        <Text style={[styles.notFoundTitle, { color: C.text }]}>
          {t('Ruta no encontrada', 'Trail not found')}
        </Text>
        <Text style={[styles.notFoundSub, { color: C.muted }]}>
          {t(
            'No existe una ruta con ese identificador.',
            'No trail exists with that identifier.',
          )}
        </Text>
        <TouchableOpacity
          style={[styles.notFoundBtn, { backgroundColor: C.surface, borderColor: C.border }]}
          onPress={() => goBack()}
          activeOpacity={0.75}
        >
          <Ionicons name="chevron-back" size={18} color={C.text} />
          <Text style={[styles.notFoundBtnText, { color: C.text }]}>{t('Volver', 'Go back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const diffColor = DIFFICULTY_COLOR[trail.difficulty] ?? {
    bg: 'rgba(100,116,139,0.18)',
    text: C.muted,
  };
  const diffLabel =
    lang === 'en'
      ? ({
          facil: 'Easy',
          moderado: 'Moderate',
          dificil: 'Hard',
          extremo: 'Extreme',
        }[trail.difficulty] ?? trail.difficulty)
      : (DIFFICULTY_LABEL[trail.difficulty] ?? trail.difficulty);

  const activityLabel =
    lang === 'en'
      ? ({
          trekking: 'Trekking',
          escalada: 'Climbing',
          travesia: 'Traverse',
          alta_montana: 'High Altitude',
        }[trail.activity] ?? trail.activity)
      : ({
          trekking: 'Trekking',
          escalada: 'Escalada',
          travesia: 'Travesía',
          alta_montana: 'Alta Montaña',
        }[trail.activity] ?? trail.activity);

  const durationLabel = `${trail.duration.min}–${trail.duration.max} ${
    lang === 'en'
      ? trail.duration.unit === 'dias'
        ? 'days'
        : 'hrs'
      : trail.duration.unit === 'dias'
      ? 'días'
      : 'hrs'
  }`;

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'overview', label: t('Resumen', 'Overview') },
    { key: 'logistics', label: t('Logística', 'Logistics') },
    { key: 'safety', label: t('Seguridad', 'Safety') },
    { key: 'gear', label: t('Equipo', 'Gear') },
  ];

  const safetyBullets = getSafetyBullets(trail.difficulty, trail.activity, lang);
  const gearCategories = getGearList(trail.difficulty, trail.activity, lang);
  const logisticsLines = getLogisticsContent(trail, lang);

  return (
    <TrailThemeCtx.Provider value={C}>
    <View style={[styles.root, { backgroundColor: C.bg }]}>
      {/* Floating back button — always visible above scroll */}
      <TouchableOpacity
        style={[styles.backBtn, { top: insets.top + 10 }]}
        onPress={() => goBack()}
        activeOpacity={0.75}
      >
        <Ionicons name="chevron-back" size={22} color={C.text} />
      </TouchableOpacity>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
      >
        {/* ── Hero — index 0, scrolls away ───────────────────────────────────── */}
        <View
          style={{ height: heroHeight }}
          {...(Platform.OS === 'web' ? ({ 'data-trail-hero': true } as any) : {})}
        >
          <ImageBackground
            source={{ uri: trail.photo_uri }}
            style={{ flex: 1, justifyContent: 'flex-end' }}
            resizeMode="cover"
          >
            {/* Cinematic gradient: dark top for back-btn, strong bottom for text */}
            <View
              style={styles.heroGradientTop}
              {...(Platform.OS === 'web' ? ({ 'data-trail-hero-gradient-top': true } as any) : {})}
            />
            <View
              style={styles.heroGradientBottom}
              {...(Platform.OS === 'web' ? ({ 'data-trail-hero-gradient-bottom': true } as any) : {})}
            />

            <View style={[styles.heroText, { paddingHorizontal: sidePad, paddingBottom: 40 }]}>
              {/* Activity + region line */}
              <View style={styles.activityRow}>
                <View style={[styles.activityBadge, { borderColor: 'rgba(34,197,94,0.5)' }]}>
                  <Text style={styles.activityBadgeText}>{activityLabel.toUpperCase()}</Text>
                </View>
                <View style={[styles.activityBadge, { borderColor: 'rgba(255,255,255,0.2)', marginLeft: 6 }]}>
                  <Text style={[styles.activityBadgeText, { color: 'rgba(240,249,255,0.7)' }]}>
                    {trail.province.toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* Large display title */}
              <Text style={styles.heroTitle}>{trail.name}</Text>
              <Text style={styles.heroSub}>{trail.area}{trail.subarea ? ` · ${trail.subarea}` : ''}</Text>

              {/* Inline key stats in hero */}
              <View style={styles.heroStats}>
                <HeroStat label={t('Distancia', 'Distance')} value={`${trail.distance_km} km`} />
                <View style={styles.heroStatDivider} />
                <HeroStat label={t('Desnivel', 'Gain')} value={`+${trail.elevation_gain_m} m`} />
                <View style={styles.heroStatDivider} />
                <HeroStat label={t('Altitud', 'Altitude')} value={`${trail.max_altitude_m} m`} />
                <View style={styles.heroStatDivider} />
                <HeroStat label={t('Tiempo', 'Time')} value={durationLabel} />
              </View>
            </View>
          </ImageBackground>
        </View>

        {/* ── Sticky tab bar — index 1 ────────────────────────────────────────── */}
        <View
          style={[styles.tabBar, { paddingHorizontal: sidePad, backgroundColor: C.bg, borderBottomColor: C.border }]}
          {...(Platform.OS === 'web' ? ({ 'data-trail-tab-bar': true } as any) : {})}
        >
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabItem, active && styles.tabItemActive]}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.75}
              >
                <Text style={[styles.tabLabel, { color: active ? C.accent : C.muted }]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Tab content — index 2 ───────────────────────────────────────────── */}
        <View style={[styles.scrollContent, { paddingHorizontal: sidePad, backgroundColor: C.bg }]}>
          {activeTab === 'overview' && (
            <OverviewTab trail={trail} lang={lang} t={t} onStartHike={() => setIsHiking(true)} />
          )}
          {activeTab === 'logistics' && (
            <LogisticsTab lines={logisticsLines} t={t} />
          )}
          {activeTab === 'safety' && (
            <SafetyTab bullets={safetyBullets} difficulty={trail.difficulty} t={t} />
          )}
          {activeTab === 'gear' && (
            <GearTab categories={gearCategories} />
          )}
          <View style={{ height: 60 }} />
        </View>
      </ScrollView>
      <HikeMode
        visible={isHiking}
        trail={trail}
        onClose={() => setIsHiking(false)}
        t={t}
      />
    </View>
    </TrailThemeCtx.Provider>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatPill({ icon, value }: { icon: React.ComponentProps<typeof Ionicons>['name']; value: string }) {
  const C = useC();
  return (
    <View style={[styles.statPill, { backgroundColor: C.elevated, borderColor: C.border }]}>
      <Ionicons name={icon} size={13} color={C.accent} />
      <Text style={[styles.statPillText, { color: C.text }]}>{value}</Text>
    </View>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.heroStatItem}>
      <Text style={styles.heroStatValue}>{value}</Text>
      <Text style={styles.heroStatLabel}>{label}</Text>
    </View>
  );
}

function ElevationProfile({
  distanceKm,
  gainM,
  maxAltM,
  gpxTrack,
}: {
  distanceKm: number;
  gainM: number;
  maxAltM: number;
  gpxTrack?: Array<{ lat: number; lon: number; ele?: number }>;
}) {
  const C = useC();
  const [tooltip, setTooltip] = React.useState<{ x: number; y: number; elev: number; dist: number } | null>(null);
  if (Platform.OS !== 'web') return null;

  const W = 400;
  const H = 160;
  const padL = 38; // left pad for y-axis labels
  const padR = 6;
  const padT = 10;
  const padB = 22; // bottom pad for x-axis labels
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const hasRealEle = gpxTrack && gpxTrack.length >= 2 && gpxTrack.some((p) => p.ele != null);

  let rawPts: Array<{ x: number; y: number }>;

  if (hasRealEle) {
    const R = 6371;
    const haversineKm = (a: { lat: number; lon: number }, b: { lat: number; lon: number }) => {
      const dLat = ((b.lat - a.lat) * Math.PI) / 180;
      const dLon = ((b.lon - a.lon) * Math.PI) / 180;
      const s =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((a.lat * Math.PI) / 180) *
          Math.cos((b.lat * Math.PI) / 180) *
          Math.sin(dLon / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
    };
    let cumDist = 0;
    rawPts = gpxTrack!.map((p, i) => {
      if (i > 0) cumDist += haversineKm(gpxTrack![i - 1], p);
      return { x: cumDist, y: p.ele ?? maxAltM - gainM };
    });
  } else {
    const baseAlt = maxAltM - gainM;
    rawPts = [
      { x: 0,                y: baseAlt },
      { x: distanceKm * 0.10, y: baseAlt + gainM * 0.05 },
      { x: distanceKm * 0.28, y: baseAlt + gainM * 0.30 },
      { x: distanceKm * 0.48, y: baseAlt + gainM * 0.62 },
      { x: distanceKm * 0.65, y: maxAltM },
      { x: distanceKm * 0.78, y: maxAltM - gainM * 0.08 },
      { x: distanceKm * 0.90, y: maxAltM - gainM * 0.18 },
      { x: distanceKm,        y: maxAltM - gainM * 0.28 },
    ];
  }

  const totalX = rawPts[rawPts.length - 1].x || distanceKm;
  const minY = Math.min(...rawPts.map((p) => p.y));
  const maxY = Math.max(...rawPts.map((p) => p.y));
  const rangeY = maxY - minY || 1;

  const toSvg = (x: number, y: number): [number, number] => [
    padL + (x / totalX) * chartW,
    padT + (1 - (y - minY) / rangeY) * chartH,
  ];

  const pts = rawPts.map((p) => toSvg(p.x, p.y));

  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const [px, py] = pts[i - 1];
    const [cx, cy] = pts[i];
    const cpx = (px + cx) / 2;
    d += ` C ${cpx} ${py} ${cpx} ${cy} ${cx} ${cy}`;
  }
  const fillD = `${d} L ${pts[pts.length - 1][0]} ${padT + chartH} L ${padL} ${padT + chartH} Z`;

  const peakIdx = rawPts.reduce((best, p, i) => (p.y > rawPts[best].y ? i : best), 0);
  const peakPt = pts[peakIdx];

  // Y-axis gridlines at 25 / 50 / 75 %
  const gridFracs = [0.25, 0.5, 0.75];

  // X-axis ticks at 25 / 50 / 75 %
  const xTicks = [0.25, 0.5, 0.75];

  function handleMouseMove(e: React.MouseEvent<SVGRectElement>) {
    const rect = (e.currentTarget as SVGRectElement).getBoundingClientRect();
    const relX = e.clientX - rect.left;
    const frac = Math.max(0, Math.min(1, (relX - padL) / chartW));
    const distAtCursor = frac * totalX;
    // find nearest rawPt
    let nearest = rawPts[0];
    let minDist = Math.abs(rawPts[0].x - distAtCursor);
    for (const p of rawPts) {
      const d2 = Math.abs(p.x - distAtCursor);
      if (d2 < minDist) { minDist = d2; nearest = p; }
    }
    const [sx, sy] = toSvg(nearest.x, nearest.y);
    setTooltip({ x: sx, y: sy, elev: Math.round(nearest.y), dist: Math.round(nearest.x * 10) / 10 });
  }

  return (
    <View style={{ marginTop: 8 }}>
      {/* @ts-ignore — SVG on web */}
      <svg
        width="100%"
        viewBox={`0 0 ${W} ${H}`}
        style={{ display: 'block', overflow: 'visible' }}
        onMouseLeave={() => setTooltip(null)}
      >
        <defs>
          {/* @ts-ignore */}
          <linearGradient id="elevFill" x1="0" y1="0" x2="0" y2="1">
            {/* @ts-ignore */}
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.30" />
            {/* @ts-ignore */}
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Gridlines */}
        {gridFracs.map((f) => {
          const elevLabel = Math.round(minY + f * rangeY);
          const gy = padT + (1 - f) * chartH;
          return (
            <React.Fragment key={f}>
              {/* @ts-ignore */}
              <line x1={padL} y1={gy} x2={padL + chartW} y2={gy} stroke="rgba(100,116,139,0.2)" strokeWidth="1" strokeDasharray="3 3" />
              {/* @ts-ignore */}
              <text x={padL - 4} y={gy + 4} textAnchor="end" fontSize="9" fill="#64748b">{elevLabel}</text>
            </React.Fragment>
          );
        })}

        {/* Fill + line */}
        {/* @ts-ignore */}
        <path d={fillD} fill="url(#elevFill)" />
        {/* @ts-ignore */}
        <path d={d} fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Peak dot */}
        {/* @ts-ignore */}
        <circle cx={peakPt[0]} cy={peakPt[1]} r="4" fill="#22c55e" />
        {/* @ts-ignore */}
        <circle cx={peakPt[0]} cy={peakPt[1]} r="8" fill="#22c55e" fillOpacity="0.2" />
        {/* @ts-ignore */}
        <text x={peakPt[0]} y={peakPt[1] - 12} textAnchor="middle" fontSize="9" fontWeight="700" fill="#22c55e">{maxAltM.toLocaleString()} m</text>

        {/* X-axis distance ticks */}
        {xTicks.map((f) => {
          const tx = padL + f * chartW;
          const distLabel = `${Math.round(f * distanceKm * 10) / 10} km`;
          return (
            <React.Fragment key={f}>
              {/* @ts-ignore */}
              <line x1={tx} y1={padT + chartH} x2={tx} y2={padT + chartH + 4} stroke="#64748b" strokeWidth="1" />
              {/* @ts-ignore */}
              <text x={tx} y={padT + chartH + 14} textAnchor="middle" fontSize="9" fill="#64748b">{distLabel}</text>
            </React.Fragment>
          );
        })}

        {/* Hover interaction overlay */}
        {/* @ts-ignore */}
        <rect
          x={padL} y={padT} width={chartW} height={chartH}
          fill="transparent"
          style={{ cursor: 'crosshair' }}
          onMouseMove={handleMouseMove}
        />

        {/* Tooltip */}
        {tooltip && (
          <>
            {/* @ts-ignore */}
            <line x1={tooltip.x} y1={padT} x2={tooltip.x} y2={padT + chartH} stroke="rgba(255,255,255,0.25)" strokeWidth="1" strokeDasharray="3 3" />
            {/* @ts-ignore */}
            <circle cx={tooltip.x} cy={tooltip.y} r="4" fill="#fff" stroke="#22c55e" strokeWidth="2" />
            {/* @ts-ignore */}
            <rect x={tooltip.x + 6} y={tooltip.y - 22} width={72} height={20} rx="4" fill="#0f1724" fillOpacity="0.92" />
            {/* @ts-ignore */}
            <text x={tooltip.x + 42} y={tooltip.y - 8} textAnchor="middle" fontSize="9" fill="#f0f9ff">
              {tooltip.elev.toLocaleString()} m · {tooltip.dist} km
            </text>
          </>
        )}
      </svg>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
        <Text style={{ color: C.muted, fontSize: 10 }}>0 km</Text>
        <Text style={{ color: C.accent, fontSize: 11, fontWeight: '700' }}>
          ↑ {gainM.toLocaleString()} m · {maxAltM.toLocaleString()} m máx
        </Text>
        <Text style={{ color: C.muted, fontSize: 10 }}>{distanceKm} km</Text>
      </View>
    </View>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  const C = useC();
  return <View style={[styles.sectionCard, { backgroundColor: C.surface, borderColor: C.border }]}>{children}</View>;
}

function CardLabel({ text }: { text: string }) {
  const C = useC();
  return <Text style={[styles.cardLabel, { color: C.muted }]}>{text}</Text>;
}

function VideoSection({
  trailId,
  t,
}: {
  trailId: string;
  t: (es: string, en: string) => string;
}) {
  const C = useC();
  const videoId = TRAIL_VIDEOS[trailId];
  if (!videoId) return null;

  return (
    <SectionCard>
      <CardLabel text="VIDEO" />
      {Platform.OS === 'web' ? (
        <View
          style={{
            width: '100%',
            height: 200,
            borderRadius: 12,
            overflow: 'hidden',
            marginTop: 4,
          }}
        >
          {/* @ts-ignore — iframe is web-only */}
          <iframe
            src={`https://www.youtube.com/embed/${videoId}`}
            style={{ width: '100%', height: '100%', border: 'none' }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </View>
      ) : (
        <TouchableOpacity
          style={[styles.videoButton, { borderColor: C.accent }]}
          onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${videoId}`)}
          activeOpacity={0.75}
        >
          <Ionicons name="play-circle-outline" size={22} color={C.accent} />
          <Text style={[styles.videoButtonText, { color: C.accent }]}>
            {t('Ver video en YouTube', 'Watch on YouTube')}
          </Text>
          <Ionicons name="open-outline" size={16} color={C.muted} style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
      )}
    </SectionCard>
  );
}

function DownloadRow({
  trail,
  t,
}: {
  trail: (typeof ARGENTINA_TRAILS)[0] & { gpxTrack?: Array<{ lat: number; lon: number; ele?: number }>; long_description?: string; parking?: string; access_notes?: string; water_sources?: string; refugio?: string; namedWaypoints?: Array<{ lat: number; lon: number; name: string; description: string }> };
  t: (es: string, en: string) => string;
}) {
  const C = useC();
  const { width } = useWindowDimensions();
  const [gpxState, setGpxState] = useState<'idle' | 'done'>('idle');
  const narrow = width < 420;

  async function handleGpx() {
    const gpxPoints = (trail as any).gpxTrack
      ? (trail as any).gpxTrack.map((p: any) => ({ lat: p.lat, lon: p.lon, ele: p.ele, name: '' }))
      : [{ lat: trail.coordinates.lat, lon: trail.coordinates.lon, name: trail.trailhead }];

    if (Platform.OS === 'web') {
      const ok = downloadGpx(trail.name, gpxPoints, trail.description);
      if (ok) {
        setGpxState('done');
        setTimeout(() => setGpxState('idle'), 2500);
      }
    } else {
      try {
        const { FileSystem } = await import('expo-file-system') as any;
        const content = buildGpx(trail.name, gpxPoints, trail.description);
        const filename = `${trail.id.replace(/[^a-z0-9-]/gi, '-')}.gpx`;
        const uri = `${FileSystem.documentDirectory}${filename}`;
        await FileSystem.writeAsStringAsync(uri, content, { encoding: 'utf8' });
        const canOpen = await Linking.canOpenURL(uri);
        if (canOpen) {
          await Linking.openURL(uri);
        } else {
          await Linking.openURL(`osmand.api://import_gpx?url=${encodeURIComponent(uri)}`).catch(() => {
            Linking.openURL('market://details?id=net.osmand');
          });
        }
        setGpxState('done');
        setTimeout(() => setGpxState('idle'), 2500);
      } catch {
        // swallow
      }
    }
  }

  function handlePdf(url: string) {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') window.open(url, '_blank');
    } else {
      Linking.openURL(url);
    }
  }

  const pdfDirectUrl = ((trail as any).pdfUrl as string | undefined) || '';

  return (
    <View
      style={[
        dlRowS.row,
        { backgroundColor: C.surface, borderColor: C.border },
        narrow && dlRowS.rowNarrow,
      ]}
    >
      <View style={narrow ? dlRowS.textBlockNarrow : { flex: 1 }}>
        <Text style={[dlRowS.label, { color: C.muted }]}>{t('DESCARGAS OFFLINE', 'OFFLINE DOWNLOADS')}</Text>
        <Text style={[dlRowS.sub, { color: C.text }]}>
          {t('Guardá la ruta en tu dispositivo', 'Save the route to your device')}
        </Text>
      </View>

      <View style={[dlRowS.btns, narrow && dlRowS.btnsNarrow]}>
        <TouchableOpacity
          style={[dlRowS.btn, dlRowS.btnBlue, narrow && dlRowS.btnFull]}
          onPress={handleGpx}
          activeOpacity={0.8}
        >
          <Ionicons
            name={gpxState === 'done' ? 'checkmark-outline' : 'navigate-outline'}
            size={15}
            color="#93c5fd"
          />
          <Text style={dlRowS.btnTxtBlue}>
            {gpxState === 'done' ? t('GPX listo', 'GPX ready') : 'GPX'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[dlRowS.btn, pdfDirectUrl ? dlRowS.btnGreen : dlRowS.btnDisabled, narrow && dlRowS.btnFull]}
          onPress={() => pdfDirectUrl ? handlePdf(pdfDirectUrl) : undefined}
          activeOpacity={pdfDirectUrl ? 0.8 : 1}
          disabled={!pdfDirectUrl}
        >
          <Ionicons name="document-text-outline" size={15} color={pdfDirectUrl ? '#86efac' : '#475569'} />
          <Text style={pdfDirectUrl ? dlRowS.btnTxtGreen : dlRowS.btnTxtDisabled}>
            {pdfDirectUrl ? t('Mapa PDF', 'Map PDF') : t('PDF pronto', 'PDF soon')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const dlRowS = StyleSheet.create({
  row: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowNarrow: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 14,
  },
  textBlockNarrow: { width: '100%' },
  label: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 2 },
  sub: { fontSize: 13, fontWeight: '600' },
  btns: { flexDirection: 'row', gap: 8 },
  btnsNarrow: { flexDirection: 'row', gap: 10 },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10,
    borderWidth: 1,
  },
  btnFull: { flex: 1 },
  btnBlue: { backgroundColor: '#1e3a5f', borderColor: '#3b82f6' },
  btnGreen: { backgroundColor: '#14532d', borderColor: '#22c55e' },
  btnDisabled: { backgroundColor: '#1a2030', borderColor: '#2d3748' },
  btnTxtBlue: { fontSize: 13, fontWeight: '700', color: '#93c5fd' },
  btnTxtGreen: { fontSize: 13, fontWeight: '700', color: '#86efac' },
  btnTxtDisabled: { fontSize: 13, fontWeight: '700', color: '#475569' },
});

function OverviewTab({
  trail,
  lang,
  t,
  onStartHike,
}: {
  trail: (typeof ARGENTINA_TRAILS)[0];
  lang: 'es' | 'en';
  t: (es: string, en: string) => string;
  onStartHike: () => void;
}) {
  const C = useC();
  return (
    <View style={styles.tabContent}>
      <DownloadRow trail={trail as any} t={t} />

      {/* Start Hike button */}
      <TouchableOpacity
        style={[hikeStartS.btn, { backgroundColor: '#14532d', borderColor: C.accent }]}
        onPress={onStartHike}
        activeOpacity={0.8}
      >
        <Ionicons name="walk-outline" size={20} color={C.accent} />
        <View>
          <Text style={[hikeStartS.label, { color: C.accent }]}>
            {t('Iniciar Caminata', 'Start Hike')}
          </Text>
          <Text style={[hikeStartS.sub, { color: 'rgba(134,239,172,0.7)' }]}>
            {t('GPS en vivo · tiempo · distancia', 'Live GPS · time · distance')}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={C.accent} style={{ marginLeft: 'auto' }} />
      </TouchableOpacity>

      <SectionCard>
        <CardLabel text={t('Perfil de elevación', 'Elevation Profile')} />
        <ElevationProfile
          distanceKm={trail.distance_km}
          gainM={trail.elevation_gain_m}
          maxAltM={trail.max_altitude_m}
          gpxTrack={(trail as any).gpxTrack}
        />
      </SectionCard>

      {(trail as any).gpxTrack?.length >= 2 && (
        <SectionCard>
          <CardLabel text={t('Vista satelital 3D', '3D Satellite View')} />
          {TrailMap3DCinematic ? (
            <TrailMap3DCinematic
              track={(trail as any).gpxTrack}
              trailName={trail.name}
              height={420}
            />
          ) : (
            <TrailMap3D
              track={(trail as any).gpxTrack}
              trailName={trail.name}
              height={320}
            />
          )}
        </SectionCard>
      )}

      <SectionCard>
        <CardLabel text={t('Descripción', 'Description')} />
        <Text style={[styles.bodyText, { color: C.text }]}>{trail.description}</Text>
        {!!trail.long_description &&
          trail.long_description.split('\n\n').map((para, i) => (
            <Text key={i} style={[styles.bodyText, { color: C.text, marginTop: 12 }]}>
              {para.trim()}
            </Text>
          ))}
      </SectionCard>

      {/* Live community condition reports (shown once Supabase is configured) */}
      <TrailReports trailId={trail.id} colors={C} />

      {!!trail.namedWaypoints?.length && (
        <SectionCard>
          <CardLabel text={t('Puntos de referencia', 'Key waypoints')} />
          {trail.namedWaypoints!.map((wp, i) => (
            <View key={i} style={{ marginBottom: 10 }}>
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={16} color={C.accent} />
                <Text style={[styles.bodyText, { color: C.text, fontWeight: '700' }]}>{wp.name}</Text>
              </View>
              {!!wp.description && (
                <Text style={[styles.bodyText, { color: C.muted, marginLeft: 24 }]}>{wp.description}</Text>
              )}
            </View>
          ))}
        </SectionCard>
      )}

      {(!!trail.access_notes || !!trail.parking || !!trail.water_sources || !!trail.refugio) && (
        <SectionCard>
          <CardLabel text={t('Logística', 'Logistics')} />
          {!!trail.access_notes && (
            <View style={[styles.infoRow, { marginBottom: 8 }]}>
              <Ionicons name="navigate-outline" size={16} color={C.accent} />
              <Text style={[styles.bodyText, { color: C.text, flex: 1 }]}>{trail.access_notes}</Text>
            </View>
          )}
          {!!trail.parking && (
            <View style={[styles.infoRow, { marginBottom: 8 }]}>
              <Ionicons name="car-outline" size={16} color={C.accent} />
              <Text style={[styles.bodyText, { color: C.text, flex: 1 }]}>{trail.parking}</Text>
            </View>
          )}
          {!!trail.water_sources && (
            <View style={[styles.infoRow, { marginBottom: 8 }]}>
              <Ionicons name="water-outline" size={16} color={C.accent} />
              <Text style={[styles.bodyText, { color: C.text, flex: 1 }]}>{trail.water_sources}</Text>
            </View>
          )}
          {!!trail.refugio && (
            <View style={styles.infoRow}>
              <Ionicons name="home-outline" size={16} color={C.accent} />
              <Text style={[styles.bodyText, { color: C.text, flex: 1 }]}>{trail.refugio}</Text>
            </View>
          )}
        </SectionCard>
      )}

      <SectionCard>
        <CardLabel text={t('Mejor época', 'Best Season')} />
        <View style={styles.infoRow}>
          <Ionicons name="sunny-outline" size={16} color={C.accent} />
          <Text style={[styles.bodyText, { color: C.text }]}>{trail.best_season}</Text>
        </View>
      </SectionCard>

      <SectionCard>
        <CardLabel text={t('Punto de inicio', 'Trailhead')} />
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color={C.accent} />
          <Text style={[styles.bodyText, { color: C.text, flex: 1 }]}>{trail.trailhead}</Text>
        </View>
      </SectionCard>

      <SectionCard>
        <CardLabel text={t('Permisos', 'Permits')} />
        <View style={styles.infoRow}>
          <Ionicons
            name={trail.permits_required ? 'document-text-outline' : 'checkmark-circle-outline'}
            size={16}
            color={trail.permits_required ? '#fbbf24' : C.accent}
          />
          <Text style={[styles.bodyText, { color: C.text, flex: 1 }]}>
            {trail.permits_required
              ? t(
                  'Se requiere permiso previo. Gestionarlo con anticipación ante la autoridad del parque.',
                  'A permit is required in advance. Obtain it through the park authority before your trip.',
                )
              : t(
                  'No se requiere permiso especial para esta ruta.',
                  'No special permit is required for this trail.',
                )}
          </Text>
        </View>
      </SectionCard>

      {trail.tags.length > 0 && (
        <View style={styles.tagsRow}>
          {trail.tags.map((tag) => (
            <View key={tag} style={[styles.tag, { backgroundColor: C.surface, borderColor: C.border }]}>
              <Text style={[styles.tagText, { color: C.muted }]}>{tag}</Text>
            </View>
          ))}
        </View>
      )}

      <VideoSection trailId={trail.id} t={t} />

      {trail.id === 'tierra-del-fuego-costera' && (
        <PeninsulaMitreSection t={t} lang={lang} />
      )}
    </View>
  );
}

function PeninsulaMitreSection({
  t,
  lang,
}: {
  t: (es: string, en: string) => string;
  lang: 'es' | 'en';
}) {
  const C = useC();

  const chips = lang === 'es'
    ? ['70 km aprox.', '7–14 días', 'Dificultad alta', 'Sin senderos marcados']
    : ['70 km approx.', '7–14 days', 'High difficulty', 'No marked trails'];

  const keyStats = [
    { k: t('Inicio', 'Start'), v: 'Estancia Moat' },
    { k: t('Final', 'End'), v: 'Bahía Sloggett / Puerto Español' },
    { k: t('Terreno', 'Terrain'), v: t('Costa, turba, bosque', 'Coast, peat bog, forest') },
    { k: t('Época', 'Season'), v: t('Nov–Abr', 'Nov–Apr') },
  ];

  const stages = lang === 'es' ? [
    { day: 'Día 1', text: 'Traslado a Moat, trekking por el Canal Beagle y campamento en Casa Vieja.' },
    { day: 'Día 2', text: 'Senderos altos hasta Cabo San Pío y campamento en Puesto Ibarra.' },
    { day: 'Día 3', text: 'Llegada a Bahía Sloggett, con draga de oro histórica y campamento cercano.' },
    { day: 'Día 4', text: 'Vadeo del Río López y llegada a Playa Dorada.' },
    { day: 'Día 5', text: 'Avance hacia Playa Paraíso y campamento previo al tramo final.' },
    { day: 'Día 6', text: 'Cuevas de Gardinier, Río Bonpland, Bahía Aguirre y Puerto Español.' },
    { day: 'Días 7–8', text: 'Descanso o espera logística en Puerto Español.' },
    { day: 'Día 9', text: 'Regreso en velero a Ushuaia por el Canal Beagle.' },
  ] : [
    { day: 'Day 1', text: 'Transfer to Moat, trekking along the Beagle Channel and camp at Casa Vieja.' },
    { day: 'Day 2', text: 'High ridge trail to Cabo San Pío and camp at Puesto Ibarra.' },
    { day: 'Day 3', text: 'Arrival at Bahía Sloggett, historic gold dredge and nearby camp.' },
    { day: 'Day 4', text: 'Ford of Río López and arrival at Playa Dorada.' },
    { day: 'Day 5', text: 'Advance to Playa Paraíso and camp before the final stretch.' },
    { day: 'Day 6', text: 'Gardinier caves, Río Bonpland, Bahía Aguirre and Puerto Español.' },
    { day: 'Days 7–8', text: 'Rest or logistics wait at Puerto Español.' },
    { day: 'Day 9', text: 'Return by sailboat to Ushuaia along the Beagle Channel.' },
  ];

  const descriptionEs = 'Península Mitre ofrece una experiencia de hiking de expedición, remota y exigente. La costa sur es la travesía más conocida: combina acantilados bajos, playas rocosas, ríos que se cruzan según la marea y zonas de bosque subantártico.';
  const descriptionEn = 'Península Mitre is a remote expedition hiking area at the eastern tip of Tierra del Fuego. The southern coast crossing is the best-known route: it combines low coastal cliffs, rocky beaches, river crossings, and subantarctic forest sections.';
  const subDescEs = 'Es ideal para personas con experiencia previa, buen estado físico y capacidad de autosuficiencia. La temporada recomendada para particulares va del 1 de noviembre al 15 de abril, con registro obligatorio antes del ingreso.';
  const subDescEn = 'Best suited for experienced hikers with strong fitness and self-sufficient camping skills. For private visitors, the official season runs from November 1st to April 15th, with mandatory registration before entry.';

  return (
    <SectionCard>
      <CardLabel text={t('ÁREA NATURAL PROTEGIDA · EXPEDICIÓN', 'PROTECTED AREA · EXPEDITION')} />
      <Text style={{ fontSize: 17, fontWeight: '800', color: C.accent, letterSpacing: -0.3 }}>
        Península Mitre
      </Text>
      <Text style={{ fontSize: 13, color: C.muted }}>
        {t('Ruta tipo expedición · Tierra del Fuego', 'Expedition route · Tierra del Fuego')}
      </Text>

      {/* Chips */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {chips.map((chip) => (
          <View key={chip} style={[styles.tag, { backgroundColor: C.elevated, borderColor: C.border }]}>
            <Text style={[styles.tagText, { color: C.text }]}>{chip}</Text>
          </View>
        ))}
      </View>

      {/* Key stats */}
      <View style={{ gap: 8 }}>
        {keyStats.map(({ k, v }) => (
          <View
            key={k}
            style={{ borderRadius: 10, padding: 12, backgroundColor: C.elevated, borderWidth: 1, borderColor: C.border }}
          >
            <Text style={{ fontSize: 11, color: C.muted, marginBottom: 2 }}>{k}</Text>
            <Text style={{ fontSize: 14, fontWeight: '700', color: C.text }}>{v}</Text>
          </View>
        ))}
      </View>

      {/* Timeline */}
      <Text style={[styles.cardLabel, { color: C.muted }]}>
        {t('ETAPAS DE LA RUTA', 'ROUTE STAGES')}
      </Text>
      <View style={{ borderLeftWidth: 2, borderLeftColor: C.border, marginLeft: 8, paddingLeft: 16, gap: 12 }}>
        {stages.map(({ day, text }) => (
          <View key={day}>
            <Text style={{ color: C.accent, fontWeight: '700', fontSize: 13 }}>{day}</Text>
            <Text style={{ color: C.text, fontSize: 13, lineHeight: 20 }}>{text}</Text>
          </View>
        ))}
      </View>

      {/* Descriptions */}
      <Text style={[styles.bodyText, { color: C.text }]}>
        {lang === 'es' ? descriptionEs : descriptionEn}
      </Text>
      <Text style={[styles.bodyText, { color: C.muted, fontSize: 13 }]}>
        {lang === 'es' ? subDescEs : subDescEn}
      </Text>

      {/* Official info */}
      <View style={{ backgroundColor: C.elevated, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: C.border }}>
        <Text style={{ color: C.muted, fontSize: 12, lineHeight: 18 }}>
          {t(
            'Temporada: 1 Nov – 15 Abr. Registro de visitantes obligatorio. Equipo mínimo recomendado: GPS, tabla de mareas, dispositivo de comunicación, botiquín y comida para toda la expedición.',
            'Season: 1 Nov – 15 Apr. Visitor registration is mandatory. Recommended minimum equipment: GPS, tide table, communication device, first-aid kit and enough food for the whole expedition.',
          )}
        </Text>
      </View>
    </SectionCard>
  );
}

function LogisticsTab({
  lines,
  t,
}: {
  lines: string[];
  t: (es: string, en: string) => string;
}) {
  const C = useC();
  return (
    <View style={styles.tabContent}>
      <SectionCard>
        <CardLabel text={t('Información de acceso y logística', 'Access & Logistics')} />
        {lines.map((line, i) => (
          <View key={i} style={styles.bulletRow}>
            <View style={styles.bulletDot} />
            <Text style={[styles.bodyText, { color: C.text, flex: 1 }]}>{line}</Text>
          </View>
        ))}
      </SectionCard>
    </View>
  );
}

function SafetyTab({
  bullets,
  difficulty,
  t,
}: {
  bullets: string[];
  difficulty: TrailDifficulty;
  t: (es: string, en: string) => string;
}) {
  const C = useC();
  const alertColor: Record<TrailDifficulty, string> = {
    facil: '#22c55e',
    moderado: '#fbbf24',
    dificil: '#f97316',
    extremo: '#ef4444',
  };
  const color = alertColor[difficulty] ?? C.muted;

  return (
    <View style={styles.tabContent}>
      <View style={[styles.alertBanner, { borderColor: color, backgroundColor: `${color}18` }]}>
        <Ionicons name="warning-outline" size={18} color={color} />
        <Text style={[styles.alertText, { color }]}>
          {t(
            'Verifica siempre las condiciones antes de salir. La montaña no negocia.',
            'Always verify conditions before departure. The mountain does not negotiate.',
          )}
        </Text>
      </View>

      <SectionCard>
        <CardLabel text={t('Recomendaciones de seguridad', 'Safety Recommendations')} />
        {bullets.map((b, i) => (
          <View key={i} style={styles.bulletRow}>
            <Ionicons name="shield-checkmark-outline" size={14} color={C.accent} style={{ marginTop: 2 }} />
            <Text style={[styles.bodyText, { color: C.text, flex: 1 }]}>{b}</Text>
          </View>
        ))}
      </SectionCard>
    </View>
  );
}

function GearTab({ categories }: { categories: { category: string; items: string[] }[] }) {
  const C = useC();
  return (
    <View style={styles.tabContent}>
      {categories.map((cat) => (
        <SectionCard key={cat.category}>
          <CardLabel text={cat.category} />
          {cat.items.map((item, i) => (
            <View key={i} style={styles.bulletRow}>
              <Ionicons name="checkmark-outline" size={14} color={C.accent} style={{ marginTop: 2 }} />
              <Text style={[styles.bodyText, { color: C.text, flex: 1 }]}>{item}</Text>
            </View>
          ))}
        </SectionCard>
      ))}
    </View>
  );
}

// ─── Hike Mode ────────────────────────────────────────────────────────────────

function formatElapsed(ms: number): string {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

interface HikeModeProps {
  visible: boolean;
  trail: (typeof ALL_TRAILS)[0];
  onClose: () => void;
  t: (es: string, en: string) => string;
}

function HikeMode({ visible, trail, onClose, t }: HikeModeProps) {
  const C = useC();
  const [elapsed, setElapsed] = useState(0);
  const [userPos, setUserPos] = useState<{ lat: number; lon: number } | null>(null);
  const [posHistory, setPosHistory] = useState<Array<{ lat: number; lon: number }>>([]);
  const startRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const mapRef = useRef<MapLibreEsriHandle>(null);

  const updatePosition = useCallback((lat: number, lon: number) => {
    setUserPos({ lat, lon });
    setPosHistory((prev) => {
      const next = [...prev, { lat, lon }];
      return next;
    });
  }, []);

  useEffect(() => {
    if (!visible) return;
    startRef.current = Date.now();
    setElapsed(0);
    setUserPos(null);
    setPosHistory([]);

    timerRef.current = setInterval(() => {
      setElapsed(Date.now() - startRef.current);
    }, 1000);

    if (Platform.OS === 'web') {
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => updatePosition(pos.coords.latitude, pos.coords.longitude),
          () => {},
          { enableHighAccuracy: true, maximumAge: 3000, timeout: 20000 },
        );
      }
    } else {
      // Native: start tracking via WebView injectJavaScript
      setTimeout(() => {
        (mapRef.current as any)?.startHikeTracking?.();
      }, 1200); // give WebView time to load
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (Platform.OS === 'web' && watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      } else {
        (mapRef.current as any)?.stopHikeTracking?.();
      }
    };
  }, [visible, updatePosition]);

  const distanceCovered = posHistory.length >= 2
    ? posHistory.reduce((sum, p, i) => i === 0 ? 0 : sum + haversineKm(posHistory[i - 1], p), 0)
    : 0;

  const mapCenter: [number, number] = [trail.coordinates.lat, trail.coordinates.lon];

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <SafeAreaView style={[hikeS.root, { backgroundColor: C.bg }]}>
        {/* Header */}
        <View style={[hikeS.header, { borderBottomColor: C.border }]}>
          <View style={hikeS.headerLeft}>
            <View style={hikeS.activeDot} />
            <Text style={[hikeS.headerTitle, { color: C.accent }]}>
              {t('CAMINATA ACTIVA', 'ACTIVE HIKE')}
            </Text>
          </View>
          <TouchableOpacity
            style={[hikeS.stopBtn, { borderColor: '#ef4444' }]}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Ionicons name="stop-circle-outline" size={16} color="#ef4444" />
            <Text style={hikeS.stopBtnText}>{t('Detener', 'Stop')}</Text>
          </TouchableOpacity>
        </View>

        {/* Map */}
        <View style={{ flex: 1 }}>
          <HikeMap
            ref={mapRef}
            center={mapCenter}
            zoom={13}
            height="100%"
            layer="esri-topo"
            showPolyline={false}
            showHikingRoute={false}
            userPosition={userPos}
            onLocationUpdate={updatePosition}
          />
        </View>

        {/* Stats HUD */}
        <View style={[hikeS.hud, { backgroundColor: C.surface, borderTopColor: C.border }]}>
          <HikeStat
            icon="time-outline"
            label={t('Tiempo', 'Time')}
            value={formatElapsed(elapsed)}
            accent={C.accent}
            text={C.text}
            muted={C.muted}
          />
          <View style={[hikeS.hudDivider, { backgroundColor: C.border }]} />
          <HikeStat
            icon="walk-outline"
            label={t('Distancia', 'Distance')}
            value={distanceCovered >= 1
              ? `${distanceCovered.toFixed(2)} km`
              : `${Math.round(distanceCovered * 1000)} m`}
            accent={C.accent}
            text={C.text}
            muted={C.muted}
          />
          <View style={[hikeS.hudDivider, { backgroundColor: C.border }]} />
          <HikeStat
            icon="location-outline"
            label={t('GPS', 'GPS')}
            value={userPos ? t('Activo', 'Active') : t('Buscando…', 'Searching…')}
            accent={userPos ? C.accent : C.muted}
            text={C.text}
            muted={C.muted}
          />
        </View>

        {/* Trail name footer */}
        <View style={[hikeS.footer, { backgroundColor: C.bg }]}>
          <Ionicons name="map-outline" size={13} color={C.muted} />
          <Text style={[hikeS.footerText, { color: C.muted }]} numberOfLines={1}>
            {trail.name}
          </Text>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

function HikeStat({
  icon, label, value, accent, text, muted,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  accent: string;
  text: string;
  muted: string;
}) {
  return (
    <View style={hikeS.statItem}>
      <Ionicons name={icon} size={18} color={accent} />
      <Text style={[hikeS.statValue, { color: text }]}>{value}</Text>
      <Text style={[hikeS.statLabel, { color: muted }]}>{label}</Text>
    </View>
  );
}

const hikeStartS = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  label: { fontSize: 15, fontWeight: '800', letterSpacing: -0.3 },
  sub: { fontSize: 12, marginTop: 1 },
});

const hikeS = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  activeDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e',
  },
  headerTitle: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },
  stopBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8,
    backgroundColor: 'rgba(239,68,68,0.1)',
  },
  stopBtnText: { fontSize: 13, fontWeight: '700', color: '#ef4444' },
  hud: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  hudDivider: { width: 1, height: 40, marginHorizontal: 4 },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontSize: 17, fontWeight: '800', letterSpacing: -0.5 },
  statLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
  footer: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  footerText: { fontSize: 12, flex: 1 },
});

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },

  // Hero
  heroGradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: 'rgba(7,11,20,0.4)',
  },
  heroGradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '65%' as any,
    backgroundColor: 'rgba(7,11,20,0.75)',
  },
  backBtn: {
    position: 'absolute',
    zIndex: 10,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(7,11,20,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  heroText: { gap: 8 },
  activityRow: { flexDirection: 'row', marginBottom: 4 },
  activityBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    backgroundColor: 'rgba(7,11,20,0.5)',
  },
  activityBadgeText: { fontSize: 10, fontWeight: '700', color: C.accent, letterSpacing: 1.2 },
  heroTitle: {
    fontSize: 42,
    fontWeight: '900',
    color: C.text,
    letterSpacing: -1.5,
    lineHeight: 46,
  },
  heroSub: { fontSize: 13, color: 'rgba(240,249,255,0.6)', letterSpacing: 0.3, marginTop: 2 },

  // Hero inline stats
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },
  heroStatItem: { flex: 1, alignItems: 'center' },
  heroStatValue: { fontSize: 18, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  heroStatLabel: { fontSize: 10, color: 'rgba(240,249,255,0.5)', marginTop: 2, letterSpacing: 0.5 },
  heroStatDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.12)' },

  // Stats (legacy — kept for pill usage if needed)
  statsBar: {
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  statsScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: C.elevated ?? '#162035',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: C.border,
  },
  statPillText: { fontSize: 12, fontWeight: '600', color: C.text },
  diffPill: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  diffPillText: { fontSize: 12, fontWeight: '700' },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: C.bg,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap: 0,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: { borderBottomColor: C.accent },
  tabLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' as const },
  tabLabelActive: { color: C.accent },

  // Scroll / content
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 20, paddingBottom: 24, gap: 14 },
  tabContent: { gap: 14 },

  // Section card
  sectionCard: {
    backgroundColor: C.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.border,
    padding: 20,
    gap: 12,
  },
  cardLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
    color: C.muted,
    marginBottom: 2,
  },

  // Body text
  bodyText: { fontSize: 14, color: C.text, lineHeight: 22 },

  // Info row
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },

  // Bullets
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: C.accent,
    marginTop: 8,
  },

  // Tags
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  tag: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tagText: { fontSize: 12, color: C.muted },

  // Video button (native)
  videoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: C.accent,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 4,
  },
  videoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.accent,
  },

  // Alert banner
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  alertText: { fontSize: 13, fontWeight: '600', flex: 1, lineHeight: 20 },

  // Not found
  notFound: {
    flex: 1,
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    padding: 32,
  },
  notFoundTitle: { fontSize: 22, fontWeight: '800', color: C.text },
  notFoundSub: { fontSize: 14, color: C.muted, textAlign: 'center' },
  notFoundBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: C.surface,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  notFoundBtnText: { fontSize: 14, fontWeight: '600', color: C.text },
});
