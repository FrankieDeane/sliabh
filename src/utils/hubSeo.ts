/**
 * SEO tags for region/park hub pages — shared by HubScreen (SeoHead) and
 * scripts/prerender-hubs.mjs, same reasoning as trailSeo.ts.
 */
import type { ArgentinaTrail } from '../data/argentinaTrails';
import {
  regionMeta, trailsForRegion, parkMeta, trailsForPark, parksInRegion,
  type RegionMeta, type ParkMeta,
} from '../data/hubs';
import { regionFaqs, parkFaqs, type Faq } from './trailFaq';

const SITE_URL = 'https://sliabh.com.ar';

export interface HubSeo {
  lang: 'es' | 'en';
  kind: 'region' | 'park';
  slug: string;
  name: string;
  intro: string;
  region?: RegionMeta;
  park?: ParkMeta;
  trails: ArgentinaTrail[];
  childParks: ParkMeta[];
  faqs: Faq[];
  title: string;
  description: string;
  keywords: string;
  image: string;
  path: string;
  url: string;
  urlEs: string;
  urlEn: string;
  jsonLd: object[];
}

export function hubSeo(kind: 'region' | 'park', slug: string, lang: 'es' | 'en'): HubSeo | null {
  const isEn = lang === 'en';
  const region = kind === 'region' ? regionMeta(slug) : undefined;
  const park = kind === 'park' ? parkMeta(slug) : undefined;
  const trails = kind === 'region' ? trailsForRegion(slug) : trailsForPark(slug);
  if ((kind === 'region' && !region) || (kind === 'park' && !park) || !trails.length) return null;
  const childParks = kind === 'region' ? parksInRegion(slug) : [];
  const parentRegion = park ? regionMeta(park.region) : undefined;

  const name = region ? (isEn ? region.en.name : region.es.name) : isEn ? park!.en.name : park!.es.name;
  const intro = region ? (isEn ? region.en.intro : region.es.intro) : isEn ? park!.en.intro : park!.es.intro;
  const faqs = region ? regionFaqs(region, trails, lang) : parkFaqs(park!, trails, lang);
  const provinces = [...new Set(trails.map((t) => t.province))];

  const title = region
    ? isEn
      ? `Hiking & Trekking in ${name}, Argentina — Trails, Maps & GPX | Sliabh`
      : `Trekking en ${name}: rutas, mapas y GPX | Sliabh`
    : isEn
      ? `${name} Hiking Trails, Argentina — Maps & GPX | Sliabh`
      : `Trekking en ${name}: rutas, mapas y GPX | Sliabh`;

  const description = region
    ? isEn
      ? `${trails.length} hiking trails in ${name}, Argentina (${provinces.join(', ')}), with 3D maps, offline GPS and free GPX tracks. Best time: ${region.en.bestTime}`
      : `${trails.length} rutas de trekking y senderismo en ${name} (${provinces.join(', ')}), con mapa 3D, GPS offline y track GPX gratis. Mejor época: ${region.es.bestTime}`
    : isEn
      ? `${trails.length} hiking trails in ${name}, ${provinces.join(', ')}, Argentina: 3D maps, offline GPS, free GPX tracks and trip planning for every route.`
      : `${trails.length} rutas de trekking en ${name}, ${provinces.join(', ')}: mapa 3D, GPS offline, track GPX gratis y planificación de cada ruta.`;

  const trailNames = trails.slice(0, 6).map((t) => t.name.split(' — ')[0]);
  const keywords = [
    ...(isEn
      ? [`hiking ${name}`, `${name} trekking`, `${name} hiking trails`, `trekking ${name} Argentina`, `best hikes ${name}`, 'GPX tracks Argentina', 'offline hiking map']
      : [`trekking ${name}`, `senderismo ${name}`, `rutas ${name}`, `rutas de montaña ${name}`, `qué hacer en ${name}`, 'tracks GPX Argentina', 'mapas offline trekking']),
    ...provinces,
    ...trailNames,
  ].filter((v, i, a) => v && a.indexOf(v) === i).join(', ');

  const base = kind === 'region' ? 'region' : 'parque';
  const prefix = isEn ? '/en' : '';
  const path = `${prefix}/${base}/${slug}`;
  const url = `${SITE_URL}${path}`;
  const urlEs = `${SITE_URL}/${base}/${slug}`;
  const urlEn = `${SITE_URL}/en/${base}/${slug}`;
  const photo = trails[0].photo_uri;
  const image = photo.startsWith('http') ? photo : `${SITE_URL}${photo}`;

  const crumbs = [
    { name: 'Sliabh', item: `${SITE_URL}${isEn ? '/en' : '/'}` },
    ...(parentRegion
      ? [{ name: isEn ? parentRegion.en.name : parentRegion.es.name, item: `${SITE_URL}${prefix}/region/${parentRegion.slug}` }]
      : []),
    { name, item: url },
  ];

  const jsonLd: object[] = [
    { '@type': 'CollectionPage', '@id': `${url}#page`, name: title, description, url, inLanguage: lang, keywords, image },
    {
      '@type': 'ItemList',
      name: isEn ? `Hiking trails in ${name}` : `Rutas de trekking en ${name}`,
      numberOfItems: trails.length,
      itemListElement: trails.map((t, i) => ({
        '@type': 'ListItem', position: i + 1, name: t.name, url: `${SITE_URL}${prefix}/ruta/${t.id}`,
      })),
    },
    ...(park
      ? [{
          '@type': 'TouristAttraction', name, description: intro, url,
          address: { '@type': 'PostalAddress', addressRegion: provinces[0], addressCountry: 'AR' },
          geo: { '@type': 'GeoCoordinates', latitude: trails[0].coordinates.lat, longitude: trails[0].coordinates.lon },
        }]
      : [{ '@type': 'Place', name, description: intro, url, containedInPlace: { '@type': 'Country', name: 'Argentina' } }]),
    { '@type': 'BreadcrumbList', itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.item })) },
    {
      '@type': 'FAQPage',
      mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  ];

  return {
    lang, kind, slug, name, intro, region, park, trails, childParks, faqs,
    title, description, keywords, image, path, url, urlEs, urlEn, jsonLd,
  };
}
