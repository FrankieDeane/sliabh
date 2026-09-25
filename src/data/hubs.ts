/**
 * Region & park "hub" pages — the SEO landing layer above individual trails.
 *
 * A trail page (ruta/[id]) answers "how do I hike Laguna de los Tres". A hub
 * page answers the query one step up the funnel — "trekking en la Patagonia
 * Sur", "Parque Nacional Los Glaciares hiking" — the exact searches (AR
 * domestic + EN/foreign) that have no landing page today: /rutas only ever
 * renders one generic title no matter which `?region=` filter is applied
 * (see app/(tabs)/rutas.tsx), so none of that traffic has anywhere of its
 * own to rank.
 *
 * Two hub kinds, both grouped straight off real trail data (no separate
 * content system to keep in sync):
 *  - **region**: one per `ArgentinaTrail['region']` value (7 total) — the
 *    same field every trail already carries, not the separate `TrailRegion`
 *    display-name/province-filter type used by /rutas's chips (kept as-is;
 *    `regionFilterLabel` below just bridges to it for the "see all on the
 *    map" link).
 *  - **park**: one per `area` value, but only where ≥2 trails share it —
 *    with a single trail the park page and the trail page would be near-
 *    duplicates of each other, which is a thin-content risk, not a second
 *    ranking opportunity. The other ~24 single-trail areas stay reachable
 *    through their trail page's own `containedInPlace` schema and body text.
 *
 * Both a route component (region/park hub screens) and a Node prerender
 * script (scripts/prerender-hubs.mjs) import this file — one place for the
 * copy, so the two can't drift the way two hand-kept copies would.
 */
import { ARGENTINA_TRAILS, type ArgentinaTrail, type TrailRegion } from './argentinaTrails';
import { BARILOCHE_TRAILS } from './barilocheTreks';

export const ALL_HUB_TRAILS: ArgentinaTrail[] = [...ARGENTINA_TRAILS, ...(BARILOCHE_TRAILS as unknown as ArgentinaTrail[])];

export type RegionSlug = ArgentinaTrail['region'];

export interface RegionMeta {
  slug: RegionSlug;
  /** Bridges to the /rutas?region= chip filter, which buckets by province, not this field. */
  filterLabel: TrailRegion;
  es: { name: string; intro: string; bestTime: string };
  en: { name: string; intro: string; bestTime: string };
}

