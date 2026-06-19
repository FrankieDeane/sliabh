import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, useWindowDimensions, Platform, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { useLangStore } from '../../src/store/langStore';
import { WebFooter } from '../../src/components/layout/WebFooter';

const MAX_CONTENT = 800;

const PATAGONIA_PHOTOS = [
  'https://images.unsplash.com/photo-1574068468668-a05a11f871da?w=800&q=80&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=800&q=80&fit=crop&auto=format',
  'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80&fit=crop&auto=format',
];

const FAQ_DATA: Array<{
  category: { es: string; en: string };
  items: Array<{ q: { es: string; en: string }; a: { es: string; en: string } }>;
}> = [
  {
    category: { es: 'GENERAL', en: 'GENERAL' },
    items: [
      {
        q: {
          es: '¿Qué es Sliabh?',
          en: 'What is Sliabh?',
        },
        a: {
          es: 'Sliabh es una aplicación de montaña diseñada para explorar los parques nacionales y rutas de trekking de Argentina. Ofrece mapas interactivos, archivos GPX descargables, guías de supervivencia y fichas detalladas de más de 39 parques nacionales.',
          en: 'Sliabh is a mountain app designed to explore Argentina\'s national parks and trekking routes. It offers interactive maps, downloadable GPX files, survival guides and detailed profiles for over 39 national parks.',
        },
      },
      {
        q: {
          es: '¿La aplicación funciona sin conexión a internet?',
          en: 'Does the app work without an internet connection?',
        },
        a: {
          es: 'Sí. Los archivos GPX descargados, las guías de supervivencia y los mapas pre-cacheados funcionan completamente offline. Descargá el GPX y los mapas de cada parque antes de salir al campo para tenerlos disponibles sin señal.',
          en: 'Yes. Downloaded GPX files, survival guides and pre-cached maps work completely offline. Download the GPX and maps for each park before heading out to have them available without signal.',
        },
      },
      {
        q: {
          es: '¿En qué plataformas está disponible Sliabh?',
          en: 'What platforms is Sliabh available on?',
        },
        a: {
          es: 'Sliabh funciona como aplicación web (sliabh.netlify.app), y como aplicación móvil nativa para iOS y Android. Todas las versiones comparten el mismo contenido y se actualizan simultáneamente.',
          en: 'Sliabh works as a web app (sliabh.netlify.app) and as a native mobile app for iOS and Android. All versions share the same content and are updated simultaneously.',
        },
      },
      {
        q: {
          es: '¿Sliabh es gratuita?',
          en: 'Is Sliabh free?',
        },
        a: {
          es: 'La mayoría del contenido de Sliabh es de acceso libre. Algunas funciones avanzadas como la sincronización de rutas y el historial de expediciones requieren crear una cuenta.',
          en: 'Most of Sliabh\'s content is freely accessible. Some advanced features such as route syncing and expedition history require creating an account.',
        },
      },
      {
        q: {
          es: '¿Cómo me registro en la aplicación?',
          en: 'How do I sign up?',
        },
        a: {
          es: 'Tocá el botón "Únete a la comunidad" en la pantalla de inicio, o accedé desde el menú superior. El registro es gratuito y requiere solo un correo electrónico.',
          en: 'Tap "Join the community" on the home screen, or access it from the top menu. Registration is free and only requires an email address.',
        },
      },
    ],
  },
  {
    category: { es: 'ARCHIVOS GPX', en: 'GPX FILES' },
    items: [
      {
        q: {
          es: '¿Cómo descargo el archivo GPX de un parque?',
          en: 'How do I download a park\'s GPX file?',
        },
        a: {
          es: 'En la sección "Mapas", encontrás una tarjeta por cada parque nacional. Tocá el botón "GPX / OsmAnd" para descargar el archivo. El archivo se guarda en tu dispositivo con el nombre del parque.',
          en: 'In the "Maps" section, you\'ll find a card for each national park. Tap the "GPX / OsmAnd" button to download the file. It is saved on your device with the park\'s name.',
        },
      },
      {
        q: {
          es: '¿Para qué sirve el archivo GPX?',
          en: 'What is a GPX file for?',
        },
        a: {
          es: 'El archivo GPX (GPS Exchange Format) contiene los waypoints y trazados de las rutas. Podés importarlo en aplicaciones como OsmAnd, Gaia GPS, Garmin Connect, Komoot o cualquier dispositivo GPS para navegar offline con precisión.',
          en: 'A GPX file (GPS Exchange Format) contains waypoints and route tracks. You can import it into apps like OsmAnd, Gaia GPS, Garmin Connect, Komoot or any GPS device for accurate offline navigation.',
        },
      },
      {
        q: {
          es: '¿Cómo importo el GPX en OsmAnd?',
          en: 'How do I import a GPX into OsmAnd?',
        },
        a: {
          es: 'En OsmAnd: Menú → Mis lugares → Pistas → Importar. Seleccioná el archivo .gpx descargado. El parque aparecerá como track en el mapa y podés activarlo para navegar sin conexión.',
          en: 'In OsmAnd: Menu → My Places → Tracks → Import. Select the downloaded .gpx file. The park will appear as a track on the map and you can enable it for offline navigation.',
        },
      },
      {
        q: {
          es: '¿Cómo importo el GPX en Garmin?',
          en: 'How do I import a GPX into Garmin?',
        },
        a: {
          es: 'Conectá tu Garmin por USB a la computadora. Copiá el archivo .gpx a la carpeta /GPX o /Garmin/GPX del dispositivo. El track aparecerá en el menú de actividades de tu GPS.',
          en: 'Connect your Garmin via USB to your computer. Copy the .gpx file to the /GPX or /Garmin/GPX folder on the device. The track will appear in the activities menu of your GPS.',
        },
      },
      {
        q: {
          es: '¿Los archivos GPX incluyen curvas de nivel?',
          en: 'Do GPX files include elevation contours?',
        },
        a: {
          es: 'Los archivos GPX de Sliabh incluyen waypoints clave y el trazado principal de cada ruta. Para curvas de nivel detalladas, recomendamos combinarlos con mapas topográficos en OsmAnd (disponibles gratuitamente en la app).',
          en: 'Sliabh\'s GPX files include key waypoints and the main track for each route. For detailed elevation contours, we recommend combining them with topographic maps in OsmAnd (available for free in the app).',
        },
      },
      {
        q: {
          es: '¿Puedo usar el GPX en Komoot o Strava?',
          en: 'Can I use the GPX in Komoot or Strava?',
        },
        a: {
          es: 'Sí. Importá el archivo GPX desde la sección de rutas de Komoot (Planificar ruta → Importar GPX) o desde Strava (Dashboard → Crear actividad → Subir archivo GPX). Ambas plataformas soportan el formato estándar GPX 1.1.',
          en: 'Yes. Import the GPX file from Komoot\'s route section (Plan route → Import GPX) or from Strava (Dashboard → Create activity → Upload GPX file). Both platforms support the standard GPX 1.1 format.',
        },
      },
      {
        q: {
          es: '¿Qué pasa si el GPX no se descarga correctamente?',
          en: 'What if the GPX doesn\'t download correctly?',
        },
        a: {
          es: 'Verificá que tu navegador no esté bloqueando las descargas automáticas. En Chrome/Safari, fijate en la barra de descarga o en la carpeta de descargas del dispositivo. El archivo siempre se llama [nombre_parque].gpx.',
          en: 'Check that your browser is not blocking automatic downloads. In Chrome/Safari, look at the download bar or the device\'s downloads folder. The file is always named [park_name].gpx.',
        },
      },
    ],
  },
  {
    category: { es: 'MAPAS', en: 'MAPS' },
    items: [
      {
        q: {
          es: '¿Cómo funciona el mapa interactivo?',
          en: 'How does the interactive map work?',
        },
        a: {
          es: 'El mapa interactivo usa OpenStreetMap a través de Leaflet. Podés explorar toda Argentina, hacer zoom, ver la ubicación de cada parque nacional con marcadores verdes y leer información básica al tocar cada marcador.',
          en: 'The interactive map uses OpenStreetMap via Leaflet. You can explore all of Argentina, zoom in, see each national park marked with green markers and read basic information by tapping each marker.',
        },
      },
      {
        q: {
          es: '¿Cómo uso el botón "Ver mapa" de cada parque?',
          en: 'How do I use the "View map" button for each park?',
        },
        a: {
          es: 'Al tocar "Ver mapa" en la tarjeta de un parque, el mapa interactivo vuela automáticamente hasta ese parque con el nivel de zoom correcto para verlo completo. Esto funciona tanto en web como en la app nativa.',
          en: 'Tapping "View map" on a park card automatically flies the interactive map to that park with the correct zoom level to see it fully. This works both on web and in the native app.',
        },
      },
      {
        q: {
          es: '¿Puedo cambiar el estilo del mapa?',
          en: 'Can I change the map style?',
        },
        a: {
          es: 'Sí. El mapa soporta varios estilos: OpenStreetMap (estándar), OpenTopoMap (topográfico con curvas de nivel), modo oscuro y Argenmap (cartografía oficial IGN Argentina). Seleccioná el estilo desde el panel del mapa.',
          en: 'Yes. The map supports several styles: OpenStreetMap (standard), OpenTopoMap (topographic with contour lines), dark mode and Argenmap (official IGN Argentina cartography). Select the style from the map panel.',
        },
      },
      {
        q: {
          es: '¿El mapa muestra mi ubicación en tiempo real?',
          en: 'Does the map show my real-time location?',
        },
        a: {
          es: 'En la versión nativa (iOS/Android) podés activar la geolocalización para ver tu posición en tiempo real. En la versión web, esta función depende de los permisos del navegador.',
          en: 'In the native version (iOS/Android) you can enable geolocation to see your position in real time. In the web version, this feature depends on browser permissions.',
        },
      },
      {
        q: {
          es: '¿Puedo ver mi posición GPS sin internet en la montaña?',
          en: 'Can I see my GPS position in the mountains without internet?',
        },
        a: {
          es: 'Sí, y es una de las ventajas más importantes de Sliabh. El chip GPS de tu celular recibe señal directamente de satélites — no necesita internet ni señal móvil para funcionar. Esto es igual a como funciona un GPS de senderismo dedicado. El único requisito es descargar el mapa del parque antes de salir, mientras tenés Wi-Fi. Una vez descargado, tu punto azul se mueve en tiempo real sobre el mapa aunque estés en medio de la Patagonia sin cobertura.',
          en: 'Yes, and this is one of Sliabh\'s most important advantages. Your phone\'s GPS chip receives signals directly from satellites — it does not need internet or mobile signal to work. This is the same way a dedicated hiking GPS device works. The only requirement is to download the park map before you leave, while you have Wi-Fi. Once downloaded, your blue dot moves in real time on the map even if you are in the middle of Patagonia with no coverage.',
        },
      },
      {
        q: {
          es: '¿Qué es Argenmap?',
          en: 'What is Argenmap?',
        },
        a: {
          es: 'Argenmap es la cartografía oficial del Instituto Geográfico Nacional (IGN) de Argentina. Es especialmente útil para rutas en zonas andinas donde los datos de OpenStreetMap pueden ser menos detallados.',
          en: 'Argenmap is the official cartography of Argentina\'s National Geographic Institute (IGN). It is especially useful for routes in Andean areas where OpenStreetMap data may be less detailed.',
        },
      },
      {
        q: {
          es: '¿Cómo descargo el mapa de un parque para usarlo sin señal?',
          en: 'How do I download a park map to use without signal?',
        },
        a: {
          es: 'Es muy simple: 1) Andá a la sección "Mapas" con Wi-Fi o datos. 2) Encontrá el parque que vas a visitar y tocá "Descargar mapa". Los tiles se guardan automáticamente en tu dispositivo. 3) Listo — la próxima vez que abras el mapa de ese parque, cargará desde tu teléfono sin necesitar internet. Combinado con el GPS de tu celular, vas a ver tu posición en tiempo real aunque no tengas señal.',
          en: 'It\'s very simple: 1) Go to the "Maps" section with Wi-Fi or data. 2) Find the park you are going to visit and tap "Download map". Tiles are saved automatically on your device. 3) Done — the next time you open that park\'s map, it will load from your phone without needing internet. Combined with your phone\'s GPS, you will see your real-time position even without signal.',
        },
      },
      {
        q: {
          es: '¿El mapa funciona bien en móvil?',
          en: 'Does the map work well on mobile?',
        },
        a: {
          es: 'Sí. El mapa interactivo está optimizado para pantallas móviles con gestos táctiles para zoom y desplazamiento. La versión web adapta el tamaño automáticamente y la versión nativa usa un WebView con Leaflet integrado.',
          en: 'Yes. The interactive map is optimised for mobile screens with touch gestures for zoom and panning. The web version adapts its size automatically and the native version uses a WebView with integrated Leaflet.',
        },
      },
    ],
  },
  {
    category: { es: 'RUTAS Y TREKKING', en: 'ROUTES & TREKKING' },
    items: [
      {
        q: {
          es: '¿Cuántas rutas tiene la aplicación?',
          en: 'How many routes does the app have?',
        },
        a: {
          es: 'Sliabh cuenta con más de 30 rutas detalladas de trekking y montañismo en Argentina, distribuidas en 6 regiones geográficas: Patagonia Sur, Patagonia Norte, Cuyo, Norte NOA, Sierras Centrales y Litoral.',
          en: 'Sliabh has over 30 detailed trekking and mountaineering routes in Argentina, spread across 6 geographical regions: Southern Patagonia, Northern Patagonia, Cuyo, NOA North, Central Sierras and Litoral.',
        },
      },
      {
        q: {
          es: '¿Hay rutas para principiantes?',
          en: 'Are there routes for beginners?',
        },
        a: {
          es: 'Sí. Rutas como el Cerro Campanario en Bariloche (1h de subida), la Catarata del Río Arrayanes en Los Alerces o el sendero costero de Tierra del Fuego son accesibles para personas con poca experiencia en trekking.',
          en: 'Yes. Routes like Cerro Campanario in Bariloche (1h ascent), the Río Arrayanes waterfall in Los Alerces or the coastal trail in Tierra del Fuego are accessible for people with little trekking experience.',
        },
      },
      {
        q: {
          es: '¿Puedo filtrar las rutas por dificultad?',
          en: 'Can I filter routes by difficulty?',
        },
        a: {
          es: 'Sí, desde la sección "Rutas" podés filtrar por dificultad (fácil, moderada, difícil, técnica), región, duración y actividad (trekking, alta montaña, travesía). Los filtros se combinan para refinar los resultados.',
          en: 'Yes, from the "Routes" section you can filter by difficulty (easy, moderate, hard, technical), region, duration and activity (trekking, high altitude, traverse). Filters combine to refine results.',
        },
      },
      {
        q: {
          es: '¿Qué significa la dificultad "técnica"?',
          en: 'What does "technical" difficulty mean?',
        },
        a: {
          es: 'Las rutas técnicas requieren equipamiento especializado (cuerdas, crampones, piolet) y experiencia en alpinismo. El Aconcagua y el Cerro Torre son ejemplos. No se recomiendan sin guía certificado y preparación previa.',
          en: 'Technical routes require specialised equipment (ropes, crampons, ice axe) and mountaineering experience. Aconcagua and Cerro Torre are examples. They are not recommended without a certified guide and prior preparation.',
        },
      },
      {
        q: {
          es: '¿Las rutas tienen waypoints marcados?',
          en: 'Do the routes have marked waypoints?',
        },
        a: {
          es: 'Sí. Cada ruta tiene waypoints numerados para los puntos clave: inicio, bifurcaciones, refugios, cumbres y campamentos. Estos waypoints están incluidos en el archivo GPX descargable.',
          en: 'Yes. Each route has numbered waypoints for key points: start, junctions, huts, summits and campsites. These waypoints are included in the downloadable GPX file.',
        },
      },
      {
        q: {
          es: '¿Puedo planificar una expedición en Sliabh?',
          en: 'Can I plan an expedition in Sliabh?',
        },
        a: {
          es: 'La sección "Planificar" te permite crear itinerarios personalizados seleccionando etapas de múltiples rutas. Podés guardar el plan, exportarlo como GPX y compartirlo con compañeros de expedición.',
          en: 'The "Plan" section lets you create custom itineraries by selecting stages from multiple routes. You can save the plan, export it as GPX and share it with expedition partners.',
        },
      },
    ],
  },
  {
    category: { es: 'TIERRA DEL FUEGO', en: 'TIERRA DEL FUEGO' },
    items: [
      {
        q: {
          es: '¿Qué es la ruta Tierra del Fuego Costera?',
          en: 'What is the Tierra del Fuego Coastal route?',
        },
        a: {
          es: 'Es la ruta costera del Parque Nacional Tierra del Fuego, que recorre la bahía Lapataia y el Canal Beagle. Distancia aproximada de 20 km, dificultad baja-moderada. Es una de las rutas más accesibles y fotogénicas del sur de Argentina.',
          en: 'It is the coastal route of Tierra del Fuego National Park, running along Lapataia Bay and the Beagle Channel. Approximately 20 km, low-to-moderate difficulty. One of the most accessible and scenic routes in southern Argentina.',
        },
      },
      {
        q: {
          es: '¿Cuánto dura la ruta Tierra del Fuego Costera?',
          en: 'How long does the Tierra del Fuego Coastal route take?',
        },
        a: {
          es: 'La ruta completa se puede hacer en 1 día (6-8 horas). Si querés disfrutar el paisaje con calma, muchos viajeros dividen el trekking en dos días con campamento en los refugios del parque.',
          en: 'The full route can be done in 1 day (6–8 hours). If you want to enjoy the scenery at a slower pace, many travellers split the trek into two days with camping at the park\'s huts.',
        },
      },
      {
        q: {
          es: '¿Cuál es la dificultad de Tierra del Fuego Costera?',
          en: 'What is the difficulty of the Tierra del Fuego Coastal route?',
        },
        a: {
          es: 'La dificultad es baja a moderada. El terreno es relativamente plano con algunas subidas suaves. No requiere equipamiento técnico, aunque es imprescindible llevar ropa impermeable dado el clima variable de Ushuaia.',
          en: 'The difficulty is low to moderate. The terrain is relatively flat with some gentle ascents. No technical equipment is needed, though waterproof clothing is essential given Ushuaia\'s variable weather.',
        },
      },
      {
        q: {
          es: '¿Hay que pagar entrada al Parque Nacional Tierra del Fuego?',
          en: 'Is there an entrance fee for Tierra del Fuego National Park?',
        },
        a: {
          es: 'Sí, el parque cobra entrada que varía según la temporada y la procedencia del visitante (argentino o extranjero). El pago se realiza en la entrada principal o en línea a través del sistema de reservas de Parques Nacionales de Argentina.',
          en: 'Yes, the park charges an entrance fee that varies by season and visitor origin (Argentine or foreign). Payment is made at the main entrance or online through Argentina\'s National Parks reservation system.',
        },
      },
      {
        q: {
          es: '¿Cuál es la mejor época para visitar Tierra del Fuego?',
          en: 'What is the best time to visit Tierra del Fuego?',
        },
        a: {
          es: 'Noviembre a marzo (verano austral) es la mejor época con días largos de hasta 17 horas de luz. Diciembre-enero son los meses más cálidos (10-16°C). Evitá julio-agosto donde las temperaturas bajan a -5°C y muchos senderos están cubiertos de nieve.',
          en: 'November to March (austral summer) is the best time with long days of up to 17 hours of daylight. December–January are the warmest months (10–16°C). Avoid July–August when temperatures drop to -5°C and many trails are snow-covered.',
        },
      },
      {
        q: {
          es: '¿Cómo llego al Parque Nacional Tierra del Fuego?',
          en: 'How do I get to Tierra del Fuego National Park?',
        },
        a: {
          es: 'Desde Ushuaia hay buses regulares (15 min) que salen del centro cada 30 minutos en temporada alta. También podés ir en taxi o auto alquilado. El parque está a 12 km al oeste de Ushuaia por la Ruta Nacional 3.',
          en: 'From Ushuaia there are regular buses (15 min) departing from the centre every 30 minutes in high season. You can also go by taxi or rental car. The park is 12 km west of Ushuaia on National Route 3.',
        },
      },
      {
        q: {
          es: '¿Hay refugios o alojamiento dentro del parque?',
          en: 'Are there huts or accommodation inside the park?',
        },
        a: {
          es: 'Hay zonas de acampada habilitadas con equipamiento básico (agua potable, sanitarios). No hay refugios con camas. El camping "Lago Roca" es el principal punto de acampada con más servicios.',
          en: 'There are designated camping areas with basic facilities (drinking water, toilets). There are no huts with beds. "Lago Roca" campsite is the main camping spot with the most services.',
        },
      },
      {
        q: {
          es: '¿Qué llevar para el Parque Nacional Tierra del Fuego?',
          en: 'What to bring to Tierra del Fuego National Park?',
        },
        a: {
          es: 'Imprescindible: ropa impermeable (lluvia y viento), calzado de trekking waterproof, comida para el día, agua (mínimo 2 litros), repelente de insectos, protector solar, mapa o GPX descargado. El clima puede cambiar bruscamente en minutos.',
          en: 'Essential: waterproof clothing (rain and wind), waterproof trekking footwear, food for the day, water (minimum 2 litres), insect repellent, sunscreen, downloaded map or GPX. Weather can change abruptly within minutes.',
        },
      },
    ],
  },
  {
    category: { es: 'PARQUES NACIONALES', en: 'NATIONAL PARKS' },
    items: [
      {
        q: {
          es: '¿Cuántos parques nacionales tiene Argentina?',
          en: 'How many national parks does Argentina have?',
        },
        a: {
          es: 'Argentina tiene 39 parques nacionales administrados por la Administración de Parques Nacionales (APN). Sliabh incluye fichas, mapas y descargas GPX para los 32 parques con mayor actividad de trekking.',
          en: 'Argentina has 39 national parks administered by the National Parks Administration (APN). Sliabh includes profiles, maps and GPX downloads for the 32 parks with the most trekking activity.',
        },
      },
      {
        q: {
          es: '¿Qué parques tienen certificación UNESCO?',
          en: 'Which parks have UNESCO recognition?',
        },
        a: {
          es: 'Los Glaciares, Los Alerces, Talampaya/Ischigualasto, Iguazú y la Quebrada de Humahuaca tienen reconocimiento UNESCO. Están marcados con el badge verde "UNESCO" en la sección de mapas.',
          en: 'Los Glaciares, Los Alerces, Talampaya/Ischigualasto, Iguazú and Quebrada de Humahuaca have UNESCO recognition. They are marked with a green "UNESCO" badge in the maps section.',
        },
      },
      {
        q: {
          es: '¿Qué es el Parque Los Glaciares y por qué es famoso?',
          en: 'What is Los Glaciares Park and why is it famous?',
        },
        a: {
          es: 'Es el parque más extenso de la Patagonia argentina (7.269 km²) y Patrimonio Mundial UNESCO. Alberga el Glaciar Perito Moreno, el Cerro Fitz Roy, el Cerro Torre y los campos de hielo patagónicos más grandes fuera de los polos.',
          en: 'It is the largest park in Argentine Patagonia (7,269 km²) and a UNESCO World Heritage Site. It hosts Perito Moreno Glacier, Cerro Fitz Roy, Cerro Torre and the largest Patagonian ice fields outside the poles.',
        },
      },
      {
        q: {
          es: '¿Cuál es la montaña más alta de Argentina?',
          en: 'What is the highest mountain in Argentina?',
        },
        a: {
          es: 'El Aconcagua (6.961 m) en Mendoza es la montaña más alta de Argentina, de América y del hemisferio sur. La ruta normal sale desde Horcones y requiere entre 18 y 22 días según las condiciones.',
          en: 'Aconcagua (6,961 m) in Mendoza is the highest mountain in Argentina, the Americas and the Southern Hemisphere. The normal route starts from Horcones and takes 18 to 22 days depending on conditions.',
        },
      },
      {
        q: {
          es: '¿Qué parque tiene los alerces milenarios?',
          en: 'Which park has the ancient alerce trees?',
        },
        a: {
          es: 'El Parque Nacional Los Alerces en Chubut protege bosques de alerce (Fitzroya cupressoides) de hasta 2.600 años de antigüedad. El alerce más antiguo registrado tiene 2.620 años y está en el sendero del Alerzal Milenario.',
          en: 'Los Alerces National Park in Chubut protects forests of alerce (Fitzroya cupressoides) up to 2,600 years old. The oldest recorded alerce is 2,620 years old and stands on the Alerzal Milenario trail.',
        },
      },
      {
        q: {
          es: '¿Cuáles son los parques más visitados de Argentina?',
          en: 'What are the most visited parks in Argentina?',
        },
        a: {
          es: 'Los más visitados son: Los Glaciares (Fitz Roy y Perito Moreno), Tierra del Fuego (Ushuaia), Nahuel Huapi (Bariloche), Iguazú y Los Alerces. En temporada alta se recomienda reservar entrada y acampada con anticipación.',
          en: 'The most visited are: Los Glaciares (Fitz Roy and Perito Moreno), Tierra del Fuego (Ushuaia), Nahuel Huapi (Bariloche), Iguazú and Los Alerces. In high season, book entrance tickets and campsites well in advance.',
        },
      },
      {
        q: {
          es: '¿Los parques nacionales están abiertos todo el año?',
          en: 'Are national parks open year-round?',
        },
        a: {
          es: 'La mayoría está abierto todo el año, aunque el acceso a ciertos senderos puede estar restringido en invierno por nieve. Los parques del norte (Iguazú, Calilegua) mantienen acceso todo el año. Consultá la web de la APN antes de viajar.',
          en: 'Most parks are open year-round, although access to certain trails may be restricted in winter due to snow. Northern parks (Iguazú, Calilegua) maintain access all year. Check the APN website before travelling.',
        },
      },
    ],
  },
  {
    category: { es: 'SEGURIDAD Y EQUIPO', en: 'SAFETY & GEAR' },
    items: [
      {
        q: {
          es: '¿Qué debo llevar siempre en trekking en Patagonia?',
          en: 'What should I always bring for trekking in Patagonia?',
        },
        a: {
          es: 'Equipo básico: ropa impermeable (gore-tex o similar), muda de ropa seca en bolsa hermética, protección solar, mapa/GPX, agua purificada, botiquín básico, silbato, linterna, comida extra para 1 día. En el sur: ropa de abrigo incluso en verano.',
          en: 'Basic kit: waterproof clothing (gore-tex or similar), dry change of clothes in a dry bag, sun protection, map/GPX, purified water, basic first-aid kit, whistle, headlamp, extra food for 1 day. In the south: warm clothing even in summer.',
        },
      },
      {
        q: {
          es: '¿Cómo evito la hipotermia en la montaña?',
          en: 'How do I avoid hypothermia in the mountains?',
        },
        a: {
          es: 'Nunca salgas con ropa de algodón (retiene humedad). Usá el sistema de capas: capa base térmica, capa media (polar), capa externa (impermeable). Si te mojás, cambiá ropa seca de inmediato. Comé regularmente para mantener el calor corporal.',
          en: 'Never go out in cotton clothing (it retains moisture). Use the layering system: thermal base layer, mid layer (fleece), outer layer (waterproof). If you get wet, change into dry clothes immediately. Eat regularly to maintain body heat.',
        },
      },
      {
        q: {
          es: '¿Qué hacer si hay tormenta eléctrica en la montaña?',
          en: 'What to do if there is a thunderstorm in the mountains?',
        },
        a: {
          es: 'Descendé de cumbres y crestas inmediatamente. Buscá refugio en zonas bajas alejadas de árboles aislados, cuerpos de agua y cuevas. Si estás en campo abierto, agachate con los pies juntos, alejado de grupos. No uses paraguas ni bastones de metal.',
          en: 'Descend from summits and ridges immediately. Seek shelter in low areas away from isolated trees, bodies of water and caves. If you are in open ground, crouch with feet together, away from groups. Do not use umbrellas or metal poles.',
        },
      },
      {
        q: {
          es: '¿Es necesario contratar un guía para rutas difíciles?',
          en: 'Is it necessary to hire a guide for difficult routes?',
        },
        a: {
          es: 'Para rutas técnicas como el Aconcagua, Cerro Torre o ascensos en Los Glaciares es obligatorio o muy recomendado. En Argentina, los guías de montaña están certificados por la Asociación Argentina de Guías de Montaña (AAGM). Verificá siempre la habilitación.',
          en: 'For technical routes such as Aconcagua, Cerro Torre or ascents in Los Glaciares it is mandatory or strongly recommended. In Argentina, mountain guides are certified by the Argentine Mountain Guides Association (AAGM). Always verify their licence.',
        },
      },
      {
        q: {
          es: '¿Qué calzado usar para trekking en Patagonia?',
          en: 'What footwear to use for trekking in Patagonia?',
        },
        a: {
          es: 'Botas de trekking impermeables y con buen agarre son esenciales. Para rutas largas, elegí botas con caña media o alta para soporte del tobillo. Evitá zapatillas comunes: las rocas húmedas y el barro patagónico requieren suela Vibram o similar.',
          en: 'Waterproof trekking boots with good grip are essential. For long routes, choose mid or high-cut boots for ankle support. Avoid ordinary trainers: wet rocks and Patagonian mud require a Vibram sole or similar.',
        },
      },
    ],
  },
  {
    category: { es: 'APLICACIÓN', en: 'APP' },
    items: [
      {
        q: {
          es: '¿Puedo contribuir con nuevas rutas?',
          en: 'Can I contribute new routes?',
        },
        a: {
          es: 'Sí, desde la sección "Contribuir" podés enviar trazados GPX, fotos y descripciones de rutas que hayas explorado. El equipo de Sliabh revisa cada contribución antes de publicarla.',
          en: 'Yes, from the "Contribute" section you can submit GPX tracks, photos and descriptions of routes you have explored. The Sliabh team reviews each contribution before publishing it.',
        },
      },
      {
        q: {
          es: '¿Cómo reporto un problema con la aplicación?',
          en: 'How do I report a problem with the app?',
        },
        a: {
          es: 'Usá el formulario de contacto en la sección "Contribuir", o reportá el problema directamente en el repositorio de GitHub del proyecto. Incluí capturas de pantalla y descripción del problema para agilizar la resolución.',
          en: 'Use the contact form in the "Contribute" section, or report the issue directly in the project\'s GitHub repository. Include screenshots and a description of the problem to speed up the resolution.',
        },
      },
      {
        q: {
          es: '¿Con qué frecuencia se actualiza el contenido?',
          en: 'How often is the content updated?',
        },
        a: {
          es: 'El contenido de rutas y parques se actualiza regularmente según las condiciones reportadas por la comunidad y los guardaparques. Las actualizaciones de la app se publican en Netlify y están disponibles automáticamente en el navegador.',
          en: 'Route and park content is updated regularly based on conditions reported by the community and park rangers. App updates are published on Netlify and are automatically available in the browser.',
        },
      },
      {
        q: {
          es: '¿La app requiere muchos datos móviles?',
          en: 'Does the app use a lot of mobile data?',
        },
        a: {
          es: 'La app es liviana en datos para navegación normal. Las imágenes de parques y mapas se cargan bajo demanda. Para uso offline, la descarga inicial de mapas de un parque puede pesar entre 20 MB y 142 MB según el área y el nivel de detalle.',
          en: 'The app is light on data for normal browsing. Park images and maps load on demand. For offline use, the initial download of a park\'s maps can range from 20 MB to 142 MB depending on the area and level of detail.',
        },
      },
      {
        q: {
          es: '¿Puedo usar Sliabh desde mi computadora?',
          en: 'Can I use Sliabh from my computer?',
        },
        a: {
          es: 'Sí. La versión web (sliabh.netlify.app) funciona perfectamente en computadoras de escritorio y laptops. Desde el navegador tenés acceso a todas las funciones: mapas, descargas GPX, rutas y guías de supervivencia.',
          en: 'Yes. The web version (sliabh.netlify.app) works perfectly on desktop computers and laptops. From the browser you have access to all features: maps, GPX downloads, routes and survival guides.',
        },
      },
    ],
  },
];

