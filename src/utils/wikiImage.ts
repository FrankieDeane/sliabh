/**
 * Resolve a representative photo for a place from Wikimedia / Wikipedia at
 * runtime (in the browser). Many cards historically used random stock photos;
 * this fetches the lead image of the best-matching Spanish Wikipedia article
 * (which is a Wikimedia Commons image, free and valid for commercial reuse with
 * attribution). The fetch runs client-side, so it works even where the build
 * environment cannot reach Wikimedia.
 */

const cache = new Map<string, string | null>();
const inflight = new Map<string, Promise<string | null>>();

const API = 'https://es.wikipedia.org/w/api.php';

// Hand-picked Wikimedia Commons photos for specific places (provided by the
// team). Matched by a normalized substring of the query/place name, so they
// take precedence over the automatic Wikipedia lookup.
const PHOTO_OVERRIDES: Array<[string, string]> = [
  ['sierra valdivieso', 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/Cormorant_Island_Patagonia.jpg/960px-Cormorant_Island_Patagonia.jpg'],
  ['bahia mitre', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/ARG-2016-Aerial-Tierra_del_Fuego_%28Ushuaia%29%E2%80%93Valle_Carbajal_01.jpg/960px-ARG-2016-Aerial-Tierra_del_Fuego_%28Ushuaia%29%E2%80%93Valle_Carbajal_01.jpg'],
  ['laguna submarino', 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/ARG-2016-Aerial-Tierra_del_Fuego_%28Ushuaia%29%E2%80%93Valle_Carbajal_01.jpg/960px-ARG-2016-Aerial-Tierra_del_Fuego_%28Ushuaia%29%E2%80%93Valle_Carbajal_01.jpg'],
  ['baliza', 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Bird_Tail_Divide%2C_Montana_04.jpg/960px-Bird_Tail_Divide%2C_Montana_04.jpg'],
  ['iguazu', 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Cataratas027.jpg/960px-Cataratas027.jpg'],
  ['calilegua', 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Camino_interno_Parque_Nacional_Calilegua_%28Jujuy%29.jpg/960px-Camino_interno_Parque_Nacional_Calilegua_%28Jujuy%29.jpg'],
  ['chaco', 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Flor_de_Ceiba_chodatii_%28Palo_borracho_blanco%29%2C_Ciudad_de_Resistencia_%28Chaco%2C_Argentina%29.jpg/960px-Flor_de_Ceiba_chodatii_%28Palo_borracho_blanco%29%2C_Ciudad_de_Resistencia_%28Chaco%2C_Argentina%29.jpg'],
  ['el rey', 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/San_Francisco%2C_Jujuy.jpg/960px-San_Francisco%2C_Jujuy.jpg'],
  ['los arrayanes', 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Parque_Nacional_Los_Arrayanes.jpg/960px-Parque_Nacional_Los_Arrayanes.jpg'],
  ['laguna blanca', 'https://commons.wikimedia.org/wiki/Special:FilePath/Laguna_Blanca,_San_Juan,_Argentina.jpg'],
];

function normalize(s: string): string {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/** Returns a hand-picked override photo for `query`, or null. */
export function getPhotoOverride(query: string): string | null {
  const n = normalize(query);
  for (const [key, url] of PHOTO_OVERRIDES) {
    if (n.includes(key)) return url;
  }
  return null;
}

/** Build a MediaWiki search→pageimages URL that returns a 600px thumbnail. */
function buildUrl(query: string): string {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    origin: '*',
    generator: 'search',
    gsrsearch: query,
    gsrlimit: '1',
    prop: 'pageimages',
    piprop: 'thumbnail',
    pithumbsize: '800',
  });
  return `${API}?${params.toString()}`;
}

/**
 * Returns a Wikimedia image URL for `query` (e.g. "Parque Nacional Iguazú"),
 * or null if none is found. Results are cached for the session.
 */
export async function fetchWikiImage(query: string): Promise<string | null> {
  if (!query) return null;
  const override = getPhotoOverride(query);
  if (override) return override;
  if (cache.has(query)) return cache.get(query)!;
  if (inflight.has(query)) return inflight.get(query)!;

  const p = (async () => {
    try {
      const res = await fetch(buildUrl(query));
      const data = await res.json();
      const pages = data?.query?.pages;
      if (pages) {
        const first: any = Object.values(pages)[0];
        const src: string | undefined = first?.thumbnail?.source;
        if (src) { cache.set(query, src); return src; }
      }
    } catch {
      // network/parse error — fall through to null
    }
    cache.set(query, null);
    return null;
  })();

  inflight.set(query, p);
  const out = await p;
  inflight.delete(query);
  return out;
}
