/**
 * Bariloche extended trail data.
 * All trails located in Parque Nacional Nahuel Huapi / Parque Municipal Llao
 * Llao, Río Negro, Argentina.
 *
 * Factual data (distances, elevation, times, difficulty, refugios) verified
 * against official sources: barilochetrekking.com (Municipalidad de
 * Bariloche / Emprotur / Club Andino Bariloche / PN Nahuel Huapi),
 * clubandino.org, nahuelhuapi.gov.ar and barilocheturismo.gob.ar.
 * Descriptions are Sliabh's own text.
 *
 * Extends the base ArgentinaTrail interface with rich detail fields:
 * GPX tracks, named waypoints, access notes, water sources, and refugio info.
 */

import type { ArgentinaTrail } from './argentinaTrails';

// ---------------------------------------------------------------------------
// Extended interface
// ---------------------------------------------------------------------------

export interface ExtendedTrail extends ArgentinaTrail {
  /** Data provider */
  source: 'barilochetrekking.com';
  /** 3–4 detailed paragraphs describing the route, landscape and key moments */
  long_description: string;
  /** Realistic waypoints tracing the trail (lat/lon/optional ele) */
  gpxTrack: Array<{ lat: number; lon: number; ele?: number }>;
  /** Key landmarks along the route */
  namedWaypoints: Array<{ lat: number; lon: number; name: string; description: string }>;
  /** Where to park at the trailhead */
  parking: string;
  /** How to get there from downtown Bariloche */
  access_notes: string;
  /** Water availability on the route */
  water_sources: string;
  /** Whether overnight camping is permitted */
  camping_allowed: boolean;
  /** Name of the mountain hut if one exists on this route */
  refugio?: string;
  /** true = out-and-back; false = one-way / loop */
  round_trip: boolean;
}

// ---------------------------------------------------------------------------
// Registro y emergencias — aplica a todos los senderos del PN Nahuel Huapi
// ---------------------------------------------------------------------------

/** Mandatory free trekking registration for PN Nahuel Huapi */
export const BARILOCHE_REGISTRO = {
  es: 'Registro de trekking obligatorio y gratuito antes de salir. Se completa online en nahuelhuapi.gov.ar o barilochetrekking.com.',
  en: 'Mandatory free trekking registration before you set out. Complete it online at nahuelhuapi.gov.ar or barilochetrekking.com.',
};

/** Mountain emergency contacts for the Bariloche area */
export const BARILOCHE_EMERGENCIAS = {
  es: 'Emergencias — Protección Civil Bariloche: 103 o (0294) 442-8276. Mensajería satelital: comisiondeauxiliocab@gmail.com',
  en: 'Emergencies — Bariloche Civil Protection: 103 or +54 294 442-8276. Satellite messaging: comisiondeauxiliocab@gmail.com',
};

// ---------------------------------------------------------------------------
// Helper type for duration (re-used from ArgentinaTrail structure)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// 18 detailed Bariloche trails
// ---------------------------------------------------------------------------

