/**
 * Argentina hiking & climbing trail data curated from thecrag.com/en/climbing/argentina
 * Organised by thecrag area hierarchy: country → province → area → route
 */

export type TrailDifficulty = 'facil' | 'moderado' | 'dificil' | 'extremo';
export type TrailActivity = 'trekking' | 'escalada' | 'travesia' | 'alta_montana';

export interface ArgentinaTrail {
  id: string;
  name: string;
  province: string;
  area: string;
  subarea?: string;
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
  thecrag_url: string;
  description: string;
  trailhead: string;
}

export const ARGENTINA_TRAILS: ArgentinaTrail[] = [
  {
    id: 'aconcagua-ruta-normal',
    name: 'Aconcagua — Ruta Normal',
    province: 'Mendoza',
    area: 'Parque Provincial Aconcagua',
    activity: 'alta_montana',
    difficulty: 'extremo',
    distance_km: 110,
    elevation_gain_m: 3270,
    max_altitude_m: 6961,
    duration: { min: 18, max: 22, unit: 'dias' },
    coordinates: { lat: -32.6532, lon: -70.0109 },
    photo_uri:
      'https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=800&q=80&fit=crop&auto=format',
    tags: ['cima', 'nieve', 'alta montaña', 'aclimatación'],
    permits_required: true,
    best_season: 'Dic – Feb',
    thecrag_url: 'https://www.thecrag.com/en/climbing/argentina/mendoza/aconcagua',
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
    activity: 'trekking',
    difficulty: 'moderado',
    distance_km: 24,
    elevation_gain_m: 1200,
    max_altitude_m: 3405,
    duration: { min: 8, max: 10, unit: 'horas' },
    coordinates: { lat: -49.2713, lon: -72.9856 },
    photo_uri:
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80&fit=crop&auto=format',
    tags: ['laguna', 'vistas', 'glaciar', 'icónico'],
    permits_required: false,
    best_season: 'Nov – Mar',
    thecrag_url: 'https://www.thecrag.com/en/climbing/argentina/santa-cruz/chalten',
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
    activity: 'trekking',
    difficulty: 'moderado',
    distance_km: 18,
    elevation_gain_m: 580,
    max_altitude_m: 760,
    duration: { min: 5, max: 7, unit: 'horas' },
    coordinates: { lat: -49.3055, lon: -72.9614 },
    photo_uri:
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80&fit=crop&auto=format',
    tags: ['laguna', 'glaciar', 'vistas', 'patagonia'],
    permits_required: false,
    best_season: 'Nov – Mar',
    thecrag_url: 'https://www.thecrag.com/en/climbing/argentina/santa-cruz/chalten',
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
    activity: 'trekking',
    difficulty: 'moderado',
    distance_km: 24,
    elevation_gain_m: 1000,
    max_altitude_m: 1700,
    duration: { min: 6, max: 8, unit: 'horas' },
    coordinates: { lat: -41.1855, lon: -71.4499 },
    photo_uri:
      'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=800&q=80&fit=crop&auto=format',
    tags: ['refugio', 'lago', 'escalada', 'bosque'],
    permits_required: false,
    best_season: 'Nov – Abr',
    thecrag_url: 'https://www.thecrag.com/en/climbing/argentina/rio-negro/bariloche',
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
    activity: 'trekking',
    difficulty: 'moderado',
    distance_km: 18,
    elevation_gain_m: 1300,
    max_altitude_m: 2076,
    duration: { min: 6, max: 8, unit: 'horas' },
    coordinates: { lat: -41.0817, lon: -71.5133 },
    photo_uri:
      'https://images.unsplash.com/photo-1548248823-ce16a73b6d49?w=800&q=80&fit=crop&auto=format',
    tags: ['vistas', 'lago Nahuel Huapi', 'refugio', 'panorama'],
    permits_required: false,
    best_season: 'Dic – Mar',
    thecrag_url: 'https://www.thecrag.com/en/climbing/argentina/rio-negro/bariloche',
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
    activity: 'trekking',
    difficulty: 'moderado',
    distance_km: 26,
    elevation_gain_m: 750,
    max_altitude_m: 1800,
    duration: { min: 7, max: 9, unit: 'horas' },
    coordinates: { lat: -41.3298, lon: -71.8879 },
    photo_uri:
      'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80&fit=crop&auto=format',
    tags: ['glaciar', 'volcán', 'cascada', 'bosque nativo'],
    permits_required: false,
    best_season: 'Dic – Mar',
    thecrag_url: 'https://www.thecrag.com/en/climbing/argentina/rio-negro/bariloche/tronador',
    description:
      'Sendero hasta los aluviones del Glaciar Negro del Cerro Tronador (3491 m). Se pasa por el imponente salto de agua de la garganta del Diablo.',
    trailhead: 'Pampa Linda (90 km de Bariloche)',
  },
  {
    id: 'volcan-lanin',
    name: 'Volcán Lanín — Cumbre',
    province: 'Neuquén',
    area: 'Parque Nacional Lanín',
    activity: 'alta_montana',
    difficulty: 'dificil',
    distance_km: 18,
    elevation_gain_m: 2800,
    max_altitude_m: 3776,
    duration: { min: 2, max: 3, unit: 'dias' },
    coordinates: { lat: -39.6356, lon: -71.4999 },
    photo_uri:
      'https://images.unsplash.com/photo-1574068468668-a05a11f871da?w=800&q=80&fit=crop&auto=format',
    tags: ['volcán', 'cima', 'nieve', 'crampones'],
    permits_required: true,
    best_season: 'Dic – Mar',
    thecrag_url: 'https://www.thecrag.com/en/climbing/argentina/neuquen/lanin',
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
    activity: 'trekking',
    difficulty: 'moderado',
    distance_km: 30,
    elevation_gain_m: 1400,
    max_altitude_m: 2790,
    duration: { min: 2, max: 2, unit: 'dias' },
    coordinates: { lat: -31.9838, lon: -64.9292 },
    photo_uri:
      'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=800&q=80&fit=crop&auto=format',
    tags: ['cumbre', 'serranías', 'pastizales', 'sierras grandes'],
    permits_required: false,
    best_season: 'Mar – Nov',
    thecrag_url: 'https://www.thecrag.com/en/climbing/argentina/cordoba',
    description:
      'El punto más alto de la provincia de Córdoba (2790 m). Trekking de 2 días por pastizales de altura con vistas a las Sierras Grandes. Clásico para quienes empiezan en alta montaña.',
    trailhead: 'Villa Alpina o Luyaba (Córdoba)',
  },
  {
    id: 'los-gigantes-cordoba',
    name: 'Los Gigantes — Pared Sur',
    province: 'Córdoba',
    area: 'Reserva Natural Los Gigantes',
    activity: 'escalada',
    difficulty: 'dificil',
    distance_km: 12,
    elevation_gain_m: 700,
    max_altitude_m: 2374,
    duration: { min: 5, max: 7, unit: 'horas' },
    coordinates: { lat: -31.3682, lon: -64.7397 },
    photo_uri:
      'https://images.unsplash.com/photo-1455156218388-5e61b526818b?w=800&q=80&fit=crop&auto=format',
    tags: ['granito', 'escalada deportiva', 'vias clásicas', 'sierras'],
    permits_required: false,
    best_season: 'Abr – Oct',
    thecrag_url: 'https://www.thecrag.com/en/climbing/argentina/cordoba/los-gigantes',
    description:
      'El área de escalada más importante de Córdoba. Paredes de granito de hasta 300 m con vías de todos los grados. El acceso al camping base toma ~2 h de caminata.',
    trailhead: 'La Cumbre / Estancia Los Gigantes (Córdoba)',
  },
  {
    id: 'cerro-la-ventana',
    name: 'Cerro La Ventana',
    province: 'Buenos Aires',
    area: 'Parque Provincial Ernesto Tornquist',
    activity: 'trekking',
    difficulty: 'moderado',
    distance_km: 14,
    elevation_gain_m: 820,
    max_altitude_m: 1134,
    duration: { min: 5, max: 7, unit: 'horas' },
    coordinates: { lat: -38.0722, lon: -62.0258 },
    photo_uri:
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80&fit=crop&auto=format',
    tags: ['ventana natural', 'sierra de la ventana', 'vistas pampa', 'sudoeste bonaerense'],
    permits_required: true,
    best_season: 'Todo el año',
    thecrag_url: 'https://www.thecrag.com/en/climbing/argentina/buenos-aires/sierra-de-la-ventana',
    description:
      'Ascenso a la famosa "ventana" natural en la cumbre del cerro. El permiso diario se gestiona en el centro de visitantes. El tramo final requiere manos para trepar la roca.',
    trailhead: 'Centro de Visitantes Tornquist (Buenos Aires)',
  },
  {
    id: 'quebrada-humahuaca-trek',
    name: 'Quebrada de Humahuaca — Circuito Cultural',
    province: 'Jujuy',
    area: 'Quebrada de Humahuaca (Patrimonio UNESCO)',
    activity: 'trekking',
    difficulty: 'facil',
    distance_km: 16,
    elevation_gain_m: 400,
    max_altitude_m: 3197,
    duration: { min: 2, max: 3, unit: 'dias' },
    coordinates: { lat: -23.2055, lon: -65.3497 },
    photo_uri:
      'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=800&q=80&fit=crop&auto=format',
    tags: ['patrimonio UNESCO', 'cerro de los 7 colores', 'puna', 'pueblos originarios'],
    permits_required: false,
    best_season: 'Abr – Oct',
    thecrag_url: 'https://www.thecrag.com/en/climbing/argentina/jujuy',
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
    activity: 'trekking',
    difficulty: 'facil',
    distance_km: 12,
    elevation_gain_m: 320,
    max_altitude_m: 600,
    duration: { min: 4, max: 6, unit: 'horas' },
    coordinates: { lat: -49.1047, lon: -72.8422 },
    photo_uri:
      'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80&fit=crop&auto=format',
    tags: ['lago glaciar', 'bosque nativo', 'fauna', 'fácil'],
    permits_required: false,
    best_season: 'Nov – Mar',
    thecrag_url: 'https://www.thecrag.com/en/climbing/argentina/santa-cruz/chalten',
    description:
      'Sendero tranquilo hasta el Lago del Desierto, al norte de El Chaltén. Bosque de lenga y ñire, posibles avistamientos de huemules y vistas al Volcán Rees. Ideal para familias.',
    trailhead: 'El Chaltén (37 km al norte)',
  },
];

export const TRAIL_REGIONS = [
  'Todas',
  'Patagonia',
  'Bariloche',
  'Mendoza',
  'Córdoba',
  'NOA',
  'Buenos Aires',
] as const;

export type TrailRegion = (typeof TRAIL_REGIONS)[number];

export function filterByRegion(trails: ArgentinaTrail[], region: TrailRegion): ArgentinaTrail[] {
  if (region === 'Todas') return trails;
  const map: Record<TrailRegion, string[]> = {
    Todas: [],
    Patagonia: ['Santa Cruz', 'Neuquén'],
    Bariloche: ['Río Negro'],
    Mendoza: ['Mendoza'],
    Córdoba: ['Córdoba'],
    NOA: ['Jujuy', 'Salta', 'Tucumán', 'Catamarca'],
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
