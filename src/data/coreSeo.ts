/**
 * Title/description for every core page (/rutas, /mapas, …) in both
 * languages. The screens pass it to SeoHead and scripts/prerender-core.mjs
 * bakes the same strings into the static HTML of /<route> and /en/<route>,
 * so the two can't drift. Plain TS so the Node prerender can load it.
 */
export type CoreRoute = 'rutas' | 'mapas' | 'planificar' | 'faq' | 'supervivencia' | 'contribuir' | 'guias' | 'app';

type Copy = { title: string; description: string };

export const CORE_SEO: Record<CoreRoute, { es: Copy; en: Copy }> = {
  rutas: {
    es: { title: 'Rutas de trekking en Argentina: mapas y GPX | Sliabh', description: 'Todas las rutas de trekking de Argentina: filtrá por región, dificultad y actividad. Distancia, desnivel, mapa y GPX descargable de cada sendero.' },
    en: { title: 'Hiking Trails in Argentina & Patagonia — Maps & GPX | Sliabh', description: 'Every hiking trail in Argentina and Patagonia: filter by region, difficulty and activity. Distance, elevation, map and a free GPX for each one.' },
  },
  mapas: {
    es: { title: 'Mapas offline de senderos de Argentina | Sliabh', description: 'Descargá mapas offline de los Parques Nacionales de Argentina para navegar con GPS sin señal. Mapas interactivos con rutas, senderos y puntos de interés.' },
    en: { title: "Offline Hiking Maps of Argentina's National Parks | Sliabh", description: "Download offline maps of Argentina's national parks and navigate by GPS with no signal. Interactive maps with trails and points of interest." },
  },
  planificar: {
    es: { title: 'Planificador de trekking en Argentina | Sliabh', description: 'Planificá tu próxima expedición de montaña en Argentina: elegí una ruta, revisá logística y descargá el GPX antes de salir.' },
    en: { title: 'Hiking Trip Planner for Argentina | Sliabh', description: 'Plan your next mountain trip in Argentina: pick a trail, check distance, elevation and logistics, and download the GPX before you go. Free.' },
  },
  faq: {
    es: { title: 'Preguntas frecuentes: GPS offline y mapas | Sliabh', description: 'Todo sobre Sliabh: qué es, si funciona sin señal, cómo descargar mapas offline y tracks GPX, cuentas, seguridad en montaña y más.' },
    en: { title: 'FAQ — Offline GPS, Maps and Mountain Safety | Sliabh', description: 'Everything about Sliabh: what it is, whether it works with no signal, how to download offline maps and GPX tracks, accounts and mountain safety.' },
  },
  supervivencia: {
    es: { title: 'Guías de supervivencia: montaña, nuclear y apagones | Sliabh', description: 'Guías de supervivencia offline para Argentina: hipotermia, orientación, zonas seguras ante una guerra nuclear, apagones por ciberataques y pandemias.' },
    en: { title: 'Survival Guides: Mountains, Nuclear, Blackouts | Sliabh', description: 'Offline survival guides for Argentina: hypothermia, navigation, the safest areas in a nuclear war, cyberattack or AI blackouts, and pandemics.' },
  },
  contribuir: {
    es: { title: 'Contribuí con rutas y alertas de montaña | Sliabh', description: 'Sumá nuevas rutas, correcciones de senderos, puntos de interés y alertas a la comunidad de Sliabh. Ayudá a mantener actualizado el mapa de montaña de Argentina.' },
    en: { title: 'Contribute Trails and Trail Alerts | Sliabh', description: "Add new trails, trail fixes, points of interest and alerts to the Sliabh community and help keep Argentina's mountain map up to date." },
  },
  guias: {
    es: { title: 'Guías de montaña en Argentina: publicá tu perfil | Sliabh', description: 'Guías de montaña de Argentina: publicá tu perfil en los senderos donde sos experto, justo donde miles de trekkers planifican su próxima salida.' },
    en: { title: 'Mountain Guides in Argentina — List Your Profile | Sliabh', description: 'Mountain guides in Argentina: list your profile on the specific trails you specialize in, right where thousands of hikers plan their next trip.' },
  },
  app: {
    es: { title: 'Sliabh para Android — grabá con el teléfono en el bolsillo', description: 'Descargá la app de Sliabh para Android: graba tu recorrido con la pantalla bloqueada y con música. Paso a paso para instalarla.' },
    en: { title: 'Sliabh for Android — Record Hikes with the Screen Off', description: 'Download the free Sliabh Android app: record your hike with the screen locked and music playing, even offline. Step-by-step install guide.' },
  },
};

export const CORE_ROUTES = Object.keys(CORE_SEO) as CoreRoute[];

export function coreSeo(route: CoreRoute, lang: 'es' | 'en') {
  const c = CORE_SEO[route][lang];
  return {
    title: c.title,
    description: c.description,
    path: lang === 'en' ? `/en/${route}` : `/${route}`,
    alternates: { es: `/${route}`, en: `/en/${route}` },
  };
}
