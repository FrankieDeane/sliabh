/**
 * Deterministic FAQ generation for trail, region and park pages.
 *
 * Every answer is built straight from fields already on the trail (nothing
 * invented), so it stays accurate as the data changes and never needs a
 * second, hand-written copy to keep in sync. This exists for two audiences
 * at once: a real visitor skimming before a hike, and an AI answer engine
 * (Google AI Overviews, Perplexity, ChatGPT search) that lifts Q&A pairs
 * almost verbatim from `FAQPage` schema — the plainest, most literal
 * question a hiker would type is exactly what belongs here, not clever copy.
 */
import type { ArgentinaTrail, TrailDifficulty } from '../data/argentinaTrails';
import { difficultyLabel, seasonLabel, activityLabel } from '../data/argentinaTrails';
import type { RegionMeta } from '../data/hubs';
import type { ParkMeta } from '../data/hubs';

export interface Faq { q: string; a: string }

function durationText(trail: ArgentinaTrail, lang: 'es' | 'en'): string {
  const { min, max, unit } = trail.duration;
  const u = lang === 'en' ? (unit === 'dias' ? (max === 1 ? 'day' : 'days') : 'hours') : unit;
  return min === max ? `${min} ${u}` : `${min}–${max} ${u}`;
}

export function trailFaqs(trail: ArgentinaTrail, lang: 'es' | 'en'): Faq[] {
  const isEn = lang === 'en';
  const faqs: Faq[] = [];

  faqs.push(
    isEn
      ? {
          q: `How long does the ${trail.name} trek take?`,
          a: `${trail.name} takes ${durationText(trail, 'en')} to complete, covering ${trail.distance_km} km with ${trail.elevation_gain_m} m of elevation gain, rated ${difficultyLabel(trail.difficulty, 'en').toLowerCase()}.`,
        }
      : {
          q: `¿Cuánto dura la ruta ${trail.name}?`,
          a: `${trail.name} lleva ${durationText(trail, 'es')} en total, con ${trail.distance_km} km de recorrido y ${trail.elevation_gain_m} m de desnivel positivo, de dificultad ${difficultyLabel(trail.difficulty, 'es').toLowerCase()}.`,
        },
  );

  faqs.push(
    isEn
      ? {
          q: `Is ${trail.name} suitable for beginners?`,
          a: beginnerAnswerEn(trail),
        }
      : {
          q: `¿La ruta ${trail.name} es apta para principiantes?`,
          a: beginnerAnswerEs(trail),
        },
  );

  faqs.push(
    isEn
      ? { q: `Do I need a permit to hike ${trail.name}?`, a: permitAnswerEn(trail) }
      : { q: `¿Se necesita permiso para hacer ${trail.name}?`, a: permitAnswerEs(trail) },
  );

  faqs.push(
    isEn
      ? {
          q: `When is the best time to hike ${trail.name}?`,
          a: `The recommended season is ${seasonLabel(trail.best_season, 'en')}. Sliabh’s map shows current daylight hours and a live weather/solar panel for the exact trailhead.`,
        }
      : {
          q: `¿Cuál es la mejor época para hacer ${trail.name}?`,
          a: `La época recomendada es ${seasonLabel(trail.best_season, 'es')}. El mapa de Sliabh muestra horas de luz y un panel de clima/sol en vivo para el trailhead exacto.`,
        },
  );

  if (typeof trail.camping_allowed === 'boolean') {
    faqs.push(
      isEn
        ? {
            q: `Can I camp along ${trail.name}?`,
            a: trail.camping_allowed
              ? `Yes, camping is allowed along this route (check current park regulations before you go).`
              : `No, camping is not permitted along this specific route.`,
          }
        : {
            q: `¿Se puede acampar en ${trail.name}?`,
            a: trail.camping_allowed
              ? `Sí, está permitido acampar en esta ruta (confirmá la reglamentación vigente del parque antes de salir).`
              : `No, en esta ruta puntual no está permitido acampar.`,
          },
    );
  }

  faqs.push(
    isEn
      ? {
          q: `Where does the ${trail.name} trailhead start?`,
          a: `The trailhead is at ${trail.trailhead}, in ${trail.area}, ${trail.province} province. Sliabh’s 3D map and downloadable GPX track show the exact starting point.`,
        }
      : {
          q: `¿Dónde está el trailhead de ${trail.name}?`,
          a: `El punto de partida es ${trail.trailhead}, dentro de ${trail.area}, provincia de ${trail.province}. El mapa 3D de Sliabh y el track GPX descargable muestran el punto exacto.`,
        },
  );

  faqs.push(
    isEn
      ? {
          q: `Can I download an offline map or GPX track for ${trail.name}?`,
          a: `Yes — Sliabh provides a downloadable GPX track and an offline 3D map for ${trail.name}, so it works with no signal on the trail.`,
        }
      : {
          q: `¿Se puede descargar el mapa o el track GPX de ${trail.name}?`,
          a: `Sí — Sliabh ofrece un track GPX descargable y un mapa 3D offline de ${trail.name}, para usarlo sin señal en el sendero.`,
        },
  );

  return faqs;
}

