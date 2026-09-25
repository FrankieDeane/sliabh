/**
 * Every SEO tag for a trail page — title, meta description, keywords,
 * canonical/hreflang URLs, and the JSON-LD graph — built in one place.
 *
 * Two consumers must agree byte for byte: the trail screen (SeoHead, which
 * Google sees after its JS render) and scripts/prerender-trails.mjs (the
 * static HTML every other crawler and link preview sees). They used to each
 * keep their own copy of the formulas, and had drifted: the client always
 * declared the Spanish URL canonical, so after hydration every /en/ruta/<id>
 * page pointed Google at its Spanish twin. Both now import this file.
 *
 * Plain TS with relative imports only — no React Native — so the Node
 * prerender can load it (see scripts/lib/load-ts.mjs).
 */
import type { ArgentinaTrail } from '../data/argentinaTrails';
import { difficultyLabel, seasonLabel, activityLabel } from '../data/argentinaTrails';
import { regionMeta, parkMeta, slugifyArea } from '../data/hubs';
import { trailFaqs } from './trailFaq';

export const SITE_URL = 'https://sliabh.com.ar';

const GENERIC_NAME_PART =
  /^(ruta normal|v[ií]a normal.*|conector|cima|circuito( cultural)?|costera|costa sur|pared sur|\d+k|la ascensi[oó]n|los hitos|sendero peatonal|parque municipal|traves[ií]a .*|desde .*)$/i;

export interface TrailSeo {
  lang: 'es' | 'en';
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

function firstSentence(text: string, max = 180): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  const m = clean.match(/^.*?[.!?](\s|$)/);
  let s = (m ? m[0] : clean).trim();
  if (s.length > max) s = s.slice(0, max).replace(/\s+\S*$/, '') + '…';
  return s;
}

function durationText(trail: ArgentinaTrail, lang: 'es' | 'en'): string {
  const { min, max, unit } = trail.duration;
  const u = lang === 'en' ? (unit === 'dias' ? 'days' : 'h') : unit === 'dias' ? 'días' : 'h';
  return min === max ? `${min} ${u}` : `${min}–${max} ${u}`;
}

