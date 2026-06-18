import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, useWindowDimensions, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { WebFooter } from '../../src/components/layout/WebFooter';

const MAX_CONTENT = 800;

const FAQ_DATA = [
  {
    category: 'GENERAL',
    items: [
      {
        q: '¿Qué es Sliabh?',
        a: 'Sliabh es una aplicación de montaña diseñada para explorar los parques nacionales y rutas de trekking de Argentina. Ofrece mapas interactivos, archivos GPX descargables, guías de supervivencia y fichas detalladas de más de 39 parques nacionales.',
      },
      {
        q: '¿La aplicación funciona sin conexión a internet?',
        a: 'Sí. Los archivos GPX descargados, las guías de supervivencia y los mapas pre-cacheados funcionan completamente offline. Descargá el GPX y los mapas de cada parque antes de salir al campo para tenerlos disponibles sin señal.',
      },
      {
        q: '¿En qué plataformas está disponible Sliabh?',
        a: 'Sliabh funciona como aplicación web (sliabh.netlify.app), y como aplicación móvil nativa para iOS y Android. Todas las versiones comparten el mismo contenido y se actualizan simultáneamente.',
      },
      {
        q: '¿Sliabh es gratuita?',
        a: 'La mayoría del contenido de Sliabh es de acceso libre. Algunas funciones avanzadas como la sincronización de rutas y el historial de expediciones requieren crear una cuenta.',
      },
      {
        q: '¿Cómo me registro en la aplicación?',
        a: 'Tocá el botón "Únete a la comunidad" en la pantalla de inicio, o accedé desde el menú superior. El registro es gratuito y requiere solo un correo electrónico.',
      },
    ],
  },
  {
    category: 'ARCHIVOS GPX',
    items: [
      {
        q: '¿Cómo descargo el archivo GPX de un parque?',
        a: 'En la sección "Mapas", encontrás una tarjeta por cada parque nacional. Tocá el botón "GPX / OsmAnd" para descargar el archivo. El archivo se guarda en tu dispositivo con el nombre del parque.',
      },
      {
        q: '¿Para qué sirve el archivo GPX?',
        a: 'El archivo GPX (GPS Exchange Format) contiene los waypoints y trazados de las rutas. Podés importarlo en aplicaciones como OsmAnd, Gaia GPS, Garmin Connect, Komoot o cualquier dispositivo GPS para navegar offline con precisión.',
      },
      {
        q: '¿Cómo importo el GPX en OsmAnd?',
        a: 'En OsmAnd: Menú → Mis lugares → Pistas → Importar. Seleccioná el archivo .gpx descargado. El parque aparecerá como track en el mapa y podés activarlo para navegar sin conexión.',
      },
      {
        q: '¿Cómo importo el GPX en Garmin?',
        a: 'Conectá tu Garmin por USB a la computadora. Copiá el archivo .gpx a la carpeta /GPX o /Garmin/GPX del dispositivo. El track aparecerá en el menú de actividades de tu GPS.',
      },
      {
        q: '¿Los archivos GPX incluyen curvas de nivel?',
        a: 'Los archivos GPX de Sliabh incluyen waypoints clave y el trazado principal de cada ruta. Para curvas de nivel detalladas, recomendamos combinarlos con mapas topográficos en OsmAnd (disponibles gratuitamente en la app).',
      },
      {
        q: '¿Puedo usar el GPX en Komoot o Strava?',
        a: 'Sí. Importá el archivo GPX desde la sección de rutas de Komoot (Planificar ruta → Importar GPX) o desde Strava (Dashboard → Crear actividad → Subir archivo GPX). Ambas plataformas soportan el formato estándar GPX 1.1.',
      },
      {
        q: '¿Qué pasa si el GPX no se descarga correctamente?',
        a: 'Verificá que tu navegador no esté bloqueando las descargas automáticas. En Chrome/Safari, fijate en la barra de descarga o en la carpeta de descargas del dispositivo. El archivo siempre se llama [nombre_parque].gpx.',
      },
    ],
  },
  {
    category: 'MAPAS',
    items: [
      {
        q: '¿Cómo funciona el mapa interactivo?',
        a: 'El mapa interactivo usa OpenStreetMap a través de Leaflet. Podés explorar toda Argentina, hacer zoom, ver la ubicación de cada parque nacional con marcadores verdes y leer información básica al tocar cada marcador.',
      },
      {
        q: '¿Cómo uso el botón "Ver mapa" de cada parque?',
        a: 'Al tocar "Ver mapa" en la tarjeta de un parque, el mapa interactivo vuela automáticamente hasta ese parque con el nivel de zoom correcto para verlo completo. Esto funciona tanto en web como en la app nativa.',
      },
      {
        q: '¿Puedo cambiar el estilo del mapa?',
        a: 'Sí. El mapa soporta varios estilos: OpenStreetMap (estándar), OpenTopoMap (topográfico con curvas de nivel), modo oscuro y Argenmap (cartografía oficial IGN Argentina). Seleccioná el estilo desde el panel del mapa.',
      },
      {
        q: '¿El mapa muestra mi ubicación en tiempo real?',
        a: 'En la versión nativa (iOS/Android) podés activar la geolocalización para ver tu posición en tiempo real. En la versión web, esta función depende de los permisos del navegador.',
      },
      {
        q: '¿Qué es Argenmap?',
        a: 'Argenmap es la cartografía oficial del Instituto Geográfico Nacional (IGN) de Argentina. Es especialmente útil para rutas en zonas andinas donde los datos de OpenStreetMap pueden ser menos detallados.',
      },
      {
        q: '¿Puedo descargar mapas para uso offline?',
        a: 'Los mapas se pre-cachean automáticamente cuando visitás un parque. Para garantizar el acceso offline, abrí el mapa de cada parque mientras tenés conexión. Los tiles se guardan en el almacenamiento local del dispositivo.',
      },
      {
        q: '¿El mapa funciona bien en móvil?',
        a: 'Sí. El mapa interactivo está optimizado para pantallas móviles con gestos táctiles para zoom y desplazamiento. La versión web adapta el tamaño automáticamente y la versión nativa usa un WebView con Leaflet integrado.',
      },
    ],
  },
  {
    category: 'RUTAS Y TREKKING',
    items: [
      {
        q: '¿Cuántas rutas tiene la aplicación?',
        a: 'Sliabh cuenta con más de 30 rutas detalladas de trekking y montañismo en Argentina, distribuidas en 6 regiones geográficas: Patagonia Sur, Patagonia Norte, Cuyo, Norte NOA, Sierras Centrales y Litoral.',
      },
      {
        q: '¿Hay rutas para principiantes?',
        a: 'Sí. Rutas como el Cerro Campanario en Bariloche (1h de subida), la Catarata del Río Arrayanes en Los Alerces o el sendero costero de Tierra del Fuego son accesibles para personas con poca experiencia en trekking.',
      },
      {
        q: '¿Puedo filtrar las rutas por dificultad?',
        a: 'Sí, desde la sección "Rutas" podés filtrar por dificultad (fácil, moderada, difícil, técnica), región, duración y actividad (trekking, alta montaña, travesía). Los filtros se combinan para refinar los resultados.',
      },
      {
        q: '¿Qué significa la dificultad "técnica"?',
        a: 'Las rutas técnicas requieren equipamiento especializado (cuerdas, crampones, piolet) y experiencia en alpinismo. El Aconcagua y el Cerro Torre son ejemplos. No se recomiendan sin guía certificado y preparación previa.',
      },
      {
        q: '¿Las rutas tienen waypoints marcados?',
        a: 'Sí. Cada ruta tiene waypoints numerados para los puntos clave: inicio, bifurcaciones, refugios, cumbres y campamentos. Estos waypoints están incluidos en el archivo GPX descargable.',
      },
      {
        q: '¿Puedo planificar una expedición en Sliabh?',
        a: 'La sección "Planificar" te permite crear itinerarios personalizados seleccionando etapas de múltiples rutas. Podés guardar el plan, exportarlo como GPX y compartirlo con compañeros de expedición.',
      },
    ],
  },
  {
    category: 'TIERRA DEL FUEGO',
    items: [
      {
        q: '¿Qué es la ruta Tierra del Fuego Costera?',
        a: 'Es la ruta costera del Parque Nacional Tierra del Fuego, que recorre la bahía Lapataia y el Canal Beagle. Distancia aproximada de 20 km, dificultad baja-moderada. Es una de las rutas más accesibles y fotogénicas del sur de Argentina.',
      },
      {
        q: '¿Cuánto dura la ruta Tierra del Fuego Costera?',
        a: 'La ruta completa se puede hacer en 1 día (6-8 horas). Si querés disfrutar el paisaje con calma, muchos viajeros dividen el trekking en dos días con campamento en los refugios del parque.',
      },
      {
        q: '¿Cuál es la dificultad de Tierra del Fuego Costera?',
        a: 'La dificultad es baja a moderada. El terreno es relativamente plano con algunas subidas suaves. No requiere equipamiento técnico, aunque es imprescindible llevar ropa impermeable dado el clima variable de Ushuaia.',
      },
      {
        q: '¿Hay que pagar entrada al Parque Nacional Tierra del Fuego?',
        a: 'Sí, el parque cobra entrada que varía según la temporada y la procedencia del visitante (argentino o extranjero). El pago se realiza en la entrada principal o en línea a través del sistema de reservas de Parques Nacionales de Argentina.',
      },
      {
        q: '¿Cuál es la mejor época para visitar Tierra del Fuego?',
        a: 'Noviembre a marzo (verano austral) es la mejor época con días largos de hasta 17 horas de luz. Diciembre-enero son los meses más cálidos (10-16°C). Evitá julio-agosto donde las temperaturas bajan a -5°C y muchos senderos están cubiertos de nieve.',
      },
      {
        q: '¿Cómo llego al Parque Nacional Tierra del Fuego?',
        a: 'Desde Ushuaia hay buses regulares (15 min) que salen del centro cada 30 minutos en temporada alta. También podés ir en taxi o auto alquilado. El parque está a 12 km al oeste de Ushuaia por la Ruta Nacional 3.',
      },
      {
        q: '¿Hay refugios o alojamiento dentro del parque?',
        a: 'Hay zonas de acampada habilitadas con equipamiento básico (agua potable, sanitarios). No hay refugios con camas. El camping "Lago Roca" es el principal punto de acampada con más servicios.',
      },
      {
        q: '¿Qué llevar para el Parque Nacional Tierra del Fuego?',
        a: 'Imprescindible: ropa impermeable (lluvia y viento), calzado de trekking waterproof, comida para el día, agua (mínimo 2 litros), repelente de insectos, protector solar, mapa o GPX descargado. El clima puede cambiar bruscamente en minutos.',
      },
    ],
  },
  {
    category: 'PARQUES NACIONALES',
    items: [
      {
        q: '¿Cuántos parques nacionales tiene Argentina?',
        a: 'Argentina tiene 39 parques nacionales administrados por la Administración de Parques Nacionales (APN). Sliabh incluye fichas, mapas y descargas GPX para los 32 parques con mayor actividad de trekking.',
      },
      {
        q: '¿Qué parques tienen certificación UNESCO?',
        a: 'Los Glaciares, Los Alerces, Talampaya/Ischigualasto, Iguazú y la Quebrada de Humahuaca tienen reconocimiento UNESCO. Están marcados con el badge verde "UNESCO" en la sección de mapas.',
      },
      {
        q: '¿Qué es el Parque Los Glaciares y por qué es famoso?',
        a: 'Es el parque más extenso de la Patagonia argentina (7.269 km²) y Patrimonio Mundial UNESCO. Alberga el Glaciar Perito Moreno, el Cerro Fitz Roy, el Cerro Torre y los campos de hielo patagónicos más grandes fuera de los polos.',
      },
      {
        q: '¿Cuál es la montaña más alta de Argentina?',
        a: 'El Aconcagua (6.961 m) en Mendoza es la montaña más alta de Argentina, de América y del hemisferio sur. La ruta normal sale desde Horcones y requiere entre 18 y 22 días según las condiciones.',
      },
      {
        q: '¿Qué parque tiene los alerces milenarios?',
        a: 'El Parque Nacional Los Alerces en Chubut protege bosques de alerce (Fitzroya cupressoides) de hasta 2.600 años de antigüedad. El alerce más antiguo registrado tiene 2.620 años y está en el sendero del Alerzal Milenario.',
      },
      {
        q: '¿Cuáles son los parques más visitados de Argentina?',
        a: 'Los más visitados son: Los Glaciares (Fitz Roy y Perito Moreno), Tierra del Fuego (Ushuaia), Nahuel Huapi (Bariloche), Iguazú y Los Alerces. En temporada alta se recomienda reservar entrada y acampada con anticipación.',
      },
      {
        q: '¿Los parques nacionales están abiertos todo el año?',
        a: 'La mayoría está abierto todo el año, aunque el acceso a ciertos senderos puede estar restringido en invierno por nieve. Los parques del norte (Iguazú, Calilegua) mantienen acceso todo el año. Consultá la web de la APN antes de viajar.',
      },
    ],
  },
  {
    category: 'SEGURIDAD Y EQUIPO',
    items: [
      {
        q: '¿Qué debo llevar siempre en trekking en Patagonia?',
        a: 'Equipo básico: ropa impermeable (gore-tex o similar), muda de ropa seca en bolsa hermética, protección solar, mapa/GPX, agua purificada, botiquín básico, silbato, linterna, comida extra para 1 día. En el sur: ropa de abrigo incluso en verano.',
      },
      {
        q: '¿Cómo evito la hipotermia en la montaña?',
        a: 'Nunca salgas con ropa de algodón (retiene humedad). Usá el sistema de capas: capa base térmica, capa media (polar), capa externa (impermeable). Si te mojás, cambiá ropa seca de inmediato. Comé regularmente para mantener el calor corporal.',
      },
      {
        q: '¿Qué hacer si hay tormenta eléctrica en la montaña?',
        a: 'Descendé de cumbres y crestas inmediatamente. Buscá refugio en zonas bajas alejadas de árboles aislados, cuerpos de agua y cuevas. Si estás en campo abierto, agachate con los pies juntos, alejado de grupos. No uses paraguas ni bastones de metal.',
      },
      {
        q: '¿Es necesario contratar un guía para rutas difíciles?',
        a: 'Para rutas técnicas como el Aconcagua, Cerro Torre o ascensos en Los Glaciares es obligatorio o muy recomendado. En Argentina, los guías de montaña están certificados por la Asociación Argentina de Guías de Montaña (AAGM). Verificá siempre la habilitación.',
      },
      {
        q: '¿Qué calzado usar para trekking en Patagonia?',
        a: 'Botas de trekking impermeables y con buen agarre son esenciales. Para rutas largas, elegí botas con caña media o alta para soporte del tobillo. Evitá zapatillas comunes: las rocas húmedas y el barro patagónico requieren suela Vibram o similar.',
      },
    ],
  },
  {
    category: 'APLICACIÓN',
    items: [
      {
        q: '¿Puedo contribuir con nuevas rutas?',
        a: 'Sí, desde la sección "Contribuir" podés enviar trazados GPX, fotos y descripciones de rutas que hayas explorado. El equipo de Sliabh revisa cada contribución antes de publicarla.',
      },
      {
        q: '¿Cómo reporto un problema con la aplicación?',
        a: 'Usá el formulario de contacto en la sección "Contribuir", o reportá el problema directamente en el repositorio de GitHub del proyecto. Incluí capturas de pantalla y descripción del problema para agilizar la resolución.',
      },
      {
        q: '¿Con qué frecuencia se actualiza el contenido?',
        a: 'El contenido de rutas y parques se actualiza regularmente según las condiciones reportadas por la comunidad y los guardaparques. Las actualizaciones de la app se publican en Netlify y están disponibles automáticamente en el navegador.',
      },
      {
        q: '¿La app requiere muchos datos móviles?',
        a: 'La app es liviana en datos para navegación normal. Las imágenes de parques y mapas se cargan bajo demanda. Para uso offline, la descarga inicial de mapas de un parque puede pesar entre 20 MB y 142 MB según el área y el nivel de detalle.',
      },
      {
        q: '¿Puedo usar Sliabh desde mi computadora?',
        a: 'Sí. La versión web (sliabh.netlify.app) funciona perfectamente en computadoras de escritorio y laptops. Desde el navegador tenés acceso a todas las funciones: mapas, descargas GPX, rutas y guías de supervivencia.',
      },
    ],
  },
];