export const REGIONS: RegionMeta[] = [
  {
    slug: 'patagonia-sur',
    filterLabel: 'Patagonia Sur',
    es: {
      name: 'Patagonia Sur',
      intro:
        'El extremo sur de Argentina, entre Santa Cruz y Tierra del Fuego: el Fitz Roy y el Cerro Torre sobre El Chaltén, los glaciares del Parque Nacional Los Glaciares y los bosques y montañas fueguinas de Ushuaia. Es el corredor de trekking más buscado del país por viajeros de Europa y Estados Unidos, y el que concentra las rutas más fotografiadas de Sliabh.',
      bestTime: 'Noviembre a marzo (verano austral); el viento patagónico es fuerte todo el año.',
    },
    en: {
      name: 'Southern Patagonia',
      intro:
        'The southern tip of Argentina, spanning Santa Cruz and Tierra del Fuego: the Fitz Roy and Cerro Torre massifs above El Chaltén, the glaciers of Los Glaciares National Park, and the sub-Antarctic forests and peaks around Ushuaia. It is the most-searched trekking corridor in Argentina for hikers travelling from Europe and the US, and home to Sliabh’s most photographed routes.',
      bestTime: 'November to March (austral summer); the Patagonian wind is strong year-round.',
    },
  },
  {
    slug: 'patagonia-norte',
    filterLabel: 'Patagonia Norte',
    es: {
      name: 'Patagonia Norte',
      intro:
        'La región de los lagos: Bariloche y el Parque Nacional Nahuel Huapi, el volcán Lanín, El Bolsón y la Ruta de los Siete Lagos. Bosques de lengas y arrayanes, refugios de montaña con historia y el trekking de acceso más fácil desde una ciudad grande de todo el país.',
      bestTime: 'Diciembre a abril; julio-agosto para nieve y montañismo invernal.',
    },
    en: {
      name: 'Northern Patagonia',
      intro:
        'Argentina’s lake district: Bariloche and Nahuel Huapi National Park, Lanín volcano, El Bolsón and the Seven Lakes Route. Lenga and arrayán forests, historic mountain refugios, and the easiest big-city access to real trekking anywhere in the country.',
      bestTime: 'December to April; July–August for snow and winter mountaineering.',
    },
  },
  {
    slug: 'cuyo',
    filterLabel: 'Cuyo',
    es: {
      name: 'Cuyo',
      intro:
        'Mendoza y San Juan, al pie de la Cordillera de los Andes: el Aconcagua, la montaña más alta de América, y los cerros de Vallecitos como su antesala técnica y de aclimatación. Alta montaña seca, con permisos y logística propios de la altura.',
      bestTime: 'Diciembre a febrero (temporada de ascenso al Aconcagua).',
    },
    en: {
      name: 'Cuyo',
      intro:
        'Mendoza and San Juan, at the foot of the Andes: Aconcagua, the highest mountain in the Americas, with the Vallecitos range as its technical and acclimatization warm-up. Dry high-altitude terrain, with its own permit and logistics requirements.',
      bestTime: 'December to February (Aconcagua climbing season).',
    },
  },
  {
    slug: 'norte',
    filterLabel: 'Norte',
    es: {
      name: 'Norte',
      intro:
        'Salta y Jujuy, el altiplano andino: la Quebrada de Humahuaca (Patrimonio Mundial UNESCO) y el Parque Nacional El Rey, en el yungas salteño. Paisaje de colores, cerros multicolores y trekking de baja altitud comparado con Cuyo o Patagonia.',
      bestTime: 'Abril a noviembre (estación seca); evitar el verano por lluvias.',
    },
    en: {
      name: 'the North (Salta & Jujuy)',
      intro:
        'Salta and Jujuy, on the Andean altiplano: the Quebrada de Humahuaca (a UNESCO World Heritage site) and El Rey National Park, in Salta’s cloud forest. Colour-striped hills and lower-altitude trekking than Cuyo or Patagonia.',
      bestTime: 'April to November (dry season); avoid summer for heavy rain.',
    },
  },
  {
    slug: 'sierras-centrales',
    filterLabel: 'Sierras Centrales',
    es: {
      name: 'Sierras Centrales',
      intro:
        'Las sierras de Córdoba: el Cerro Champaquí, punto más alto de la provincia, y Los Gigantes. Montaña de altura media, a pocas horas de Córdoba capital y Buenos Aires — la opción de trekking más accesible en fin de semana para el centro del país.',
      bestTime: 'Marzo a noviembre; el verano cordobés puede ser muy caluroso.',
    },
    en: {
      name: 'the Central Sierras (Córdoba)',
      intro:
        'The Córdoba hill country: Cerro Champaquí, the province’s highest point, and Los Gigantes. Mid-altitude mountains a few hours from Córdoba city and Buenos Aires — the easiest weekend trekking trip for central Argentina.',
      bestTime: 'March to November; Córdoba summers can be very hot.',
    },
  },
  {
    slug: 'litoral',
    filterLabel: 'Litoral',
    es: {
      name: 'Litoral',
      intro:
        'El noreste subtropical: las Cataratas del Iguazú y el Parque Nacional Río Pilcomayo. Selva, humedales y senderos cortos entre pasarelas y miradores — trekking de un día, sin montaña, pensado para combinar con turismo de naturaleza.',
      bestTime: 'Abril a septiembre (fuera del calor y humedad más extremos).',
    },
    en: {
      name: 'the Litoral (Northeast)',
      intro:
        'Subtropical northeast Argentina: Iguazú Falls and Río Pilcomayo National Park. Rainforest, wetlands and short boardwalk-and-lookout trails — day-hike nature trekking with no mountain involved, easy to combine with wider nature tourism.',
      bestTime: 'April to September (outside the worst heat and humidity).',
    },
  },
  {
    slug: 'buenos-aires',
    filterLabel: 'Buenos Aires',
    es: {
      name: 'Buenos Aires',
      intro:
        'Sierra de la Ventana, en el sudoeste de la provincia: la única montaña real a pocas horas de la Ciudad de Buenos Aires, con el Cerro Tres Picos como techo de la sierra. Ideal para quien vive en la capital y quiere un trekking real sin viajar a la Patagonia.',
      bestTime: 'Marzo a noviembre.',
    },
    en: {
      name: 'Buenos Aires Province',
      intro:
        'Sierra de la Ventana, in the southwest of the province: the only real mountain range within a few hours of Buenos Aires city, topped by Cerro Tres Picos. The closest option to a genuine trek for anyone based in the capital who can’t get to Patagonia.',
      bestTime: 'March to November.',
    },
  },
];

