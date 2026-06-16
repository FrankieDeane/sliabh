/**
 * Argentina hiking & climbing trail data — curated by the Sliabh Argaelic Team.
 * Organised by region: country → province → area → route
 */

export type TrailDifficulty = 'facil' | 'moderado' | 'dificil' | 'extremo';
export type TrailActivity = 'trekking' | 'escalada' | 'travesia' | 'alta_montana';

export interface ArgentinaTrail {
  id: string;
  name: string;
  province: string;
  area: string;
  subarea?: string;
  region: 'patagonia-sur' | 'patagonia-norte' | 'cuyo' | 'norte' | 'sierras-centrales' | 'litoral' | 'buenos-aires';
  activity: TrailActivity;
  difficulty: TrailDifficulty;
  distance_km: number;
  elevation_gain_m: number;
  max_altitude_m: number;
  duration: { min: number; max: number; unit: 'horas' | 'dias' };
  coordinates: { lat: number; lon: number };
  photo_uri: string;
  tags: string[];
  permits_required: boolean;
  best_season: string;
  description: string;
  trailhead: string;
  mapOverlayUrl?: string;
  pdfUrl?: string;
}

export const ARGENTINA_TRAILS: ArgentinaTrail[] = [
  {
    id: 'aconcagua-ruta-normal',
    name: 'Aconcagua — Ruta Normal',
    province: 'Mendoza',
    area: 'Parque Provincial Aconcagua',
    region: 'cuyo',
    activity: 'alta_montana',
    difficulty: 'extremo',
    distance_km: 110,
    elevation_gain_m: 3270,
    max_altitude_m: 6961,
    duration: { min: 18, max: 22, unit: 'dias' },
    coordinates: { lat: -32.6532, lon: -70.0109 },
    photo_uri:
      'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=800&q=80&fit=crop&auto=format',
    tags: ['cima', 'nieve', 'alta montaña', 'aclimatación'],
    permits_required: true,
    best_season: 'Dic – Feb',
    description:
      'La cima más alta del hemisferio occidental (6961 m). La Ruta Normal sube por el noroeste desde Plaza de Mulas. Requiere aclimatación progresiva y permiso del parque.',
    trailhead: 'Horcones (Uspallata, Mendoza)',
  },
  {
    id: 'fitz-roy-laguna-tres',
    name: 'Fitz Roy — Laguna de los Tres',
    province: 'Santa Cruz',
    area: 'Parque Nacional Los Glaciares',
    subarea: 'El Chaltén',
    region: 'patagonia-sur',
    activity: 'trekking',
    difficulty: 'moderado',
    distance_km: 24,
    elevation_gain_m: 1200,
    max_altitude_m: 3405,
    duration: { min: 8, max: 10, unit: 'horas' },
    coordinates: { lat: -49.2713, lon: -72.9856 },
    photo_uri:
      'https://images.unsplash.com/photo-1574068468668-a05a11f871da?w=800&q=80&fit=crop&auto=format',
    tags: ['laguna', 'vistas', 'glaciar', 'icónico'],
    permits_required: false,
    best_season: 'Nov – Mar',
    description:
      'El sendero más famoso de la Patagonia argentina. Ofrece vistas directas al imponente cerro Fitz Roy (3405 m) desde la laguna glaciar al pie de las torres.',
    trailhead: 'El Chaltén (Santa Cruz)',
  },
  {
    id: 'cerro-torre-base',
    name: 'Cerro Torre — Laguna Torre',
    province: 'Santa Cruz',
    area: 'Parque Nacional Los Glaciares',
    subarea: 'El Chaltén',
    region: 'patagonia-sur',
    activity: 'trekking',
    difficulty: 'moderado',
    distance_km: 18,
    elevation_gain_m: 580,
    max_altitude_m: 760,
    duration: { min: 5, max: 7, unit: 'horas' },
    coordinates: { lat: -49.3055, lon: -72.9614 },
    photo_uri:
      'https://www.voyagers.travel/_ipx/w_1200&f_webp&q_85/google/travel-web-app-1.appspot.com/flamelink/media/Cerro%20Torre%207.jpg%3Falt=media',
    tags: ['laguna', 'glaciar', 'vistas', 'patagonia'],
    permits_required: false,
    best_season: 'Nov – Mar',
    description:
      'Trekking clásico hasta la Laguna Torre con vista al Cerro Torre (3128 m) y al Glaciar Grande. Terreno parejo con final técnico hasta el mirador.',
    trailhead: 'El Chaltén (Santa Cruz)',
  },
  {
    id: 'refugio-frey-bariloche',
    name: 'Refugio Frey — Cerro Catedral',
    province: 'Río Negro',
    area: 'Parque Nacional Nahuel Huapi',
    subarea: 'Bariloche',
    region: 'patagonia-norte',
    activity: 'trekking',
    difficulty: 'moderado',
    distance_km: 24,
    elevation_gain_m: 1000,
    max_altitude_m: 1700,
    duration: { min: 6, max: 8, unit: 'horas' },
    coordinates: { lat: -41.1855, lon: -71.4499 },
    photo_uri:
      'https://bariloche.org/wp-content/uploads/2019/02/refugio-frey-bariloche.jpg',
    tags: ['refugio', 'lago', 'escalada', 'bosque'],
    permits_required: false,
    best_season: 'Nov – Abr',
    description:
      'Trekking desde la base de Cerro Catedral hasta el Refugio Frey a orillas de la Laguna Schmoll. Uno de los puntos de escalada en roca más concurridos de la Patagonia.',
    trailhead: 'Base Cerro Catedral (Bariloche)',
  },
  {
    id: 'cerro-lopez-bariloche',
    name: 'Cerro López — Refugio López',
    province: 'Río Negro',
    area: 'Parque Nacional Nahuel Huapi',
    subarea: 'Bariloche',
    region: 'patagonia-norte',
    activity: 'trekking',
    difficulty: 'moderado',
    distance_km: 18,
    elevation_gain_m: 1300,
    max_altitude_m: 2076,
    duration: { min: 6, max: 8, unit: 'horas' },
    coordinates: { lat: -41.0817, lon: -71.5133 },
    photo_uri:
      'https://bariloche.org/wp-content/uploads/2018/02/refugio-lopez-trekking-bariloche.jpg',
    tags: ['vistas', 'lago Nahuel Huapi', 'refugio', 'panorama'],
    permits_required: false,
    best_season: 'Dic – Mar',
    description:
      'Ascenso al Refugio López (1626 m) y opcionalmente la cima del Cerro López (2076 m). Vistas panorámicas del lago Nahuel Huapi y la cordillera patagónica.',
    trailhead: 'Ruta 79 km 20 (Bariloche)',
  },
  {
    id: 'cerro-tronador-bariloche',
    name: 'Cerro Tronador — Glaciar Negro',
    province: 'Río Negro',
    area: 'Parque Nacional Nahuel Huapi',
    subarea: 'Pampa Linda',
    region: 'patagonia-norte',
    activity: 'trekking',
    difficulty: 'moderado',
    distance_km: 26,
    elevation_gain_m: 750,
    max_altitude_m: 1800,
    duration: { min: 7, max: 9, unit: 'horas' },
    coordinates: { lat: -41.3298, lon: -71.8879 },
    photo_uri:
      'https://bariloche.org/wp-content/uploads/2024/02/tronador-bariloche-febrero2024-franciscoraggio-barilocheorg.jpg',
    tags: ['glaciar', 'volcán', 'cascada', 'bosque nativo'],
    permits_required: false,
    best_season: 'Dic – Mar',
    description:
      'Sendero hasta los aluviones del Glaciar Negro del Cerro Tronador (3491 m). Se pasa por el imponente salto de agua de la garganta del Diablo.',
    trailhead: 'Pampa Linda (90 km de Bariloche)',
  },
  {
    id: 'volcan-lanin',
    name: 'Volcán Lanín — Cumbre',
    province: 'Neuquén',
    area: 'Parque Nacional Lanín',
    region: 'patagonia-norte',
    activity: 'alta_montana',
    difficulty: 'dificil',
    distance_km: 18,
    elevation_gain_m: 2800,
    max_altitude_m: 3776,
    duration: { min: 2, max: 3, unit: 'dias' },
    coordinates: { lat: -39.6356, lon: -71.4999 },
    photo_uri:
      'https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=800&q=80&fit=crop&auto=format',
    tags: ['volcán', 'cima', 'nieve', 'crampones'],
    permits_required: true,
    best_season: 'Dic – Mar',
    description:
      'Volcán inactivo y una de las cumbres más bellas de la Patagonia. La vía normal asciende por el flanco norte usando piolet y crampones en los tramos de hielo.',
    trailhead: 'Tromen (Neuquén) o Pucón (Chile)',
  },
  {
    id: 'cerro-champaqui',
    name: 'Cerro Champaquí — Cima',
    province: 'Córdoba',
    area: 'Reserva Hídrica Provincial Champaquí',
    subarea: 'Villa Alpina',
    region: 'sierras-centrales',
    activity: 'trekking',
    difficulty: 'moderado',
    distance_km: 30,
    elevation_gain_m: 1400,
    max_altitude_m: 2790,
    duration: { min: 2, max: 2, unit: 'dias' },
    coordinates: { lat: -31.9838, lon: -64.9292 },
    photo_uri:
      'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/14/34/ae/25/photo3jpg.jpg?w=700&h=400&s=1',
    tags: ['cumbre', 'serranías', 'pastizales', 'sierras grandes'],
    permits_required: false,
    best_season: 'Mar – Nov',
    description:
      'El punto más alto de la provincia de Córdoba (2790 m). Trekking de 2 días por pastizales de altura con vistas a las Sierras Grandes. Clásico para quienes empiezan en alta montaña.',
    trailhead: 'Villa Alpina o Luyaba (Córdoba)',
  },
  {
    id: 'los-gigantes-cordoba',
    name: 'Los Gigantes — Pared Sur',
    province: 'Córdoba',
    area: 'Reserva Natural Los Gigantes',
    region: 'sierras-centrales',
    activity: 'escalada',
    difficulty: 'dificil',
    distance_km: 12,
    elevation_gain_m: 700,
    max_altitude_m: 2374,
    duration: { min: 5, max: 7, unit: 'horas' },
    coordinates: { lat: -31.3682, lon: -64.7397 },
    photo_uri:
      'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/1a/c3/f4/d9/el-paso-por-un-lugar.jpg?w=700&h=400&s=1',
    tags: ['granito', 'escalada deportiva', 'vias clásicas', 'sierras'],
    permits_required: false,
    best_season: 'Abr – Oct',
    description:
      'El área de escalada más importante de Córdoba. Paredes de granito de hasta 300 m con vías de todos los grados. El acceso al camping base toma ~2 h de caminata.',
    trailhead: 'La Cumbre / Estancia Los Gigantes (Córdoba)',
  },
  {
    id: 'cerro-la-ventana',
    name: 'Cerro La Ventana',
    province: 'Buenos Aires',
    area: 'Parque Provincial Ernesto Tornquist',
    region: 'buenos-aires',
    activity: 'trekking',
    difficulty: 'moderado',
    distance_km: 14,
    elevation_gain_m: 820,
    max_altitude_m: 1134,
    duration: { min: 5, max: 7, unit: 'horas' },
    coordinates: { lat: -38.0722, lon: -62.0258 },
    photo_uri:
      'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/1c/a2/2f/58/cerro-ventana.jpg?w=700&h=-1&s=1',
    tags: ['ventana natural', 'sierra de la ventana', 'vistas pampa', 'sudoeste bonaerense'],
    permits_required: true,
    best_season: 'Todo el año',
    description:
      'Ascenso a la famosa "ventana" natural en la cumbre del cerro. El permiso diario se gestiona en el centro de visitantes. El tramo final requiere manos para trepar la roca.',
    trailhead: 'Centro de Visitantes Tornquist (Buenos Aires)',
  },
  {
    id: 'quebrada-humahuaca-trek',
    name: 'Quebrada de Humahuaca — Circuito Cultural',
    province: 'Jujuy',
    area: 'Quebrada de Humahuaca (Patrimonio UNESCO)',
    region: 'norte',
    activity: 'trekking',
    difficulty: 'facil',
    distance_km: 16,
    elevation_gain_m: 400,
    max_altitude_m: 3197,
    duration: { min: 2, max: 3, unit: 'dias' },
    coordinates: { lat: -23.2055, lon: -65.3497 },
    photo_uri:
      'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/05/a5/19/21/quebrada-de-humahuaca.jpg?w=700&h=400&s=1',
    tags: ['patrimonio UNESCO', 'cerro de los 7 colores', 'puna', 'pueblos originarios'],
    permits_required: false,
    best_season: 'Abr – Oct',
    description:
      'Recorrido a pie por la quebrada Patrimonio de la Humanidad. Conecta Tilcara, Purmamarca (Cerro de los 7 Colores) y Humahuaca. Ideal para aclimatación a la Puna.',
    trailhead: 'Purmamarca / Tilcara (Jujuy)',
  },
  {
    id: 'lago-desierto-patagonia',
    name: 'Lago del Desierto — Circuito',
    province: 'Santa Cruz',
    area: 'Parque Nacional Los Glaciares',
    subarea: 'El Chaltén',
    region: 'patagonia-sur',
    activity: 'trekking',
    difficulty: 'facil',
    distance_km: 12,
    elevation_gain_m: 320,
    max_altitude_m: 600,
    duration: { min: 4, max: 6, unit: 'horas' },
    coordinates: { lat: -49.1047, lon: -72.8422 },
    photo_uri:
      'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/17/9a/3e/fe/vista-do-final-da-trilha.jpg?w=700&h=400&s=1',
    tags: ['lago glaciar', 'bosque nativo', 'fauna', 'fácil'],
    permits_required: false,
    best_season: 'Nov – Mar',
    description:
      'Sendero tranquilo hasta el Lago del Desierto, al norte de El Chaltén. Bosque de lenga y ñire, posibles avistamientos de huemules y vistas al Volcán Rees. Ideal para familias.',
    trailhead: 'El Chaltén (37 km al norte)',
  },
  {
    id: 'alerces-cascada-arrayanes',
    name: 'Los Alerces — Cascada Arrayanes',
    province: 'Chubut',
    area: 'Parque Nacional Los Alerces',
    region: 'patagonia-norte',
    activity: 'trekking',
    difficulty: 'facil',
    distance_km: 18,
    elevation_gain_m: 380,
    max_altitude_m: 800,
    duration: { min: 5, max: 7, unit: 'horas' },
    coordinates: { lat: -42.8782, lon: -71.6400 },
    photo_uri: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80&fit=crop&auto=format',
    tags: ['UNESCO', 'alerces milenarios', 'lago', 'bosque ancestral'],
    permits_required: false,
    best_season: 'Nov – Mar',
    description: 'Circuito lacustre y terrestre por el Parque Nacional Los Alerces, Patrimonio de la Humanidad. Bosques de alerces de 2000 años, lagos azules glaciares y cascadas vírgenes en la Patagonia andina.',
    trailhead: 'Villa Futalaufquen (Chubut)',
  },
  {
    id: 'lago-puelo-los-hitos',
    name: 'Lago Puelo — Los Hitos',
    province: 'Chubut',
    area: 'Parque Nacional Lago Puelo',
    region: 'patagonia-norte',
    activity: 'trekking',
    difficulty: 'moderado',
    distance_km: 22,
    elevation_gain_m: 700,
    max_altitude_m: 1300,
    duration: { min: 6, max: 9, unit: 'horas' },
    coordinates: { lat: -42.1523, lon: -71.6380 },
    photo_uri: 'https://media-cdn.tripadvisor.com/media/photo-s/0a/69/a1/bb/20160220-131838-largejpg.jpg',
    tags: ['lago glaciar', 'frontera Chile', 'bosque valdiviano', 'microclima'],
    permits_required: false,
    best_season: 'Oct – Abr',
    description: 'Trekking hasta la frontera con Chile bordeando el Lago Puelo. Microclima único que permite vegetación valdiviana con arrayanes, cipreses y maitenes. El lago tiene uno de los colores más intensos de la Patagonia.',
    trailhead: 'El Bolsón (Chubut)',
  },
  {
    id: 'pn-patagonia-ascension',
    name: 'PN Patagonia — La Ascensión',
    province: 'Santa Cruz',
    area: 'Parque Nacional Patagonia',
    region: 'patagonia-sur',
    activity: 'trekking',
    difficulty: 'moderado',
    distance_km: 28,
    elevation_gain_m: 900,
    max_altitude_m: 1434,
    duration: { min: 7, max: 10, unit: 'horas' },
    coordinates: { lat: -47.2100, lon: -72.1830 },
    photo_uri: 'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/1c/4a/26/62/cerro-la-calle-lugar.jpg?w=600&h=-1&s=1',
    tags: ['estepa patagónica', 'cóndores', 'lago Cochrane', 'vientos'],
    permits_required: false,
    best_season: 'Nov – Mar',
    description: 'Ascenso al mirador principal del Parque Nacional Patagonia con vistas al lago Cochrane y la estepa infinita. El parque protege ecosistemas únicos de estepa patagónica y guanaco silvestre. Vientos fuertes son frecuentes.',
    trailhead: 'Villa O\'Higgins o Cochrane (Santa Cruz)',
  },
  {
    id: 'tierra-del-fuego-costera',
    name: 'Tierra del Fuego — Costera',
    province: 'Tierra del Fuego',
    area: 'Parque Nacional Tierra del Fuego',
    region: 'patagonia-sur',
    activity: 'trekking',
    difficulty: 'facil',
    distance_km: 20,
    elevation_gain_m: 220,
    max_altitude_m: 150,
    duration: { min: 5, max: 7, unit: 'horas' },
    coordinates: { lat: -54.8019, lon: -68.5471 },
    photo_uri: '/tierra-del-fuego.jpg',
    tags: ['fin del mundo', 'Canal Beagle', 'bosque subantártico', 'fauna marina'],
    permits_required: false,
    best_season: 'Nov – Mar',
    description: 'Sendero costero por la orilla del Canal Beagle en el parque más austral del mundo. Bosque de lenga, pingüinos y lobos marinos en el Canal Beagle. El tren del Fin del Mundo sale desde aquí.',
    trailhead: 'Ushuaia (Tierra del Fuego)',
    pdfUrl: '/mapa-tierra-del-fuego-costero.jpg',
  },
];

