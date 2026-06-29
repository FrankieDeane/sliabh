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