export function regionMeta(slug: string): RegionMeta | undefined {
  return REGIONS.find((r) => r.slug === slug);
}

export function trailsForRegion(slug: string): ArgentinaTrail[] {
  return ALL_HUB_TRAILS.filter((t) => t.region === slug);
}

// ── Parks (only areas with ≥2 trails — see file header) ────────────────────
export interface ParkMeta {
  slug: string;
  /** Must exactly match `ArgentinaTrail['area']` for the trails it groups. */
  area: string;
  region: RegionSlug;
  es: { name: string; intro: string };
  en: { name: string; intro: string };
}

export function slugifyArea(area: string): string {
  return area
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const PARKS: ParkMeta[] = [
  {
    slug: slugifyArea('Parque Nacional Los Glaciares'),
    area: 'Parque Nacional Los Glaciares',
    region: 'patagonia-sur',
    es: {
      name: 'Parque Nacional Los Glaciares',
      intro:
        'En El Chaltén y El Calafate, Santa Cruz. El macizo Fitz Roy/Cerro Torre concentra el trekking de montaña más icónico de Argentina — Laguna de los Tres, Laguna Torre, Piedra del Fraile — con acceso libre y gratuito desde el pueblo, sin necesidad de guía para las rutas clásicas.',
    },
    en: {
      name: 'Los Glaciares National Park',
      intro:
        'Around El Chaltén and El Calafate, Santa Cruz. The Fitz Roy / Cerro Torre massif holds Argentina’s most iconic mountain trekking — Laguna de los Tres, Laguna Torre, Piedra del Fraile — with free, guide-free access to the classic routes straight from town.',
    },
  },
  {
    slug: slugifyArea('Parque Nacional Nahuel Huapi'),
    area: 'Parque Nacional Nahuel Huapi',
    region: 'patagonia-norte',
    es: {
      name: 'Parque Nacional Nahuel Huapi',
      intro:
        'El parque nacional más antiguo de Argentina, alrededor de Bariloche. Refugios de montaña (Frey, López, Jakob), circuitos de uno o varios días y el Cerro Tronador como techo de la zona — la mayor concentración de trekking del país en un solo parque.',
    },
    en: {
      name: 'Nahuel Huapi National Park',
      intro:
        'Argentina’s oldest national park, around Bariloche. Mountain refugios (Frey, López, Jakob), single- and multi-day circuits, and Tronador volcano as the area’s high point — the largest concentration of trekking routes in the country inside one park.',
    },
  },
  {
    slug: slugifyArea('Parque Nacional Tierra del Fuego'),
    area: 'Parque Nacional Tierra del Fuego',
    region: 'patagonia-sur',
    es: {
      name: 'Parque Nacional Tierra del Fuego',
      intro:
        'En Ushuaia, la ciudad más austral del mundo. Bosques subantárticos, turberas y costa del Canal de Beagle, con senderos cortos aptos para cualquier nivel y otros de montaña más exigentes por la Sierra Alvear y la Sierra Valdivieso.',
    },
    en: {
      name: 'Tierra del Fuego National Park',
      intro:
        'In Ushuaia, the world’s southernmost city. Sub-Antarctic forest, peat bogs and the Beagle Channel coastline, with short trails suited to any fitness level alongside tougher mountain routes into the Sierra Alvear and Sierra Valdivieso.',
    },
  },
  {
    slug: slugifyArea('Parque Nacional Lanín'),
    area: 'Parque Nacional Lanín',
    region: 'patagonia-norte',
    es: {
      name: 'Parque Nacional Lanín',
      intro:
        'Neuquén, sobre la Ruta de los Siete Lagos. El volcán Lanín (3.747 m), con su cono nevado casi perfecto, domina un parque de bosques de araucarias milenarias y lagos — ascenso técnico al volcán y trekking de acceso más sencillo alrededor.',
    },
    en: {
      name: 'Lanín National Park',
      intro:
        'Neuquén, along the Seven Lakes Route. Lanín volcano (3,747 m), with its near-perfect snow-capped cone, presides over a park of ancient monkey-puzzle (araucaria) forest and lakes — a technical volcano climb plus easier trekking around it.',
    },
  },
  {
    slug: slugifyArea('Sierra Alvear — Ushuaia'),
    area: 'Sierra Alvear — Ushuaia',
    region: 'patagonia-sur',
    es: {
      name: 'Sierra Alvear (Ushuaia)',
      intro:
        'La cadena montañosa que domina Ushuaia desde el sur. Trekking de montaña fueguino, con glaciares de valle y vistas sobre el Canal de Beagle — más técnico y menos concurrido que el trekking clásico del parque nacional.',
    },
    en: {
      name: 'Sierra Alvear (Ushuaia)',
      intro:
        'The mountain range overlooking Ushuaia from the south. Fuegian mountain trekking, with valley glaciers and views over the Beagle Channel — more technical and far less crowded than the national park’s classic trails.',
    },
  },
  {
    slug: slugifyArea('Parque Nacional El Rey'),
    area: 'Parque Nacional El Rey',
    region: 'norte',
    es: {
      name: 'Parque Nacional El Rey',
      intro:
        'Selva de yungas en Salta, a unas 3 horas de la capital provincial. Poco visitado comparado con la Quebrada de Humahuaca, con senderos entre selva de montaña y una biodiversidad (yaguareté, tapir) que no existe en el resto del país.',
    },
    en: {
      name: 'El Rey National Park',
      intro:
        'Cloud forest (yungas) in Salta province, about 3 hours from the provincial capital. Far less visited than the Quebrada de Humahuaca, with trails through montane rainforest and wildlife (jaguar, tapir) found nowhere else in the country.',
    },
  },
  {
    slug: slugifyArea('Vallecitos, Cordón del Plata'),
    area: 'Vallecitos, Cordón del Plata',
    region: 'cuyo',
    es: {
      name: 'Vallecitos — Cordón del Plata',
      intro:
        'A 1 hora de Mendoza capital. La escuela de montaña de Cuyo: aclimatación previa al Aconcagua y cumbres de más de 5.000 m con acceso relativamente corto, en el Cordón del Plata.',
    },
    en: {
      name: 'Vallecitos — Cordón del Plata',
      intro:
        'An hour from Mendoza city. Cuyo’s mountaineering school: Aconcagua-acclimatization terrain and 5,000 m+ summits with a comparatively short approach, in the Cordón del Plata range.',
    },
  },
  {
    slug: slugifyArea('Parque Municipal Llao Llao'),
    area: 'Parque Municipal Llao Llao',
    region: 'patagonia-norte',
    es: {
      name: 'Parque Municipal Llao Llao',
      intro:
        'A 25 minutos de Bariloche. Senderos cortos y de baja dificultad entre bosque nativo y miradores sobre el lago Nahuel Huapi — la puerta de entrada al trekking patagónico para quien tiene poco tiempo o viaja en familia.',
    },
    en: {
      name: 'Llao Llao Municipal Park',
      intro:
        '25 minutes from Bariloche. Short, easy trails through native forest and lookout points over Lake Nahuel Huapi — the entry point into Patagonian trekking for anyone short on time or travelling with family.',
    },
  },
];

export function parkMeta(slug: string): ParkMeta | undefined {
  return PARKS.find((p) => p.slug === slug);
}

export function trailsForPark(slug: string): ArgentinaTrail[] {
  const meta = parkMeta(slug);
  if (!meta) return [];
  return ALL_HUB_TRAILS.filter((t) => t.area === meta.area);
}

export function parksInRegion(regionSlug: string): ParkMeta[] {
  return PARKS.filter((p) => p.region === regionSlug);
}