export const BARILOCHE_TRAILS: ExtendedTrail[] = [
  // -------------------------------------------------------------------------
  // 1. Refugio Frey vía Cancha de Fútbol
  // -------------------------------------------------------------------------
  {
    id: 'refugio-frey-catedral',
    name: 'Refugio Frey vía Cancha de Fútbol',
    province: 'Río Negro',
    area: 'Parque Nacional Nahuel Huapi',
    subarea: 'Bariloche',
    region: 'patagonia-norte',
    activity: 'trekking',
    difficulty: 'moderado',
    distance_km: 20,
    elevation_gain_m: 700,
    max_altitude_m: 1700,
    duration: { min: 7, max: 9, unit: 'horas' },
    coordinates: { lat: -41.1855, lon: -71.4499 },
    photo_uri:
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80&fit=crop&auto=format',
    tags: ['refugio', 'laguna', 'escalada en roca', 'agujas graníticas', 'bosque nativo'],
    permits_required: false,
    best_season: 'Nov – Abr',
    description:
      'Trekking desde la base de Cerro Catedral hasta el Refugio Frey (1700 m) a orillas de la Laguna Toncek. Uno de los destinos más icónicos de Bariloche, frecuentado por escaladores de todo el mundo. Unos 10 km y 4 horas por tramo.',
    trailhead: 'Base Cerro Catedral (Bariloche)',
    source: 'barilochetrekking.com',
    long_description: `El sendero al Refugio Frey es sin duda el trek más emblemático del entorno de Bariloche. La ruta parte del estacionamiento de la base de Cerro Catedral (1050 m) y penetra de inmediato en un denso bosque de coihues y ñires que ofrece sombra y humedad en los primeros kilómetros. El camino asciende de manera constante cruzando algunos arroyos tributarios y atravesando claros con vistas ocasionales a los cerros circundantes, hasta llegar al sector conocido como la Cancha de Fútbol, una pampa alta de suelo arenoso donde los escaladores sueltan sus mochilas para organizar sus cordadas.

A partir de la Cancha de Fútbol el terreno se vuelve más técnico. El sendero trepa entre bloques de granito, superando pasos que requieren el uso de las manos en uno o dos puntos claves. Las agujas de granito gris del Grupo Frey van apareciendo en el horizonte como dedos de piedra que perforan el cielo patagónico, y la sensación de encontrarse en un anfiteatro natural de escala monumental crece con cada metro de altitud ganado. La variedad de tonos en la roca —gris plata, óxido y blanco— cambia según el ángulo de la luz solar.

La llegada a la Laguna Toncek (1700 m) resulta siempre impactante: las aguas verdes y frías reflejan las torres de granito que la rodean, y el Refugio Frey, gestionado por el Club Andino Bariloche, aparece discretamente en su orilla. El refugio ofrece comidas calientes, alojamiento en literas y una terraza desde la que los atardeceres sobre el agua son memorables. En temporada de escalada la laguna se puebla de coloridas carpas y el murmullo de cuerdas y mosquetones llena el aire de madrugada.

El regreso por el mismo sendero permite apreciar el paisaje con luz diferente y detenerse a explorar las piletas de agua cristalina entre los bloques graníticos. Para los más curiosos, la subida de 20-30 minutos a la Laguna Schmoll —el escalón superior del circo, por encima de Toncek— añade una hora extra y perspectivas únicas de las paredes que han hecho famoso a Frey en toda Sudamérica.`,
    gpxTrack: [
      { lat: -41.1855, lon: -71.4499, ele: 1050 },
      { lat: -41.1872, lon: -71.4523, ele: 1100 },
      { lat: -41.1890, lon: -71.4558, ele: 1175 },
      { lat: -41.1905, lon: -71.4585, ele: 1230 },
      { lat: -41.1918, lon: -71.4610, ele: 1290 },
      { lat: -41.1930, lon: -71.4635, ele: 1340 },
      { lat: -41.1940, lon: -71.4655, ele: 1380 },
      { lat: -41.1950, lon: -71.4670, ele: 1420 },
      { lat: -41.1957, lon: -71.4690, ele: 1460 },
      { lat: -41.1963, lon: -71.4705, ele: 1500 },
      { lat: -41.1970, lon: -71.4718, ele: 1540 },
      { lat: -41.1975, lon: -71.4727, ele: 1580 },
      { lat: -41.1980, lon: -71.4733, ele: 1620 },
      { lat: -41.1985, lon: -71.4737, ele: 1655 },
      { lat: -41.1990, lon: -71.4739, ele: 1680 },
      { lat: -41.1995, lon: -71.4740, ele: 1695 },
      { lat: -41.1997, lon: -71.4741, ele: 1700 },
    ],
    namedWaypoints: [
      {
        lat: -41.1855,
        lon: -71.4499,
        name: 'Base Cerro Catedral',
        description: 'Punto de partida con estacionamiento, baños y alquiler de equipos de esquí en temporada invernal.',
      },
      {
        lat: -41.1918,
        lon: -71.4610,
        name: 'Arroyo Van Titter',
        description: 'El sendero remonta el valle del arroyo Van Titter; buena fuente de agua. Cruces sobre troncos o piedras según el caudal.',
      },
      {
        lat: -41.1950,
        lon: -71.4670,
        name: 'Cancha de Fútbol',
        description: 'Pampa alta de granito arenoso donde convergen los senderos de escalada. Excelente lugar para descansar y admirar las agujas.',
      },
      {
        lat: -41.1975,
        lon: -71.4727,
        name: 'Paso técnico del granito',
        description: 'Sector de bloques donde el sendero se vuelve expuesto; se requiere el uso de manos en dos cortos tramos.',
      },
      {
        lat: -41.1997,
        lon: -71.4741,
        name: 'Refugio Frey / Laguna Toncek',
        description: 'Refugio del CAB a 1700 m con alojamiento, comidas y terraza sobre la Laguna Toncek. Centro neurálgico de la escalada patagónica. La Laguna Schmoll queda 20-30 min más arriba.',
      },
    ],
    parking: 'Estacionamiento pago en la base de Cerro Catedral (Villa Catedral), con capacidad amplia y vigilancia en temporada alta.',
    access_notes: 'Desde Bariloche tomar la Ruta 82 (Av. de los Pioneros) hacia el oeste por 18 km hasta Villa Catedral. En temporada de verano circulan micros urbanos de línea 55 desde el centro. En auto: 25 min desde el centro.',
    water_sources: 'Arroyo Van Titter a lo largo del valle, varios hilos de agua al cruzar los bloques graníticos (km 7–8), y agua limpia en la Laguna Toncek. El refugio también vende agua filtrada.',
    camping_allowed: true,
    refugio: 'Refugio Frey (CAB)',
    round_trip: true,
  },

  // -------------------------------------------------------------------------
  // 2. Cerro López vía Refugio López
  // -------------------------------------------------------------------------
  {
    id: 'cerro-lopez-cumbre',
    name: 'Cerro López vía Refugio López',
    province: 'Río Negro',
    area: 'Parque Nacional Nahuel Huapi',
    subarea: 'Bariloche',
    region: 'patagonia-norte',
    activity: 'trekking',
    difficulty: 'dificil',
    distance_km: 12,
    elevation_gain_m: 1250,
    max_altitude_m: 2088,
    duration: { min: 7, max: 9, unit: 'horas' },
    coordinates: { lat: -41.0817, lon: -71.5133 },
    photo_uri:
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80&fit=crop&auto=format',
    tags: ['cumbre', 'panorama', 'Nahuel Huapi', 'Tronador', 'refugio', 'scramble'],
    permits_required: false,
    best_season: 'Dic – Mar',
    description:
      'Ascenso por la Picada Vieja al Refugio López (1620 m) y de allí al Pico Turista (2088 m), el punto más alto del macizo. Vistas 360° del lago Nahuel Huapi, el Tronador y la estepa patagónica. Tramo final con algo de scramble.',
    trailhead: 'Arroyo López, Ruta 79 — Circuito Chico (Bariloche)',
    source: 'barilochetrekking.com',
    long_description: `El macizo del Cerro López ofrece una de las panorámicas más completas de la región de los lagos, con acceso directo desde el Circuito Chico. El sendero clásico —la Picada Vieja— parte junto al arroyo López sobre la Ruta 79 y se adentra en un coihuar maduro donde la humedad ambiental y los líquenes colgantes crean un ambiente de bosque templado austral casi onírico. Durante la primera hora el camino es cómodo y bien marcado, con algunos sectores de raíces expuestas que conviene pisar con cuidado. La picada cruza en dos ocasiones el camino vehicular que también sube al refugio.

Pasados los primeros 600 metros de desnivel el bosque cede ante arbustos de altura y pasturas alpinas. El Refugio López aparece en la ladera a 1620 metros de altitud, un refugio de piedra y madera administrado por el CAB que ofrece almuerzo, infusiones calientes y vistas soberbias al lago Nahuel Huapi en toda su extensión. En días claros el monte Tronador (3491 m) domina el horizonte al sudoeste, sus glaciares brillando bajo el sol patagónico.

Desde el refugio, el sendero al Pico Turista se vuelve netamente más desafiante. El tramo final de unos 450 metros de desnivel adicional transcurre sobre roca viva, con pasajes de scramble donde las manos se apoyan en la roca para ganar estabilidad. La cresta final expuesta al viento requiere precaución: en condiciones de viento sur fuerte conviene evaluar la conveniencia de continuar. El Pico Turista (2088 m), punto más alto del área, es una plataforma rocosa desde la cual se ven simultáneamente el lago Nahuel Huapi, el lago Gutiérrez, el lago Moreno, el lago Mascardi y, en días muy despejados, los volcanes chilenos al norte y al sur.

El descenso por la misma ruta requiere especial atención en el tramo de scramble y en las raíces del bosque inferior, que pueden volverse resbaladizas con rocío vespertino. Salir antes de las 8:00 h es recomendable para alcanzar la cumbre antes de que las nubes de convección de la tarde cierren las vistas.`,
    gpxTrack: [
      { lat: -41.0817, lon: -71.5133, ele: 776 },
      { lat: -41.0830, lon: -71.5155, ele: 850 },
      { lat: -41.0850, lon: -71.5175, ele: 940 },
      { lat: -41.0868, lon: -71.5190, ele: 1040 },
      { lat: -41.0882, lon: -71.5205, ele: 1130 },
      { lat: -41.0895, lon: -71.5220, ele: 1210 },
      { lat: -41.0905, lon: -71.5230, ele: 1290 },
      { lat: -41.0912, lon: -71.5242, ele: 1370 },
      { lat: -41.0918, lon: -71.5255, ele: 1440 },
      { lat: -41.0922, lon: -71.5265, ele: 1530 },
      { lat: -41.0928, lon: -71.5275, ele: 1620 },
      { lat: -41.0933, lon: -71.5283, ele: 1700 },
      { lat: -41.0938, lon: -71.5290, ele: 1780 },
      { lat: -41.0942, lon: -71.5295, ele: 1850 },
      { lat: -41.0946, lon: -71.5299, ele: 1930 },
      { lat: -41.0949, lon: -71.5299, ele: 2010 },
      { lat: -41.0950, lon: -71.5300, ele: 2088 },
    ],
    namedWaypoints: [
      {
        lat: -41.0817,
        lon: -71.5133,
        name: 'Arroyo López (Picada Vieja)',
        description: 'Inicio del sendero junto al arroyo López sobre la Ruta 79. Hay una pequeña área de estacionamiento y un cartel del parque.',
      },
      {
        lat: -41.0882,
        lon: -71.5205,
        name: 'Bosque alto de coihues',
        description: 'Zona densa de coihues centenarios con líquenes. El sendero se vuelve más empinado aquí.',
      },
      {
        lat: -41.0928,
        lon: -71.5275,
        name: 'Refugio López (1620 m)',
        description: 'Refugio del CAB con vistas al lago Nahuel Huapi. Ofrece almuerzo y bebidas calientes. Punto de control y descanso obligado. Subida de 2 a 4 horas desde el arroyo.',
      },
      {
        lat: -41.0942,
        lon: -71.5295,
        name: 'Inicio del scramble',
        description: 'Aquí el sendero se convierte en roca viva; se usan las manos en varios pasos. Evaluación de condiciones meteorológicas recomendada.',
      },
      {
        lat: -41.0950,
        lon: -71.5300,
        name: 'Pico Turista (2088 m)',
        description: 'Punto más alto del macizo, con panorama 360°: 5 lagos y el Tronador visibles en días claros. Vientos pueden ser intensos.',
      },
    ],
    parking: 'Área de estacionamiento en el margen de la Ruta 79 junto al arroyo López. Caben aproximadamente 15 vehículos. No hay guardacoches.',
    access_notes: 'Desde el centro de Bariloche por Av. Bustillo y el Circuito Chico hasta el arroyo López, sobre la Ruta 79 (25 km, 35 min en auto). En bus: línea 10 hacia Colonia Suiza, parada arroyo López.',
    water_sources: 'Un arroyo a los 30 min del inicio y otra pequeña vertiente antes del refugio. El refugio López vende agua embotellada y tiene una canilla de agua potable.',
    camping_allowed: false,
    refugio: 'Refugio López (CAB)',
    round_trip: true,
  },

  // -------------------------------------------------------------------------
  // 3. Cerro Tronador — Glaciar Negro
  // -------------------------------------------------------------------------
  {
    id: 'tronador-glaciar-negro',
    name: 'Tronador — Ventisquero Negro y Garganta del Diablo',
    province: 'Río Negro',
    area: 'Parque Nacional Nahuel Huapi',
    subarea: 'Pampa Linda',
    region: 'patagonia-norte',
    activity: 'trekking',
    difficulty: 'moderado',
    distance_km: 19,
    elevation_gain_m: 400,
    max_altitude_m: 1250,
    duration: { min: 6, max: 8, unit: 'horas' },
    coordinates: { lat: -41.2535, lon: -71.7755 },
    photo_uri:
      'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80&fit=crop&auto=format',
    tags: ['glaciar', 'Tronador', 'cascada', 'Ventisquero Negro', 'Garganta del Diablo', 'bosque nativo'],
    permits_required: false,
    best_season: 'Dic – Mar',
    description:
      'Del corazón de Pampa Linda al Ventisquero Negro —el glaciar cubierto de sedimento oscuro del Tronador— y al mirador de la Garganta del Diablo, un circo de cascadas que caen desde los glaciares colgantes. Se puede caminar desde Pampa Linda o llegar en vehículo al final del camino y hacer solo la senda corta.',
    trailhead: 'Pampa Linda (90 km al sudoeste de Bariloche)',
    source: 'barilochetrekking.com',
    long_description: `El Ventisquero Negro es uno de los glaciares más singulares de la Patagonia andina: el hielo que desciende del Tronador incorpora tanto sedimento y detrito rocoso que su frente es de un color oscuro casi total, y desprende bloques sobre una laguna proglaciar de tono lechoso. La ruta parte de Pampa Linda, el puesto de guardaparques y hostería en el corazón del parque, donde la pradera abierta y el rugido lejano de los derrumbes de hielo —el "trueno" que da nombre al Tronador— anticipan la escala del lugar.

Desde Pampa Linda hasta el mirador del Ventisquero Negro hay unos 6,5 km (1:30 a 2 h) siguiendo el valle del río Manso superior, entre bosque de coihues y lengas. Quienes disponen de vehículo pueden hacer este tramo por el camino y comenzar a caminar más arriba: el mirador del glaciar está junto al camino y es la postal clásica de la excursión. La laguna con témpanos oscuros al pie del frente del hielo cambia de forma año a año con los desprendimientos.

Del mirador del Ventisquero Negro el camino continúa unos 2 km más hasta el estacionamiento final, donde arranca la senda peatonal a la Garganta del Diablo: un tramo corto (1,4 km ida y vuelta, 30-40 min) que remonta el valle hasta un anfiteatro de paredes de roca por donde caen numerosas cascadas de deshielo desde los glaciares colgantes del Tronador. El estruendo del agua y de los desprendimientos de hielo es constante en los días cálidos de verano; conviene respetar la senda marcada y no acercarse al cauce.

El regreso es por la misma ruta. Importante: el camino de acceso a Pampa Linda y al Tronador es angosto y funciona con horarios de mano única (subida por la mañana, bajada por la tarde); consultá los horarios vigentes en la Intendencia del parque antes de ir. Llevá abrigo incluso en verano: el microclima del glaciar puede bajar la temperatura 10 °C respecto del valle.`,
    gpxTrack: [
      { lat: -41.2535, lon: -71.7755, ele: 890 },
      { lat: -41.2490, lon: -71.7850, ele: 910 },
      { lat: -41.2440, lon: -71.7950, ele: 930 },
      { lat: -41.2390, lon: -71.8050, ele: 950 },
      { lat: -41.2330, lon: -71.8150, ele: 975 },
      { lat: -41.2270, lon: -71.8240, ele: 995 },
      { lat: -41.2220, lon: -71.8300, ele: 1010 },
      { lat: -41.2175, lon: -71.8330, ele: 1020 },
      { lat: -41.2120, lon: -71.8400, ele: 1060 },
      { lat: -41.2080, lon: -71.8450, ele: 1100 },
      { lat: -41.2050, lon: -71.8480, ele: 1130 },
      { lat: -41.2010, lon: -71.8520, ele: 1190 },
      { lat: -41.1960, lon: -71.8560, ele: 1250 },
    ],
    namedWaypoints: [
      {
        lat: -41.2535,
        lon: -71.7755,
        name: 'Pampa Linda (890 m)',
        description: 'Punto de partida con guardaparques, hostería y estacionamiento. Registro de trekking y consulta de horarios del camino.',
      },
      {
        lat: -41.2175,
        lon: -71.8330,
        name: 'Mirador Ventisquero Negro',
        description: 'Frente del glaciar cubierto de sedimento oscuro y laguna proglaciar con témpanos. Junto al camino vehicular.',
      },
      {
        lat: -41.2050,
        lon: -71.8480,
        name: 'Estacionamiento final del camino',
        description: 'Fin del camino vehicular y comienzo de la senda peatonal a la Garganta del Diablo (1,4 km ida y vuelta).',
      },
      {
        lat: -41.1960,
        lon: -71.8560,
        name: 'Mirador Garganta del Diablo (1250 m)',
        description: 'Anfiteatro de cascadas de deshielo que caen de los glaciares colgantes del Tronador. Estruendo constante en días cálidos.',
      },
    ],
    parking: 'Estacionamiento en Pampa Linda y en el estacionamiento final del camino al Tronador (antes de la senda a la Garganta). El camino funciona con horarios de mano única.',
    access_notes: 'Desde Bariloche tomar la Ruta 40 sur hasta el desvío de Villa Mascardi (35 km) y luego el camino de ripio hacia Pampa Linda (otros 45 km, mano única por horarios). El trayecto completo es de aproximadamente 90 km y 2 h de conducción. En temporada alta hay excursiones y traslados desde Bariloche.',
    water_sources: 'Arroyos a lo largo del valle del río Manso superior. No tomar agua de la laguna proglaciar ni aguas abajo del glaciar sin purificar, por el sedimento en suspensión.',
    camping_allowed: true,
    round_trip: true,
  },

  // -------------------------------------------------------------------------
  // 4. Laguna Negra desde Cerro Catedral
  // -------------------------------------------------------------------------
  {
    id: 'laguna-negra-catedral',
    name: 'Laguna Negra — Refugio Italia (Manfredo Segre)',
    province: 'Río Negro',
    area: 'Parque Nacional Nahuel Huapi',
    subarea: 'Colonia Suiza',
    region: 'patagonia-norte',
    activity: 'trekking',
    difficulty: 'dificil',
    distance_km: 24,
    elevation_gain_m: 900,
    max_altitude_m: 1650,
    duration: { min: 10, max: 12, unit: 'horas' },
    coordinates: { lat: -41.0567, lon: -71.6000 },
    photo_uri:
      'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80&fit=crop&auto=format',
    tags: ['laguna alpina', 'refugio', 'arroyo Goye', 'caracoles', 'Cerro Negro', 'Colonia Suiza'],
    permits_required: false,
    best_season: 'Dic – Abr',
    description:
      'Clásico ascenso por el valle del arroyo Goye desde Colonia Suiza hasta la Laguna Negra y el Refugio Italia — Manfredo Segre (1650 m), al pie del Cerro Negro. Exigente por su longitud; muchos lo hacen con noche en el refugio.',
    trailhead: 'Colonia Suiza — puente del arroyo Goye',
    source: 'barilochetrekking.com',
    long_description: `La Laguna Negra es uno de los grandes clásicos del trekking barilochense y su refugio —el Italia, bautizado Manfredo Segre— uno de los más queridos del Club Andino Bariloche. La ruta parte de Colonia Suiza, cruza el arroyo Goye junto a la tranquera de ingreso señalizada y remonta el valle del Goye hacia el sur, primero por una vieja huella vehicular entre pinares y luego por sendero de bosque nativo de coihues que se va cerrando a medida que el valle se estrecha.

En la parte media del valle el sendero cruza mallines y vegetación alta junto al arroyo, pasando por el sector conocido como Rancho Manolo. El rumor del agua acompaña casi toda la caminata; los cruces de afluentes se hacen sobre piedras o pasarelas simples y en primavera pueden llevar buen caudal. El bosque en este tramo es húmedo y umbrío, con líquenes colgantes y un sotobosque exuberante de caña colihue.

El tramo final es el famoso sector de "los caracoles": una sucesión de zigzags empinados que ganan los últimos 400 metros de desnivel sobre la ladera del circo. La pendiente es sostenida y con carga se siente; conviene dosificar el paso y llevar agua. Al coronar el borde del circo la recompensa es inmediata: la Laguna Negra aparece oscura y especular, encajonada entre paredes grises, con el refugio de piedra asomado a la orilla como un pequeño faro de montaña.

El Refugio Italia — Manfredo Segre (1650 m) ofrece comidas, literas y zona de acampe. Por la longitud total de la ruta (unos 12 km por tramo) muchos senderistas eligen dormir en el refugio y bajar al día siguiente, o continuar la travesía de altura hacia el Refugio Jakob por la Laguna CAB y el filo (solo con buen tiempo y experiencia). El descenso por los caracoles exige rodillas frescas y atención con el pedrero suelto.`,
    gpxTrack: [
      { lat: -41.0567, lon: -71.6000, ele: 800 },
      { lat: -41.0620, lon: -71.6030, ele: 830 },
      { lat: -41.0680, lon: -71.6060, ele: 870 },
      { lat: -41.0740, lon: -71.6090, ele: 910 },
      { lat: -41.0800, lon: -71.6120, ele: 950 },
      { lat: -41.0860, lon: -71.6150, ele: 1000 },
      { lat: -41.0920, lon: -71.6180, ele: 1060 },
      { lat: -41.0970, lon: -71.6200, ele: 1130 },
      { lat: -41.1010, lon: -71.6215, ele: 1220 },
      { lat: -41.1040, lon: -71.6225, ele: 1330 },
      { lat: -41.1060, lon: -71.6232, ele: 1450 },
      { lat: -41.1075, lon: -71.6238, ele: 1560 },
      { lat: -41.1085, lon: -71.6242, ele: 1650 },
    ],
    namedWaypoints: [
      {
        lat: -41.0567,
        lon: -71.6000,
        name: 'Colonia Suiza — arroyo Goye',
        description: 'Cruce del arroyo Goye y tranquera de ingreso con cartelería del parque. Inicio de la vieja huella vehicular.',
      },
      {
        lat: -41.0800,
        lon: -71.6120,
        name: 'Valle del Goye',
        description: 'Sendero de bosque nativo junto al arroyo. Mallines y cruces de afluentes; caudal alto en primavera.',
      },
      {
        lat: -41.0970,
        lon: -71.6200,
        name: 'Rancho Manolo',
        description: 'Referencia clásica de la parte media del valle. Desde aquí la pendiente aumenta de forma gradual.',
      },
      {
        lat: -41.1050,
        lon: -71.6228,
        name: 'Los Caracoles',
        description: 'Zigzags empinados que ganan los últimos 400 m de desnivel hasta el borde del circo. Tramo más exigente.',
      },
      {
        lat: -41.1085,
        lon: -71.6242,
        name: 'Refugio Italia — Laguna Negra (1650 m)',
        description: 'Refugio del CAB a orillas de la laguna, al pie del Cerro Negro. Comidas, literas y zona de acampe.',
      },
    ],
    parking: 'Estacionamiento gratuito en Colonia Suiza, cerca del puente del arroyo Goye.',
    access_notes: 'Desde Bariloche por Av. Bustillo y Ruta 79 hasta Colonia Suiza (22 km, 30-40 min en auto). En bus: línea 10 desde el centro hasta Colonia Suiza.',
    water_sources: 'Arroyo Goye y afluentes durante casi todo el recorrido. El refugio tiene agua. Purificar siempre antes de consumir.',
    camping_allowed: true,
    refugio: 'Refugio Italia — Manfredo Segre (CAB)',
    round_trip: true,
  },

  // -------------------------------------------------------------------------
  // 5. Cerro Campanario (sendero peatonal)
  // -------------------------------------------------------------------------
  {
    id: 'cerro-campanario',
    name: 'Cerro Campanario — Sendero Peatonal',
    province: 'Río Negro',
    area: 'Parque Nacional Nahuel Huapi',
    subarea: 'Bariloche',
    region: 'patagonia-norte',
    activity: 'trekking',
    difficulty: 'facil',
    distance_km: 3,
    elevation_gain_m: 260,
    max_altitude_m: 1049,
    duration: { min: 1, max: 2, unit: 'horas' },
    coordinates: { lat: -40.9967, lon: -71.5150 },
    photo_uri:
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80&fit=crop&auto=format',
    tags: ['vista panorámica', '7 lagos', 'Nahuel Huapi', 'apto familias', 'silla mecánica'],
    permits_required: false,
    best_season: 'Todo el año',
    description:
      'Ascenso al mirador del Cerro Campanario (1049 m), votado por National Geographic como uno de los mejores miradores del mundo. Siete lagos visibles desde la cima.',
    trailhead: 'Sobre Ruta 77 km 17.5, acceso peatonal junto a la estación del telesilla',
    source: 'barilochetrekking.com',
    long_description: `El Cerro Campanario es el mirador por excelencia de la región de Bariloche y ha sido reconocido internacionalmente como uno de los mejores puntos de observación paisajística del mundo. Su singularidad radica en que desde un solo punto a apenas 1049 metros de altitud es posible ver simultáneamente siete cuerpos de agua de distintos tamaños y colores, cada uno rodeado por bosques y montañas que varían de tono con las estaciones. En otoño, la paleta de colores naranja, amarillo y rojo de los coihues y ñires lo convierte en una postal ineludible.

El sendero peatonal, alternativa libre al telesilla de pago que también sube a la cima, parte desde la ruta 77 y asciende de manera constante pero suave durante aproximadamente 45 minutos. El camino está bien balizado, con escalones de madera en los tramos más pronunciados, y puede recorrerse sin ningún tipo de equipo especial durante la mayor parte del año. En invierno puede haber algo de hielo en los tramos a la sombra.

La cima dispone de una confitería con vistas de 270 grados y una terraza al aire libre desde donde los guías fotográficos suelen detallar los puntos de referencia: el lago Nahuel Huapi al norte, el lago Moreno al este, el lago Perito Moreno y el lago Escondido al sur, y las cumbres del Cerro López y el Cerro Tronador al oeste. La combinación de escala y belleza hace que muchos visitantes se queden más tiempo del previsto, simplemente mirando.

Aunque es una de las caminatas más cortas y accesibles de la región, el Cerro Campanario no decepciona incluso al trekker experimentado. La recomendación es subir caminando y bajar en telesilla, o subir temprano para evitar la aglomeración de grupos de turismo que llegan en los ómnibus de excursión a partir de las 10:00 h.`,
    gpxTrack: [
      { lat: -40.9967, lon: -71.5150, ele: 800 },
      { lat: -40.9965, lon: -71.5165, ele: 840 },
      { lat: -40.9962, lon: -71.5180, ele: 880 },
      { lat: -40.9960, lon: -71.5195, ele: 918 },
      { lat: -40.9957, lon: -71.5210, ele: 955 },
      { lat: -40.9955, lon: -71.5225, ele: 990 },
      { lat: -40.9953, lon: -71.5240, ele: 1020 },
      { lat: -40.9953, lon: -71.5248, ele: 1049 },
    ],
    namedWaypoints: [
      {
        lat: -40.9967,
        lon: -71.5150,
        name: 'Base Cerro Campanario / Estación telesilla',
        description: 'Inicio del sendero peatonal y estación inferior del telesilla. Hay baños y un pequeño kiosco.',
      },
      {
        lat: -40.9962,
        lon: -71.5180,
        name: 'Mirador intermedio',
        description: 'Primera apertura del bosque con vistas al lago Moreno. Buen punto de pausa.',
      },
      {
        lat: -40.9957,
        lon: -71.5210,
        name: 'Escalones de madera',
        description: 'Tramo más empinado del sendero, con escalones de madera instalados por el parque.',
      },
      {
        lat: -40.9953,
        lon: -71.5248,
        name: 'Cumbre Cerro Campanario (1049 m)',
        description: 'Confitería, terraza panorámica y estación superior del telesilla. Siete lagos visibles. Mirador de fama mundial.',
      },
    ],
    parking: 'Estacionamiento amplio y gratuito junto a la base del telesilla sobre la Ruta 77.',
    access_notes: 'Tomar la Ruta 77 (circuito chico) desde Bariloche en dirección a Llao Llao. El acceso al Cerro Campanario está señalizado al km 17.5, aproximadamente 20 min desde el centro en auto. En transporte público: bus línea 20 desde la Terminal.',
    water_sources: 'No hay fuentes de agua en el sendero. La confitería de la cumbre vende bebidas. Llevar agua propia.',
    camping_allowed: false,
    round_trip: true,
  },

  // -------------------------------------------------------------------------
  // 6. Cerro Otto desde Bariloche
  // -------------------------------------------------------------------------
  {
    id: 'cerro-otto-cumbre',
    name: 'Cerro Otto desde Bariloche',
    province: 'Río Negro',
    area: 'Parque Nacional Nahuel Huapi',
    subarea: 'Bariloche',
    region: 'patagonia-norte',
    activity: 'trekking',
    difficulty: 'moderado',
    distance_km: 14,
    elevation_gain_m: 620,
    max_altitude_m: 1405,
    duration: { min: 4, max: 6, unit: 'horas' },
    coordinates: { lat: -41.1233, lon: -71.3700 },
    photo_uri:
      'https://images.unsplash.com/photo-1518623489648-a173ef7824f3?w=800&q=80&fit=crop&auto=format',
    tags: ['vista 360', 'Bariloche', 'distrito de lagos', 'acceso desde la ciudad', 'bosque'],
    permits_required: false,
    best_season: 'Oct – May',
    description:
      'Ascenso al Cerro Otto (1405 m) directamente desde Bariloche, sin necesidad de vehículo. Unos 620 m de desnivel desde la ciudad. Vista 360° del distrito lacustre y las montañas circundantes.',
    trailhead: 'Av. de los Pioneros km 1, salida oeste de Bariloche',
    source: 'barilochetrekking.com',
    long_description: `El Cerro Otto tiene la ventaja única de ser accesible a pie directamente desde el centro de Bariloche, lo que lo convierte en la caminata urbana por excelencia de la ciudad de la montaña. El sendero parte desde la Avenida Bustillo en su kilómetro 6, asciende por pistas forestales y senderos de tierra a través de bosques de coihue y pino ponderosa que los primeros colonos plantaron en las laderas durante la primera mitad del siglo XX.

Durante el ascenso el bosque se va abriendo en claros que permiten las primeras vistas hacia el lago Nahuel Huapi y la ciudad de Bariloche, que se ve empequeñecer a medida que se gana altura. Los pinos llenan el aire de resina aromática y el suelo se cubre de una alfombra de acículas de color ocre. Es frecuente encontrar pájaros carpinteros gigantes (Campephilus magellanicus) trabajando los troncos muertos en los tramos más boscosos.

La parte alta del sendero, por encima de los 1200 metros, sale del bosque y cruza pasturas abigas con arbustos de neneo y mata negra. Desde aquí la vista se amplía en todas las direcciones: al norte el lago Nahuel Huapi se extiende hasta el horizonte con sus penínsulas y bahías; al este la estepa patagónica comienza a dominar el paisaje; al sur el lago Gutiérrez refleja el Cerro Catedral; y al oeste los nevados de la cordillera cierran el panorama. En la cima una gran rotonda de piedra con la confitería giratoria La Galería ofrece un abrazo de 360 grados al paisaje, aunque muchos prefieren las terrazas exteriores al edificio.

El descenso puede hacerse por la misma ruta o tomando el teleférico (opcional) hasta la base y luego un remís de regreso al centro. Aquellos con energía pueden combinar el Otto con la Laguna de los Duendes, una pequeña laguna ubicada 45 minutos al sudeste de la cima.`,
    gpxTrack: [
      { lat: -41.1233, lon: -71.3700, ele: 800 },
      { lat: -41.1242, lon: -71.3720, ele: 860 },
      { lat: -41.1252, lon: -71.3745, ele: 930 },
      { lat: -41.1260, lon: -71.3768, ele: 1000 },
      { lat: -41.1267, lon: -71.3790, ele: 1065 },
      { lat: -41.1273, lon: -71.3810, ele: 1130 },
      { lat: -41.1278, lon: -71.3830, ele: 1190 },
      { lat: -41.1283, lon: -71.3850, ele: 1245 },
      { lat: -41.1287, lon: -71.3870, ele: 1290 },
      { lat: -41.1291, lon: -71.3888, ele: 1330 },
      { lat: -41.1295, lon: -71.3907, ele: 1368 },
      { lat: -41.1298, lon: -71.3922, ele: 1390 },
      { lat: -41.1300, lon: -71.3933, ele: 1405 },
    ],
    namedWaypoints: [
      {
        lat: -41.1233,
        lon: -71.3700,
        name: 'Inicio Av. de los Pioneros km 1',
        description: 'Entrada al sendero desde la avenida. Cartel con mapa de la ruta. Parada de bus cercana.',
      },
      {
        lat: -41.1260,
        lon: -71.3768,
        name: 'Confluencia de pistas forestales',
        description: 'Bifurcación entre la pista vehicular y el sendero de pie. Mantener el sendero de pie hacia la izquierda (más directo y escénico).',
      },
      {
        lat: -41.1278,
        lon: -71.3830,
        name: 'Salida del bosque',
        description: 'El coihuar da paso a pasturas y arbustos bajos. Las vistas se abren completamente. Punto de descanso con piedras cómodas.',
      },
      {
        lat: -41.1295,
        lon: -71.3907,
        name: 'Estación superior teleférico',
        description: 'Llegada del teleférico desde la base. Baños disponibles. A 15 min de la cima.',
      },
      {
        lat: -41.1300,
        lon: -71.3933,
        name: 'Cima Cerro Otto (1405 m)',
        description: 'Confitería giratoria La Galería, terraza y vista 360°. Bariloche y 8 cuerpos de agua visibles simultáneamente.',
      },
    ],
    parking: 'No se recomienda ir en auto: el acceso está diseñado para peatones. Si se va en auto, hay espacio informal en Av. de los Pioneros km 1. Alternativa: dejar el auto en el centro y comenzar la caminata desde allí.',
    access_notes: 'Directamente accesible desde el centro de Bariloche en 20-30 min a pie hasta el inicio del sendero (Av. de los Pioneros km 1). Varias líneas de bus urbano pasan cerca del acceso.',
    water_sources: 'No hay fuentes de agua en el trayecto. Llevar mínimo 1.5 litros. En la cima la confitería vende bebidas.',
    camping_allowed: false,
    round_trip: true,
  },

  // -------------------------------------------------------------------------
  // 7. Cascada de los Cántaros (circuito)
  // -------------------------------------------------------------------------
  {
    id: 'cascada-cantaros',
    name: 'Cascada y Lago Los Cántaros (Puerto Blest)',
    province: 'Río Negro',
    area: 'Parque Nacional Nahuel Huapi',
    subarea: 'Puerto Blest',
    region: 'patagonia-norte',
    activity: 'trekking',
    difficulty: 'facil',
    distance_km: 4,
    elevation_gain_m: 240,
    max_altitude_m: 1000,
    duration: { min: 2, max: 3, unit: 'horas' },
    coordinates: { lat: -41.0290, lon: -71.8130 },
    photo_uri:
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80&fit=crop&auto=format',
    tags: ['cascada', 'selva valdiviana', 'alerces', 'navegación', 'Puerto Blest', 'Brazo Blest'],
    permits_required: false,
    best_season: 'Todo el año',
    description:
      'Excursión lacustre-pedestre: navegación desde Puerto Pañuelo por el Brazo Blest y ascenso por la escalera de 600 escalones a la Cascada Los Cántaros y su lago, en plena selva valdiviana con alerces milenarios.',
    trailhead: 'Puerto Blest / Puerto Cántaros (acceso en catamarán desde Puerto Pañuelo)',
    source: 'barilochetrekking.com',
    long_description: `Los Cántaros es la excursión que muestra la cara más húmeda y exuberante del Parque Nacional Nahuel Huapi: la selva valdiviana. El acceso es en sí parte del atractivo, porque no hay camino terrestre: se navega en catamarán desde Puerto Pañuelo (junto al Hotel Llao Llao) por el Brazo Blest del lago Nahuel Huapi, un fiordo de aguas profundas flanqueado por paredes de bosque que cae directamente al agua. La navegación toma alrededor de una hora por tramo.

Desde el muelle de Puerto Cántaros —frente a Puerto Blest— arranca la escalera de unos 600 escalones de madera que asciende junto a la caída de agua. El sendero pasa por miradores sucesivos de la Cascada Los Cántaros, que se precipita en varios saltos entre paredes tapizadas de musgos, helechos de gran porte y troncos cubiertos de líquenes. La humedad permanente del sector, con precipitaciones que superan los 3000 mm anuales, sostiene una vegetación que no existe en ningún otro punto del entorno de Bariloche.

En la parte alta del recorrido se llega al lago Los Cántaros, el cuerpo de agua que alimenta la cascada, un espejo oscuro y silencioso rodeado de selva fría. En el camino se pasa junto a un alerce (lahuán) de más de 1500 años, uno de los ejemplares milenarios accesibles del parque: la escala de tiempo del árbol, anterior a cualquier presencia europea en América, invita a la pausa.

El regreso es por la misma escalera hasta el muelle. La excursión se combina habitualmente con la visita a Puerto Blest y —opcionalmente— el cruce al lago Frías. Conviene reservar la navegación con anticipación en temporada alta y llevar ropa impermeable: en Blest puede llover cualquier día del año.`,
    gpxTrack: [
      { lat: -41.0290, lon: -71.8130, ele: 770 },
      { lat: -41.0300, lon: -71.8145, ele: 800 },
      { lat: -41.0310, lon: -71.8160, ele: 840 },
      { lat: -41.0320, lon: -71.8172, ele: 880 },
      { lat: -41.0330, lon: -71.8182, ele: 920 },
      { lat: -41.0340, lon: -71.8190, ele: 960 },
      { lat: -41.0350, lon: -71.8197, ele: 990 },
      { lat: -41.0358, lon: -71.8202, ele: 1000 },
    ],
    namedWaypoints: [
      {
        lat: -41.0290,
        lon: -71.8130,
        name: 'Puerto Cántaros',
        description: 'Muelle de desembarco del catamarán, frente a Puerto Blest. Inicio de la escalera de 600 escalones.',
      },
      {
        lat: -41.0320,
        lon: -71.8172,
        name: 'Miradores de la cascada',
        description: 'Sucesión de miradores sobre los saltos de la Cascada Los Cántaros, entre musgos y helechos gigantes.',
      },
      {
        lat: -41.0340,
        lon: -71.8190,
        name: 'Alerce milenario',
        description: 'Ejemplar de lahuán (alerce) de más de 1500 años junto al sendero.',
      },
      {
        lat: -41.0358,
        lon: -71.8202,
        name: 'Lago Los Cántaros',
        description: 'Lago que alimenta la cascada, rodeado de selva valdiviana. Punto final del sendero.',
      },
    ],
    parking: 'Estacionamiento en Puerto Pañuelo (punto de embarque del catamarán). No hay acceso vehicular a Puerto Blest.',
    access_notes: 'Desde Bariloche por Av. Bustillo hasta Puerto Pañuelo (25 km, bus línea 20). Desde allí, navegación en catamarán por el Brazo Blest (aprox. 1 h por tramo). Reservar pasajes con anticipación en temporada alta.',
    water_sources: 'Arroyo de la cascada y lago Los Cántaros. Llevar agua propia para la excursión; hay confitería en Puerto Blest.',
    camping_allowed: false,
    round_trip: true,
  },

  // -------------------------------------------------------------------------
  // 8. Laguna Los Témpanos desde Pampa Linda
  // -------------------------------------------------------------------------
  {
    id: 'laguna-tempanos',
    name: 'Laguna de los Témpanos — Mirador Ventisquero Negro',
    province: 'Río Negro',
    area: 'Parque Nacional Nahuel Huapi',
    subarea: 'Pampa Linda',
    region: 'patagonia-norte',
    activity: 'trekking',
    difficulty: 'facil',
    distance_km: 13,
    elevation_gain_m: 150,
    max_altitude_m: 1020,
    duration: { min: 3, max: 5, unit: 'horas' },
    coordinates: { lat: -41.2535, lon: -71.7755 },
    photo_uri:
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80&fit=crop&auto=format',
    tags: ['témpanos', 'laguna proglaciar', 'Ventisquero Negro', 'Tronador', 'apto familias'],
    permits_required: false,
    best_season: 'Dic – Mar',
    description:
      'Caminata suave desde Pampa Linda por el valle del río Manso superior hasta la Laguna de los Témpanos, la laguna proglaciar al pie del Ventisquero Negro donde flotan bloques de hielo oscuro desprendidos del glaciar. También accesible en vehículo: el mirador está junto al camino.',
    trailhead: 'Pampa Linda (90 km al sudoeste de Bariloche)',
    source: 'barilochetrekking.com',
    long_description: `La Laguna de los Témpanos es el cuerpo de agua que se formó al pie del Ventisquero Negro por el retroceso del glaciar en las últimas décadas, y ofrece uno de los espectáculos más singulares del parque: bloques de hielo oscuro —teñidos por el sedimento que el glaciar arrastra— flotando a la deriva en aguas de tono lechoso. Cada temporada la laguna cambia de forma con los desprendimientos del frente del hielo.

Desde Pampa Linda la caminata sigue el valle del río Manso superior hacia el noroeste, unos 6,5 km por camino y sendas laterales entre bosque de coihues y lengas, con el macizo del Tronador creciendo en el horizonte a cada paso. Es un recorrido de pendiente muy suave, ideal para familias o como caminata de aclimatación el día previo a rutas mayores como el Refugio Otto Meiling.

El mirador del Ventisquero Negro, sobre la morrena que contiene la laguna, permite observar el frente del glaciar, los témpanos y —con paciencia— algún desprendimiento: primero se ve el bloque caer y segundos después llega el estruendo. Es también uno de los testimonios más didácticos del retroceso glaciar en la Patagonia: las morrenas laterales marcan dónde llegaba el hielo hace apenas unas décadas.

Quienes van en vehículo pueden detenerse directamente en el mirador, que está junto al camino al Tronador, y combinar la parada con la senda corta a la Garganta del Diablo al final del camino. El camino funciona con horarios de mano única (subida por la mañana, bajada por la tarde); consultar los horarios vigentes antes de ir.`,
    gpxTrack: [
      { lat: -41.2535, lon: -71.7755, ele: 890 },
      { lat: -41.2480, lon: -71.7860, ele: 910 },
      { lat: -41.2420, lon: -71.7970, ele: 935 },
      { lat: -41.2360, lon: -71.8080, ele: 960 },
      { lat: -41.2300, lon: -71.8190, ele: 985 },
      { lat: -41.2240, lon: -71.8280, ele: 1005 },
      { lat: -41.2175, lon: -71.8330, ele: 1020 },
    ],
    namedWaypoints: [
      {
        lat: -41.2535,
        lon: -71.7755,
        name: 'Pampa Linda (890 m)',
        description: 'Punto de partida con guardaparques, hostería y estacionamiento. Registro de trekking obligatorio.',
      },
      {
        lat: -41.2360,
        lon: -71.8080,
        name: 'Valle del río Manso superior',
        description: 'Tramo suave entre bosque de coihues y lengas, con vistas crecientes al macizo del Tronador.',
      },
      {
        lat: -41.2175,
        lon: -71.8330,
        name: 'Mirador Ventisquero Negro — Laguna de los Témpanos',
        description: 'Mirador sobre la morrena: frente del glaciar oscuro, laguna proglaciar y témpanos flotantes.',
      },
    ],
    parking: 'Estacionamiento en Pampa Linda o directamente en el mirador del Ventisquero Negro (junto al camino al Tronador).',
    access_notes: 'Desde Bariloche por Ruta 40 sur hasta el desvío de Villa Mascardi y luego camino de ripio a Pampa Linda (90 km total, 2 h). El camino tiene horarios de mano única; consultar antes de ir.',
    water_sources: 'Arroyos del valle del río Manso superior. No tomar agua de la laguna proglaciar (sedimento en suspensión) sin filtrar.',
    camping_allowed: true,
    round_trip: true,
  },

  // -------------------------------------------------------------------------
  // 9. Cerro Challhuaco
  // -------------------------------------------------------------------------
  {
    id: 'cerro-challhuaco',
    name: 'Cerro Challhuaco',
    province: 'Río Negro',
    area: 'Parque Nacional Nahuel Huapi',
    subarea: 'Bariloche',
    region: 'patagonia-norte',
    activity: 'trekking',
    difficulty: 'moderado',
    distance_km: 12,
    elevation_gain_m: 700,
    max_altitude_m: 2000,
    duration: { min: 5, max: 7, unit: 'horas' },
    coordinates: { lat: -41.2470, lon: -71.2920 },
    photo_uri:
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80&fit=crop&auto=format',
    tags: ['cumbre', 'vistas sur', 'lago Gutiérrez', 'lago Mascardi', 'sendero empinado', 'bosque'],
    permits_required: false,
    best_season: 'Nov – Abr',
    description:
      'Ascenso al Cerro Challhuaco (~2000 m) desde el Refugio Neumeyer, en el Valle del Challhuaco. Sendero bien marcado por bosque de lengas con panorama del Nahuel Huapi, el Tronador y la estepa al este.',
    trailhead: 'Refugio Neumeyer, Valle del Challhuaco (19 km de Bariloche)',
    source: 'barilochetrekking.com',
    long_description: `El Valle del Challhuaco es el rincón más tranquilo del entorno inmediato de Bariloche: un valle de bosque de lengas a solo 19 km del centro, con el Refugio Neumeyer (1320 m) como base de operaciones. El ascenso al Cerro Challhuaco es el clásico del valle y una de las mejores relaciones esfuerzo-recompensa de la zona, con un sendero bien marcado de principio a fin.

Desde el refugio, el sendero se interna en un bosque de lengas alto y luminoso, muy distinto del coihuar húmedo de las rutas del oeste. La subida es sostenida pero nunca extrema, y en una bifurcación señalizada se toma el ramal izquierdo que continúa hacia la cumbre. En otoño este bosque es uno de los espectáculos de la región: las lengas viran al rojo y al naranja en capas que cubren todo el valle.

Sobre los 1700 metros el bosque se achaparra hasta desaparecer y el sendero sale a terreno abierto de roca y arbustos rastreros, donde el viento sopla con intensidad. La señalización pasa a ser por hitos de piedra (cairns); con niebla conviene prestar atención al rumbo. El contraste es notable: hacia el oeste las cumbres nevadas de la cordillera, hacia el este el comienzo de la estepa patagónica que se pierde en el horizonte.

Desde la cumbre del Challhuaco (~2000 m) el panorama abarca el lago Nahuel Huapi y Bariloche al norte, el cordón del Catedral y el Tronador al oeste, y la transición bosque-estepa al este — pocas cumbres muestran tan claramente los dos mundos que conviven en el parque. El descenso es por la misma ruta, con el Refugio Neumeyer como parada final para un té caliente en el valle.`,
    gpxTrack: [
      { lat: -41.2470, lon: -71.2920, ele: 1320 },
      { lat: -41.2490, lon: -71.2950, ele: 1400 },
      { lat: -41.2510, lon: -71.2980, ele: 1480 },
      { lat: -41.2530, lon: -71.3010, ele: 1560 },
      { lat: -41.2550, lon: -71.3040, ele: 1640 },
      { lat: -41.2570, lon: -71.3065, ele: 1720 },
      { lat: -41.2590, lon: -71.3085, ele: 1800 },
      { lat: -41.2610, lon: -71.3100, ele: 1880 },
      { lat: -41.2628, lon: -71.3110, ele: 1950 },
      { lat: -41.2640, lon: -71.3118, ele: 2000 },
    ],
    namedWaypoints: [
      {
        lat: -41.2470,
        lon: -71.2920,
        name: 'Refugio Neumeyer (1320 m)',
        description: 'Base del Valle del Challhuaco, con comidas y alojamiento. Inicio del sendero señalizado a la cumbre.',
      },
      {
        lat: -41.2530,
        lon: -71.3010,
        name: 'Bifurcación señalizada',
        description: 'Tomar el ramal izquierdo hacia la cumbre del Challhuaco. El derecho conduce a otros paseos del valle.',
      },
      {
        lat: -41.2590,
        lon: -71.3085,
        name: 'Límite del bosque de lengas',
        description: 'Las lengas se achaparran y el sendero sale a terreno abierto. Orientación por cairns; viento frecuente.',
      },
      {
        lat: -41.2640,
        lon: -71.3118,
        name: 'Cumbre Cerro Challhuaco (~2000 m)',
        description: 'Panorama del Nahuel Huapi y Bariloche al norte, el Catedral y el Tronador al oeste y la estepa al este.',
      },
    ],
    parking: 'Estacionamiento en el Refugio Neumeyer, al final del camino del Valle del Challhuaco.',
    access_notes: 'Desde Bariloche tomar la Ruta 40 hacia el sur y el desvío señalizado al Valle del Challhuaco; camino de ripio hasta el Refugio Neumeyer (19 km desde el centro, 40 min). No hay transporte público hasta el valle.',
    water_sources: 'Arroyo Challhuaco cerca del refugio y un arroyo en la parte baja del sendero. No hay agua en la zona alta; llevar suficiente para el día.',
    camping_allowed: false,
    refugio: 'Refugio Neumeyer (CAB)',
    round_trip: true,
  },

  // -------------------------------------------------------------------------
  // 10. Travesía Frey–Jakob (2 días)
  // -------------------------------------------------------------------------
  {
    id: 'travesia-frey-jakob',
    name: 'Travesía Frey–Jakob (2 días)',
    province: 'Río Negro',
    area: 'Parque Nacional Nahuel Huapi',
    subarea: 'Bariloche',
    region: 'patagonia-norte',
    activity: 'travesia',
    difficulty: 'dificil',
    distance_km: 33,
    elevation_gain_m: 1450,
    max_altitude_m: 1900,
    duration: { min: 2, max: 3, unit: 'dias' },
    coordinates: { lat: -41.1855, lon: -71.4499 },
    photo_uri:
      'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=800&q=80&fit=crop&auto=format',
    tags: ['travesía', '2 días', 'refugio', 'paso de altura', 'backcountry', 'clásico Bariloche'],
    permits_required: false,
    best_season: 'Dic – Mar',
    description:
      'Clásica travesía de dos o tres días por la alta montaña de Bariloche: Catedral → Refugio Frey → filo por Laguna Schmoll → valle del Rucaco → Brecha Negra → Refugio Jakob → bajada a Tambo Báez. Solo con buen tiempo y experiencia.',
    trailhead: 'Base Cerro Catedral (Bariloche)',
    source: 'barilochetrekking.com',
    long_description: `La Travesía Frey–Jakob es la excursión de dos días de referencia absoluta de Bariloche y una de las rutas de montaña más completas de la Patagonia andina. Combina bosque, laguna glaciar, pasos de altura expuestos y el camaradería única de las noches en refugio de alta montaña. No en vano es el sueño cumplido de todo amante del trekking que visita la región.

El primer día replica el sendero al Refugio Frey desde la base de Catedral (ver descripción separada), con llegada al refugio a orillas de la Laguna Toncek en la tarde. La noche en el refugio Frey es una experiencia en sí misma: la terraza iluminada por los últimos rayos del sol sobre las agujas de granito, el tintineo de cuerdas y mosquetones de los escaladores, y una cena caliente rodeado de montañeros de distintos países que comparten historias de vías y cumbres.

El segundo día es el más exigente y el más recompensante. Desde Frey el sendero trepa junto a la Laguna Schmoll hasta el filo del Catedral (~1900 m), una arista entre dos mundos: del lado de Frey las agujas y las lagunas; del otro, el profundo valle del arroyo Rucaco. La bajada al Rucaco pierde unos 500 metros por pedrero empinado, el valle se cruza entre lengas achaparradas, y al final espera la subida a la Brecha Negra (~1900 m), un portezuelo de roca oscura con pendiente fuerte y terreno suelto donde en ocasiones se usan las manos. El viento en los filos puede ser intenso; con nieve, hielo o mal tiempo la travesía no debe intentarse.

Del otro lado de la Brecha, la bajada conduce al Refugio Jakob (oficialmente Refugio San Martín, 1600 m), asomado a la laguna Jakob en un valle glaciar espectacular. Se puede pernoctar allí y bajar al día siguiente por el valle del arroyo Casa de Piedra hasta Tambo Báez (unos 14 km, sobre la Ruta 79 camino a Colonia Suiza), cerrando una de las travesías más completas de la Patagonia andina.`,
    gpxTrack: [
      { lat: -41.1855, lon: -71.4499, ele: 1050 },
      { lat: -41.1905, lon: -71.4585, ele: 1230 },
      { lat: -41.1950, lon: -71.4670, ele: 1420 },
      { lat: -41.1975, lon: -71.4727, ele: 1580 },
      { lat: -41.1997, lon: -71.4741, ele: 1700 },
      { lat: -41.1975, lon: -71.4790, ele: 1760 },
      { lat: -41.1940, lon: -71.4850, ele: 1830 },
      { lat: -41.1900, lon: -71.4900, ele: 1900 },
      { lat: -41.1833, lon: -71.4933, ele: 1700 },
      { lat: -41.1733, lon: -71.4967, ele: 1500 },
      { lat: -41.1633, lon: -71.4983, ele: 1400 },
      { lat: -41.1533, lon: -71.5000, ele: 1500 },
      { lat: -41.1433, lon: -71.5033, ele: 1700 },
      { lat: -41.1400, lon: -71.5050, ele: 1900 },
      { lat: -41.1267, lon: -71.5117, ele: 1600 },
      { lat: -41.1167, lon: -71.5200, ele: 1450 },
      { lat: -41.1067, lon: -71.5350, ele: 1400 },
      { lat: -41.0900, lon: -71.5500, ele: 1100 },
      { lat: -41.0733, lon: -71.5633, ele: 900 },
      { lat: -41.0567, lon: -71.5867, ele: 830 },
    ],
    namedWaypoints: [
      {
        lat: -41.1855,
        lon: -71.4499,
        name: 'Base Cerro Catedral (Día 1 inicio)',
        description: 'Punto de partida. Estacionamiento con servicio de guarda de vehículos por 2 días. Inicio del sendero al Refugio Frey.',
      },
      {
        lat: -41.1997,
        lon: -71.4741,
        name: 'Refugio Frey (1700 m) — noche 1',
        description: 'Refugio del CAB a orillas de la Laguna Toncek. Reserva obligatoria en temporada alta. Cenas y desayunos disponibles. Carpas en la orilla de la laguna.',
      },
      {
        lat: -41.1900,
        lon: -71.4900,
        name: 'Filo del Catedral por Laguna Schmoll (~1900 m)',
        description: 'Subida junto a la Laguna Schmoll hasta el filo. Vistas a ambos lados: agujas de Frey y valle del Rucaco. Viento frecuente.',
      },
      {
        lat: -41.1633,
        lon: -71.4983,
        name: 'Valle del arroyo Rucaco',
        description: 'Bajada de ~500 m por pedrero y cruce del valle entre lengas achaparradas. Buena fuente de agua.',
      },
      {
        lat: -41.1400,
        lon: -71.5050,
        name: 'Brecha Negra (~1900 m)',
        description: 'Portezuelo de roca oscura con pendiente fuerte y terreno suelto; en ocasiones se usan las manos. No cruzar con nieve, hielo o mal tiempo.',
      },
      {
        lat: -41.1267,
        lon: -71.5117,
        name: 'Refugio San Martín / Jakob (1600 m)',
        description: 'Refugio del CAB junto a la laguna Jakob. Noche 2 recomendada antes de la bajada por el valle del Casa de Piedra.',
      },
      {
        lat: -41.0567,
        lon: -71.5867,
        name: 'Tambo Báez / Colonia Suiza (final)',
        description: 'Fin de la bajada por el valle del arroyo Casa de Piedra, sobre la Ruta 79. Bus o taxi de regreso a Bariloche; curanto en Colonia Suiza los fines de semana.',
      },
    ],
    parking: 'Dejar el vehículo en la base de Cerro Catedral (pago por días). Al finalizar en Tambo Báez / Colonia Suiza, tomar bus o taxi de regreso.',
    access_notes: 'Inicio en Cerro Catedral (Ruta 82, 18 km desde Bariloche). Fin en Tambo Báez, sobre la Ruta 79 camino a Colonia Suiza (bus línea 10 de regreso al centro). La logística de dos puntos distintos debe planificarse con antelación.',
    water_sources: 'Abundante durante toda la travesía: lagunas Toncek y Schmoll, arroyo Rucaco en el valle y arroyo Casa de Piedra en la bajada.',
    camping_allowed: true,
    refugio: 'Refugio Frey (CAB)',
    round_trip: false,
  },

  // -------------------------------------------------------------------------
  // 11. Circuito Colonia Suiza
  // -------------------------------------------------------------------------
  {
    id: 'colonia-suiza-circuito',
    name: 'Circuito Colonia Suiza',
    province: 'Río Negro',
    area: 'Parque Nacional Nahuel Huapi',
    subarea: 'Colonia Suiza',
    region: 'patagonia-norte',
    activity: 'trekking',
    difficulty: 'facil',
    distance_km: 12,
    elevation_gain_m: 400,
    max_altitude_m: 1200,
    duration: { min: 4, max: 5, unit: 'horas' },
    coordinates: { lat: -41.0500, lon: -71.5967 },
    photo_uri:
      'https://images.unsplash.com/photo-1511497584788-876760111969?w=800&q=80&fit=crop&auto=format',
    tags: ['bosque nativo', 'lago Moreno', 'patrimonio suizo', 'curanto', 'facil', 'familia'],
    permits_required: false,
    best_season: 'Oct – May',
    description:
      'Circuito tranquilo por la Colonia Suiza con ascenso parcial a las lomas boscosas y vistas al lago Moreno. Incluye patrimonio cultural de los colonos suizos del siglo XIX.',
    trailhead: 'Colonia Suiza, sobre la Ruta 79',
    source: 'barilochetrekking.com',
    long_description: `La Colonia Suiza es uno de los asentamientos más singulares de la Patagonia andina. Fundada a finales del siglo XIX por inmigrantes helvéticos que llegaron a poblar estas tierras por convocatoria del gobierno argentino, conserva hasta hoy una arquitectura y una gastronomía que recuerdan a los valles alpinos de origen. El circuito de trekking que parte desde el centro de la colonia es una combinación única de senderismo en bosque nativo y descubrimiento de patrimonio cultural vivo.

El sendero sube por pistas forestales cubiertas de coihues centenarios y robles del sur, atraviesa algunas chacras privadas con permiso de paso y asciende suavemente hasta las lomas desde donde el lago Moreno se ve en su totalidad. El bosque en este sector es especialmente denso y húmedo, con líquenes colgantes y hongos de llamativos colores en los troncos caídos. En otoño el follaje de los ñires y robles transforma el circuito en una explosión de ocres y rojizos.

Las lomas superiores ofrecen vistas tranquilas al lago Moreno y a las montañas al sur, sin la espectacularidad de las cumbres altas pero con una paz y una intimidad que los grandes senderos difícilmente ofrecen. Es un buen lugar para almorzar sentados en la hierba con vistas abiertas y sin viento. El descenso por el lado opuesto pasa junto a una antigua acequia construida por los colonos suizos para regar sus huertas, hoy un vestigio histórico cubierto de musgo.

El regreso al pueblo coincide habitualmente con la hora del curanto, el tradicional banquete patagónico que algunos restaurantes de la colonia sirven los fines de semana: carne, embutidos, papas, chorizos y empanadas cocidos lentamente bajo una cubierta de hojas de nalca (Gunnera tinctoria) sobre piedras calentadas. El maridaje entre el ejercicio de montaña y la mesa abundante es uno de los mayores placeres del circuito de Colonia Suiza.`,
    gpxTrack: [
      { lat: -41.0500, lon: -71.5967, ele: 830 },
      { lat: -41.0513, lon: -71.5940, ele: 870 },
      { lat: -41.0527, lon: -71.5912, ele: 910 },
      { lat: -41.0542, lon: -71.5885, ele: 955 },
      { lat: -41.0558, lon: -71.5858, ele: 1000 },
      { lat: -41.0573, lon: -71.5832, ele: 1045 },
      { lat: -41.0587, lon: -71.5807, ele: 1090 },
      { lat: -41.0598, lon: -71.5783, ele: 1130 },
      { lat: -41.0605, lon: -71.5762, ele: 1165 },
      { lat: -41.0607, lon: -71.5745, ele: 1190 },
      { lat: -41.0600, lon: -71.5730, ele: 1200 },
      { lat: -41.0585, lon: -71.5745, ele: 1170 },
      { lat: -41.0567, lon: -71.5775, ele: 1130 },
      { lat: -41.0548, lon: -71.5810, ele: 1080 },
      { lat: -41.0528, lon: -71.5855, ele: 1020 },
      { lat: -41.0510, lon: -71.5905, ele: 955 },
      { lat: -41.0500, lon: -71.5967, ele: 830 },
    ],
    namedWaypoints: [
      {
        lat: -41.0500,
        lon: -71.5967,
        name: 'Centro Colonia Suiza',
        description: 'Punto de partida y llegada del circuito. Restaurantes de curanto y artesanías locales.',
      },
      {
        lat: -41.0542,
        lon: -71.5885,
        name: 'Chacras históricas',
        description: 'Terrenos de antiguos colonos suizos con arquitectura alpina de finales del siglo XIX. Paso con permiso implícito.',
      },
      {
        lat: -41.0587,
        lon: -71.5807,
        name: 'Bosque denso de ñires',
        description: 'Zona de ñires y coihues maduros. En otoño colores excepcionales. Abundantes aves del bosque.',
      },
      {
        lat: -41.0600,
        lon: -71.5730,
        name: 'Loma mirador (1200 m)',
        description: 'Punto más alto del circuito con vistas al lago Moreno y montañas sur. Almuerzo recomendado.',
      },
      {
        lat: -41.0548,
        lon: -71.5810,
        name: 'Acequia histórica',
        description: 'Antigua acequia de riego construida por colonos suizos. Vestigio patrimonial cubierto de musgo.',
      },
    ],
    parking: 'Estacionamiento gratuito en el centro de Colonia Suiza, junto a los restaurantes.',
    access_notes: 'Desde Bariloche tomar la Ruta 79 hacia el oeste por 22 km (30 min en auto). Colonia Suiza está señalizada. Bus línea 10 desde la Terminal con servicio frecuente.',
    water_sources: 'La acequia histórica tiene agua de montaña. Pequeño arroyo en el tramo norte del circuito. Fuentes suficientes para la duración del paseo.',
    camping_allowed: false,
    round_trip: false,
  },

  // -------------------------------------------------------------------------
  // 12. Lago Gutiérrez Costa Sur
  // -------------------------------------------------------------------------
  {
    id: 'lago-gutierrez-costera',
    name: 'Lago Gutiérrez — Costa Sur',
    province: 'Río Negro',
    area: 'Parque Nacional Nahuel Huapi',
    subarea: 'Bariloche',
    region: 'patagonia-norte',
    activity: 'trekking',
    difficulty: 'facil',
    distance_km: 14,
    elevation_gain_m: 150,
    max_altitude_m: 850,
    duration: { min: 3, max: 5, unit: 'horas' },
    coordinates: { lat: -41.1660, lon: -71.4120 },
    photo_uri:
      'https://images.unsplash.com/photo-1501426026826-31c667bdf23d?w=800&q=80&fit=crop&auto=format',
    tags: ['lago', 'costa', 'natación', 'bosque', 'tranquilo', 'familia', 'menos concurrido'],
    permits_required: false,
    best_season: 'Oct – Abr',
    description:
      'Sendero costero por la orilla oeste del lago Gutiérrez, desde la seccional de guardaparques de Villa Los Coihues hasta Playa Muñoz, a través de bosque nativo con playas aptas para baño. Mucho menos concurrido que otras rutas de Bariloche.',
    trailhead: 'Seccional de Guardaparques Lago Gutiérrez, Villa Los Coihues',
    source: 'barilochetrekking.com',
    long_description: `El lago Gutiérrez es el lago más cercano a Bariloche, apenas 10 km al sur de la ciudad, y su orilla oeste está recorrida por un sendero costero que es quizás el mejor secreto de la región para quienes buscan un trekking tranquilo en un entorno natural prístino sin multitudes. Mientras las rutas del Catedral se llenan de caminantes, la orilla del Gutiérrez permanece silenciosa incluso en pleno enero.

El sendero parte de la seccional de guardaparques de Villa Los Coihues, en el extremo norte del lago, y sigue la costa oeste hacia el sur con suaves ascensos y descensos que pocas veces superan los 50 metros de desnivel. El bosque de coihue y ciprés de la cordillera (Austrocedrus chilensis) que acompaña la mayor parte de la ruta es uno de los más tranquilos y aromáticos de la zona: el olor a resina de ciprés, especialmente en los tramos soleados, tiene algo de medicinal que relaja el paso y ralentiza la marcha de manera casi involuntaria.

El lago Gutiérrez destaca por la extraordinaria claridad de sus aguas en la orilla pedregosa. El color varía entre el turquesa profundo en los sectores de mayor profundidad y el verde claro en las playas de guijarros donde el fondo se ve hasta 6-7 metros de profundidad. En el verano patagónico las temperaturas del agua alcanzan los 18-20 °C en las zonas someras, lo que convierte cualquier playa del sendero en un lugar idóneo para un baño revitalizante a mitad de ruta.

La Playa Muñoz, al final del tramo de ida (~7 km, 1:30-2 h), es una playa de piedras claras con vistas al macizo del Catedral. El silencio aquí es notable. En el entorno se ven bandurrias y cauquenes en las orillas bajas, y los martín pescadores patrullan el litoral con sus vuelos rasantes sobre el agua. El regreso por la misma ruta al atardecer ofrece la luz más cálida del día sobre el espejo del lago.`,
    gpxTrack: [
      { lat: -41.1660, lon: -71.4120, ele: 800 },
      { lat: -41.1700, lon: -71.4150, ele: 810 },
      { lat: -41.1740, lon: -71.4180, ele: 820 },
      { lat: -41.1780, lon: -71.4210, ele: 830 },
      { lat: -41.1820, lon: -71.4230, ele: 840 },
      { lat: -41.1860, lon: -71.4250, ele: 830 },
      { lat: -41.1900, lon: -71.4265, ele: 840 },
      { lat: -41.1935, lon: -71.4278, ele: 850 },
      { lat: -41.1960, lon: -71.4285, ele: 820 },
    ],
    namedWaypoints: [
      {
        lat: -41.1660,
        lon: -71.4120,
        name: 'Seccional Guardaparques Lago Gutiérrez',
        description: 'Punto de partida en Villa Los Coihues, extremo norte del lago. Cartelería del parque y registro.',
      },
      {
        lat: -41.1700,
        lon: -71.4150,
        name: 'Desvío a la Cascada de los Duendes',
        description: 'A pocos minutos del inicio, senda corta autoguiada a la cascada sobre el arroyo Pescadero.',
      },
      {
        lat: -41.1780,
        lon: -71.4210,
        name: 'Mirador del lago',
        description: 'Balcón natural con vistas al lago Gutiérrez y al macizo del Catedral.',
      },
      {
        lat: -41.1860,
        lon: -71.4250,
        name: 'Bosque de cipreses cordilleranos',
        description: 'Tramo más aromático del sendero con cipreses de la cordillera maduros. Aroma resinoso característico.',
      },
      {
        lat: -41.1960,
        lon: -71.4285,
        name: 'Playa Muñoz',
        description: 'Playa de piedras claras y aguas transparentes, fin del recorrido (~7 km desde la seccional, 1:30-2 h). Apta para baño en verano.',
      },
    ],
    parking: 'Estacionamiento en Villa Los Coihues, cerca de la seccional de guardaparques.',
    access_notes: 'Desde Bariloche tomar la Ruta 82 hacia el lago Gutiérrez y el acceso a Villa Los Coihues (10 km, 15 min). Bus línea 50 desde el centro hasta Villa Los Coihues.',
    water_sources: 'El lago Gutiérrez tiene agua limpia disponible en toda la orilla (potable con purificación) y el arroyo Pescadero al inicio. Ideal llevar botella y tabletas purificadoras.',
    camping_allowed: false,
    round_trip: true,
  },

  // -------------------------------------------------------------------------
  // 13. Cerro San Martín (Llao Llao)
  // -------------------------------------------------------------------------
  {
    id: 'cerro-san-martin',
    name: 'Cerro San Martín (La Vieja)',
    province: 'Río Negro',
    area: 'Parque Nacional Nahuel Huapi',
    subarea: 'Bariloche',
    region: 'patagonia-norte',
    activity: 'trekking',
    difficulty: 'facil',
    distance_km: 7,
    elevation_gain_m: 280,
    max_altitude_m: 1275,
    duration: { min: 2, max: 4, unit: 'horas' },
    coordinates: { lat: -41.1520, lon: -71.4380 },
    photo_uri:
      'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80&fit=crop&auto=format',
    tags: ['mirador', 'lago Gutiérrez', 'Catedral', 'apto familias', 'medio día', 'menos concurrido'],
    permits_required: false,
    best_season: 'Todo el año',
    description:
      'Ascenso corto al Cerro San Martín (1275 m), conocido localmente como La Vieja, frente al macizo del Catedral. Excelente mirador del lago Gutiérrez con poco esfuerzo, ideal para medio día.',
    trailhead: 'Camino a Villa Catedral (Ruta 82), desvío señalizado',
    source: 'barilochetrekking.com',
    long_description: `El Cerro San Martín —que los barilochenses llaman La Vieja— es la cumbre baja que se levanta frente al macizo del Catedral, sobre la cabecera norte del lago Gutiérrez. Es una de las mejores relaciones esfuerzo-vista de todo el entorno de Bariloche: con apenas 280 metros de desnivel y 7 km ida y vuelta se obtiene un balcón privilegiado sobre el lago Gutiérrez, el cordón del Catedral y el cerro Ventana.

El acceso parte del camino a Villa Catedral (Ruta 82) y sigue un viejo camino vehicular hoy cerrado al tránsito de autos, que suben solo caminantes y ciclistas de montaña. La pendiente es amable y constante, entre bosque bajo de ciprés de la cordillera y maitenes, con claros que van abriendo vistas parciales a medida que se gana altura. Existen además picadas más directas y empinadas para quien prefiera un ascenso más deportivo.

La cumbre es amplia y despejada. Hacia el sur, el lago Gutiérrez se despliega completo con sus playas y bahías; al oeste, la mole del Catedral con sus antenas y pistas; al norte, la ciudad de Bariloche y el Nahuel Huapi; al este, el perfil rocoso del cerro Ventana y la transición hacia la estepa. Al atardecer la luz baja sobre el Gutiérrez convierte la caminata de bajada en un espectáculo.

Por su corta duración y baja exigencia es una salida ideal para familias, para el día de llegada a Bariloche o para tardes de otoño e invierno: con nieve el camino se transforma en una caminata invernal sencilla (con el calzado adecuado). No hay agua en el recorrido, así que conviene llevar botella propia.`,
    gpxTrack: [
      { lat: -41.1520, lon: -71.4380, ele: 995 },
      { lat: -41.1535, lon: -71.4400, ele: 1030 },
      { lat: -41.1550, lon: -71.4420, ele: 1065 },
      { lat: -41.1565, lon: -71.4440, ele: 1100 },
      { lat: -41.1580, lon: -71.4460, ele: 1140 },
      { lat: -41.1595, lon: -71.4478, ele: 1180 },
      { lat: -41.1610, lon: -71.4494, ele: 1220 },
      { lat: -41.1622, lon: -71.4506, ele: 1250 },
      { lat: -41.1632, lon: -71.4515, ele: 1275 },
    ],
    namedWaypoints: [
      {
        lat: -41.1520,
        lon: -71.4380,
        name: 'Desvío del camino a Villa Catedral',
        description: 'Inicio del viejo camino vehicular, cerrado al tránsito de autos. Cartel indicador.',
      },
      {
        lat: -41.1580,
        lon: -71.4460,
        name: 'Bosque de cipreses y maitenes',
        description: 'Subida amable con claros que abren vistas parciales al lago Gutiérrez y al Catedral.',
      },
      {
        lat: -41.1632,
        lon: -71.4515,
        name: 'Cumbre Cerro San Martín / La Vieja (1275 m)',
        description: 'Balcón sobre el lago Gutiérrez, el Catedral, el cerro Ventana y la ciudad de Bariloche.',
      },
    ],
    parking: 'Espacio para estacionar en el desvío sobre el camino a Villa Catedral (Ruta 82).',
    access_notes: 'Desde Bariloche tomar la Ruta 82 hacia Villa Catedral; el desvío señalizado está a unos 15 km del centro (20 min en auto). En bus: línea 55 hacia Catedral, bajarse en el desvío.',
    water_sources: 'No hay fuentes de agua en el recorrido. Llevar agua propia.',
    camping_allowed: false,
    round_trip: true,
  },

  // -------------------------------------------------------------------------
  // 14. Refugio Jakob desde Colonia Suiza
  // -------------------------------------------------------------------------
  {
    id: 'refugio-jakob',
    name: 'Refugio Jakob (San Martín) desde Tambo Báez',
    province: 'Río Negro',
    area: 'Parque Nacional Nahuel Huapi',
    subarea: 'Bariloche',
    region: 'patagonia-norte',
    activity: 'trekking',
    difficulty: 'dificil',
    distance_km: 27,
    elevation_gain_m: 850,
    max_altitude_m: 1600,
    duration: { min: 9, max: 12, unit: 'horas' },
    coordinates: { lat: -41.0700, lon: -71.5350 },
    photo_uri:
      'https://images.unsplash.com/photo-1482685945432-29a7abf2f466?w=800&q=80&fit=crop&auto=format',
    tags: ['refugio', 'alta montaña', 'circo glaciar', 'traversía', 'solitario', 'Jakob'],
    permits_required: false,
    best_season: 'Dic – Mar',
    description:
      'Larga caminata por el valle del arroyo Casa de Piedra desde Tambo Báez hasta el Refugio San Martín (Jakob, 1600 m), a orillas de la laguna Jakob. Unos 13-14 km por tramo; muchos lo hacen con noche en el refugio.',
    trailhead: 'Tambo Báez, Ruta 79 (camino a Colonia Suiza)',
    source: 'barilochetrekking.com',
    long_description: `El Refugio San Martín, universalmente conocido como Refugio Jakob, es uno de los refugios más remotos del Club Andino Bariloche en el entorno inmediato de la ciudad, y su valle de acceso —el del arroyo Casa de Piedra— uno de los más hermosos. La ruta clásica parte de Tambo Báez, un establecimiento privado sobre la Ruta 79 poco antes de Colonia Suiza donde se abona un ingreso simbólico, y remonta el valle en unos 13-14 kilómetros de ida con un desnivel total moderado pero una longitud que exige buen estado físico.

La primera mitad del recorrido es amable: el sendero acompaña al arroyo Casa de Piedra por un bosque de coihues alto, con pendiente suave y varios accesos al agua. El rumor del arroyo es constante y en los claros se asoman las paredes del cordón que separa este valle del circo del Frey. Es un tramo para caminar a ritmo sostenido sin quemar energía.

En la segunda mitad el valle se empina: aparecen los escalones glaciares, el bosque se achaparra y el sendero gana altura en tramos de zigzag, con algún paso de roca donde apoyar las manos. Los cruces de arroyos de deshielo pueden llevar buen caudal en noviembre y diciembre. El último escalón deposita al caminante en el borde del circo, y la laguna Jakob aparece de golpe: azul intensa, encajonada entre paredes, con el refugio de piedra en su orilla.

El Refugio Jakob (1600 m), reconstruido y reinaugurado en años recientes, ofrece comidas, literas y zona de acampe. Por la longitud total (unos 27 km ida y vuelta) la mayoría pernocta y baja al día siguiente. Para quienes buscan más, desde el refugio salen la subida corta a la laguna de los Témpanos superior del circo, el cruce a la Laguna Negra por el filo (solo expertos, con buen tiempo) y la clásica travesía a Frey por la Brecha Negra en sentido inverso.`,
    gpxTrack: [
      { lat: -41.0700, lon: -71.5350, ele: 900 },
      { lat: -41.0760, lon: -71.5330, ele: 930 },
      { lat: -41.0820, lon: -71.5315, ele: 960 },
      { lat: -41.0880, lon: -71.5300, ele: 990 },
      { lat: -41.0940, lon: -71.5290, ele: 1020 },
      { lat: -41.1000, lon: -71.5280, ele: 1060 },
      { lat: -41.1060, lon: -71.5270, ele: 1100 },
      { lat: -41.1120, lon: -71.5255, ele: 1150 },
      { lat: -41.1170, lon: -71.5240, ele: 1210 },
      { lat: -41.1210, lon: -71.5220, ele: 1290 },
      { lat: -41.1240, lon: -71.5190, ele: 1380 },
      { lat: -41.1260, lon: -71.5160, ele: 1480 },
      { lat: -41.1267, lon: -71.5117, ele: 1600 },
    ],
    namedWaypoints: [
      {
        lat: -41.0700,
        lon: -71.5350,
        name: 'Tambo Báez (900 m)',
        description: 'Inicio del sendero en un establecimiento privado sobre la Ruta 79 (ingreso simbólico). Estacionamiento disponible.',
      },
      {
        lat: -41.0940,
        lon: -71.5290,
        name: 'Valle del arroyo Casa de Piedra',
        description: 'Tramo largo y amable de bosque de coihues junto al arroyo. Varias fuentes de agua.',
      },
      {
        lat: -41.1210,
        lon: -71.5220,
        name: 'Escalones glaciares',
        description: 'El valle se empina en zigzags con algún paso de roca. Cruces de arroyos con caudal en el deshielo.',
      },
      {
        lat: -41.1267,
        lon: -71.5117,
        name: 'Refugio San Martín / Jakob (1600 m)',
        description: 'Refugio del CAB a orillas de la laguna Jakob, en circo glaciar. Comidas, literas y acampe. Reserva en temporada.',
      },
    ],
    parking: 'Estacionamiento en Tambo Báez (privado, ingreso simbólico). Si se pernocta en el refugio, el auto puede quedar hasta el día siguiente.',
    access_notes: 'Desde Bariloche por Av. Bustillo y Ruta 79 hacia Colonia Suiza; Tambo Báez está señalizado sobre la ruta, unos 6 km antes de la colonia (25 km, 35 min en auto). Bus línea 10 hasta las cercanías.',
    water_sources: 'Arroyo Casa de Piedra y múltiples afluentes durante el ascenso. Agua abundante y de buena calidad (purificar igualmente). El refugio tiene agua disponible.',
    camping_allowed: true,
    refugio: 'Refugio San Martín / Jakob (CAB)',
    round_trip: true,
  },

  // -------------------------------------------------------------------------
  // 15. Laguna Ilón
  // -------------------------------------------------------------------------
  {
    id: 'laguna-ilon',
    name: 'Laguna Ilón desde Pampa Linda',
    province: 'Río Negro',
    area: 'Parque Nacional Nahuel Huapi',
    subarea: 'Pampa Linda',
    region: 'patagonia-norte',
    activity: 'trekking',
    difficulty: 'moderado',
    distance_km: 16,
    elevation_gain_m: 550,
    max_altitude_m: 1350,
    duration: { min: 7, max: 9, unit: 'horas' },
    coordinates: { lat: -41.2535, lon: -71.7755 },
    photo_uri:
      'https://images.unsplash.com/photo-1540390769625-2fc3f8b1d50c?w=800&q=80&fit=crop&auto=format',
    tags: ['laguna', 'lengas', 'Mirada del Doctor', 'Mascardi', 'acampe', 'refugio'],
    permits_required: false,
    best_season: 'Dic – Abr',
    description:
      'Sendero desde Pampa Linda a la Laguna Ilón por la Mirada del Doctor: subida sostenida al principio y un largo tramo llano entre lengas, con el balcón sobre el lago Mascardi como premio intermedio. Refugio y zona de acampe en la laguna.',
    trailhead: 'Pampa Linda (90 km al sudoeste de Bariloche)',
    source: 'barilochetrekking.com',
    long_description: `La Laguna Ilón es uno de los destinos más armoniosos del sector Tronador: una laguna de montaña rodeada de lengas y pastizales de altura, con un refugio pequeño y una zona de acampe que la convierten en base ideal para explorar el corazón del parque. La ruta desde Pampa Linda toma 4 a 5 horas de ida y concentra su esfuerzo al principio: una subida sostenida en zigzag que gana la mayor parte de los 550 metros de desnivel.

El premio intermedio de esa subida es la Mirada del Doctor, un balcón natural sobre el brazo Tronador del lago Mascardi: el agua turquesa lechosa —teñida por el sedimento glaciar del río Manso— serpentea entre laderas boscosas cientos de metros más abajo, en una de las vistas más fotografiadas del sector. Es parada obligada para recuperar el aliento.

Superada la subida, el sendero se vuelve un paseo: un largo tramo casi llano por bosque de lengas altas, con claros de pastizal y cruces de arroyos menores. La llegada a la laguna es suave, sin el dramatismo de los circos de granito de Catedral, pero con una serenidad propia: la Laguna Ilón (~1350 m) descansa entre lomadas verdes con el pico Bonete asomando detrás.

En la laguna funcionan en temporada un refugio pequeño y una zona de acampe. Pernoctar permite continuar al día siguiente hacia el mirador del Cerro Bonete o enlazar la travesía hacia el Refugio Agostino Rocca por Paso de las Nubes. Atención a la logística del camino a Pampa Linda: funciona con horarios de mano única (subida por la mañana, bajada por la tarde), lo que condiciona los horarios de inicio y regreso.`,
    gpxTrack: [
      { lat: -41.2535, lon: -71.7755, ele: 890 },
      { lat: -41.2570, lon: -71.7740, ele: 950 },
      { lat: -41.2610, lon: -71.7730, ele: 1030 },
      { lat: -41.2650, lon: -71.7725, ele: 1110 },
      { lat: -41.2690, lon: -71.7725, ele: 1190 },
      { lat: -41.2725, lon: -71.7730, ele: 1250 },
      { lat: -41.2760, lon: -71.7740, ele: 1290 },
      { lat: -41.2800, lon: -71.7755, ele: 1310 },
      { lat: -41.2840, lon: -71.7775, ele: 1330 },
      { lat: -41.2875, lon: -71.7795, ele: 1345 },
      { lat: -41.2900, lon: -71.7810, ele: 1350 },
    ],
    namedWaypoints: [
      {
        lat: -41.2535,
        lon: -71.7755,
        name: 'Pampa Linda (890 m)',
        description: 'Punto de partida con guardaparques, hostería y estacionamiento. Registro de trekking obligatorio.',
      },
      {
        lat: -41.2650,
        lon: -71.7725,
        name: 'Zigzags de la subida',
        description: 'Tramo de mayor esfuerzo: subida sostenida en zigzag que concentra casi todo el desnivel de la ruta.',
      },
      {
        lat: -41.2725,
        lon: -71.7730,
        name: 'Mirada del Doctor (~1250 m)',
        description: 'Balcón sobre el brazo Tronador del lago Mascardi, de aguas turquesa lechosas. Parada obligada.',
      },
      {
        lat: -41.2840,
        lon: -71.7775,
        name: 'Bosque de lengas',
        description: 'Largo tramo casi llano entre lengas altas y claros de pastizal. Cruces de arroyos menores.',
      },
      {
        lat: -41.2900,
        lon: -71.7810,
        name: 'Laguna Ilón (~1350 m)',
        description: 'Laguna entre lomadas verdes con refugio pequeño y zona de acampe en temporada. Base para el Cerro Bonete y la travesía al Refugio Rocca.',
      },
    ],
    parking: 'Estacionamiento en Pampa Linda. El camino de acceso funciona con horarios de mano única; planificar ida y vuelta.',
    access_notes: 'Desde Bariloche por Ruta 40 sur hasta el desvío de Villa Mascardi y camino de ripio a Pampa Linda (90 km, 2 h). Consultar horarios de mano única del camino antes de ir.',
    water_sources: 'Arroyos menores a lo largo del tramo alto y la laguna al final. Purificar antes de consumir.',
    camping_allowed: true,
    refugio: 'Refugio Ilón',
    round_trip: true,
  },

  // -------------------------------------------------------------------------
  // 16. Refugio Otto Meiling (Pampa Linda)
  // -------------------------------------------------------------------------
  {
    id: 'refugio-otto-meiling',
    name: 'Refugio Otto Meiling — Cerro Tronador',
    province: 'Río Negro',
    area: 'Parque Nacional Nahuel Huapi',
    subarea: 'Pampa Linda',
    region: 'patagonia-norte',
    activity: 'trekking',
    difficulty: 'dificil',
    distance_km: 27,
    elevation_gain_m: 1100,
    max_altitude_m: 2000,
    duration: { min: 8, max: 10, unit: 'horas' },
    coordinates: { lat: -41.2535, lon: -71.7755 },
    photo_uri:
      'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=800&q=80&fit=crop&auto=format',
    tags: ['refugio', 'glaciares', 'Tronador', 'filo', 'alta montaña', 'clásico Bariloche'],
    permits_required: false,
    best_season: 'Dic – Mar',
    description:
      'Ascenso desde Pampa Linda al Refugio Otto Meiling (2000 m), sobre el filo entre los glaciares Castaño Overa y Alerce del Tronador. Unos 13-14 km y 1000-1050 m de desnivel por tramo; la mayoría pernocta en el refugio.',
    trailhead: 'Pampa Linda (90 km al sudoeste de Bariloche)',
    source: 'barilochetrekking.com',
    long_description: `El Otto Meiling es el refugio de alta montaña por excelencia del Tronador y una de las excursiones más espectaculares de toda la Patagonia norte: se duerme a 2000 metros, sobre un filo rocoso encajado entre dos glaciares, con el macizo de tres cumbres rugiendo desprendimientos de hielo a lo largo de toda la noche. Es también la base histórica para los cursos de hielo y las ascensiones al Pico Argentino del Tronador.

La ruta parte de Pampa Linda y durante los dos primeros tercios sube por bosque de coihues y lengas, con señalización de carteles y marcas amarillas. La pendiente es sostenida pero regular, con un par de bifurcaciones señalizadas (mantener el rumbo al refugio) y buenos lugares de descanso en los claros, desde donde asoman las paredes del valle del río Castaño Overa.

El tercio final es otro mundo: el bosque queda atrás y el sendero gana el filo de la Motte, una cresta pedregosa y ventosa entre los glaciares Castaño Overa y Alerce. La sensación de caminar con hielo a ambos lados, el Nahuel Huapi al fondo y las cumbres del Tronador creciendo delante es única en la región. Con niebla o viento fuerte este tramo exige atención: no hay resguardo hasta el refugio.

El Refugio Otto Meiling (2000 m, CAB) ofrece comidas, literas y una terraza natural con uno de los atardeceres más celebrados de la Patagonia. La subida completa toma unas 5 horas (algo menos sin carga) y la bajada unas 3,5, por lo que hacerlo en el día es posible pero exigente: la mayoría pernocta. Desde el refugio salen paseos cortos al mirador del glaciar Castaño Overa y, para quienes contratan guía, caminatas por el hielo.`,
    gpxTrack: [
      { lat: -41.2535, lon: -71.7755, ele: 890 },
      { lat: -41.2490, lon: -71.7810, ele: 960 },
      { lat: -41.2440, lon: -71.7870, ele: 1040 },
      { lat: -41.2390, lon: -71.7930, ele: 1120 },
      { lat: -41.2340, lon: -71.7985, ele: 1200 },
      { lat: -41.2290, lon: -71.8040, ele: 1280 },
      { lat: -41.2240, lon: -71.8090, ele: 1360 },
      { lat: -41.2190, lon: -71.8140, ele: 1450 },
      { lat: -41.2140, lon: -71.8180, ele: 1550 },
      { lat: -41.2090, lon: -71.8215, ele: 1650 },
      { lat: -41.2040, lon: -71.8240, ele: 1750 },
      { lat: -41.1990, lon: -71.8260, ele: 1850 },
      { lat: -41.1950, lon: -71.8272, ele: 1930 },
      { lat: -41.1920, lon: -71.8280, ele: 2000 },
    ],
    namedWaypoints: [
      {
        lat: -41.2535,
        lon: -71.7755,
        name: 'Pampa Linda (890 m)',
        description: 'Punto de partida con guardaparques, hostería y estacionamiento. Registro de trekking obligatorio.',
      },
      {
        lat: -41.2340,
        lon: -71.7985,
        name: 'Bosque de coihues y lengas',
        description: 'Dos tercios de la ruta suben por bosque con carteles y marcas amarillas. Pendiente sostenida y regular.',
      },
      {
        lat: -41.2090,
        lon: -71.8215,
        name: 'Salida del bosque — filo de la Motte',
        description: 'El sendero gana la cresta pedregosa entre los glaciares Castaño Overa y Alerce. Viento frecuente; sin resguardo hasta el refugio.',
      },
      {
        lat: -41.1920,
        lon: -71.8280,
        name: 'Refugio Otto Meiling (2000 m)',
        description: 'Refugio del CAB entre dos glaciares, base de los cursos de hielo y las ascensiones al Tronador. Comidas, literas y acampe.',
      },
    ],
    parking: 'Estacionamiento en Pampa Linda. El camino de acceso funciona con horarios de mano única; planificar ida y vuelta.',
    access_notes: 'Desde Bariloche por Ruta 40 sur hasta el desvío de Villa Mascardi y camino de ripio a Pampa Linda (90 km, 2 h). En temporada alta hay traslados desde Bariloche. Consultar horarios de mano única del camino.',
    water_sources: 'Arroyos en el tramo de bosque. En el filo superior no hay agua hasta el refugio; llevar reserva.',
    camping_allowed: true,
    refugio: 'Refugio Otto Meiling (CAB)',
    round_trip: true,
  },

  // -------------------------------------------------------------------------
  // 17. Cerro Llao Llao
  // -------------------------------------------------------------------------
  {
    id: 'cerro-llao-llao',
    name: 'Cerro Llao Llao — Parque Municipal',
    province: 'Río Negro',
    area: 'Parque Municipal Llao Llao',
    subarea: 'Llao Llao',
    region: 'patagonia-norte',
    activity: 'trekking',
    difficulty: 'facil',
    distance_km: 8,
    elevation_gain_m: 225,
    max_altitude_m: 1050,
    duration: { min: 2, max: 3, unit: 'horas' },
    coordinates: { lat: -41.0400, lon: -71.5820 },
    photo_uri:
      'https://images.unsplash.com/photo-1469521669194-babb45599def?w=800&q=80&fit=crop&auto=format',
    tags: ['mirador', 'apto familias', 'Circuito Chico', 'bosque nativo', 'arrayanes', 'medio día'],
    permits_required: false,
    best_season: 'Todo el año',
    description:
      'El mirador más famoso del Circuito Chico: caminata fácil por el Parque Municipal Llao Llao hasta el cerrito Llao Llao (1050 m), con panorámica del Brazo de la Tristeza, la Isla Victoria y los cerros López y Capilla.',
    trailhead: 'Portada del Parque Municipal Llao Llao, Ruta 77 (cartel de madera)',
    source: 'barilochetrekking.com',
    long_description: `El Cerro Llao Llao es probablemente la caminata corta más popular de Bariloche, y con razón: por un sendero fácil de bosque se llega en una hora a un mirador de postal, con el lago Nahuel Huapi ramificándose en brazos azules entre penínsulas boscosas y los cerros López, Capilla y Millaqueo cerrando el horizonte. Para muchos visitantes es la primera —y más recordada— foto de la Patagonia andina.

El recorrido arranca en la portada del Parque Municipal Llao Llao, señalizada con un cartel de madera sobre la Ruta 77, pasado el hotel Llao Llao. El sendero avanza primero casi llano por bosque de coihues, con desvíos señalizados a la playita de Villa Tacul y al bosque de arrayanes de la península —ambos merecen la visita si sobra tiempo—. El último tramo es la única subida real: unos 20-30 minutos de pendiente sostenida en zigzag hasta la cumbre del cerrito.

Arriba hay tres miradores que se complementan: hacia el oeste el Brazo de la Tristeza y la Isla Victoria; hacia el norte el hotel Llao Llao con Puerto Pañuelo y el cerro Campanario detrás; hacia el sudoeste el cordón del López. Al atardecer la luz lateral sobre los brazos del lago produce los colores más intensos, aunque implica bajar con la última luz.

Es una salida ideal para familias con niños, para el día de llegada o para combinar con el resto del Circuito Chico en bicicleta. No hay agua en el recorrido y en verano la subida final puede dar calor: llevar botella. El parque es municipal y de acceso gratuito; los senderos cierran al anochecer.`,
    gpxTrack: [
      { lat: -41.0330, lon: -71.5710, ele: 825 },
      { lat: -41.0345, lon: -71.5740, ele: 830 },
      { lat: -41.0360, lon: -71.5765, ele: 840 },
      { lat: -41.0372, lon: -71.5785, ele: 855 },
      { lat: -41.0382, lon: -71.5800, ele: 890 },
      { lat: -41.0390, lon: -71.5810, ele: 940 },
      { lat: -41.0396, lon: -71.5816, ele: 1000 },
      { lat: -41.0400, lon: -71.5820, ele: 1050 },
    ],
    namedWaypoints: [
      {
        lat: -41.0330,
        lon: -71.5710,
        name: 'Portada Parque Municipal Llao Llao',
        description: 'Cartel de madera sobre la Ruta 77, pasado el hotel Llao Llao. Estacionamiento en la banquina.',
      },
      {
        lat: -41.0360,
        lon: -71.5765,
        name: 'Desvíos a Villa Tacul y arrayanes',
        description: 'Desvíos señalizados a la playa de Villa Tacul y al bosque de arrayanes de la península.',
      },
      {
        lat: -41.0390,
        lon: -71.5810,
        name: 'Zigzags finales',
        description: 'Única subida real del recorrido: 20-30 min de pendiente sostenida hasta la cumbre.',
      },
      {
        lat: -41.0400,
        lon: -71.5820,
        name: 'Miradores del Cerro Llao Llao (1050 m)',
        description: 'Tres miradores: Brazo de la Tristeza e Isla Victoria, hotel Llao Llao y Campanario, y cordón del López.',
      },
    ],
    parking: 'Banquina junto a la portada del parque sobre la Ruta 77. Se llena temprano en temporada alta.',
    access_notes: 'Desde Bariloche por Av. Bustillo y Ruta 77 (Circuito Chico) hasta pasar el hotel Llao Llao; la portada del parque está señalizada (27 km, 40 min). Bus línea 20 hasta Puerto Pañuelo y 1,5 km a pie.',
    water_sources: 'No hay fuentes de agua en el recorrido. Llevar botella propia.',
    camping_allowed: false,
    round_trip: true,
  },

  // -------------------------------------------------------------------------
  // 18. Cascada de los Duendes (Lago Gutiérrez)
  // -------------------------------------------------------------------------
  {
    id: 'cascada-duendes',
    name: 'Cascada de los Duendes y Mirador Lago Gutiérrez',
    province: 'Río Negro',
    area: 'Parque Nacional Nahuel Huapi',
    subarea: 'Bariloche',
    region: 'patagonia-norte',
    activity: 'trekking',
    difficulty: 'facil',
    distance_km: 3,
    elevation_gain_m: 80,
    max_altitude_m: 880,
    duration: { min: 1, max: 2, unit: 'horas' },
    coordinates: { lat: -41.1660, lon: -71.4120 },
    photo_uri:
      'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=800&q=80&fit=crop&auto=format',
    tags: ['cascada', 'apto familias', 'sendero autoguiado', 'lago Gutiérrez', 'niños', 'corto'],
    permits_required: false,
    best_season: 'Todo el año',
    description:
      'Paseo corto y autoguiado desde la seccional de guardaparques del lago Gutiérrez: la Cascada de los Duendes sobre el arroyo Pescadero y, con un desvío de 1 km, el mirador del lago. Ideal con niños.',
    trailhead: 'Seccional de Guardaparques Lago Gutiérrez, Villa Los Coihues',
    source: 'barilochetrekking.com',
    long_description: `La Cascada de los Duendes es la caminata iniciática de Bariloche: corta, segura, señalizada y con premio garantizado. Parte de la seccional de guardaparques del lago Gutiérrez, en Villa Los Coihues, y en unos 600 metros de sendero ancho y casi llano llega a la cascada sobre el arroyo Pescadero, una caída modesta pero encantadora que salta entre bloques cubiertos de musgo en plena penumbra del bosque.

El sendero es autoguiado, con carteles interpretativos sobre el bosque andino-patagónico: coihues, cipreses de la cordillera, radales y el sotobosque de caña colihue. Es una introducción perfecta al ecosistema del parque para quien recién llega, y una salida ideal para familias con niños pequeños o para tardes de clima inestable, porque el bosque protege del viento y de la llovizna.

Desde la cascada, un desvío señalizado de aproximadamente 1 km sube al mirador del lago Gutiérrez, un balcón rocoso con vista al lago completo y al macizo del Catedral detrás. Este tramo tiene algo más de pendiente pero sigue siendo accesible para cualquier persona en condiciones básicas de caminar en montaña.

El paseo se combina naturalmente con el sendero costero a Playa Muñoz, que parte de la misma seccional, o con una tarde de playa en Villa Los Coihues. En invierno, con nieve, el bosque y la cascada congelada tienen un encanto particular y el recorrido sigue siendo transitable con calzado adecuado.`,
    gpxTrack: [
      { lat: -41.1660, lon: -71.4120, ele: 800 },
      { lat: -41.1670, lon: -71.4135, ele: 810 },
      { lat: -41.1680, lon: -71.4150, ele: 820 },
      { lat: -41.1690, lon: -71.4162, ele: 830 },
      { lat: -41.1700, lon: -71.4172, ele: 840 },
      { lat: -41.1712, lon: -71.4185, ele: 865 },
      { lat: -41.1720, lon: -71.4195, ele: 880 },
    ],
    namedWaypoints: [
      {
        lat: -41.1660,
        lon: -71.4120,
        name: 'Seccional Guardaparques Lago Gutiérrez',
        description: 'Inicio del sendero autoguiado frente a la oficina de guardaparques, en Villa Los Coihues.',
      },
      {
        lat: -41.1690,
        lon: -71.4162,
        name: 'Cascada de los Duendes',
        description: 'Caída del arroyo Pescadero entre bloques con musgo, a ~600 m del inicio por sendero ancho y llano.',
      },
      {
        lat: -41.1720,
        lon: -71.4195,
        name: 'Mirador Lago Gutiérrez',
        description: 'Balcón rocoso con vista al lago completo y al macizo del Catedral, a ~1 km de la cascada.',
      },
    ],
    parking: 'Estacionamiento en Villa Los Coihues, cerca de la seccional de guardaparques.',
    access_notes: 'Desde Bariloche por Ruta 82 hacia el lago Gutiérrez y acceso a Villa Los Coihues (10 km, 15 min). Bus línea 50 desde el centro hasta Villa Los Coihues.',
    water_sources: 'Arroyo Pescadero junto al sendero. Llevar agua propia para el paseo.',
    camping_allowed: false,
    round_trip: true,
  },
];

// ---------------------------------------------------------------------------
// Quick-lookup set
// ---------------------------------------------------------------------------

export const ALL_BARILOCHE_IDS: Set<string> = new Set(BARILOCHE_TRAILS.map((t) => t.id));
