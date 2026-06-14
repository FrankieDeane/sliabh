/**
 * Bariloche extended trail data — sourced from barilochetrekking.com style content.
 * All trails located in Parque Nacional Nahuel Huapi, Río Negro, Argentina.
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
// Helper type for duration (re-used from ArgentinaTrail structure)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// 15 detailed Bariloche trails
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
    elevation_gain_m: 1000,
    max_altitude_m: 1700,
    duration: { min: 6, max: 8, unit: 'horas' },
    coordinates: { lat: -41.1855, lon: -71.4499 },
    photo_uri:
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80&fit=crop&auto=format',
    tags: ['refugio', 'laguna', 'escalada en roca', 'agujas graníticas', 'bosque nativo'],
    permits_required: false,
    best_season: 'Nov – Abr',
    description:
      'Trekking desde la base de Cerro Catedral hasta el Refugio Frey a orillas de la Laguna Schmoll. Uno de los destinos más icónicos de Bariloche, frecuentado por escaladores de todo el mundo.',
    trailhead: 'Base Cerro Catedral (Bariloche)',
    source: 'barilochetrekking.com',
    long_description: `El sendero al Refugio Frey es sin duda el trek más emblemático del entorno de Bariloche. La ruta parte del estacionamiento de la base de Cerro Catedral (1050 m) y penetra de inmediato en un denso bosque de coihues y ñires que ofrece sombra y humedad en los primeros kilómetros. El camino asciende de manera constante cruzando algunos arroyos tributarios y atravesando claros con vistas ocasionales a los cerros circundantes, hasta llegar al sector conocido como la Cancha de Fútbol, una pampa alta de suelo arenoso donde los escaladores sueltan sus mochilas para organizar sus cordadas.

A partir de la Cancha de Fútbol el terreno se vuelve más técnico. El sendero trepa entre bloques de granito, superando pasos que requieren el uso de las manos en uno o dos puntos claves. Las agujas de granito gris del Grupo Frey van apareciendo en el horizonte como dedos de piedra que perforan el cielo patagónico, y la sensación de encontrarse en un anfiteatro natural de escala monumental crece con cada metro de altitud ganado. La variedad de tonos en la roca —gris plata, óxido y blanco— cambia según el ángulo de la luz solar.

La llegada a la Laguna Schmoll (1700 m) resulta siempre impactante: las aguas de un azul profundo e inmóvil reflejan las torres de granito que la rodean, y el Refugio Frey, gestionado por el Club Andino Bariloche, aparece discretamente a la orilla sur. El refugio ofrece comidas calientes, alojamiento en literas y una terraza desde la que los atardeceres sobre el agua son memorables. En temporada de escalada la laguna se puebla de coloridas carpas y el murmullo de cuerdas y mosquetones llena el aire de madrugada.

El regreso por el mismo sendero permite apreciar el paisaje con luz diferente y detenerse a explorar las piletas de agua cristalina entre los bloques graníticos. Para los más curiosos, el desvío hacia la Laguna Cerro Catedral o hacia el pie de las vías de escalada añade una hora extra y perspectivas únicas de las paredes que han hecho famoso a Frey en toda Sudamérica.`,
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
        name: 'Cruce del arroyo Rucaco',
        description: 'Primer arroyo de importancia; buena fuente de agua. El sendero cruza sobre troncos o piedras según el caudal.',
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
        name: 'Refugio Frey / Laguna Schmoll',
        description: 'Refugio del CAB a 1700 m con alojamiento, comidas y terraza sobre la laguna. Centro neurálgico de la escalada patagónica.',
      },
    ],
    parking: 'Estacionamiento pago en la base de Cerro Catedral (Villa Catedral), con capacidad amplia y vigilancia en temporada alta.',
    access_notes: 'Desde Bariloche tomar la Ruta 82 (Av. de los Pioneros) hacia el oeste por 18 km hasta Villa Catedral. En temporada de verano circulan micros urbanos de línea 55 desde el centro. En auto: 25 min desde el centro.',
    water_sources: 'Arroyo Rucaco al inicio (km 3), varios hilos de agua al cruzar los bloques graníticos (km 7–8), y agua limpia en la Laguna Schmoll. El refugio también vende agua filtrada.',
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
    distance_km: 22,
    elevation_gain_m: 1300,
    max_altitude_m: 2076,
    duration: { min: 8, max: 10, unit: 'horas' },
    coordinates: { lat: -41.0817, lon: -71.5133 },
    photo_uri:
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80&fit=crop&auto=format',
    tags: ['cumbre', 'panorama', 'Nahuel Huapi', 'Tronador', 'refugio', 'scramble'],
    permits_required: false,
    best_season: 'Dic – Mar',
    description:
      'Ascenso al Cerro López (2076 m) pasando por el Refugio López. Vistas 360° del lago Nahuel Huapi, el Tronador y la estepa patagónica. Tramo final técnico con algo de scramble.',
    trailhead: 'Ruta 79 km 20 (Bariloche)',
    source: 'barilochetrekking.com',
    long_description: `El Cerro López es la cumbre de mayor altitud en acceso directo desde Bariloche y recompensa al senderista con una de las panorámicas más completas de la región de los lagos. El sendero parte desde la Ruta 79 en su kilómetro 20, adentrándose en un coihuar maduro donde la humedad ambiental y los líquenes colgantes crean un ambiente de bosque templado austral casi onírico. Durante la primera hora el camino es cómodo y bien marcado, con algunos sectores de raíces expuestas que conviene pisar con cuidado.

Pasados los primeros 600 metros de desnivel el bosque cede ante arbustos de altura y pasturas alpinas. El Refugio López aparece en la ladera sur a 1626 metros de altitud, un refugio de madera administrado por el CAB que ofrece almuerzo, infusiones calientes y vistas soberbias al lago Nahuel Huapi en toda su extensión. En días claros el volcán Tronador (3491 m) domina el horizonte al sudoeste, sus glaciares brillando bajo el sol patagónico, y la silueta del Cerro Tronador parece irreal en su escala.

Desde el refugio, el sendero a la cumbre se vuelve netamente más desafiante. El tramo final de 450 metros de desnivel adicional transcurre sobre roca viva, con pasajes de scramble de grado I–II donde las manos se apoyan en la roca para ganar estabilidad. La cresta final expuesta al viento requiere precaución: en condiciones de viento sur fuerte conviene evaluar la conveniencia de continuar. La cima (2076 m) es una pequeña plataforma rocosa desde la cual se ven simultáneamente el lago Nahuel Huapi, el lago Gutiérrez, el lago Moreno, el lago Mascardi y, en días muy despejados, los volcanes chilenos al norte y al sur.

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
      { lat: -41.0928, lon: -71.5275, ele: 1626 },
      { lat: -41.0933, lon: -71.5283, ele: 1700 },
      { lat: -41.0938, lon: -71.5290, ele: 1780 },
      { lat: -41.0942, lon: -71.5295, ele: 1850 },
      { lat: -41.0946, lon: -71.5299, ele: 1930 },
      { lat: -41.0949, lon: -71.5299, ele: 2010 },
      { lat: -41.0950, lon: -71.5300, ele: 2076 },
    ],
    namedWaypoints: [
      {
        lat: -41.0817,
        lon: -71.5133,
        name: 'Trailhead Ruta 79',
        description: 'Inicio del sendero sobre la ruta 79. Hay una pequeña área de estacionamiento informal y un cartel del parque.',
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
        name: 'Refugio López (1626 m)',
        description: 'Refugio del CAB con vistas al lago Nahuel Huapi. Ofrece almuerzo y bebidas calientes. Punto de control y descanso obligado.',
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
        name: 'Cima Cerro López (2076 m)',
        description: 'Cumbre con panorama 360°: 5 lagos y el Tronador visibles en días claros. Vientos pueden ser intensos.',
      },
    ],
    parking: 'Área informal de estacionamiento en el margen de la Ruta 79 km 20. Caben aproximadamente 15 vehículos. No hay guardacoches.',
    access_notes: 'Desde el centro de Bariloche tomar la Ruta 237 dirección oeste y luego la Ruta 79 bordeando el lago Moreno. La distancia desde el centro es de aproximadamente 20 km (30 min en auto). No hay transporte público directo al trailhead; se puede tomar el bus a Llao Llao y caminar 2 km.',
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
    name: 'Cerro Tronador — Glaciar Negro',
    province: 'Río Negro',
    area: 'Parque Nacional Nahuel Huapi',
    subarea: 'Pampa Linda',
    region: 'patagonia-norte',
    activity: 'trekking',
    difficulty: 'moderado',
    distance_km: 26,
    elevation_gain_m: 750,
    max_altitude_m: 1800,
    duration: { min: 7, max: 9, unit: 'horas' },
    coordinates: { lat: -41.3298, lon: -71.8879 },
    photo_uri:
      'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80&fit=crop&auto=format',
    tags: ['glaciar', 'Tronador', 'cascada', 'aluviones', 'Garganta del Diablo', 'bosque nativo'],
    permits_required: false,
    best_season: 'Dic – Mar',
    description:
      'Sendero hasta los aluviones del Glaciar Negro al pie del Cerro Tronador (3491 m). Se pasa por la imponente Garganta del Diablo, cascada de deshielo que ruge durante el día.',
    trailhead: 'Pampa Linda (90 km al sur-oeste de Bariloche)',
    source: 'barilochetrekking.com',
    long_description: `El Glaciar Negro es uno de los glaciares de valle más accesibles de la Patagonia andina y el Cerro Tronador su formidable telón de fondo. La ruta comienza en Pampa Linda, un puesto de guardaparques y refugio en el corazón del parque, donde una pradera abierta y el rugido lejano de los derrumbes de hielo ya anticipan la naturaleza descomunal del lugar. El sendero inicial atraviesa un bosque mixto de coihues y arrayanes que humidifica el aire y amortigua los sonidos del exterior; la sensación de adentrarse en un mundo distinto se instala desde los primeros pasos.

Alrededor de los 5 km aparece la Garganta del Diablo, una cascada de fusión glaciar que precipita desde más de 100 metros de altura sobre paredes de roca oscura. El estruendo es tal que la comunicación verbal se vuelve difícil; el spray frío que genera crea un microclima propio y reviste las piedras cercanas de musgos y helechos imposiblemente verdes. La parada en este punto es obligada: conviene alejarse del sendero y sentarse sobre los bloques erráticos para absorber el espectáculo sin prisa.

El camino continúa ascendiendo por la morrena lateral del glaciar, un terreno inestable de bloques de granito y sedimento glaciar oscuro —el "negro" que da nombre al glaciar proviene de la capa de detritos rocosos que cubre el hielo— hasta alcanzar el mirador superior desde donde se aprecia el frente activo del glaciar. Grietas de color azul eléctrico son visibles en el interior del hielo expuesto. Desde aquí los tres picos del Tronador (Internacional, Argentino y Chileno) se elevan sobre el glaciar con una majestuosidad que pocas cumbres patagónicas igualan.

El regreso por la misma ruta permite completar la jornada antes del cierre del portón de acceso a Pampa Linda, que se cierra a las 18:00 h en temporada alta. Se recomienda llevar ropa de abrigo incluso en verano, ya que el microclima del glaciar puede bajar la temperatura 10 °C respecto al valle.`,
    gpxTrack: [
      { lat: -41.3298, lon: -71.8879, ele: 1050 },
      { lat: -41.3312, lon: -71.8900, ele: 1075 },
      { lat: -41.3325, lon: -71.8920, ele: 1100 },
      { lat: -41.3338, lon: -71.8940, ele: 1125 },
      { lat: -41.3352, lon: -71.8958, ele: 1150 },
      { lat: -41.3365, lon: -71.8970, ele: 1175 },
      { lat: -41.3378, lon: -71.8980, ele: 1200 },
      { lat: -41.3390, lon: -71.8985, ele: 1240 },
      { lat: -41.3405, lon: -71.8988, ele: 1280 },
      { lat: -41.3418, lon: -71.8992, ele: 1330 },
      { lat: -41.3430, lon: -71.8997, ele: 1380 },
      { lat: -41.3442, lon: -71.9010, ele: 1430 },
      { lat: -41.3455, lon: -71.9030, ele: 1480 },
      { lat: -41.3468, lon: -71.9055, ele: 1520 },
      { lat: -41.3480, lon: -71.9075, ele: 1560 },
      { lat: -41.3492, lon: -71.9090, ele: 1620 },
      { lat: -41.3500, lon: -71.9100, ele: 1800 },
    ],
    namedWaypoints: [
      {
        lat: -41.3298,
        lon: -71.8879,
        name: 'Pampa Linda',
        description: 'Punto de partida con guardaparques, refugio Tronador y estacionamiento. Portón de acceso cierra a las 18:00 h.',
      },
      {
        lat: -41.3365,
        lon: -71.8970,
        name: 'Bosque de coihues y arrayanes',
        description: 'Tramo de bosque húmedo con arrayanes de corteza naranja. El sendero es ancho y bien marcado.',
      },
      {
        lat: -41.3400,
        lon: -71.8983,
        name: 'Garganta del Diablo',
        description: 'Cascada de fusión glaciar de más de 100 m de caída. Punto icónico y de descanso obligado.',
      },
      {
        lat: -41.3455,
        lon: -71.9030,
        name: 'Morrena lateral del glaciar',
        description: 'Terreno inestable de detritos oscuros sobre el hielo. Se aprecia el contraste entre el glaciar y la vegetación lateral.',
      },
      {
        lat: -41.3500,
        lon: -71.9100,
        name: 'Mirador Glaciar Negro',
        description: 'Mirador superior con vistas al frente activo del glaciar y las tres cumbres del Tronador. Grietas azules visibles en el hielo.',
      },
    ],
    parking: 'Estacionamiento en Pampa Linda (pago en temporada). Acceso vehicular sujeto a horario: portón abre a las 9:00 h y cierra a las 18:00 h. El portón de ingreso a Pampa Linda está en la bifurcación km 64 desde Bariloche.',
    access_notes: 'Desde Bariloche tomar la Ruta 258 sur hasta Villa Mascardi (35 km) y luego el camino de ripio hacia Pampa Linda (otros 55 km). El trayecto completo son aproximadamente 90 km y 1:30 h de conducción. En temporada alta (enero–febrero) hay micros directos desde la Terminal de Bariloche.',
    water_sources: 'Abundante agua en arroyos a lo largo del sendero y especialmente al pie de la Garganta del Diablo. No recomendable tomar agua aguas abajo del glaciar sin purificar por sedimento en suspensión.',
    camping_allowed: false,
    round_trip: true,
  },

  // -------------------------------------------------------------------------
  // 4. Laguna Negra desde Cerro Catedral
  // -------------------------------------------------------------------------
  {
    id: 'laguna-negra-catedral',
    name: 'Laguna Negra desde Cerro Catedral',
    province: 'Río Negro',
    area: 'Parque Nacional Nahuel Huapi',
    subarea: 'Bariloche',
    region: 'patagonia-norte',
    activity: 'trekking',
    difficulty: 'moderado',
    distance_km: 15,
    elevation_gain_m: 850,
    max_altitude_m: 1580,
    duration: { min: 5, max: 7, unit: 'horas' },
    coordinates: { lat: -41.1900, lon: -71.4800 },
    photo_uri:
      'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=80&fit=crop&auto=format',
    tags: ['laguna alpina', 'sobre la línea arbórea', 'granito', 'soledad', 'Catedral'],
    permits_required: false,
    best_season: 'Dic – Mar',
    description:
      'Ruta hacia la Laguna Negra, un lago de alta montaña sobre la línea arbórea al oeste del macizo de Catedral. Terreno técnico en bloques de granito y vistas espectaculares.',
    trailhead: 'Refugio Piedritas, base oeste de Cerro Catedral',
    source: 'barilochetrekking.com',
    long_description: `La Laguna Negra es uno de los secretos mejor guardados del macizo del Cerro Catedral. A diferencia de la concurrida ruta al Refugio Frey, este sendero atrae a un número mucho menor de excursionistas, lo que garantiza una experiencia de montaña más íntima y silenciosa. El punto de partida es el Refugio Piedritas, al oeste de la base de Catedral, desde donde el sendero se interna en coihuar abierto ascendiendo de modo progresivo durante la primera hora.

A medida que se gana altura el paisaje muda drásticamente: los árboles se achaparran primero, luego desaparecen por completo, y el caminante se encuentra en una zona de arbustos bajos, pasturas de puna baja y enormes bloques de granito depositados por el glaciar cuaternario que ocupó este circo. La luz patagónica, sin filtros arbóreos, transforma cada nube en un espectáculo dinámico de sombras sobre el paisaje desnudo.

El sector más técnico del sendero se encuentra en el km 5, donde se atraviesa una zona de bloques donde el camino se pierde entre las rocas y hay que leer el terreno o seguir los hitos de piedras apiladas (cairns). Un par de pasos cortos requieren el uso de las manos para trepar aunque sin exposición seria. La recompensa llega al superar el último escalón de granito: la Laguna Negra aparece de improviso, oscura y especular, rodeada por paredes grises que se elevan varios centenares de metros. El nombre le viene del color oscuro que toman sus aguas al reflejar el cielo y las rocas sombrías.

Sentado en la orilla norte de la laguna con vistas a los cerros circundantes es posible apreciar la escala real del trabajo geológico que modeló este paisaje durante las glaciaciones del Pleistoceno. El silencio solo se rompe por el viento y, ocasionalmente, por el estruendo de alguna pequeña avalancha de rocas en las paredes altas.`,
    gpxTrack: [
      { lat: -41.1900, lon: -71.4800, ele: 1100 },
      { lat: -41.1912, lon: -71.4830, ele: 1160 },
      { lat: -41.1922, lon: -71.4870, ele: 1230 },
      { lat: -41.1930, lon: -71.4910, ele: 1300 },
      { lat: -41.1938, lon: -71.4950, ele: 1360 },
      { lat: -41.1944, lon: -71.4990, ele: 1410 },
      { lat: -41.1950, lon: -71.5030, ele: 1460 },
      { lat: -41.1955, lon: -71.5075, ele: 1500 },
      { lat: -41.1960, lon: -71.5120, ele: 1535 },
      { lat: -41.1964, lon: -71.5165, ele: 1560 },
      { lat: -41.1966, lon: -71.5210, ele: 1575 },
      { lat: -41.1967, lon: -71.5283, ele: 1580 },
    ],
    namedWaypoints: [
      {
        lat: -41.1900,
        lon: -71.4800,
        name: 'Refugio Piedritas',
        description: 'Punto de partida en el flanco oeste de Cerro Catedral. Pequeño refugio informal; buena referencia de inicio.',
      },
      {
        lat: -41.1930,
        lon: -71.4910,
        name: 'Límite de la vegetación',
        description: 'Zona de transición donde los coihues se achaparran hasta desaparecer. Las vistas a los cerros se abren desde aquí.',
      },
      {
        lat: -41.1950,
        lon: -71.5030,
        name: 'Campo de bloques técnico',
        description: 'Sector donde el sendero se pierde entre bloques de granito. Seguir cairns. Dos pasos cortos requieren manos.',
      },
      {
        lat: -41.1967,
        lon: -71.5283,
        name: 'Laguna Negra (1580 m)',
        description: 'Lago de alta montaña de aguas oscuras y paredes grises. Excelente punto de almuerzo y fotografía.',
      },
    ],
    parking: 'Usar el mismo estacionamiento de la base de Cerro Catedral (Villa Catedral) y caminar 20 min hasta el Refugio Piedritas.',
    access_notes: 'Acceso idéntico al Refugio Frey: Ruta 82 desde Bariloche hasta Villa Catedral (18 km). Desde la base seguir señalización hacia el Refugio Piedritas por el flanco oeste.',
    water_sources: 'Arroyos de deshielo durante el trayecto de ascenso. La laguna misma tiene agua potable; filtrar o purificar igualmente.',
    camping_allowed: false,
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
    distance_km: 4,
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
    elevation_gain_m: 1025,
    max_altitude_m: 1405,
    duration: { min: 5, max: 7, unit: 'horas' },
    coordinates: { lat: -41.1233, lon: -71.3700 },
    photo_uri:
      'https://images.unsplash.com/photo-1518623489648-a173ef7824f3?w=800&q=80&fit=crop&auto=format',
    tags: ['vista 360', 'Bariloche', 'distrito de lagos', 'acceso desde la ciudad', 'bosque'],
    permits_required: false,
    best_season: 'Oct – May',
    description:
      'Ascenso al Cerro Otto (1405 m) directamente desde Bariloche, sin necesidad de vehículo. Vista 360° del distrito lacustre y las montañas circundantes.',
    trailhead: 'Calle Bustillo km 6, salida oeste de Bariloche',
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
        name: 'Inicio Av. Bustillo km 6',
        description: 'Entrada al sendero desde la avenida. Cartel del parque con mapa de la ruta. Parada de bus cercana.',
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
    parking: 'No se recomienda ir en auto: el acceso está diseñado para peatones. Si se va en auto, hay espacio informal en Av. Bustillo km 6. Alternativa: dejar el auto en el centro y comenzar la caminata desde allí.',
    access_notes: 'Directamente accesible desde el centro de Bariloche en 20 min a pie hasta el inicio del sendero (Av. Bustillo km 6). Buses de línea 10 y 21 pasan por Bustillo.',
    water_sources: 'No hay fuentes de agua en el trayecto. Llevar mínimo 1.5 litros. En la cima la confitería vende bebidas.',
    camping_allowed: false,
    round_trip: true,
  },

  // -------------------------------------------------------------------------
  // 7. Cascada de los Cántaros (circuito)
  // -------------------------------------------------------------------------
  {
    id: 'cascada-cantaros',
    name: 'Cascada de los Cántaros — Circuito',
    province: 'Río Negro',
    area: 'Parque Nacional Nahuel Huapi',
    subarea: 'Llao Llao',
    region: 'patagonia-norte',
    activity: 'trekking',
    difficulty: 'facil',
    distance_km: 8,
    elevation_gain_m: 350,
    max_altitude_m: 950,
    duration: { min: 3, max: 4, unit: 'horas' },
    coordinates: { lat: -41.0400, lon: -71.5650 },
    photo_uri:
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80&fit=crop&auto=format',
    tags: ['cascada', 'arrayán', 'bosque nativo', 'Llao Llao', 'lago', 'Brazo de la Tristeza'],
    permits_required: false,
    best_season: 'Oct – Abr',
    description:
      'Circuito por el bosque de arrayanes de Llao Llao hasta la Cascada de los Cántaros, con vistas al Brazo de la Tristeza del lago Nahuel Huapi.',
    trailhead: 'Puerto Pañuelo / Hotel Llao Llao',
    source: 'barilochetrekking.com',
    long_description: `El circuito de la Cascada de los Cántaros es quizás la joya escondida del bosque de Llao Llao. El sendero parte desde el sector del Puerto Pañuelo, donde el barco patagónico de cruce a Chile hace escala, y penetra de inmediato en un bosque de arrayanes que es de los más representativos de la Patagonia andina. El arrayán (Luma apiculata) se reconoce por su corteza de color naranja-canela, lustrosa y fría al tacto, y su presencia masiva convierte el tramo inicial de la ruta en un túnel vegetal único en el mundo.

A medida que el sendero asciende suavemente por las lomadas del Parque Municipal Llao Llao las vistas al Brazo de la Tristeza —el brazo sur del lago Nahuel Huapi— comienzan a aparecer entre la vegetación. La masa de agua azul intensa enmarcada por bosques oscuros es una de las fotografías más reproducidas de la Patagonia. Los miradores informales sobre la costa permiten apreciar tanto el lago como los cerros nevados al fondo.

La cascada de los Cántaros (950 m) es una caída de agua de unos 30 metros que se precipita por una pared de basalto negro. En primavera, con el deshielo, el caudal es máximo y el ruido del agua se escucha desde los 200 metros de distancia. En verano la caída se reduce pero no pierde su encanto. La vegetación alrededor de la base de la cascada es especialmente exuberante: helechos de gran tamaño, musgos de distintos tonos verdes y flores silvestres patagónicas que buscan la humedad permanente del spray.

El regreso del circuito discurre por el lado opuesto de la lomada, con vistas distintas y algo de descenso más directo. Es ideal terminarlo con un café o mate en el Hotel Llao Llao —uno de los hoteles más elegantes de Sudamérica— cuya vista al lago desde la terraza es el broche perfecto para la excursión.`,
    gpxTrack: [
      { lat: -41.0400, lon: -71.5650, ele: 780 },
      { lat: -41.0415, lon: -71.5630, ele: 800 },
      { lat: -41.0432, lon: -71.5608, ele: 820 },
      { lat: -41.0448, lon: -71.5590, ele: 845 },
      { lat: -41.0463, lon: -71.5575, ele: 870 },
      { lat: -41.0477, lon: -71.5560, ele: 895 },
      { lat: -41.0490, lon: -71.5548, ele: 920 },
      { lat: -41.0503, lon: -71.5538, ele: 940 },
      { lat: -41.0518, lon: -71.5530, ele: 950 },
      { lat: -41.0530, lon: -71.5535, ele: 940 },
      { lat: -41.0525, lon: -71.5550, ele: 920 },
      { lat: -41.0515, lon: -71.5568, ele: 895 },
      { lat: -41.0500, lon: -71.5585, ele: 865 },
      { lat: -41.0480, lon: -71.5605, ele: 835 },
      { lat: -41.0455, lon: -71.5625, ele: 810 },
      { lat: -41.0427, lon: -71.5645, ele: 790 },
      { lat: -41.0400, lon: -71.5650, ele: 780 },
    ],
    namedWaypoints: [
      {
        lat: -41.0400,
        lon: -71.5650,
        name: 'Puerto Pañuelo',
        description: 'Punto de partida. Muelle de embarcaciones turísticas y de cruce a Chile. Inicio del sendero señalizado.',
      },
      {
        lat: -41.0432,
        lon: -71.5608,
        name: 'Bosque de arrayanes',
        description: 'Tramo denso de arrayanes con corteza naranja característica. Fotografía inmejorable.',
      },
      {
        lat: -41.0477,
        lon: -71.5560,
        name: 'Mirador Brazo de la Tristeza',
        description: 'Vista al brazo sur del lago Nahuel Huapi con los cerros nevados al fondo. Uno de los miradores más fotografiados de la región.',
      },
      {
        lat: -41.0518,
        lon: -71.5530,
        name: 'Cascada de los Cántaros',
        description: 'Cascada de 30 m sobre pared de basalto negro. Microclima húmedo con helechos y musgos.',
      },
    ],
    parking: 'Estacionamiento en Puerto Pañuelo (gratuito, limitado). Alternativa: estacionar en el hotel Llao Llao o en el centro de Llao Llao.',
    access_notes: 'Tomar la Ruta 77 circuito chico/grande desde Bariloche hasta Llao Llao (25 km, 30 min). El bus línea 20 desde la Terminal llega hasta Llao Llao.',
    water_sources: 'El arroyo que alimenta la cascada tiene agua limpia. No hay otras fuentes en el circuito. Llevar agua propia.',
    camping_allowed: false,
    round_trip: false,
  },

  // -------------------------------------------------------------------------
  // 8. Laguna Los Témpanos desde Pampa Linda
  // -------------------------------------------------------------------------
  {
    id: 'laguna-tempanos',
    name: 'Laguna Los Témpanos desde Pampa Linda',
    province: 'Río Negro',
    area: 'Parque Nacional Nahuel Huapi',
    subarea: 'Pampa Linda',
    region: 'patagonia-norte',
    activity: 'trekking',
    difficulty: 'moderado',
    distance_km: 18,
    elevation_gain_m: 600,
    max_altitude_m: 1400,
    duration: { min: 5, max: 7, unit: 'horas' },
    coordinates: { lat: -41.3298, lon: -71.8879 },
    photo_uri:
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80&fit=crop&auto=format',
    tags: ['glaciar colgante', 'témpanos', 'laguna glaciar', 'remoto', 'Tronador', 'prístino'],
    permits_required: false,
    best_season: 'Dic – Mar',
    description:
      'Ruta hasta la Laguna Los Témpanos, una laguna glaciar con témpanos flotantes desprendidos del glaciar colgante del Tronador. Acceso remoto y muy bajo tráfico.',
    trailhead: 'Pampa Linda (90 km al sur-oeste de Bariloche)',
    source: 'barilochetrekking.com',
    long_description: `La Laguna Los Témpanos es uno de los rincones más espectaculares y menos visitados del Parque Nacional Nahuel Huapi. Su nombre lo dice todo: en sus aguas de un verde azulado fluorescente flotan pequeños bloques de hielo desprendidos del glaciar colgante que desciende desde las paredes del Tronador directamente hacia la laguna. El espectáculo de los témpanos a la deriva, de dimensiones modestas pero de un azul celeste intenso, es surrealista en medio del bosque andino-patagónico.

El sendero parte desde Pampa Linda, el mismo punto de partida que para el Glaciar Negro, pero toma una dirección distinta hacia el sudoeste, internándose en un bosque de coihues y tepuales que en algunos tramos bordea el río Alerce. El terreno es relativamente suave durante los primeros 6 km, con algunos cruces de arroyos en piedras o troncos. El bosque aquí es especialmente diverso: junto a los coihues aparecen notros de flores rojas, maitenes y, en los sectores más húmedos, espesos pajonales de caña.

A partir de los 7 km la pendiente aumenta y el sendero se vuelve más solitario, evidencia de que son pocos los excursionistas que van más allá del Glaciar Negro. El sonido del río Alerce crece en volumen a medida que la ruta se acerca a sus fuentes glaciares. El último kilómetro antes de la laguna traversa un campo de morrenas donde los bloques de roca ennegrecida por los sedimentos glaciares crean un paisaje casi lunar.

La orilla de la Laguna Los Témpanos recompensa cada esfuerzo: el color del agua cambia de verde esmeralda a azul celeste según la posición del sol, los témpanos flotan silenciosamente y el glaciar colgante que los origina se ve suspendido en las paredes grises del Tronador, listo para dejar caer su siguiente bloque con un estruendo que llega hasta la orilla minutos después del impacto visual.`,
    gpxTrack: [
      { lat: -41.3298, lon: -71.8879, ele: 1050 },
      { lat: -41.3310, lon: -71.8910, ele: 1075 },
      { lat: -41.3323, lon: -71.8942, ele: 1100 },
      { lat: -41.3337, lon: -71.8972, ele: 1125 },
      { lat: -41.3350, lon: -71.9002, ele: 1150 },
      { lat: -41.3363, lon: -71.9035, ele: 1175 },
      { lat: -41.3377, lon: -71.9068, ele: 1200 },
      { lat: -41.3390, lon: -71.9100, ele: 1230 },
      { lat: -41.3403, lon: -71.9130, ele: 1260 },
      { lat: -41.3415, lon: -71.9162, ele: 1290 },
      { lat: -41.3428, lon: -71.9195, ele: 1320 },
      { lat: -41.3440, lon: -71.9225, ele: 1350 },
      { lat: -41.3452, lon: -71.9252, ele: 1375 },
      { lat: -41.3460, lon: -71.9267, ele: 1400 },
      { lat: -41.3467, lon: -71.9267, ele: 1400 },
    ],
    namedWaypoints: [
      {
        lat: -41.3298,
        lon: -71.8879,
        name: 'Pampa Linda',
        description: 'Punto de partida compartido con la ruta al Glaciar Negro. Tomar el sendero señalizado hacia el sudoeste para Los Témpanos.',
      },
      {
        lat: -41.3350,
        lon: -71.9002,
        name: 'Orilla del río Alerce',
        description: 'El sendero bordea el río Alerce de aguas color turquesa. Buena fuente de agua.',
      },
      {
        lat: -41.3403,
        lon: -71.9130,
        name: 'Cruce de arroyos glaciares',
        description: 'Tres arroyos pequeños en rápida sucesión. En épocas de deshielo el caudal puede ser alto; usar las piedras de cruce.',
      },
      {
        lat: -41.3440,
        lon: -71.9225,
        name: 'Campo de morrenas',
        description: 'Zona de bloques ennegrecidos por sedimento glaciar. Terreno inestable; cuidado al pisar.',
      },
      {
        lat: -41.3467,
        lon: -71.9267,
        name: 'Laguna Los Témpanos (1400 m)',
        description: 'Laguna glaciar con témpanos flotantes de color azul celeste. Glaciar colgante del Tronador visible en la pared superior.',
      },
    ],
    parking: 'Estacionamiento en Pampa Linda (mismo que Glaciar Negro). Portón de acceso con horario restringido.',
    access_notes: 'Idéntico acceso que Tronador-Glaciar Negro: Ruta 258 sur hasta Villa Mascardi y luego camino de ripio a Pampa Linda (90 km total desde Bariloche, 1:30 h en auto).',
    water_sources: 'Río Alerce y múltiples arroyos a lo largo del sendero. Agua muy limpia pero con algo de sedimento glaciar en suspensión; conveniente filtrar.',
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
    difficulty: 'dificil',
    distance_km: 18,
    elevation_gain_m: 1200,
    max_altitude_m: 1895,
    duration: { min: 6, max: 8, unit: 'horas' },
    coordinates: { lat: -41.2083, lon: -71.4667 },
    photo_uri:
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80&fit=crop&auto=format',
    tags: ['cumbre', 'vistas sur', 'lago Gutiérrez', 'lago Mascardi', 'sendero empinado', 'bosque'],
    permits_required: false,
    best_season: 'Nov – Abr',
    description:
      'Ascenso al Cerro Challhuaco (1895 m) desde el barrio Melipal. Sendero empinado a través de bosque cerrado con magníficas vistas al sur de Bariloche.',
    trailhead: 'Barrio Melipal, sur de Bariloche',
    source: 'barilochetrekking.com',
    long_description: `El Cerro Challhuaco es una de las subidas más exigentes de los alrededores inmediatos de Bariloche y, paradójicamente, una de las menos conocidas por los turistas, lo que garantiza una experiencia de montaña auténtica y sin multitudes. El sendero parte desde el barrio Melipal, al sur del centro urbano, y asciende de manera casi sostenida por el flanco norte del cerro a través de un bosque de coihue denso y húmedo donde la luz del sol llega filtrada y la vegetación del sotobosque —helechos, quila, murtilla— se desarrolla con exuberancia.

Los primeros 4 km son los más forestales y también los más empinados en términos relativos: el sendero gana altitud con rapidez sin grandes horizontales de alivio. El suelo de tierra negra puede ser resbaladizo tras las lluvias frecuentes del verano andino, por lo que bastones de trekking son especialmente útiles aquí. A medida que se aproxima al km 6 el bosque comienza a abrirse y aparecen los primeros claros desde donde el lago Gutiérrez —de color verde jade— se ve al este.

La zona alta del cerro, sobre los 1600 metros, es un páramo de roca y arbustos bajos donde el viento sopla con mayor intensidad. Los últimos 300 metros de desnivel hasta la cima requieren atención en la orientación ya que el terreno es más difuso y los senderos secundarios pueden llevar a pasajes sin salida. La señalización con cairns suele ser fiable en temporada alta pero puede ser escasa en condiciones de visibilidad reducida.

Desde la cima del Challhuaco (1895 m) la vista al sur es la principal recompensa: el lago Gutiérrez en primer plano, el lago Mascardi detrás con su brazo que se pierde entre las montañas, y en el horizonte las cumbres nevadas del Tronador y los volcanes chilenos. Hacia el norte el lago Nahuel Huapi y la ciudad de Bariloche completan un panorama de escala regional que justifica cada metro de esfuerzo.`,
    gpxTrack: [
      { lat: -41.2083, lon: -71.4667, ele: 820 },
      { lat: -41.2100, lon: -71.4693, ele: 900 },
      { lat: -41.2118, lon: -71.4718, ele: 990 },
      { lat: -41.2135, lon: -71.4740, ele: 1080 },
      { lat: -41.2152, lon: -71.4762, ele: 1165 },
      { lat: -41.2167, lon: -71.4782, ele: 1250 },
      { lat: -41.2180, lon: -71.4800, ele: 1330 },
      { lat: -41.2193, lon: -71.4817, ele: 1410 },
      { lat: -41.2205, lon: -71.4833, ele: 1490 },
      { lat: -41.2215, lon: -71.4847, ele: 1560 },
      { lat: -41.2225, lon: -71.4858, ele: 1640 },
      { lat: -41.2233, lon: -71.4862, ele: 1710 },
      { lat: -41.2240, lon: -71.4864, ele: 1780 },
      { lat: -41.2246, lon: -71.4865, ele: 1840 },
      { lat: -41.2250, lon: -71.4867, ele: 1895 },
    ],
    namedWaypoints: [
      {
        lat: -41.2083,
        lon: -71.4667,
        name: 'Inicio barrio Melipal',
        description: 'Punto de partida en zona residencial al sur de Bariloche. Calle de tierra finaliza en el sendero.',
      },
      {
        lat: -41.2135,
        lon: -71.4740,
        name: 'Bosque cerrado de coihue',
        description: 'Tramo de bosque más denso. Suelo blando y húmedo. Puede ser resbaladizo; bastones recomendados.',
      },
      {
        lat: -41.2193,
        lon: -71.4817,
        name: 'Primer claro con vistas al Gutiérrez',
        description: 'El bosque se abre brevemente permitiendo las primeras vistas al lago Gutiérrez al este.',
      },
      {
        lat: -41.2233,
        lon: -71.4862,
        name: 'Zona de páramo alto',
        description: 'Sobre 1700 m; vegetación de altura rasa y viento permanente. Orientación por cairns.',
      },
      {
        lat: -41.2250,
        lon: -71.4867,
        name: 'Cima Cerro Challhuaco (1895 m)',
        description: 'Vista al sur con lagos Gutiérrez y Mascardi. Al norte, Nahuel Huapi y Bariloche. Punto de almuerzo excelente.',
      },
    ],
    parking: 'Estacionamiento informal al final de la calle de tierra en barrio Melipal. Espacio para unos 10 vehículos.',
    access_notes: 'Desde el centro de Bariloche tomar la Av. Bustillo hacia el sur, girar en el acceso al barrio Melipal y seguir las calles de tierra hasta el final de la calle Chalhuaco. Aproximadamente 8 km desde el centro (15 min en auto).',
    water_sources: 'Un arroyo al inicio del sendero (km 1) y otro hacia el km 4 en el bosque. No hay agua en la zona alta. Llevar suficiente para el día.',
    camping_allowed: false,
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
    distance_km: 35,
    elevation_gain_m: 2100,
    max_altitude_m: 2000,
    duration: { min: 2, max: 2, unit: 'dias' },
    coordinates: { lat: -41.1855, lon: -71.4499 },
    photo_uri:
      'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=800&q=80&fit=crop&auto=format',
    tags: ['travesía', '2 días', 'refugio', 'paso de altura', 'backcountry', 'clásico Bariloche'],
    permits_required: false,
    best_season: 'Dic – Mar',
    description:
      'Clásica travesía de dos días por la alta montaña de Bariloche: Catedral → Frey → Paso de las Nubes → Refugio Jakob → Colonia Suiza. Experiencia técnica con pasos expuestos.',
    trailhead: 'Base Cerro Catedral (Bariloche)',
    source: 'barilochetrekking.com',
    long_description: `La Travesía Frey–Jakob es la excursión de dos días de referencia absoluta de Bariloche y una de las rutas de montaña más completas de la Patagonia andina. Combina bosque, laguna glaciar, pasos de altura expuestos y el camaradería única de las noches en refugio de alta montaña. No en vano es el sueño cumplido de todo amante del trekking que visita la región.

El primer día replica el sendero al Refugio Frey por la ruta de la Cancha de Fútbol (ver descripción separada), con llegada al refugio a orillas de la Laguna Schmoll en la tarde. La noche en el refugio Frey es una experiencia en sí misma: la terraza iluminada por los últimos rayos del sol sobre las agujas de granito, el tintineo de cuerdas y mosquetones de los escaladores, y una cena caliente rodeado de montañeros de distintos países que comparten historias de vías y cumbres.

El segundo día es el más exigente y el más recompensante. Desde Frey el sendero asciende hacia el Paso de las Nubes (2000 m), una arista entre dos mundos: del lado de Frey las agujas y la laguna; del lado de Jakob los valles abiertos y los glaciares suspendidos del Cerro Negro. El paso es técnico en sus últimos 200 metros de desnivel: roca firme pero expuesta, requiriendo atención y en algunas condiciones el uso de las manos. El viento en el paso puede ser intenso.

La bajada hacia el Refugio Jakob atraviesa paisajes de alta montaña que cambian constantemente de vegetación y tipo de terreno. El refugio Jakob (oficialmente Refugio San Martín, 2000 m) aparece en un valle glaciar con paredes que lo rodean en tres lados. Desde aquí el descenso a Colonia Suiza (830 m) recupera los 1170 metros de desnivel ganados a través de un bosque de coihues que parece más verde y más vivo después de los dos días en la piedra y el hielo.`,
    gpxTrack: [
      { lat: -41.1855, lon: -71.4499, ele: 1050 },
      { lat: -41.1905, lon: -71.4585, ele: 1230 },
      { lat: -41.1950, lon: -71.4670, ele: 1420 },
      { lat: -41.1975, lon: -71.4727, ele: 1580 },
      { lat: -41.1997, lon: -71.4741, ele: 1700 },
      { lat: -41.1975, lon: -71.4790, ele: 1760 },
      { lat: -41.1940, lon: -71.4850, ele: 1830 },
      { lat: -41.1900, lon: -71.4900, ele: 1900 },
      { lat: -41.1833, lon: -71.4933, ele: 1960 },
      { lat: -41.1733, lon: -71.4967, ele: 2000 },
      { lat: -41.1633, lon: -71.4983, ele: 2000 },
      { lat: -41.1533, lon: -71.5000, ele: 1990 },
      { lat: -41.1433, lon: -71.5033, ele: 1950 },
      { lat: -41.1367, lon: -71.5067, ele: 2000 },
      { lat: -41.1267, lon: -71.5117, ele: 2000 },
      { lat: -41.1167, lon: -71.5200, ele: 1700 },
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
        description: 'Refugio del CAB. Reserva obligatoria en temporada alta. Cenas y desayunos disponibles. Carpas en la orilla de la laguna.',
      },
      {
        lat: -41.1633,
        lon: -71.4983,
        name: 'Paso de las Nubes (2000 m)',
        description: 'Paso técnico y expuesto. Punto más alto de la travesía. Vistas a ambos lados: agujas de Frey y valles de Jakob. Viento frecuente.',
      },
      {
        lat: -41.1267,
        lon: -71.5117,
        name: 'Refugio San Martín / Jakob (2000 m)',
        description: 'Refugio remoto en un circo glaciar. Punto de reabastecimiento y, para los que alargan la travesía, noche 2 opcional.',
      },
      {
        lat: -41.0567,
        lon: -71.5867,
        name: 'Colonia Suiza (final, 830 m)',
        description: 'Fin de la travesía en la histórica colonia de inmigrantes suizos. Restaurante con curanto al hoyo los fines de semana. Taxi o bus de regreso a Bariloche.',
      },
    ],
    parking: 'Dejar el vehículo en la base de Cerro Catedral (pago por días). Al finalizar en Colonia Suiza, tomar bus o taxi de regreso a Catedral.',
    access_notes: 'Inicio en Cerro Catedral (Ruta 82, 18 km desde Bariloche). Fin en Colonia Suiza sobre la Ruta 79 (bus línea 10 de regreso al centro). La logística de dos puntos distintos debe planificarse con antelación.',
    water_sources: 'Abundante durante toda la travesía. Laguna Schmoll en Frey, arroyos en el paso y múltiples fuentes en el descenso a Colonia Suiza.',
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
    elevation_gain_m: 300,
    max_altitude_m: 900,
    duration: { min: 4, max: 5, unit: 'horas' },
    coordinates: { lat: -41.2150, lon: -71.4050 },
    photo_uri:
      'https://images.unsplash.com/photo-1501426026826-31c667bdf23d?w=800&q=80&fit=crop&auto=format',
    tags: ['lago', 'costa', 'natación', 'bosque', 'tranquilo', 'familia', 'menos concurrido'],
    permits_required: false,
    best_season: 'Oct – Abr',
    description:
      'Sendero por la costa sur del lago Gutiérrez, bordeando el lago a través de bosque nativo con posibilidades de natación. Mucho menos concurrido que otras rutas de Bariloche.',
    trailhead: 'Camping Petunia, costado sur del lago Gutiérrez',
    source: 'barilochetrekking.com',
    long_description: `El lago Gutiérrez es el segundo lago más grande en el entorno inmediato de Bariloche, apenas 8 km al sur de la ciudad, y su costa sur está atravesada por un sendero forestal que es quizás el mejor secreto de la región para quienes buscan un trekking tranquilo en un entorno natural pristino sin multitudes. Mientras las rutas del Catedral se llenan de caminantes, la orilla del Gutiérrez permanece silenciosa incluso en pleno enero.

El sendero parte del Camping Petunia y sigue la costa del lago con algunos suaves ascensos y descensos que suponen pocas veces más de 50 metros de desnivel. El bosque de coihue y ciprés de la cordillera (Austrocedrus chilensis) que acompaña la mayor parte de la ruta es uno de los más tranquilos y aromáticos de la zona: el olor a resina de ciprés, especialmente en los tramos soleados, tiene algo de medicinal que relaja el paso y ralentiza la marcha de manera casi involuntaria.

El lago Gutiérrez destaca por la extraordinaria claridad de sus aguas en la orilla pedregosa. El color varía entre el turquesa profundo en los sectores de mayor profundidad y el verde claro en las playas de guijarros donde el fondo se ve hasta 6-7 metros de profundidad. En el verano patagónico las temperaturas del agua alcanzan los 18-20 °C en las zonas someras, lo que convierte cualquier playa del sendero en un lugar idóneo para un baño revitalizante a mitad de ruta.

La Playa Muñoz, al final del tramo de ida, es una pequeña bahía de piedras blancas con vistas al Cerro Catedral al norte. El silencio aquí es notable. En el entorno se ven carpinchos en los cañaverales de la orilla baja, y los martín pescadores patrullan el litoral con sus vuelos rasantes sobre el agua. El regreso por la misma ruta al atardecer ofrece la luz más cálida del día sobre el espejo del lago.`,
    gpxTrack: [
      { lat: -41.2150, lon: -71.4050, ele: 770 },
      { lat: -41.2175, lon: -71.4027, ele: 790 },
      { lat: -41.2200, lon: -71.4010, ele: 810 },
      { lat: -41.2225, lon: -71.3998, ele: 830 },
      { lat: -41.2250, lon: -71.3992, ele: 850 },
      { lat: -41.2275, lon: -71.3990, ele: 865 },
      { lat: -41.2300, lon: -71.3988, ele: 875 },
      { lat: -41.2325, lon: -71.3987, ele: 885 },
      { lat: -41.2350, lon: -71.3987, ele: 892 },
      { lat: -41.2375, lon: -71.3985, ele: 898 },
      { lat: -41.2400, lon: -71.3983, ele: 900 },
      { lat: -41.2425, lon: -71.3982, ele: 895 },
      { lat: -41.2450, lon: -71.3983, ele: 780 },
    ],
    namedWaypoints: [
      {
        lat: -41.2150,
        lon: -71.4050,
        name: 'Camping Petunia',
        description: 'Punto de partida con baños y zona de acampe. Buena base para la noche anterior al trekking.',
      },
      {
        lat: -41.2225,
        lon: -71.3998,
        name: 'Primera playa de piedras',
        description: 'Playa pedregosa con aguas cristalinas aptas para baño en verano. Vista al Cerro Catedral al norte.',
      },
      {
        lat: -41.2300,
        lon: -71.3988,
        name: 'Bosque de cipreses cordilleranos',
        description: 'Tramo más aromático del sendero con cipreses de la cordillera maduros. Aroma resinoso característico.',
      },
      {
        lat: -41.2375,
        lon: -71.3985,
        name: 'Bahía de los carpinchos',
        description: 'Zona de cañaverales donde es frecuente ver carpinchos al amanecer y al atardecer.',
      },
      {
        lat: -41.2450,
        lon: -71.3983,
        name: 'Playa Muñoz',
        description: 'Bahía de piedras blancas, fin del sendero. Silencio total, martín pescadores y vistas al Catedral.',
      },
    ],
    parking: 'Estacionamiento en el Camping Petunia (pago). También se puede acceder desde el centro en bicicleta por la Av. Bustillo.',
    access_notes: 'Desde Bariloche tomar la Av. Bustillo hacia el sudeste hasta el Camping Petunia (8 km, 12 min). Bus línea 50 desde la Terminal hasta las proximidades.',
    water_sources: 'El lago Gutiérrez tiene agua limpia disponible en toda la orilla (potable con purificación). Ideal llevar botella y tabletas purificadoras.',
    camping_allowed: true,
    round_trip: true,
  },

  // -------------------------------------------------------------------------
  // 13. Cerro San Martín (Llao Llao)
  // -------------------------------------------------------------------------
  {
    id: 'cerro-san-martin',
    name: 'Cerro San Martín desde Llao Llao',
    province: 'Río Negro',
    area: 'Parque Nacional Nahuel Huapi',
    subarea: 'Llao Llao',
    region: 'patagonia-norte',
    activity: 'trekking',
    difficulty: 'moderado',
    distance_km: 16,
    elevation_gain_m: 820,
    max_altitude_m: 1621,
    duration: { min: 6, max: 7, unit: 'horas' },
    coordinates: { lat: -41.0417, lon: -71.5483 },
    photo_uri:
      'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80&fit=crop&auto=format',
    tags: ['Llao Llao', 'cima', 'alternativa tranquila', 'bosque', 'vistas Andinas', 'menos concurrido'],
    permits_required: false,
    best_season: 'Nov – Abr',
    description:
      'Ascenso al Cerro San Martín (1621 m) desde la península de Llao Llao. Alternativa más tranquila al Campanario o al López, con vistas únicas desde el reverso de la península.',
    trailhead: 'Villa Llao Llao, a 500 m del Hotel Llao Llao',
    source: 'barilochetrekking.com',
    long_description: `El Cerro San Martín es la cumbre discreta de la península de Llao Llao, eclipsada en popularidad por el Campanario pero comparable en recompensa paisajística. Su ascenso desde la Villa Llao Llao pasa por el reverso de la famosa península y ofrece perspectivas del lago Nahuel Huapi, el lago Moreno y el lago Escondido que difieren completamente de las obtenidas desde los miradores clásicos, ya que el observador se sitúa en el interior del macizo en lugar de en su periferia.

El sendero arranca desde la Villa Llao Llao, una pequeña comunidad de casas de madera y piedra que existe en las sombras del célebre hotel homónimo, y asciende de inmediato por un bosque mixto de coihue y arrayán donde la mezcla de texturas de corteza —gris rugosa del coihue, naranja lisa del arrayán— crea un efecto visual sorprendente. En los primeros 2 km la inclinación es suave y el sendero bien marcado; es una buena zona para calentar músculos antes de la parte más empinada.

A partir del km 3 la pendiente aumenta y el sendero se aleja de la línea arbórea baja ascendiendo por laderas abiertas con arbustos de chaura y notro. En la época de floración del notro (diciembre–enero) las flores rojas brillantes salpican el paisaje con un color que contrasta con el verde apagado de la vegetación dominante. La segunda mitad del ascenso transcurre sobre sendero de tierra compacta entre rocas, con algunos tramos en que el camino se estrecha y la vegetación se cierra a ambos lados.

Desde la cima del Cerro San Martín (1621 m) la vista es realmente amplia: al norte el lago Nahuel Huapi con sus brazos y penínsulas; al este Bariloche y sus cerros traseros; al sur el lago Moreno y, en días claros, el lago Escondido; al oeste el Cerro López y más lejos los nevados de la cordillera. El silencio aquí es notable comparado con los miradores turísticos más concurridos: en este cerro es habitual no encontrar a nadie más.`,
    gpxTrack: [
      { lat: -41.0417, lon: -71.5483, ele: 800 },
      { lat: -41.0428, lon: -71.5455, ele: 850 },
      { lat: -41.0440, lon: -71.5425, ele: 905 },
      { lat: -41.0452, lon: -71.5393, ele: 960 },
      { lat: -41.0462, lon: -71.5360, ele: 1015 },
      { lat: -41.0470, lon: -71.5325, ele: 1075 },
      { lat: -41.0477, lon: -71.5290, ele: 1130 },
      { lat: -41.0480, lon: -71.5253, ele: 1185 },
      { lat: -41.0482, lon: -71.5215, ele: 1240 },
      { lat: -41.0482, lon: -71.5177, ele: 1300 },
      { lat: -41.0478, lon: -71.5137, ele: 1360 },
      { lat: -41.0467, lon: -71.5095, ele: 1420 },
      { lat: -41.0450, lon: -71.5055, ele: 1480 },
      { lat: -41.0430, lon: -71.5022, ele: 1545 },
      { lat: -41.0410, lon: -71.5003, ele: 1590 },
      { lat: -41.0390, lon: -71.5000, ele: 1610 },
      { lat: -40.9717, lon: -71.5000, ele: 1621 },
    ],
    namedWaypoints: [
      {
        lat: -41.0417,
        lon: -71.5483,
        name: 'Villa Llao Llao',
        description: 'Inicio del sendero en la pequeña villa residencial junto al famoso hotel. Cartel de inicio del sendero en calle principal.',
      },
      {
        lat: -41.0452,
        lon: -71.5393,
        name: 'Bosque de arrayanes y coihues',
        description: 'Zona mixta de arrayán y coihue. Cortezas de naranja y gris se alternan. Muy fotogénico en las primeras horas.',
      },
      {
        lat: -41.0477,
        lon: -71.5290,
        name: 'Ladera de notros',
        description: 'Arbustos de notro en flor (diciembre–enero). Flores rojas llamativas sobre ladera abierta con vistas nacientes al lago.',
      },
      {
        lat: -41.0450,
        lon: -71.5055,
        name: 'Cresta previa a la cima',
        description: 'La ruta se afina sobre una cresta con exposición a ambos lados. Viento frecuente; precaución.',
      },
      {
        lat: -40.9717,
        lon: -71.5000,
        name: 'Cima Cerro San Martín (1621 m)',
        description: 'Cumbre silenciosa con panorámica completa. Lagos Nahuel Huapi, Moreno y Escondido visibles. Sin multitudes.',
      },
    ],
    parking: 'Estacionamiento informal en Villa Llao Llao (calle principal). También se puede llegar en bus (línea 20) desde Bariloche y comenzar desde allí.',
    access_notes: 'Desde Bariloche por Ruta 77 circuito chico/grande hasta Llao Llao (25 km, 30 min). Villa Llao Llao está a 500 m del hotel. Bus línea 20.',
    water_sources: 'Un arroyo al inicio del sendero (km 1). No hay agua en la parte alta; llevar suficiente para el día completo.',
    camping_allowed: false,
    round_trip: true,
  },

  // -------------------------------------------------------------------------
  // 14. Refugio Jakob desde Colonia Suiza
  // -------------------------------------------------------------------------
  {
    id: 'refugio-jakob',
    name: 'Refugio Jakob desde Colonia Suiza',
    province: 'Río Negro',
    area: 'Parque Nacional Nahuel Huapi',
    subarea: 'Bariloche',
    region: 'patagonia-norte',
    activity: 'trekking',
    difficulty: 'dificil',
    distance_km: 20,
    elevation_gain_m: 1170,
    max_altitude_m: 2000,
    duration: { min: 7, max: 9, unit: 'horas' },
    coordinates: { lat: -41.0567, lon: -71.5867 },
    photo_uri:
      'https://images.unsplash.com/photo-1482685945432-29a7abf2f466?w=800&q=80&fit=crop&auto=format',
    tags: ['refugio', 'alta montaña', 'circo glaciar', 'traversía', 'solitario', 'Jakob'],
    permits_required: false,
    best_season: 'Dic – Mar',
    description:
      'Ascenso al Refugio San Martín (Jakob) desde Colonia Suiza, en el límite de los 2000 m. Punto de inicio de la travesía Jakob–Frey y acceso al backcountry de Bariloche.',
    trailhead: 'Colonia Suiza, sobre la Ruta 79',
    source: 'barilochetrekking.com',
    long_description: `El Refugio San Martín, universalmente conocido como Refugio Jakob en honor al explorador alemán que cartografió la zona a principios del siglo XX, es el refugio más remoto y elevado de los administrados por el Club Andino Bariloche en el entorno de Bariloche. Su acceso desde Colonia Suiza es la ruta más directa y también la más exigente desde el fondo del valle, sumando 1170 metros de desnivel en un trayecto de 10 kilómetros de ida.

El sendero parte del centro de Colonia Suiza y asciende hacia el este por el flanco del cordón Frey, penetrando en un bosque de coihue viejo que se hace más espeso y oscuro a medida que el desnivel aumenta. El suelo es esponjoso y el sendero a veces lleva agua en los tramos de descarga de arroyos laterales. Durante la primera hora el rumor del arroyo del Casero —que desciende desde el glaciar hasta la colonia— acompaña casi constantemente el camino.

A los 5-6 km el bosque se aclara y el paisaje se transforma de manera radical: los circos glaciares comienzan a hacerse visibles, las paredes de roca gris asoman por encima de los últimos árboles, y el silencio —que el bosque amortigua eficazmente— aparece de golpe en toda su intensidad de alta montaña. El sendero se vuelve más técnico en este tramo, con varios pasos entre bloques de roca y cruces de arroyos de deshielo que pueden tener caudal significativo en enero y febrero.

El Refugio Jakob aparece en el fondo de un circo glaciar espectacular: paredes que suben 600-700 metros sobre el refugio, pequeños lagos de altura de color azul intenso en los llanos glaciares, y una quietud que hace que la llegada al refugio sea una de las experiencias más memorables del trekking patagónico. El refugio es el punto de partida para el cruce al Refugio Frey por el Paso de las Nubes, una de las travesías más clásicas de la región andino-patagónica.`,
    gpxTrack: [
      { lat: -41.0567, lon: -71.5867, ele: 830 },
      { lat: -41.0617, lon: -71.5800, ele: 900 },
      { lat: -41.0667, lon: -71.5733, ele: 980 },
      { lat: -41.0717, lon: -71.5667, ele: 1060 },
      { lat: -41.0767, lon: -71.5600, ele: 1140 },
      { lat: -41.0817, lon: -71.5533, ele: 1220 },
      { lat: -41.0867, lon: -71.5467, ele: 1300 },
      { lat: -41.0917, lon: -71.5400, ele: 1380 },
      { lat: -41.0967, lon: -71.5333, ele: 1460 },
      { lat: -41.1017, lon: -71.5267, ele: 1540 },
      { lat: -41.1067, lon: -71.5217, ele: 1620 },
      { lat: -41.1117, lon: -71.5175, ele: 1700 },
      { lat: -41.1167, lon: -71.5150, ele: 1790 },
      { lat: -41.1217, lon: -71.5133, ele: 1870 },
      { lat: -41.1267, lon: -71.5117, ele: 2000 },
    ],
    namedWaypoints: [
      {
        lat: -41.0567,
        lon: -71.5867,
        name: 'Colonia Suiza',
        description: 'Inicio del sendero. Restaurantes, baños y transporte disponibles. Señalización clara al comienzo.',
      },
      {
        lat: -41.0717,
        lon: -71.5667,
        name: 'Arroyo del Casero',
        description: 'Cruce del arroyo principal que baja del glaciar de Jakob. Buena fuente de agua.',
      },
      {
        lat: -41.0917,
        lon: -71.5400,
        name: 'Salida del bosque de coihue',
        description: 'El bosque se adelgaza y aparecen los primeros circos glaciares. El sendero se vuelve más técnico.',
      },
      {
        lat: -41.1117,
        lon: -71.5175,
        name: 'Pasos entre bloques de roca',
        description: 'Sector más técnico del ascenso. Manos necesarias en dos o tres pasos. Arroyos de deshielo frecuentes.',
      },
      {
        lat: -41.1267,
        lon: -71.5117,
        name: 'Refugio San Martín / Jakob (2000 m)',
        description: 'Refugio en circo glaciar con vistas espectaculares. Inicio de la travesía al Refugio Frey. Reserva obligatoria en temporada.',
      },
    ],
    parking: 'Estacionamiento en Colonia Suiza (gratuito). Si se pernocta en el refugio, el auto puede quedar sin problema hasta el día siguiente.',
    access_notes: 'Desde Bariloche por Ruta 79 oeste hasta Colonia Suiza (22 km, 30 min en auto). Bus línea 10 con servicio frecuente desde la Terminal de Bariloche.',
    water_sources: 'Arroyo del Casero y múltiples afluentes durante el ascenso. Agua abundante y de buena calidad (purificar igualmente). El refugio tiene agua disponible.',
    camping_allowed: true,
    refugio: 'Refugio San Martín / Jakob (CAB)',
    round_trip: true,
  },

  // -------------------------------------------------------------------------
  // 15. Laguna Ilón
  // -------------------------------------------------------------------------
  {
    id: 'laguna-ilon',
    name: 'Laguna Ilón',
    province: 'Río Negro',
    area: 'Parque Nacional Nahuel Huapi',
    subarea: 'Bariloche',
    region: 'patagonia-norte',
    activity: 'trekking',
    difficulty: 'moderado',
    distance_km: 12,
    elevation_gain_m: 600,
    max_altitude_m: 1450,
    duration: { min: 4, max: 6, unit: 'horas' },
    coordinates: { lat: -41.2000, lon: -71.4600 },
    photo_uri:
      'https://images.unsplash.com/photo-1540390769625-2fc3f8b1d50c?w=800&q=80&fit=crop&auto=format',
    tags: ['laguna oculta', 'pesca', 'bajo tráfico', 'sur Catedral', 'bosque nativo', 'tranquilo'],
    permits_required: false,
    best_season: 'Nov – Abr',
    description:
      'Sendero a la Laguna Ilón, un lago escondido al sur del macizo de Cerro Catedral con muy bajo tráfico y buena pesca de trucha arcoíris y marrón.',
    trailhead: 'Zona baja del área de esquí de Cerro Catedral, lado sur',
    source: 'barilochetrekking.com',
    long_description: `La Laguna Ilón es el secreto mejor guardado del sector de Cerro Catedral y uno de los destinos de trekking con menor presión de visitantes de toda la región de Bariloche. Situada al sur del macizo de Catedral, esta laguna de montaña ocupa el fondo de un pequeño circo glaciar que el turismo masivo no ha descubierto todavía, lo que se traduce en una experiencia de naturaleza auténtica y sin interrupciones.

El sendero parte de la zona baja del área de esquí de Cerro Catedral en su flanco sur y asciende de manera sostenida por un bosque de coihue mezclado con arbustos de quila y notro. A diferencia de la ruta norte al Refugio Frey, este sendero está menos mantenido y en algunos tramos la quila puede estrechar el paso considerablemente. Quien busca un sendero en solitario lo tiene aquí. La primera hora es completamente boscosa y el silencio, roto solo por los pájaros del bosque y el viento en las copas de los coihues, predispone a un estado de calma que las rutas más concurridas no permiten alcanzar.

A partir del km 4 el bosque se abre y el sendero discurre entre arbustos bajos con vistas a las cumbres del sur del macizo de Catedral. El terreno sube con mayor pendiente en los últimos 2 km antes de la laguna, con algunos tramos de roca suelta que requieren atención. La aparición de la Laguna Ilón desde el borde del circo glaciar es siempre sorpresiva: el agua de color verde-azulado brilla contenida entre paredes de roca y pasturas de altura, sin un solo edificio o instalación humana a la vista.

La laguna es conocida entre los pescadores locales como uno de los mejores spots de pesca de trucha arcoíris y trucha marrón de todo el parque. La razón es la combinación de baja presión pesquera y las condiciones de agua fría y bien oxigenada ideales para las trótas. Se requiere licencia de pesca de la Provincia de Río Negro para practicar la actividad. El trekker que no pesca también encontrará en la orilla norte de la laguna un lugar excepcional para sentarse, contemplar el reflejo de las montañas en el agua y escuchar el viento patagónico sin apuros.`,
    gpxTrack: [
      { lat: -41.2000, lon: -71.4600, ele: 1100 },
      { lat: -41.2033, lon: -71.4633, ele: 1145 },
      { lat: -41.2067, lon: -71.4667, ele: 1190 },
      { lat: -41.2100, lon: -71.4700, ele: 1230 },
      { lat: -41.2133, lon: -71.4733, ele: 1265 },
      { lat: -41.2167, lon: -71.4767, ele: 1295 },
      { lat: -41.2200, lon: -71.4800, ele: 1325 },
      { lat: -41.2233, lon: -71.4833, ele: 1355 },
      { lat: -41.2267, lon: -71.4867, ele: 1385 },
      { lat: -41.2333, lon: -71.4900, ele: 1415 },
      { lat: -41.2400, lon: -71.4933, ele: 1438 },
      { lat: -41.2450, lon: -71.4967, ele: 1448 },
      { lat: -41.2483, lon: -71.5033, ele: 1450 },
    ],
    namedWaypoints: [
      {
        lat: -41.2000,
        lon: -71.4600,
        name: 'Inicio zona sur Cerro Catedral',
        description: 'Acceso por el flanco sur del área de esquí. Señalización escasa; conveniente llevar mapa o GPS.',
      },
      {
        lat: -41.2067,
        lon: -71.4667,
        name: 'Bosque de coihue y quila',
        description: 'Tramo con quila densa que puede estrechar el sendero. Prever ropa de manga larga en este sector.',
      },
      {
        lat: -41.2200,
        lon: -71.4800,
        name: 'Apertura del bosque',
        description: 'El coihue se adelgaza y aparecen arbustos de notro. Primeras vistas a las cumbres del sur del macizo de Catedral.',
      },
      {
        lat: -41.2400,
        lon: -71.4933,
        name: 'Zona de roca suelta',
        description: 'Tramo de roca suelta en el acceso al circo. Cuidado al pisar; bastones recomendados.',
      },
      {
        lat: -41.2483,
        lon: -71.5033,
        name: 'Laguna Ilón (1450 m)',
        description: 'Laguna en circo glaciar de baja presión turística. Excelente pesca de trucha (licencia requerida). Vista a cumbres de Catedral.',
      },
    ],
    parking: 'Usar el estacionamiento de la base de Cerro Catedral y acceder al sendero sur a pie (1.5 km adicionales).',
    access_notes: 'Acceso por la Ruta 82 hasta Villa Catedral (18 km desde Bariloche). Desde la base de Catedral seguir la pista forestal hacia el sur. La señalización es escasa; se recomienda mapa o GPS.',
    water_sources: 'Un arroyo en el km 3 y la laguna misma al final. Agua disponible y de buena calidad; filtrar antes de consumir.',
    camping_allowed: false,
    round_trip: true,
  },
];

// ---------------------------------------------------------------------------
// Quick-lookup set
// ---------------------------------------------------------------------------

export const ALL_BARILOCHE_IDS: Set<string> = new Set(BARILOCHE_TRAILS.map((t) => t.id));
