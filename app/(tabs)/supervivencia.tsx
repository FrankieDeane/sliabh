import React, { useState } from 'react';
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
import { useTheme } from '../../src/hooks/useTheme';
import { useLangStore } from '../../src/store/langStore';
import { WebFooter } from '../../src/components/layout/WebFooter';
import { SeoHead } from '../../src/components/ui/SeoHead';

const MAX_CONTENT = 860;

interface Guide {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  photo: string;
  titleEs: string;
  titleEn: string;
  taglineEs: string;
  taglineEn: string;
  quickEs: string[];
  quickEn: string[];
  bodyEs: string;
  bodyEn: string;
  warningEs?: string;
  warningEn?: string;
}

const GUIDES: Guide[] = [
  {
    id: 'perdido',
    photo: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1000&q=80&fit=crop&auto=format',
    icon: 'location-outline',
    color: '#ef4444',
    titleEs: 'Si te perdés',
    titleEn: 'If you get lost',
    taglineEs: 'Protocolo PARE: la regla más importante',
    taglineEn: 'STOP protocol: the most important rule',
    quickEs: [
      'PARA — no sigas caminando sin rumbo',
      'ANALIZA — ¿qué sabés? ¿qué ves? ¿dónde estás?',
      'REFLEXIONA — tu última posición conocida',
      'ESPERA — llamá y quedáte quieto si tenés señal',
    ],
    quickEn: [
      'STOP — do not keep walking without direction',
      'THINK — what do you know? what can you see?',
      'OBSERVE — recall your last known position',
      'PLAN — call for help and stay put if you have signal',
    ],
    bodyEs: 'La mayoría de las tragedias en montaña ocurren cuando una persona que se ha perdido sigue caminando y se aleja más del sendero. Quedarse quieto aumenta enormemente las posibilidades de ser encontrado.\n\nAntes de salir: registrá tu itinerario en la intendencia del parque. En El Chaltén, el Aconcagua y el volcán Lanín esto es obligatorio. En el Parque Nacional Nahuel Huapi (Bariloche) el Registro de Trekking es obligatorio y gratuito: se completa online en nahuelhuapi.gov.ar o barilochetrekking.com. Dejá copia de tu plan a alguien de confianza fuera del parque.\n\nEmergencias APN: 105 | Policía / Emergencias: 911\nBariloche — Protección Civil: 103 o (0294) 442-8276 | Mensajería satelital: comisiondeauxiliocab@gmail.com\nCentro de atención de emergencias de montaña (Mendoza): +54 261 427-0900',
    bodyEn: 'Most mountain tragedies happen when someone who is lost keeps walking and moves further from the trail. Staying put dramatically increases the chances of being found.\n\nBefore you leave: register your itinerary at the park ranger station. In El Chaltén, Aconcagua and Volcán Lanín this is mandatory. In Nahuel Huapi National Park (Bariloche) the Trekking Registry is mandatory and free: complete it online at nahuelhuapi.gov.ar or barilochetrekking.com. Leave a copy of your plan with someone you trust outside the park.\n\nAPN emergencies: 105 | Police / Emergencies: 911\nBariloche — Civil Protection: 103 or +54 294 442-8276 | Satellite messaging: comisiondeauxiliocab@gmail.com',
  },
  {
    id: 'frio',
    photo: 'https://images.unsplash.com/photo-1478827536114-da961b7f86d2?w=1000&q=80&fit=crop&auto=format',
    icon: 'snow-outline',
    color: '#60a5fa',
    titleEs: 'Frío extremo e hipotermia',
    titleEn: 'Extreme cold and hypothermia',
    taglineEs: 'Reconocerla a tiempo puede salvar una vida',
    taglineEn: 'Recognising it in time can save a life',
    quickEs: [
      'Temblor intenso → primera señal de alarma',
      'Confusión, torpeza, habla lenta → hipotermia media',
      'Sin temblor, inconsciente → emergencia crítica, llamá al 105',
      'Aislá del suelo y del viento ANTES de calentar',
    ],
    quickEn: [
      'Intense shivering → first warning sign',
      'Confusion, clumsiness, slurred speech → moderate hypothermia',
      'No shivering, unconscious → critical emergency, call 105',
      'Insulate from ground and wind BEFORE warming',
    ],
    bodyEs: 'El frío húmedo de la Patagonia es engañoso: a 10°C con viento y lluvia el riesgo de hipotermia es real. La clave es el sistema de capas:\n\n• Capa base (transpira): lana merino o sintético, nunca algodón\n• Capa intermedia (aísla): polar o pluma\n• Capa exterior (protege): cortaviento impermeable\n\nQué NO hacer: no frotar las extremidades congeladas, no dar alcohol, no sumergir en agua caliente. Calentá el núcleo (tronco, axilas, ingles) primero. Hidratá con líquidos tibios si la persona está consciente.',
    bodyEn: 'The cold damp air in Patagonia is deceptive: at 10°C with wind and rain the risk of hypothermia is real. The key is a layering system:\n\n• Base layer (wicks moisture): merino wool or synthetic, never cotton\n• Mid layer (insulates): fleece or down\n• Outer layer (protects): waterproof windshell\n\nWhat NOT to do: do not rub frozen extremities, do not give alcohol, do not immerse in hot water. Warm the core (torso, armpits, groin) first.',
  },
  {
    id: 'refugio',
    photo: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=1000&q=80&fit=crop&auto=format',
    icon: 'home-outline',
    color: '#f59e0b',
    titleEs: 'Refugio improvisado',
    titleEn: 'Improvised shelter',
    taglineEs: 'La prioridad es aislarte del suelo y del viento',
    taglineEn: 'The priority is to insulate yourself from ground and wind',
    quickEs: [
      'Buscá rompevientos natural: rocas, talud, bosque denso',
      'Aislate del suelo primero (pierde más calor que el aire)',
      'Bolsa de emergencia dorada: siempre en la mochila',
      'Dos personas juntas generan más calor',
    ],
    quickEn: [
      'Find natural windbreak: rocks, embankment, dense forest',
      'Insulate from the ground first (loses more heat than air)',
      'Emergency bivvy/space blanket: always in your pack',
      'Two people together generate more heat',
    ],
    bodyEs: 'En los parques nacionales argentinos está prohibido cortar vegetación viva para construir refugios. Usá lo que ya esté caído.\n\nAcampar dentro de los parques solo está permitido en los campamentos habilitados (campings de pernocte con servicio o campamentos técnicos registrados). Acampar fuera de los sitios autorizados puede derivar en multas y compromete el ecosistema.\n\nEquipo básico de emergencia: bolsa de vivac (bivy bag) o manta de emergencia aluminizada, bolsa de dormir adecuada a la temperatura mínima esperada más 5°C de margen, colchoneta aislante.',
    bodyEn: 'In Argentine national parks cutting live vegetation to build shelters is prohibited. Use only fallen material.\n\nCamping inside parks is only permitted at designated campsites (serviced campgrounds or registered technical campsites). Camping outside authorised sites can result in fines and harms the ecosystem.\n\nBasic emergency gear: bivvy bag or aluminised emergency blanket, sleeping bag rated for the minimum expected temperature plus 5°C margin, insulating sleeping mat.',
    warningEs: 'En parques nacionales: no cortés vegetación viva. Acampá solo en sitios habilitados.',
    warningEn: 'In national parks: do not cut live vegetation. Camp only at authorised sites.',
  },
  {
    id: 'llevar',
    photo: 'https://images.unsplash.com/photo-1501554728187-ce583db33af7?w=1000&q=80&fit=crop&auto=format',
    icon: 'bag-outline',
    color: '#22c55e',
    titleEs: 'Los 10 esenciales',
    titleEn: 'The 10 essentials',
    taglineEs: 'Lo que no puede faltar en ninguna salida',
    taglineEn: 'What you must never leave behind',
    quickEs: [
      '1. Navegación: mapa, brújula, GPS (con pilas de repuesto)',
      '2. Iluminación: linterna frontal + pilas extra',
      '3. Sol y viento: protector FPS 50+, anteojos, buff',
      '4. Primeros auxilios: botiquín básico + ibuprofeno + antidiarreico',
      '5. Cuchillo / navaja multiuso',
      '6. Fuego: encendedor + fósforos impermeables',
      '7. Refugio: bolsa de emergencia aluminizada',
      '8. Comida extra: para 1 día adicional al planificado',
      '9. Agua: 2 L mínimo + pastillas purificadoras o filtro',
      '10. Comunicación: cargador portátil, SPOT o PLB si es zona remota',
    ],
    quickEn: [
      '1. Navigation: map, compass, GPS (with spare batteries)',
      '2. Illumination: headlamp + spare batteries',
      '3. Sun and wind: SPF 50+ sunscreen, sunglasses, buff',
      '4. First aid: basic kit + ibuprofen + antidiarrheal',
      '5. Knife / multi-tool',
      '6. Fire: lighter + waterproof matches',
      '7. Shelter: aluminised emergency blanket',
      '8. Extra food: enough for 1 additional day',
      '9. Water: minimum 2L + purification tablets or filter',
      '10. Communication: power bank, SPOT or PLB for remote areas',
    ],
    bodyEs: 'Para Patagonia: sumá protección específica contra el viento (cortaviento), capas de abrigo aunque salgas con buen tiempo, y considerá el peso del agua (en Patagonia se puede usar filtro; en la Puna el agua puede tener arsénico — usá pastillas).\n\nPara zonas de altura (Aconcagua, Lanín): gafas de alta montaña, crampones y piolet son obligatorios. Consultá con el guía o la intendencia sobre el equipo técnico requerido.',
    bodyEn: 'For Patagonia: add specific wind protection (windshell), warm layers even when leaving in good weather, and consider water weight (in Patagonia you can use a filter; in the Puna water may contain arsenic — use purification tablets).\n\nFor high-altitude areas (Aconcagua, Lanín): high-mountain goggles, crampons and ice axe are mandatory. Consult with your guide or the ranger station about required technical gear.',
  },
  {
    id: 'sinsignal',
    photo: 'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=1000&q=80&fit=crop&auto=format',
    icon: 'wifi-outline',
    color: '#a78bfa',
    titleEs: 'Sin señal',
    titleEn: 'No signal',
    taglineEs: 'La preparación es la mejor conectividad',
    taglineEn: 'Preparation is the best connectivity',
    quickEs: [
      'Descargá mapas offline antes de salir (Maps.me, Wikiloc, OsmAnd)',
      'Avisá tu plan de ruta a alguien de confianza',
      'Acordá un horario de chequeo (si no doy señal antes de X hora, avisá)',
      'En expediciones remotas: considera un localizador SPOT o PLB (baliza de emergencia)',
    ],
    quickEn: [
      'Download offline maps before you leave (Maps.me, Wikiloc, OsmAnd)',
      'Share your route plan with someone you trust',
      'Agree on a check-in time (if no signal before X time, raise the alarm)',
      'For remote expeditions: consider a SPOT tracker or PLB (emergency beacon)',
    ],
    bodyEs: 'Cobertura por región: Buenos Aires y sierras de Córdoba tienen cobertura decente. Bariloche y el lago Nahuel Huapi tienen señal intermitente. El Chaltén, Fitz Roy, Torres del Paine y zonas del NOA tienen zonas sin señal extendidas. Aconcagua y la zona alta del Lanín: sin cobertura celular.\n\nRadio VHF o satelital: para expediciones de varios días en zonas remotas, la radio de dos vías o un localizador satelital (Garmin InReach, SPOT) es la diferencia entre una anécdota y una tragedia.\n\nDescargá este contenido antes de salir — toda la sección de Supervivencia de Sliabh está disponible offline una vez visitada.',
    bodyEn: 'Coverage by region: Buenos Aires and Córdoba hills have decent coverage. Bariloche and Nahuel Huapi lake area have intermittent signal. El Chaltén, Fitz Roy and parts of the Northwest have extended no-signal zones. Aconcagua and the upper Lanín zone: no cell coverage.\n\nVHF or satellite radio: for multi-day expeditions in remote areas, a two-way radio or satellite communicator (Garmin InReach, SPOT) is the difference between a story and a tragedy.',
  },
  {
    id: 'orientacion',
    photo: 'https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=1000&q=80&fit=crop&auto=format',
    icon: 'compass-outline',
    color: '#34d399',
    titleEs: 'Orientación',
    titleEn: 'Navigation and orientation',
    taglineEs: 'Cómo orientarse sin GPS',
    taglineEn: 'How to navigate without GPS',
    quickEs: [
      'El sol al mediodía apunta al NORTE en el hemisferio sur',
      'Usá el reloj: apuntá las 12 al sol → la bisectriz entre 12 y la hora señala el norte',
      'Cruz del Sur: el eje más largo apunta al polo sur celeste',
      'Los musgos crecen más en el lado sur (más húmedo y sombreado)',
    ],
    quickEn: [
      'At noon the sun points NORTH in the southern hemisphere',
      'Use your watch: point 12 at the sun → the bisector between 12 and the hour hand points north',
      'Southern Cross: the longest axis points to the south celestial pole',
      'Mosses grow thicker on the south side (wetter and shadier)',
    ],
    bodyEs: 'Leer un mapa topográfico: las curvas de nivel juntas = terreno empinado; separadas = terreno plano. Los ríos y arroyos siempre bajan hacia los valles. En la Patagonia los vientos fuertes vienen principalmente del oeste (oeste → este).\n\nBrújula básica: la aguja roja apunta al norte magnético (en Argentina la declinación magnética es baja, entre 5° y 10° en la mayoría de las rutas; se puede ignorar para navegación básica).\n\nSi no tenés brújula ni GPS: seguí un arroyo o río cuesta abajo. Te llevarán a zonas habitadas o caminos en la gran mayoría de los parques argentinos.',
    bodyEn: 'Reading a topo map: contour lines close together = steep terrain; spread apart = flat terrain. Rivers and streams always flow downhill toward valleys. In Patagonia the strong winds come mainly from the west.\n\nBasic compass: the red needle points to magnetic north (in Argentina magnetic declination is low, between 5° and 10° in most areas; it can be ignored for basic navigation).\n\nNo compass or GPS: follow a stream or river downhill. In the vast majority of Argentine parks they will lead you to inhabited areas or roads.',
  },
  {
    id: 'salud',
    photo: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1000&q=80&fit=crop&auto=format',
    icon: 'medkit-outline',
    color: '#fb923c',
    titleEs: 'Agotamiento, deshidratación y altura',
    titleEn: 'Exhaustion, dehydration and altitude',
    taglineEs: 'Cuándo frenar y cómo actuar',
    taglineEn: 'When to stop and how to act',
    quickEs: [
      'Regla de oro: hidratarse antes de tener sed (cada 20 minutos)',
      'Orina oscura = deshidratación; debés tomar agua YA',
      'Mal de altura: dolor de cabeza, náuseas, mareo → BAJÁ, no subás más',
      'Cansancio extremo: la mayoría de los accidentes ocurren en el descenso',
    ],
    quickEn: [
      'Golden rule: hydrate before you feel thirsty (every 20 minutes)',
      'Dark urine = dehydration; drink water NOW',
      'Altitude sickness: headache, nausea, dizziness → DESCEND, do not continue up',
      'Extreme fatigue: most accidents happen on the descent',
    ],
    bodyEs: 'Mal de altura (soroche): afecta a partir de los 2500 m aproximadamente. Síntomas leves: dolor de cabeza, insomnio, náuseas. La única cura efectiva es bajar. Para Aconcagua y zona del NOA (Puna, sobre 3500 m): programá días de aclimatación, no subás más de 300–400 m de altura de campamento por día.\n\nGolpe de calor (en el NOA y en verano a baja altura): piel roja y seca, temperatura corporal alta, confusión. Urgencia médica. Enfriá con agua y trasladá a zona de sombra.\n\nHidratación en la Puna: el agua de ríos y lagunas de altura puede contener arsénico. Usá pastillas purificadoras o filtro con carbón activado.',
    bodyEn: 'Altitude sickness (soroche): affects from approximately 2500m above sea level. Mild symptoms: headache, insomnia, nausea. The only effective cure is descent. For Aconcagua and the NOA/Puna region (above 3500m): plan acclimatisation days, do not gain more than 300–400m of camp altitude per day.\n\nHeat stroke (in the NOA and at low altitude in summer): red dry skin, high body temperature, confusion. Medical emergency. Cool with water and move to shade.',
  },
  {
    id: 'alimentacion',
    photo: 'https://images.unsplash.com/photo-1455156218388-5e61b526818b?w=1000&q=80&fit=crop&auto=format',
    icon: 'nutrition-outline',
    color: '#fbbf24',
    titleEs: 'Alimentación de emergencia',
    titleEn: 'Emergency nutrition',
    taglineEs: 'Qué llevar y cómo racionar',
    taglineEn: 'What to carry and how to ration',
    quickEs: [
      'Siempre llevar reserva para 1 día extra del planificado',
      'Prioridad energética: carbohidratos + grasas (frutos secos, chocolate, cereales)',
      'Evitar comida que requiera mucha agua para prepararse',
      'En frío extremo: comer más (el cuerpo gasta más calorías para mantenerse cálido)',
    ],
    quickEn: [
      'Always carry supplies for 1 extra day beyond your plan',
      'Energy priority: carbohydrates + fats (nuts, chocolate, cereals)',
      'Avoid food that requires a lot of water to prepare',
      'In extreme cold: eat more (the body burns more calories to stay warm)',
    ],
    bodyEs: 'Alimentos ideales para emergencia: nueces, maníes, chocolate negro, barras energéticas, galletas de arroz, liofilizados (freeze-dried) livianos. Evitar latas pesadas para trekking.\n\nFuego para cocinar: en los parques nacionales el fuego solo está permitido en los fogones habilitados. Fuera de esas zonas el fuego puede causar incendios devastadores (como el del PN Los Alerces en 2024). Llevá siempre un anafe de gas para trekking.\n\nSobre caza y pesca: la caza está prohibida en todos los parques nacionales de Argentina. La pesca con permiso está permitida en algunos parques (ej: Nahuel Huapi, Lanín). Consultá la intendencia. No dependas de la caza ni la recolección como plan de emergencia.',
    bodyEn: 'Ideal emergency foods: nuts, peanuts, dark chocolate, energy bars, rice cakes, lightweight freeze-dried meals. Avoid heavy cans for trekking.\n\nCooking fire: in national parks fire is only permitted in designated fire pits. Outside those areas fire can cause devastating wildfires. Always carry a gas camp stove.\n\nOn hunting and fishing: hunting is prohibited in all Argentine national parks. Fishing with a permit is allowed in some parks (e.g. Nahuel Huapi, Lanín). Ask the ranger station. Do not rely on hunting or foraging as an emergency plan.',
    warningEs: 'Fuego solo en fogones habilitados. La caza está prohibida en todos los parques nacionales.',
    warningEn: 'Fire only in designated pits. Hunting is prohibited in all national parks.',
  },
];