function beginnerAnswerEs(trail: ArgentinaTrail): string {
  const diff = trail.difficulty as TrailDifficulty;
  if (diff === 'facil') {
    return `Sí, ${trail.name} está calificada como fácil y es una buena opción para quien empieza a hacer trekking.`;
  }
  if (diff === 'moderado') {
    return `${trail.name} es de dificultad moderada: requiere estado físico básico y algo de experiencia previa en montaña, pero no es técnica.`;
  }
  return `No para principiantes: ${trail.name} está calificada como ${difficultyLabel(diff, 'es').toLowerCase()} y requiere experiencia previa en montaña y buen estado físico.`;
}

function beginnerAnswerEn(trail: ArgentinaTrail): string {
  const diff = trail.difficulty as TrailDifficulty;
  if (diff === 'facil') {
    return `Yes, ${trail.name} is rated easy and is a good choice for someone new to hiking.`;
  }
  if (diff === 'moderado') {
    return `${trail.name} is rated moderate: it needs basic fitness and some prior mountain experience, but it isn’t technical.`;
  }
  return `Not for beginners: ${trail.name} is rated ${difficultyLabel(diff, 'en').toLowerCase()} and requires prior mountain experience and solid fitness.`;
}

function permitAnswerEs(trail: ArgentinaTrail): string {
  if (!trail.permits_required) return `No, ${trail.name} no requiere permiso previo para ingresar.`;
  return `Sí, se necesita un permiso previo para ingresar a ${trail.area} antes de hacer ${trail.name}. Tramitalo con la autoridad del parque provincial o nacional.`;
}

function permitAnswerEn(trail: ArgentinaTrail): string {
  if (!trail.permits_required) return `No, ${trail.name} doesn’t require an advance permit.`;
  return `Yes, a permit is required to enter ${trail.area} before hiking ${trail.name}. Arrange it with the provincial or national park authority ahead of time.`;
}

// ── Region / park level FAQs ───────────────────────────────────────────────

export function regionFaqs(meta: RegionMeta, trails: ArgentinaTrail[], lang: 'es' | 'en'): Faq[] {
  const isEn = lang === 'en';
  const name = isEn ? meta.en.name : meta.es.name;
  const count = trails.length;
  const provinces = [...new Set(trails.map((t) => t.province))];
  const easy = trails.filter((t) => t.difficulty === 'facil').length;

  return [
    isEn
      ? { q: `When is the best time to go trekking in ${name}?`, a: meta.en.bestTime }
      : { q: `¿Cuándo es la mejor época para hacer trekking en ${name}?`, a: meta.es.bestTime },
    isEn
      ? {
          q: `How many trails does Sliabh have in ${name}?`,
          a: `Sliabh currently maps ${count} route${count === 1 ? '' : 's'} in ${name}, across ${provinces.join(', ')}, with 3D maps and downloadable GPX tracks for each.`,
        }
      : {
          q: `¿Cuántas rutas hay en ${name}?`,
          a: `Sliabh tiene mapeadas ${count} ruta${count === 1 ? '' : 's'} en ${name}, entre ${provinces.join(', ')}, con mapa 3D y track GPX descargable para cada una.`,
        },
    isEn
      ? {
          q: `Are there easy trails in ${name} for beginners?`,
          a: easy > 0
            ? `Yes, ${easy} of the ${count} routes Sliabh maps in ${name} are rated easy.`
            : `Most routes Sliabh maps in ${name} are rated moderate or harder — check each trail's difficulty before choosing one as a first hike.`,
        }
      : {
          q: `¿Hay rutas fáciles en ${name} para principiantes?`,
          a: easy > 0
            ? `Sí, ${easy} de las ${count} rutas que tiene mapeadas Sliabh en ${name} son de dificultad fácil.`
            : `La mayoría de las rutas de Sliabh en ${name} son de dificultad moderada o mayor — revisá la dificultad de cada una antes de elegirla como primera salida.`,
        },
  ];
}

export function parkFaqs(meta: ParkMeta, trails: ArgentinaTrail[], lang: 'es' | 'en'): Faq[] {
  const isEn = lang === 'en';
  const name = isEn ? meta.en.name : meta.es.name;
  const anyPermit = trails.some((t) => t.permits_required);
  const activities = [...new Set(trails.map((t) => t.activity))];

  return [
    isEn
      ? {
          q: `Do I need a permit to hike in ${name}?`,
          a: anyPermit
            ? `Some routes in ${name} require a permit from the park authority — check the individual trail page for each one.`
            : `None of the routes Sliabh maps in ${name} require an advance permit, but always confirm current park rules before you go.`,
        }
      : {
          q: `¿Se necesita permiso para hacer trekking en ${name}?`,
          a: anyPermit
            ? `Algunas rutas de ${name} requieren permiso de la autoridad del parque — revisá la página de cada ruta puntual.`
            : `Ninguna de las rutas que Sliabh tiene mapeadas en ${name} requiere permiso previo, pero siempre confirmá la reglamentación vigente del parque antes de salir.`,
        },
    isEn
      ? {
          q: `What kind of trekking can I do in ${name}?`,
          a: `Sliabh maps ${trails.length} route${trails.length === 1 ? '' : 's'} in ${name}: ${activities.map((a) => activityLabel(a, 'en').toLowerCase()).join(', ')}.`,
        }
      : {
          q: `¿Qué tipo de trekking se puede hacer en ${name}?`,
          a: `Sliabh tiene mapeadas ${trails.length} ruta${trails.length === 1 ? '' : 's'} en ${name}: ${activities.map((a) => activityLabel(a, 'es').toLowerCase()).join(', ')}.`,
        },
  ];
}
