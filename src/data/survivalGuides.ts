/**
 * Survival guide content, shared by the /supervivencia screen and
 * scripts/prerender-core.mjs (static <noscript> copy + JSON-LD, so crawlers
 * that never expand a card still read every guide). Plain TS, no React
 * Native imports, so the Node prerender can load it (scripts/lib/load-ts.mjs).
 */
import type { Ionicons } from '@expo/vector-icons';

export interface Guide {
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

export const GUIDES: Guide[] = [
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
  {
    id: 'zonas-seguras',
    photo: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=1000&q=80&fit=crop&auto=format',
    icon: 'earth-outline',
    color: '#14b8a6',
    titleEs: 'Zonas más seguras de Argentina ante una catástrofe global',
    titleEn: 'Safest areas of Argentina in a global catastrophe',
    taglineEs: 'Guerra nuclear, colapso tecnológico o pandemia: qué dice la evidencia',
    taglineEn: 'Nuclear war, tech collapse or pandemic: what the evidence says',
    quickEs: [
      'Ningún lugar es 100% seguro: protegen la distancia, el agua, la comida y la comunidad',
      'Argentina no tiene armas nucleares y está en el hemisferio sur, lejos de los blancos más probables',
      'Estudios de invierno nuclear ubican a Argentina entre los países que mejor seguirían produciendo alimentos',
      'Dentro del país: lejos de grandes ciudades, puertos, centrales nucleares y bases militares, con agua propia',
    ],
    quickEn: [
      'Nowhere is 100% safe: distance, water, food and community are what protect you',
      'Argentina has no nuclear weapons and lies in the Southern Hemisphere, far from the most likely targets',
      'Nuclear-winter studies place Argentina among the countries best able to keep producing food',
      'Within the country: far from big cities, ports, nuclear plants and military bases, with its own water',
    ],
    bodyEs: 'Qué dice la ciencia: el estudio de Xia y colegas (Nature Food, 2022) modeló la producción mundial de alimentos después de distintos escenarios de guerra nuclear. Los países del hemisferio sur con gran capacidad agrícola —Argentina y Australia entre ellos— aparecen entre los menos afectados, porque están lejos de los blancos probables y producen mucho más alimento del que consumen.\n\nCriterios para elegir una zona dentro de Argentina:\n• Distancia a blancos probables: Área Metropolitana de Buenos Aires, Rosario, Córdoba, Mendoza, Bahía Blanca (puerto y base naval Puerto Belgrano), grandes puertos y refinerías.\n• Distancia a las centrales nucleares: Atucha I y II (Lima, Buenos Aires) y Embalse (Córdoba).\n• El viento: en Patagonia y buena parte del país los vientos dominantes vienen del oeste. Estar al oeste de un posible blanco reduce la exposición a la lluvia radiactiva; estar al este la aumenta.\n• Recursos propios: agua dulce (ríos, lagos, deshielo), tierra cultivable, leña y baja densidad de población.\n\nZonas que suelen cumplir la mayoría de estos criterios: los valles cordilleranos de la Patagonia norte (Comarca Andina: El Bolsón, Lago Puelo y El Hoyo; Esquel y Trevelin; San Martín de los Andes y Junín de los Andes). Tienen agua de deshielo, producción agrícola, viento a favor y pocos habitantes. En contra: inviernos duros, dependencia de las rutas para el combustible y pocos hospitales de alta complejidad.\n\nLa mejor protección es la preparación: un kit de emergencia, un plan familiar y conocer tu zona valen más que mudarte lejos.',
    bodyEn: 'What the science says: the study by Xia and colleagues (Nature Food, 2022) modelled world food production after several nuclear-war scenarios. Southern Hemisphere countries with large farming capacity —Argentina and Australia among them— are among the least affected, because they are far from the likely targets and produce far more food than they consume.\n\nHow to judge an area within Argentina:\n• Distance from likely targets: Greater Buenos Aires, Rosario, Córdoba, Mendoza, Bahía Blanca (port and Puerto Belgrano naval base), major ports and refineries.\n• Distance from the nuclear power plants: Atucha I and II (Lima, Buenos Aires) and Embalse (Córdoba).\n• Wind: in Patagonia and much of the country the prevailing winds blow from the west. Being west of a possible target reduces exposure to fallout; being east of it increases it.\n• Own resources: fresh water (rivers, lakes, snowmelt), farmland, firewood and low population density.\n\nAreas that tend to meet most of these criteria: the Andean valleys of northern Patagonia (Comarca Andina: El Bolsón, Lago Puelo and El Hoyo; Esquel and Trevelin; San Martín de los Andes and Junín de los Andes). They have snowmelt water, local farming, favourable winds and few inhabitants. Downsides: harsh winters, reliance on roads for fuel, and few major hospitals.\n\nThe best protection is preparation: an emergency kit, a family plan and knowing your area are worth more than moving far away.',
    warningEs: 'Esto es un análisis de riesgo general, no una garantía. En una emergencia real, seguí siempre a Protección Civil (SINAGIR) y a la Autoridad Regulatoria Nuclear (ARN).',
    warningEn: 'This is a general risk analysis, not a guarantee. In a real emergency, always follow Civil Protection (SINAGIR) and the Nuclear Regulatory Authority (ARN).',
  },
  {
    id: 'nuclear',
    photo: 'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=1000&q=80&fit=crop&auto=format',
    icon: 'nuclear-outline',
    color: '#eab308',
    titleEs: 'Emergencia nuclear o radiológica',
    titleEn: 'Nuclear or radiological emergency',
    taglineEs: 'Entrá, quedate adentro, informate',
    taglineEn: 'Get inside, stay inside, stay tuned',
    quickEs: [
      'ENTRÁ al edificio más sólido que tengas cerca: sótano o centro del edificio',
      'QUEDATE adentro al menos 24 horas: la radiación de la lluvia radiactiva cae rápido las primeras horas',
      'INFORMATE por radio AM/FM a pilas: seguí a Protección Civil y a la ARN',
      'Si estuviste afuera: sacate la ropa exterior y bañate con agua y jabón (sin acondicionador)',
    ],
    quickEn: [
      'GET INSIDE the sturdiest building nearby: a basement or the middle of the building',
      'STAY INSIDE for at least 24 hours: fallout radiation drops fast in the first hours',
      'STAY TUNED on a battery AM/FM radio: follow Civil Protection and the ARN',
      'If you were outside: remove your outer clothing and wash with soap and water (no conditioner)',
    ],
    bodyEs: 'La regla 7-10: cada vez que el tiempo se multiplica por 7, la radiación de la lluvia radiactiva baja unas 10 veces. A las 7 horas queda cerca del 10%; a los 2 días, cerca del 1%. Por eso las primeras horas son las más críticas y refugiarse funciona.\n\nMejores refugios: sótanos, estacionamientos subterráneos y el centro de edificios de hormigón. Cuanta más masa (tierra, hormigón, ladrillo) haya entre vos y el exterior, mejor. Un auto no protege.\n\nSi estás de trekking: buscá una cueva profunda, un refugio de piedra o una ladera que te separe del lado del viento. Tapate boca y nariz. Preferí agua envasada o de vertientes; evitá el agua de lluvia, charcos o nieve caída después del evento.\n\nPastillas de yoduro de potasio: solo protegen la tiroides y solo sirven si las indican las autoridades. No las tomes por tu cuenta.\n\nSi vivís cerca de Atucha (Lima, Buenos Aires) o de Embalse (Córdoba), conocé el plan de emergencia local: las centrales tienen zonas de protección y rutas de evacuación definidas.',
    bodyEn: 'The 7-10 rule: every time elapsed time multiplies by 7, fallout radiation drops about tenfold. After 7 hours it is near 10%; after 2 days, near 1%. That is why the first hours are the most critical and why sheltering works.\n\nBest shelters: basements, underground car parks and the middle of concrete buildings. The more mass (earth, concrete, brick) between you and the outside, the better. A car does not protect you.\n\nIf you are trekking: find a deep cave, a stone hut or a slope that shields you from the windward side. Cover your mouth and nose. Prefer bottled or spring water; avoid rainwater, puddles or snow that fell after the event.\n\nPotassium iodide tablets: they only protect the thyroid and only help when the authorities tell you to take them. Do not take them on your own.\n\nIf you live near Atucha (Lima, Buenos Aires) or Embalse (Córdoba), learn the local emergency plan: the plants have defined protection zones and evacuation routes.',
    warningEs: 'En una emergencia real, las indicaciones de Protección Civil y de la ARN están por encima de esta guía.',
    warningEn: 'In a real emergency, instructions from Civil Protection and the ARN take priority over this guide.',
  },
  {
    id: 'apagon',
    photo: 'https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=1000&q=80&fit=crop&auto=format',
    icon: 'flash-off-outline',
    color: '#8b5cf6',
    titleEs: 'Apagón tecnológico: ciberataques e IA',
    titleEn: 'Tech blackout: cyberattacks and AI',
    taglineEs: 'Sin internet, sin GPS, sin bancos: qué hacer',
    taglineEn: 'No internet, no GPS, no banks: what to do',
    quickEs: [
      'Kit de 72 horas: agua (unos 4 L por persona por día), comida, linterna, radio a pilas y botiquín',
      'Efectivo en billetes chicos: sin sistemas no hay tarjetas ni transferencias',
      'Mapas offline y en papel + brújula: el GPS puede fallar o ser interferido',
      'Un punto de encuentro acordado con tu familia, por si no hay teléfono',
    ],
    quickEn: [
      '72-hour kit: water (about 4 L per person per day), food, torch, battery radio and first-aid kit',
      'Cash in small notes: with systems down there are no cards or transfers',
      'Offline and paper maps + compass: GPS can fail or be jammed',
      'An agreed meeting point with your family, in case phones are down',
    ],
    bodyEs: 'Un ciberataque a gran escala, con o sin inteligencia artificial, apunta a la infraestructura crítica: red eléctrica, telecomunicaciones, bancos, agua y combustibles. El riesgo real no es un robot: es quedarte días sin luz, sin señal y sin dinero digital.\n\nPreparación práctica:\n• Descargá antes los mapas offline de tu zona y de tus rutas (Sliabh los guarda en el teléfono) y llevá una copia en papel.\n• Tené una radio AM/FM a pilas o a manivela: es la forma más confiable de recibir información oficial.\n• Mantené cargados power banks o un cargador solar, y guardá combustible para cocinar (garrafa o anafe).\n• Anotá en papel los teléfonos importantes: 911 (emergencias), 107 (emergencias médicas), 100 (bomberos), 103 (Protección Civil), 105 (emergencias ambientales).\n• Desconfiá de mensajes alarmistas o supuestamente oficiales que lleguen por redes: con IA es fácil falsificar voces y videos. Confirmá por radio o por los canales oficiales.\n\nGPS interferido: si tu posición salta o no coincide con el terreno, pasá a mapa y brújula (mirá la guía de Orientación).',
    bodyEn: 'A large-scale cyberattack, with or without artificial intelligence, targets critical infrastructure: the power grid, telecoms, banks, water and fuel. The real risk is not a robot: it is spending days without power, signal or digital money.\n\nPractical preparation:\n• Download offline maps of your area and your routes in advance (Sliabh keeps them on your phone) and carry a paper copy.\n• Keep a battery or hand-crank AM/FM radio: it is the most reliable way to get official information.\n• Keep power banks or a solar charger topped up, and store cooking fuel (gas canister or stove).\n• Write important numbers on paper: 911 (emergencies), 107 (medical emergencies), 100 (fire brigade), 103 (Civil Protection), 105 (environmental emergencies).\n• Be wary of alarming or supposedly official messages on social media: AI makes it easy to fake voices and videos. Confirm by radio or through official channels.\n\nJammed GPS: if your position jumps or does not match the terrain, switch to map and compass (see the Navigation guide).',
  },
  {
    id: 'biologica',
    photo: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1000&q=80&fit=crop&auto=format',
    icon: 'medical-outline',
    color: '#ec4899',
    titleEs: 'Pandemia o emergencia biológica',
    titleEn: 'Pandemic or biological emergency',
    taglineEs: 'Distancia, higiene y aislamiento: lo que funciona',
    taglineEn: 'Distance, hygiene and isolation: what works',
    quickEs: [
      'Seguí al Ministerio de Salud y a las autoridades locales, no a cadenas de WhatsApp',
      'Barbijo N95 bien ajustado + ventilación: reducen mucho el contagio respiratorio',
      'Lavate las manos con agua y jabón 20 segundos, o usá alcohol en gel al 70%',
      'Reserva para 2 semanas: alimentos, agua y tus medicamentos habituales',
    ],
    quickEn: [
      'Follow the Ministry of Health and local authorities, not forwarded chat messages',
      'A well-fitted N95 mask + ventilation greatly reduce respiratory infection',
      'Wash your hands with soap and water for 20 seconds, or use 70% alcohol gel',
      'Two-week supply: food, water and your usual medication',
    ],
    bodyEs: 'En una emergencia biológica (pandemia, brote o incidente), la baja densidad de población reduce el riesgo: las zonas rurales y de montaña se contagian más tarde y más lento. Pero también están más lejos de los hospitales. Si tenés una enfermedad crónica, estar cerca de un centro de salud puede importar más que el aislamiento.\n\nSi vas a aislarte en una zona rural o de montaña: llevá medicación para varias semanas y un botiquín completo, y avisá a las autoridades si llegás a una comunidad chica; muchas restringen el acceso durante los brotes.\n\nAgua: si dudás de su origen, hervila al menos 1 minuto (3 minutos por encima de los 2000 m).\n\nUn riesgo real hoy en la Patagonia andina es el hantavirus, que transmite el ratón colilargo. Ventilá refugios y cabañas cerradas al menos 30 minutos antes de entrar, no barras en seco (mojá el piso con agua y lavandina) y dormí en carpa cerrada.',
    bodyEn: 'In a biological emergency (pandemic, outbreak or incident), low population density lowers the risk: rural and mountain areas get infected later and more slowly. But they are also farther from hospitals. If you have a chronic condition, being near a health centre may matter more than isolation.\n\nIf you plan to isolate in a rural or mountain area: bring several weeks of medication and a full first-aid kit, and tell the authorities when you arrive in a small community; many restrict access during outbreaks.\n\nWater: if in doubt about its source, boil it for at least 1 minute (3 minutes above 2000 m).\n\nA real risk today in Andean Patagonia is hantavirus, carried by the long-tailed pygmy rice rat. Air out closed huts and cabins for at least 30 minutes before going in, never dry-sweep (wet the floor with water and bleach first) and sleep in a closed tent.',
    warningEs: 'Ante síntomas graves (fiebre alta con dificultad para respirar), llamá al 107 o al 911.',
    warningEn: 'With severe symptoms (high fever with difficulty breathing), call 107 or 911.',
  },
];

const SITE_URL = 'https://sliabh.com.ar';

/** One Question per guide, answered with its quick steps + full text. */
export function survivalJsonLd(lang: 'es' | 'en'): object[] {
  const en = lang === 'en';
  return [
    {
      '@type': 'FAQPage',
      '@id': `${SITE_URL}/supervivencia#faq`,
      inLanguage: lang,
      mainEntity: GUIDES.map((g) => ({
        '@type': 'Question',
        name: en ? g.titleEn : g.titleEs,
        acceptedAnswer: {
          '@type': 'Answer',
          text: [...(en ? g.quickEn : g.quickEs), en ? g.bodyEn : g.bodyEs, (en ? g.warningEn : g.warningEs) ?? '']
            .filter(Boolean)
            .join('\n'),
        },
      })),
    },
  ];
}

export const SURVIVAL_KEYWORDS_ES =
  'guías de supervivencia, supervivencia en montaña, hipotermia, qué llevar al trekking, zonas seguras Argentina, refugio nuclear Argentina, guerra nuclear Argentina dónde refugiarse, lugar más seguro de Argentina, Patagonia refugio, lluvia radiactiva qué hacer, kit de emergencia 72 horas, apagón qué hacer, ciberataque infraestructura, inteligencia artificial riesgos, pandemia preparación, hantavirus Patagonia, Protección Civil';
export const SURVIVAL_KEYWORDS_EN =
  'survival guides, mountain survival, hypothermia, hiking essentials, safest place in Argentina, nuclear war Argentina, Patagonia nuclear refuge, Southern Hemisphere safe countries, nuclear fallout what to do, 72-hour emergency kit, blackout preparedness, cyberattack, AI risk preparedness, pandemic preparedness, hantavirus Patagonia';