interface FaqItemProps {
  q: string;
  a: string;
  c: any;
  isLast: boolean;
}

function FaqItem({ q, a, c, isLast }: FaqItemProps) {
  const [open, setOpen] = useState(false);
  return (
    <View style={[fS.item, !isLast && { borderBottomWidth: 1, borderBottomColor: c.border }]}>
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
        <Text style={[fS.eyebrow, { color: c.muted }]}>PREGUNTAS FRECUENTES</Text>
        <Text style={[fS.title, { color: c.text }]}>Todo lo que necesitás saber</Text>
        <Text style={[fS.subtitle, { color: c.muted }]}>
          {totalQuestions} preguntas sobre mapas, rutas, GPX y parques nacionales de Argentina.
        </Text>
      </View>

      {/* FAQ sections */}
      <View style={{ paddingHorizontal: sidePad, paddingTop: 32 }}>
        {FAQ_DATA.map((section) => (
          <View key={section.category} style={fS.section}>
            <View style={fS.categoryRow}>
              <View style={[fS.categoryDot, { backgroundColor: '#22c55e' }]} />
              <Text style={[fS.category, { color: '#22c55e' }]}>{section.category}</Text>
            </View>
            <View style={[fS.card, { backgroundColor: c.surface, borderColor: c.border }]}>
              {section.items.map((item, idx) => (
                <FaqItem
                  key={item.q}
                  q={item.q}
                  a={item.a}
                  c={c}
                  isLast={idx === section.items.length - 1}
                />
              ))}
            </View>
          </View>
        ))}
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
  answerText: { fontSize: 14, lineHeight: 22 },
});