function GuideCard({ guide, c, t, expanded, onToggle }: {
  guide: Guide;
  c: any;
  t: (es: string, en: string) => string;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: c.surface, borderColor: expanded ? guide.color + '55' : c.border }]}
      activeOpacity={0.88}
      onPress={onToggle}
      {...(Platform.OS === 'web' ? ({ 'data-interactive-card': true } as any) : {})}
    >
      {/* Photo banner */}
      <View style={styles.cardPhoto}>
        {Platform.OS === 'web' && (
          // @ts-ignore
          <img
            src={guide.photo}
            alt=""
            loading="lazy"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
        <View style={styles.cardPhotoOverlay} />
        <View style={[styles.cardIcon, { backgroundColor: guide.color + 'E6' }]}>
          <Ionicons name={guide.icon} size={22} color="#fff" />
        </View>
        <View style={styles.cardPhotoText}>
          <Text style={styles.cardTitle}>{t(guide.titleEs, guide.titleEn)}</Text>
          <Text style={styles.cardTagline}>{t(guide.taglineEs, guide.taglineEn)}</Text>
        </View>
        <View style={styles.cardChevron}>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color="#fff" />
        </View>
      </View>

      {/* Quick bullets — always visible */}
      <View style={styles.quickList}>
        {(t(guide.quickEs.join('||'), guide.quickEn.join('||')).split('||')).map((line, i) => (
          <View key={i} style={styles.quickItem}>
            <View style={[styles.quickDot, { backgroundColor: guide.color }]} />
            <Text style={[styles.quickTxt, { color: c.text }]}>{line}</Text>
          </View>
        ))}
      </View>

      {/* Expanded body */}
      {expanded && (
        <View style={styles.expandedBody}>
          <View style={[styles.bodyDivider, { backgroundColor: c.border }]} />
          <Text style={[styles.bodyTxt, { color: c.muted }]}>
            {t(guide.bodyEs, guide.bodyEn)}
          </Text>
          {(guide.warningEs || guide.warningEn) && (
            <View style={styles.warningBox}>
              <Ionicons name="warning-outline" size={14} color="#f59e0b" />
              <Text style={styles.warningTxt}>
                {t(guide.warningEs ?? '', guide.warningEn ?? '')}
              </Text>
            </View>
          )}
          <View style={styles.disclaimerRow}>
            <Ionicons name="information-circle-outline" size={13} color={c.muted} />
            <Text style={[styles.disclaimerTxt, { color: c.muted }]}>
              {t(
                'Este contenido no reemplaza formación ni guías habilitados. Registrá tu trekking en la intendencia.',
                'This content does not replace training or licensed guides. Register your trek at the ranger station.',
              )}
            </Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function SupervivenciaScreen() {
  const { isDark } = useTheme();
  const { t } = useLangStore();
  const { width } = useWindowDimensions();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const contentW = Math.min(width, MAX_CONTENT);
  const sidePad = Math.max(16, (width - contentW) / 2);

  const c = isDark
    ? { bg: '#070b14', surface: '#0f1724', elevated: '#162035', border: '#1e2d42', text: '#f0f9ff', muted: '#64748b' }
    : { bg: '#f8fafc', surface: '#ffffff', elevated: '#f1f5f9', border: '#e2e8f0', text: '#0f172a', muted: '#64748b' };

  function toggle(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <SeoHead
        title="Guías de supervivencia de montaña — Sliabh"
        description="Guías de emergencia y supervivencia para montaña: hipotermia, orientación, cruce de ríos, clima y más. Disponibles sin conexión a internet."
        path="/supervivencia"
      />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero band — editorial full-bleed */}
        <View style={[styles.hero, { backgroundColor: '#0a0f1a' }]}>
          {Platform.OS === 'web' && (
            // @ts-ignore
            <img
              src="https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=1920&q=85&fit=crop&auto=format"
              alt=""
              style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                objectFit: 'cover', opacity: 0.45,
              }}
            />
          )}
          <View style={{ paddingHorizontal: sidePad, paddingVertical: 110 }}>
            <Text
              style={styles.heroPillTxt}
              {...(Platform.OS === 'web' ? ({ 'data-eyebrow': true } as any) : {})}
            >
              {t('SEGURIDAD EN MONTAÑA — GUÍAS OFFLINE', 'MOUNTAIN SAFETY — OFFLINE GUIDES')}
            </Text>
            <Text
              style={[
                styles.heroTitle,
                Platform.OS === 'web' ? ({ fontSize: 'clamp(38px, 6vw, 84px)' } as any) : { fontSize: 34 },
              ]}
              {...(Platform.OS === 'web' ? ({ 'data-display-xl': true } as any) : {})}
            >
              {t('Cuando no hay señal,\nhay preparación.', 'When there is no signal,\nthere is preparation.')}
            </Text>
            <Text
              style={styles.heroSub}
              {...(Platform.OS === 'web' ? ({ 'data-serif': true } as any) : {})}
            >
              {t(
                'Ocho guías de emergencia, escritas para la montaña argentina.\nUna vez visitadas, funcionan sin conexión.',
                'Eight emergency guides, written for the Argentine mountains.\nOnce visited, they work without connection.',
              )}
            </Text>
            <View style={styles.heroStats}>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatNum}>105</Text>
                <Text style={styles.heroStatLbl}>{t('Emergencias APN', 'APN Emergencies')}</Text>
              </View>
              <View style={styles.heroStatDiv} />
              <View style={styles.heroStat}>
                <Text style={styles.heroStatNum}>911</Text>
                <Text style={styles.heroStatLbl}>{t('Policía / SAME', 'Police / SAME')}</Text>
              </View>
              <View style={styles.heroStatDiv} />
              <View style={styles.heroStat}>
                <Text style={styles.heroStatNum}>8</Text>
                <Text style={styles.heroStatLbl}>{t('guías offline', 'offline guides')}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Offline notice */}
        <View style={[styles.offlineNotice, { paddingHorizontal: sidePad, backgroundColor: isDark ? '#0f1724' : '#f0fdf4', borderColor: isDark ? '#1e2d42' : '#bbf7d0' }]}>
          <Ionicons name="cloud-offline-outline" size={16} color="#22c55e" />
          <Text style={[styles.offlineNoticeTxt, { color: c.muted }]}>
            {t(
              'Este contenido se guarda en tu navegador. Una vez visitado, estará disponible sin conexión.',
              'This content is saved in your browser. Once visited, it will be available offline.',
            )}
          </Text>
        </View>

        {/* Guide cards */}
        <View style={[styles.guides, { paddingHorizontal: sidePad }]}>
          {GUIDES.map((guide) => (
            <GuideCard
              key={guide.id}
              guide={guide}
              c={c}
              t={t}
              expanded={expandedId === guide.id}
              onToggle={() => toggle(guide.id)}
            />
          ))}
        </View>

        {/* Responsible use banner */}
        <View style={[styles.responsibleBanner, { marginHorizontal: sidePad, backgroundColor: c.surface, borderColor: c.border }]}>
          <View style={styles.responsibleIcon}>
            <Ionicons name="leaf-outline" size={20} color="#22c55e" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.responsibleTitle, { color: c.text }]}>
              {t('Uso responsable de los parques', 'Responsible use of national parks')}
            </Text>
            <Text style={[styles.responsibleBody, { color: c.muted }]}>
              {t(
                'Argentina cuenta con 39 parques nacionales. Todos son ecosistemas protegidos. Conocer las normas antes de salir protege tanto al visitante como al ambiente.',
                'Argentina has 39 national parks. All are protected ecosystems. Knowing the rules before you leave protects both the visitor and the environment.',
              )}
            </Text>
          </View>
        </View>

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
  hero: { position: 'relative', overflow: 'hidden' },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 20,
  },
  heroPillTxt: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 4,
    marginBottom: 24,
  },
  heroTitle: {
    fontWeight: '400',
    color: '#fff',
    letterSpacing: -1,
    lineHeight: undefined,
    marginBottom: 22,
  },
  heroSub: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 27,
    marginBottom: 40,
    fontStyle: 'italic',
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroStat: { gap: 2, alignItems: 'center', paddingHorizontal: 12 },
  heroStatNum: { fontSize: 22, fontWeight: '900', color: '#f0f9ff', letterSpacing: -1 },
  heroStatLbl: { fontSize: 10, color: 'rgba(240,249,255,0.45)', fontWeight: '600', letterSpacing: 0.3 },
  heroStatDiv: { width: 1, height: 28, backgroundColor: 'rgba(240,249,255,0.12)' },

  // Offline notice
  offlineNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  offlineNoticeTxt: { fontSize: 12, lineHeight: 18, flex: 1 },

  // Guides
  guides: { gap: 12, paddingTop: 24 },

  // Card
  card: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    gap: 0,
  },
  cardPhoto: {
    height: 160,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#0f172a',
  },
  cardPhotoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5,10,20,0.55)',
  },
  cardIcon: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardPhotoText: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    right: 48,
    gap: 3,
  },
  cardChevron: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3, color: '#fff' },
  cardTagline: { fontSize: 12, lineHeight: 17, color: 'rgba(255,255,255,0.75)' },

  // Quick bullets
  quickList: { gap: 7, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14 },
  quickItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  quickDot: { width: 5, height: 5, borderRadius: 3, marginTop: 7, flexShrink: 0 },
  quickTxt: { fontSize: 13, lineHeight: 19, flex: 1, fontWeight: '500' },

  // Expanded
  expandedBody: { gap: 12 },
  bodyDivider: { height: 1 },
  bodyTxt: { fontSize: 13, lineHeight: 21 },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(245,158,11,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.25)',
    borderRadius: 10,
    padding: 10,
  },
  warningTxt: { color: '#f59e0b', fontSize: 12, lineHeight: 18, flex: 1, fontWeight: '600' },
  disclaimerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  disclaimerTxt: { fontSize: 11, lineHeight: 16, flex: 1, fontStyle: 'italic' },

  // Responsible use
  responsibleBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    marginTop: 24,
    marginBottom: 8,
  },
  responsibleIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(34,197,94,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  responsibleTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  responsibleBody: { fontSize: 12, lineHeight: 19 },
});
