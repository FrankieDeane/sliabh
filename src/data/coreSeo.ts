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
    es: { title: 'Rutas de trekking en Argentina: mapas y GPX | Sliabh', description: 'Explorá todas las rutas de trekking y montaña de Sliabh: filtrá por región, dificultad y actividad. Distancia, desnivel, mapas y GPX descargable para cada sendero de Argentina.' },
    en: { title: 'Hiking Trails in Argentina & Patagonia — Maps & GPX | Sliabh', description: 'Browse every hiking and mountain trail on Sliabh: filter by region, difficulty and activity. Distance, elevation, maps and a free GPX for each trail in Argentina and Patagonia.' },
  },
  mapas: {
    es: { title: 'Mapas offline de senderos de Argentina | Sliabh', description: 'Descargá mapas offline de los Parques Nacionales de Argentina para navegar con GPS sin señal. Mapas interactivos con rutas, senderos y puntos de interés.' },
    en: { title: "Offline Hiking Maps of Argentina's National Parks | Sliabh", description: "Download offline maps of Argentina's national parks and navigate by GPS with no signal. Interactive maps with trails and points of interest." },
  },
  planificar: {
    es: { title: 'Planificador de trekking en Argentina | Sliabh', description: 'Planificá tu próxima expedición de montaña en Argentina: elegí una ruta, revisá logística y descargá el GPX antes de salir.' },
    en: { title: 'Hiking Trip Planner for Argentina | Sliabh', description: 'Plan your next mountain trip in Argentina: pick a trail, check the logistics and download the GPX before you go.' },
  },
  faq: {
    es: { title: 'Preguntas frecuentes: GPS offline, mapas y seguridad | Sliabh', description: 'Todo sobre Sliabh: qué es, si funciona sin conexión, mapas offline, cuentas, seguridad en montaña y más.' },
    en: { title: 'FAQ — Offline GPS, Maps and Mountain Safety | Sliabh', description: 'Everything about Sliabh: what it is, whether it works offline, offline maps, accounts, mountain safety and more.' },
  },
  supervivencia: {
    es: { title: 'Guías de supervivencia en Argentina: montaña, nuclear y apagones | Sliabh', description: 'Guías de supervivencia offline para Argentina: hipotermia, orientación, qué zonas son más seguras ante una guerra nuclear, qué hacer en una emergencia nuclear, apagones por ciberataques o IA y pandemias.' },
    en: { title: 'Survival Guides for Argentina — Mountains, Nuclear, Blackouts | Sliabh', description: 'Offline survival guides for Argentina: hypothermia, navigation, the safest areas in a nuclear war, what to do in a nuclear emergency, cyberattack or AI blackouts, and pandemics.' },
  },
  contribuir: {
    es: { title: 'Contribuí con rutas y alertas de montaña | Sliabh', description: 'Sumá nuevas rutas, correcciones de senderos, puntos de interés y alertas a la comunidad de Sliabh. Ayudá a mantener actualizado el mapa de montaña de Argentina.' },
    en: { title: 'Contribute Trails and Trail Alerts | Sliabh', description: "Add new trails, trail fixes, points of interest and alerts to the Sliabh community and help keep Argentina's mountain map up to date." },
  },
  guias: {
    es: { title: 'Publicá tu perfil — Guías de montaña | Sliabh', description: 'Guías de montaña: publicá tu perfil en los senderos donde sos experto, justo donde miles planifican su salida.' },
    en: { title: 'List Your Profile — Mountain Guides | Sliabh', description: 'Mountain guides: list your profile on the specific trails you specialize in, right where thousands plan their trip.' },
  },
  app: {
    es: { title: 'Sliabh para Android — grabá con el teléfono en el bolsillo', description: 'Descargá la app de Sliabh para Android: graba tu recorrido con la pantalla bloqueada y con música. Paso a paso para instalarla.' },
    en: { title: 'Sliabh for Android — Record Hikes with Your Phone in Your Pocket', description: 'Download the Sliabh Android app: record your hike with the screen locked and music playing. Step-by-step install guide.' },
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
