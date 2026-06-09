import React, { useState } from 'react';
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
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  ARGENTINA_TRAILS,
  DIFFICULTY_LABEL,
  DIFFICULTY_COLOR,
} from '../../../src/data/argentinaTrails';
import { useLangStore } from '../../../src/store/langStore';
import type { TrailDifficulty, TrailActivity } from '../../../src/data/argentinaTrails';

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
  const { width } = useWindowDimensions();
  const { lang, t } = useLangStore();

  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  const trail = ARGENTINA_TRAILS.find((tr) => tr.id === id);

  const MAX_CONTENT = 800;
  const sidePad = Math.max(16, (width - Math.min(width, MAX_CONTENT)) / 2);

  // ── Not found ───────────────────────────────────────────────────────────────
  if (!trail) {
    return (
      <View style={[styles.notFound, { paddingTop: insets.top + 16 }]}>
        <Ionicons name="map-outline" size={52} color={C.muted} />
        <Text style={styles.notFoundTitle}>
          {t('Ruta no encontrada', 'Trail not found')}
        </Text>
        <Text style={styles.notFoundSub}>
          {t(
            'No existe una ruta con ese identificador.',
            'No trail exists with that identifier.',
          )}
        </Text>
        <TouchableOpacity
          style={styles.notFoundBtn}
          onPress={() => router.back()}
          activeOpacity={0.75}
        >
          <Ionicons name="chevron-back" size={18} color={C.text} />
          <Text style={styles.notFoundBtnText}>{t('Volver', 'Go back')}</Text>
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
    <View style={styles.root}>
      {/* Floating back button — always visible above scroll */}
      <TouchableOpacity
        style={[styles.backBtn, { top: insets.top + 10 }]}
        onPress={() => router.back()}
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
        <View style={styles.heroContainer}>
          <ImageBackground
            source={{ uri: trail.photo_uri }}
            style={styles.hero}
            resizeMode="cover"
          >
            <View style={styles.heroOverlay} />
            <View style={[styles.heroText, { paddingHorizontal: sidePad, paddingBottom: 28 }]}>
              <View style={styles.activityRow}>
                <View style={[styles.activityBadge, { borderColor: C.border }]}>
                  <Text style={styles.activityBadgeText}>{activityLabel}</Text>
                </View>
              </View>
              <Text style={styles.heroTitle}>{trail.name}</Text>
              <Text style={styles.heroSub}>
                {trail.province}
                {trail.subarea ? ` · ${trail.subarea}` : ''} · {trail.area}
              </Text>
            </View>
          </ImageBackground>
        </View>

        {/* ── Sticky header: stats + tabs — index 1 ──────────────────────────── */}
        <View style={{ backgroundColor: C.surface }}>
          {/* Stat pills */}
          <View style={[styles.statsBar, { paddingHorizontal: sidePad }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsScroll}>
              <StatPill icon="map-outline" value={`${trail.distance_km} km`} />
              <StatPill icon="trending-up-outline" value={`${trail.elevation_gain_m} m`} />
              <StatPill icon="triangle-outline" value={`${trail.max_altitude_m} m`} />
              <StatPill icon="time-outline" value={durationLabel} />
              <View style={[styles.diffPill, { backgroundColor: diffColor.bg }]}>
                <Text style={[styles.diffPillText, { color: diffColor.text }]}>{diffLabel}</Text>
              </View>
            </ScrollView>
          </View>

          {/* Tab bar */}
          <View style={[styles.tabBar, { paddingHorizontal: sidePad }]}>
            {TABS.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tabItem, active && styles.tabItemActive]}
                  onPress={() => setActiveTab(tab.key)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.tabLabel, active ? styles.tabLabelActive : { color: C.muted }]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Tab content — index 2 ───────────────────────────────────────────── */}
        <View style={[styles.scrollContent, { paddingHorizontal: sidePad }]}>
          {activeTab === 'overview' && (
            <OverviewTab trail={trail} lang={lang} t={t} />
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
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatPill({ icon, value }: { icon: React.ComponentProps<typeof Ionicons>['name']; value: string }) {
  return (
    <View style={styles.statPill}>
      <Ionicons name={icon} size={13} color={C.accent} />
      <Text style={styles.statPillText}>{value}</Text>
    </View>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return <View style={styles.sectionCard}>{children}</View>;
}

function CardLabel({ text }: { text: string }) {
  return <Text style={styles.cardLabel}>{text}</Text>;
}

function VideoSection({
  trailId,
  t,
}: {
  trailId: string;
  t: (es: string, en: string) => string;
}) {
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
          style={styles.videoButton}
          onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${videoId}`)}
          activeOpacity={0.75}
        >
          <Ionicons name="play-circle-outline" size={22} color={C.accent} />
          <Text style={styles.videoButtonText}>
            {t('Ver video en YouTube', 'Watch on YouTube')}
          </Text>
          <Ionicons name="open-outline" size={16} color={C.muted} style={{ marginLeft: 'auto' }} />
        </TouchableOpacity>
      )}
    </SectionCard>
  );
}

function OverviewTab({
  trail,
  lang,
  t,
}: {
  trail: (typeof ARGENTINA_TRAILS)[0];
  lang: 'es' | 'en';
  t: (es: string, en: string) => string;
}) {
  return (
    <View style={styles.tabContent}>
      {/* Description */}
      <SectionCard>
        <CardLabel text={t('Descripción', 'Description')} />
        <Text style={styles.bodyText}>{trail.description}</Text>
      </SectionCard>

      {/* Best season */}
      <SectionCard>
        <CardLabel text={t('Mejor época', 'Best Season')} />
        <View style={styles.infoRow}>
          <Ionicons name="sunny-outline" size={16} color={C.accent} />
          <Text style={styles.bodyText}>{trail.best_season}</Text>
        </View>
      </SectionCard>

      {/* Trailhead */}
      <SectionCard>
        <CardLabel text={t('Punto de inicio', 'Trailhead')} />
        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={16} color={C.accent} />
          <Text style={[styles.bodyText, { flex: 1 }]}>{trail.trailhead}</Text>
        </View>
      </SectionCard>

      {/* Permits */}
      <SectionCard>
        <CardLabel text={t('Permisos', 'Permits')} />
        <View style={styles.infoRow}>
          <Ionicons
            name={trail.permits_required ? 'document-text-outline' : 'checkmark-circle-outline'}
            size={16}
            color={trail.permits_required ? '#fbbf24' : C.accent}
          />
          <Text style={[styles.bodyText, { flex: 1 }]}>
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

      {/* Tags */}
      {trail.tags.length > 0 && (
        <View style={styles.tagsRow}>
          {trail.tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Video */}
      <VideoSection trailId={trail.id} t={t} />
    </View>
  );
}

function LogisticsTab({
  lines,
  t,
}: {
  lines: string[];
  t: (es: string, en: string) => string;
}) {
  return (
    <View style={styles.tabContent}>
      <SectionCard>
        <CardLabel text={t('Información de acceso y logística', 'Access & Logistics')} />
        {lines.map((line, i) => (
          <View key={i} style={styles.bulletRow}>
            <View style={styles.bulletDot} />
            <Text style={[styles.bodyText, { flex: 1 }]}>{line}</Text>
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
            <Text style={[styles.bodyText, { flex: 1 }]}>{b}</Text>
          </View>
        ))}
      </SectionCard>
    </View>
  );
}

function GearTab({ categories }: { categories: { category: string; items: string[] }[] }) {
  return (
    <View style={styles.tabContent}>
      {categories.map((cat) => (
        <SectionCard key={cat.category}>
          <CardLabel text={cat.category} />
          {cat.items.map((item, i) => (
            <View key={i} style={styles.bulletRow}>
              <Ionicons name="checkmark-outline" size={14} color={C.accent} style={{ marginTop: 2 }} />
              <Text style={[styles.bodyText, { flex: 1 }]}>{item}</Text>
            </View>
          ))}
        </SectionCard>
      ))}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },

  // Hero
  heroContainer: { height: 340 },
  hero: { flex: 1, justifyContent: 'flex-end' },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7,11,20,0.45)',
  },
  backBtn: {
    position: 'absolute',
    zIndex: 10,
    left: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(7,11,20,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  heroText: { gap: 4 },
  activityRow: { flexDirection: 'row' },
  activityBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(7,11,20,0.6)',
    marginBottom: 6,
  },
  activityBadgeText: { fontSize: 11, fontWeight: '600', color: C.accent, letterSpacing: 0.5 },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: C.text,
    letterSpacing: -0.5,
    lineHeight: 32,
  },
  heroSub: { fontSize: 13, color: 'rgba(240,249,255,0.7)', marginTop: 2 },

  // Stats
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
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap: 0,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 13,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: { borderBottomColor: C.accent },
  tabLabel: { fontSize: 12, fontWeight: '600' },
  tabLabelActive: { color: C.accent },

  // Scroll / content
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 20, paddingBottom: 24, gap: 14 },
  tabContent: { gap: 14 },

  // Section card
  sectionCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    gap: 10,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
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