interface FaqItemProps {
  q: string;
  a: string;
  c: any;
  isLast: boolean;
  photoUrl: string;
}

function FaqItem({ q, a, c, isLast, photoUrl }: FaqItemProps) {
  const [open, setOpen] = useState(false);
  return (
    <View style={[fS.item, !isLast && { borderBottomWidth: 1, borderBottomColor: c.border }]}>
      <Image source={{ uri: photoUrl }} style={fS.photo} resizeMode="cover" />
      <TouchableOpacity
        style={fS.question}
        onPress={() => setOpen((v) => !v)}
        activeOpacity={0.75}
      >
        <Text style={[fS.questionText, { color: c.text }]}>{q}</Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={c.muted}
          style={{ flexShrink: 0, marginLeft: 8 }}
        />
      </TouchableOpacity>
      {open && (
        <View style={fS.answer}>
          <Text style={[fS.answerText, { color: c.muted }]}>{a}</Text>
        </View>
      )}
    </View>
  );
}

export default function FaqScreen() {
  const { isDark } = useTheme();
  const { lang, t } = useLangStore();
  const { width } = useWindowDimensions();
  const contentW = Math.min(width, MAX_CONTENT);
  const sidePad = Math.max(16, (width - contentW) / 2);

  const c = isDark
    ? { bg: '#070b14', surface: '#0f1724', elevated: '#162035', border: '#1e2d42', text: '#f0f9ff', muted: '#64748b' }
    : { bg: '#f8fafc', surface: '#ffffff', elevated: '#f1f5f9', border: '#e2e8f0', text: '#0f172a', muted: '#64748b' };

  const totalQuestions = FAQ_DATA.reduce((acc, cat) => acc + cat.items.length, 0);

  return (
    <ScrollView
      style={[fS.root, { backgroundColor: c.bg }]}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 64 }}
    >
      {/* Header */}
      <View style={[fS.header, { borderBottomColor: c.border, backgroundColor: c.surface, paddingHorizontal: sidePad }]}>
        <Text style={[fS.eyebrow, { color: c.muted }]}>
          {t('PREGUNTAS FRECUENTES', 'FREQUENTLY ASKED QUESTIONS')}
        </Text>
        <Text style={[fS.title, { color: c.text }]}>
          {t('Todo lo que necesitás saber', 'Everything you need to know')}
        </Text>
        <Text style={[fS.subtitle, { color: c.muted }]}>
          {totalQuestions} {t(
            'preguntas sobre mapas, rutas, GPX y parques nacionales de Argentina.',
            'questions about maps, routes, GPX files and Argentina\'s national parks.',
          )}
        </Text>
      </View>

      {/* FAQ sections */}
      <View style={{ paddingHorizontal: sidePad, paddingTop: 32 }}>
        {(() => {
          let globalIdx = 0;
          return FAQ_DATA.map((section) => (
            <View key={section.category.es} style={fS.section}>
              <View style={fS.categoryRow}>
                <View style={[fS.categoryDot, { backgroundColor: '#22c55e' }]} />
                <Text style={[fS.category, { color: '#22c55e' }]}>
                  {lang === 'en' ? section.category.en : section.category.es}
                </Text>
              </View>
              <View style={[fS.card, { backgroundColor: c.surface, borderColor: c.border }]}>
                {section.items.map((item, idx) => {
                  const photoUrl = PATAGONIA_PHOTOS[globalIdx % PATAGONIA_PHOTOS.length];
                  globalIdx++;
                  return (
                    <FaqItem
                      key={item.q.es}
                      q={lang === 'en' ? item.q.en : item.q.es}
                      a={lang === 'en' ? item.a.en : item.a.es}
                      c={c}
                      isLast={idx === section.items.length - 1}
                      photoUrl={photoUrl}
                    />
                  );
                })}
              </View>
            </View>
          ));
        })()}
      </View>

      {Platform.OS === 'web' && <WebFooter />}
    </ScrollView>
  );
}

const fS = StyleSheet.create({
  root: { flex: 1 },
  header: {
    borderBottomWidth: 1,
    paddingTop: 40,
    paddingBottom: 28,
  },
  eyebrow: {
    fontSize: 11, fontWeight: '700', letterSpacing: 2,
    textTransform: 'uppercase', marginBottom: 10,
  },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, marginBottom: 8 },
  subtitle: { fontSize: 14, lineHeight: 22 },
  section: { marginBottom: 28 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  categoryDot: { width: 6, height: 6, borderRadius: 3 },
  category: {
    fontSize: 10, fontWeight: '700', letterSpacing: 3, textTransform: 'uppercase',
  },
  card: {
    borderRadius: 16, borderWidth: 1, overflow: 'hidden',
  },
  item: { paddingHorizontal: 16 },
  question: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 16,
  },
  questionText: { fontSize: 15, fontWeight: '600', flex: 1, lineHeight: 21 },
  answer: { paddingBottom: 16 },
  photo: { width: '100%', height: 160, borderRadius: 0 },
  answerText: { fontSize: 14, lineHeight: 22 },
});