export function trailSeo(trail: ArgentinaTrail, lang: 'es' | 'en'): TrailSeo {
  const isEn = lang === 'en';
  const body = isEn ? (trail.description_en ?? trail.description) : trail.description;
  const diff = difficultyLabel(trail.difficulty, lang).toLowerCase();
  const region = regionMeta(trail.region);
  const park = parkMeta(slugifyArea(trail.area));
  const regionName = region ? (isEn ? region.en.name : region.es.name) : '';

  const isPatagonia = trail.region === 'patagonia-sur' || trail.region === 'patagonia-norte';
  // Foreign searchers qualify by "Patagonia"/"Argentina", not the province;
  // Argentines search by province.
  const title = isEn
    ? `${trail.name} Hike, ${isPatagonia ? 'Patagonia' : 'Argentina'} — Map & GPX | Sliabh`
    : `${trail.name}: ruta, mapa y GPX — ${trail.province} | Sliabh`;

  const description = isEn
    ? `${trail.name} (${trail.area}): ${trail.distance_km} km, ${durationText(trail, 'en')}, +${trail.elevation_gain_m} m elevation gain, ${diff}. ${firstSentence(body)} Free 3D map, offline GPS and GPX track.`
    : `${trail.name} (${trail.area}): ${trail.distance_km} km, ${durationText(trail, 'es')}, +${trail.elevation_gain_m} m de desnivel, dificultad ${diff}. ${firstSentence(body)} Mapa 3D, GPS offline y track GPX gratis.`;

  // "Fitz Roy — Laguna de los Tres" is searched as either half, never with
  // the dash — but a descriptive suffix ("Cima", "Circuito", "13K") isn't a
  // place anyone searches, so those are dropped.
  const parts = trail.name
    .split(/\s+—\s+/)
    .map((x) => x.trim())
    .filter((x, i) => x && (i === 0 || !GENERIC_NAME_PART.test(x)));
  const spot = parts[parts.length - 1];
  const kw = isEn
    ? [
        ...parts.flatMap((x) => [`${x} hike`, `${x} trail`]), `${spot} trek`, trail.area, `${trail.province} Argentina`, regionName,
        isPatagonia ? 'Patagonia hiking' : 'Argentina hiking', 'hiking trail Argentina',
        `${activityLabel(trail.activity, 'en').toLowerCase()} Argentina`, 'GPX track', 'offline hiking map', 'trail map',
      ]
    : [
        ...parts, ...parts.map((x) => `ruta ${x}`), `trekking ${spot}`, `cómo llegar a ${spot}`, trail.area, trail.province, regionName,
        `trekking ${trail.province}`, `senderismo ${trail.province}`, isPatagonia ? 'trekking Patagonia' : 'trekking Argentina',
        'track GPX', 'mapa offline', ...trail.tags,
      ];
  const keywords = [...new Set(kw.filter(Boolean))].join(', ');

  const image = trail.photo_uri.startsWith('http') ? trail.photo_uri : `${SITE_URL}${trail.photo_uri}`;
  const urlEs = `${SITE_URL}/ruta/${trail.id}`;
  const urlEn = `${SITE_URL}/en/ruta/${trail.id}`;
  const url = isEn ? urlEn : urlEs;
  const path = isEn ? `/en/ruta/${trail.id}` : `/ruta/${trail.id}`;
  const prefix = isEn ? '/en' : '';

  const crumbs: Array<{ name: string; item: string }> = [
    { name: 'Sliabh', item: `${SITE_URL}${isEn ? '/en' : '/'}` },
  ];
  if (region) crumbs.push({ name: regionName, item: `${SITE_URL}${prefix}/region/${region.slug}` });
  if (park) crumbs.push({ name: isEn ? park.en.name : park.es.name, item: `${SITE_URL}${prefix}/parque/${park.slug}` });
  crumbs.push({ name: trail.name, item: url });

  const faqs = trailFaqs(trail, lang);

  const jsonLd: object[] = [
    {
      '@type': 'TouristAttraction',
      '@id': `${url}#trail`,
      name: trail.name,
      description: body,
      url,
      image,
      inLanguage: lang,
      keywords,
      touristType: isEn ? ['Hikers', 'Trekkers', 'Backpackers'] : ['Senderistas', 'Trekkers', 'Mochileros'],
      address: { '@type': 'PostalAddress', addressRegion: trail.province, addressCountry: 'AR' },
      geo: { '@type': 'GeoCoordinates', latitude: trail.coordinates.lat, longitude: trail.coordinates.lon },
      containedInPlace: park
        ? { '@type': 'TouristAttraction', name: isEn ? park.en.name : park.es.name, url: `${SITE_URL}${prefix}/parque/${park.slug}` }
        : { '@type': 'Place', name: trail.area },
      hasMap: url,
      additionalProperty: [
        { '@type': 'PropertyValue', name: isEn ? 'Difficulty' : 'Dificultad', value: difficultyLabel(trail.difficulty, lang) },
        { '@type': 'PropertyValue', name: isEn ? 'Distance' : 'Distancia', value: `${trail.distance_km} km` },
        { '@type': 'PropertyValue', name: isEn ? 'Elevation gain' : 'Desnivel positivo', value: `${trail.elevation_gain_m} m` },
        { '@type': 'PropertyValue', name: isEn ? 'Max altitude' : 'Altura máxima', value: `${trail.max_altitude_m} m` },
        { '@type': 'PropertyValue', name: isEn ? 'Duration' : 'Duración', value: durationText(trail, lang) },
        { '@type': 'PropertyValue', name: isEn ? 'Best season' : 'Mejor época', value: seasonLabel(trail.best_season, lang) },
        { '@type': 'PropertyValue', name: isEn ? 'Permit required' : 'Requiere permiso', value: trail.permits_required ? (isEn ? 'Yes' : 'Sí') : 'No' },
      ],
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.item })),
    },
    {
      '@type': 'FAQPage',
      mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    },
  ];

  return { lang, title, description, keywords, image, path, url, urlEs, urlEn, jsonLd };
}