export const TRAIL_REGIONS = [
  'Todas',
  'Patagonia Sur',
  'Patagonia Norte',
  'Cuyo',
  'Norte',
  'Sierras Centrales',
  'Litoral',
  'Buenos Aires',
] as const;

export type TrailRegion = (typeof TRAIL_REGIONS)[number];

export function filterByRegion(trails: ArgentinaTrail[], region: TrailRegion): ArgentinaTrail[] {
  if (region === 'Todas') return trails;
  const map: Record<TrailRegion, string[]> = {
    Todas: [],
    'Patagonia Sur': ['Santa Cruz', 'Tierra del Fuego'],
    'Patagonia Norte': ['Río Negro', 'Neuquén', 'Chubut'],
    Cuyo: ['Mendoza', 'San Juan', 'La Rioja'],
    Norte: ['Jujuy', 'Salta', 'Tucumán', 'Catamarca'],
    'Sierras Centrales': ['Córdoba', 'San Luis'],
    Litoral: ['Misiones', 'Chaco', 'Corrientes', 'Entre Ríos'],
    'Buenos Aires': ['Buenos Aires'],
  };
  return trails.filter((t) => map[region].includes(t.province));
}

export const DIFFICULTY_LABEL: Record<string, string> = {
  facil: 'Fácil',
  moderado: 'Moderado',
  dificil: 'Difícil',
  extremo: 'Extremo',
};

export const DIFFICULTY_COLOR: Record<string, { bg: string; text: string }> = {
  facil: { bg: 'rgba(34,197,94,0.18)', text: '#22c55e' },
  moderado: { bg: 'rgba(251,191,36,0.18)', text: '#fbbf24' },
  dificil: { bg: 'rgba(249,115,22,0.18)', text: '#f97316' },
  extremo: { bg: 'rgba(239,68,68,0.18)', text: '#ef4444' },
};

export const ACTIVITY_ICON: Record<string, string> = {
  trekking: 'walk-outline',
  escalada: 'trending-up-outline',
  travesia: 'compass-outline',
  alta_montana: 'triangle-outline',
};
