import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Modal, ScrollView, Linking,
  StyleSheet, Animated, Platform, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WebFooter } from '../../src/components/layout/WebFooter';
import { useTheme } from '../../src/hooks/useTheme';
import { useNetwork } from '../../src/hooks/useNetwork';
import { downloadAreaTiles, isAreaCached, isTileCachingSupported } from '../../src/utils/offlineTiles';
import { downloadGpx } from '../../src/utils/gpx';

type DlState = 'idle' | 'downloading' | 'done';

const NATIONAL_PARKS = [
  {
    id: 'glaciares',
    name: 'Los Glaciares',
    province: 'Santa Cruz',
    region: 'Patagonia Sur',
    area_km2: 7269,
    highlights: 'Fitz Roy · Cerro Torre · Glaciar Perito Moreno',
    size: '142 MB',
    photo: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=75&fit=crop',
    coords: { lat: -49.3, lon: -73.05 },
    unesco: true,
  },
  {
    id: 'nahuel',
    name: 'Nahuel Huapi',
    province: 'Río Negro / Neuquén',
    region: 'Patagonia Norte',
    area_km2: 7050,
    highlights: 'Bariloche · Cerro Tronador · Refugio Frey',
    size: '118 MB',
    photo: 'https://bariloche.org/wp-content/uploads/2024/02/tronador-bariloche-febrero2024-franciscoraggio-barilocheorg.jpg',
    coords: { lat: -41.1, lon: -71.5 },
    unesco: false,
  },
  {
    id: 'lanin',
    name: 'Lanín',
    province: 'Neuquén',
    region: 'Patagonia Norte',
    area_km2: 3789,
    highlights: 'Volcán Lanín · Lago Huechulafquen · Araucarias',
    size: '87 MB',
    photo: 'https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=600&q=75&fit=crop',
    coords: { lat: -39.6, lon: -71.5 },
    unesco: false,
  },
  {
    id: 'alerces',
    name: 'Los Alerces',
    province: 'Chubut',
    region: 'Patagonia Norte',
    area_km2: 2630,
    highlights: 'Alerces milenarios · Lago Futalaufquen · Río Arrayanes',
    size: '94 MB',
    photo: 'https://www.lanacion.com.ar/resizer/v2/la-excursion-al-alerzal-milenario-es-muy-PVCDPJR5VVAWJIT4FVKD2XDA54.jpg?auth=229b98a1980a83812a56d98a710ce265d07bc9e539fe33bc1ca97141f54cf6a0&width=1200&height=800&quality=70&smart=true',
    coords: { lat: -42.8, lon: -71.6 },
    unesco: true,
  },
  {
    id: 'tierradelfuego',
    name: 'Tierra del Fuego',
    province: 'Tierra del Fuego',
    region: 'Patagonia Sur',
    area_km2: 630,
    highlights: 'Ushuaia · Canal Beagle · Lapataia · Fin del mundo',
    size: '73 MB',
    photo: 'https://images.unsplash.com/photo-1457131760772-7017c6180f05?w=600&q=75&fit=crop',
    coords: { lat: -54.8, lon: -68.5 },
    unesco: false,
  },
  {
    id: 'lago-puelo',
    name: 'Lago Puelo',
    province: 'Chubut',
    region: 'Patagonia Norte',
    area_km2: 276,
    highlights: 'Microclima único · Bosque valdiviano · Trekking',
    size: '48 MB',
    photo: 'https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=600&q=75&fit=crop',
    coords: { lat: -42.07, lon: -71.63 },
    unesco: false,
  },
  {
    id: 'aconcagua',
    name: 'Aconcagua',
    province: 'Mendoza',
    region: 'Cuyo',
    area_km2: 710,
    highlights: '6961 m · Ruta Normal · Valle de los Horcones',
    size: '96 MB',
    photo: 'https://images.unsplash.com/photo-1574068468668-a05a11f871da?w=600&q=75&fit=crop',
    coords: { lat: -32.65, lon: -70.01 },
    unesco: false,
  },
  {
    id: 'talampaya',
    name: 'Talampaya',
    province: 'La Rioja',
    region: 'Cuyo',
    area_km2: 2150,
    highlights: 'Cañones de arenisca roja · Pinturas rupestres · Dinosaurios',
    size: '58 MB',
    photo: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=600&q=75&fit=crop',
    coords: { lat: -29.7, lon: -67.9 },
    unesco: true,
  },
  {
    id: 'iguazu',
    name: 'Iguazú',
    province: 'Misiones',
    region: 'Litoral',
    area_km2: 550,
    highlights: 'Cataratas del Iguazú · Garganta del Diablo · Selva misionera',
    size: '62 MB',
    photo: 'https://images.unsplash.com/photo-1546200547-f4c8c66de5d8?w=600&q=75&fit=crop',
    coords: { lat: -25.68, lon: -54.44 },
    unesco: true,
  },
  {
    id: 'humahuaca',
    name: 'Quebrada de Humahuaca',
    province: 'Jujuy',
    region: 'Norte',
    area_km2: 1720,
    highlights: 'UNESCO · 7 colores · Tilcara · Purmamarca',
    size: '64 MB',
    photo: 'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/05/a5/19/21/quebrada-de-humahuaca.jpg?w=700&h=400&s=1',
    coords: { lat: -23.2, lon: -65.35 },
    unesco: true,
  },
  {
    id: 'calilegua',
    name: 'Calilegua',
    province: 'Jujuy',
    region: 'Norte',
    area_km2: 760,
    highlights: 'Selva subtropical · Biodiversidad · Yungas',
    size: '41 MB',
    photo: 'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=600&q=75&fit=crop',
    coords: { lat: -23.7, lon: -64.9 },
    unesco: false,
  },
  {
    id: 'cordoba',
    name: 'Sierras de Córdoba',
    province: 'Córdoba',
    region: 'Sierras Centrales',
    area_km2: 340,
    highlights: 'Los Gigantes · Champaquí · La Ventana',
    size: '55 MB',
    photo: 'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/1a/c3/f4/d9/el-paso-por-un-lugar.jpg?w=700&h=400&s=1',
    coords: { lat: -31.4, lon: -64.6 },
    unesco: false,
  },

  // ── Litoral ──────────────────────────────────────────────────────────────
  {
    id: 'el-palmar',
    name: 'El Palmar',
    province: 'Entre Ríos',
    region: 'Litoral',
    area_km2: 85,
    highlights: 'Palmares de yatay milenarios · Costa del río Uruguay · Vizcachas y ñandúes',
    size: '38 MB',
    photo: 'https://images.unsplash.com/photo-1626288215937-747af7be5b7b?w=600&q=75&fit=crop',
    coords: { lat: -31.85, lon: -58.30 },
    unesco: false,
  },
  {
    id: 'ibera',
    name: 'Iberá',
    province: 'Corrientes',
    region: 'Litoral',
    area_km2: 1832,
    highlights: 'Esteros del Iberá · Yacarés, carpinchos y ciervo de los pantanos · Reintroducción de yaguareté',
    size: '92 MB',
    photo: 'https://images.unsplash.com/photo-1626288215937-747af7be5b7b?w=600&q=75&fit=crop',
    coords: { lat: -28.50, lon: -57.20 },
    unesco: false,
  },
  {
    id: 'mburucuya',
    name: 'Mburucuyá',
    province: 'Corrientes',
    region: 'Litoral',
    area_km2: 175,
    highlights: 'Palmares de caranday · Lagunas y malezales · Flora subtropical',
    size: '34 MB',
    photo: 'https://images.unsplash.com/photo-1626288215937-747af7be5b7b?w=600&q=75&fit=crop',
    coords: { lat: -28.02, lon: -58.05 },
    unesco: false,
  },
  {
    id: 'pre-delta',
    name: 'Pre-Delta',
    province: 'Entre Ríos',
    region: 'Litoral',
    area_km2: 24,
    highlights: 'Inicio del Delta del Paraná · Islas y arroyos · Aves acuáticas',
    size: '22 MB',
    photo: 'https://images.unsplash.com/photo-1626288215937-747af7be5b7b?w=600&q=75&fit=crop',
    coords: { lat: -32.10, lon: -60.65 },
    unesco: false,
  },
  {
    id: 'chaco',
    name: 'Chaco',
    province: 'Chaco',
    region: 'Litoral',
    area_km2: 150,
    highlights: 'Quebrachos centenarios · Monte chaqueño · Río Negro y madrejones',
    size: '40 MB',
    photo: 'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=600&q=75&fit=crop',
    coords: { lat: -26.80, lon: -59.60 },
    unesco: false,
  },
  {
    id: 'el-impenetrable',
    name: 'El Impenetrable',
    province: 'Chaco',
    region: 'Litoral',
    area_km2: 1280,
    highlights: 'Monte impenetrable · Río Bermejo y Teuquito · Yaguareté y tapir',
    size: '78 MB',
    photo: 'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=600&q=75&fit=crop',
    coords: { lat: -25.10, lon: -61.10 },
    unesco: false,
  },

  // ── Norte (NOA) ──────────────────────────────────────────────────────────
  {
    id: 'los-cardones',
    name: 'Los Cardones',
    province: 'Salta',
    region: 'Norte',
    area_km2: 650,
    highlights: 'Cardones gigantes · Recta Tin-Tin · Valle Encantado y Puna',
    size: '52 MB',
    photo: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=600&q=75&fit=crop',
    coords: { lat: -25.12, lon: -65.95 },
    unesco: false,
  },
  {
    id: 'baritu',
    name: 'Baritú',
    province: 'Salta',
    region: 'Norte',
    area_km2: 720,
    highlights: 'Selva de yungas · Parque más aislado del país · Termas de Cayotal',
    size: '60 MB',
    photo: 'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=600&q=75&fit=crop',
    coords: { lat: -22.45, lon: -64.72 },
    unesco: false,
  },
  {
    id: 'el-rey',
    name: 'El Rey',
    province: 'Salta',
    region: 'Norte',
    area_km2: 440,
    highlights: 'Anfiteatro selvático · Yungas · Río Popayán y abundante avifauna',
    size: '46 MB',
    photo: 'https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=600&q=75&fit=crop',
    coords: { lat: -24.70, lon: -64.65 },
    unesco: false,
  },
  {
    id: 'aconquija',
    name: 'Aconquija',
    province: 'Tucumán',
    region: 'Norte',
    area_km2: 700,
    highlights: 'Nevados del Aconquija · Yungas · Ruinas de La Ciudacita (inca)',
    size: '58 MB',
    photo: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=600&q=75&fit=crop',
    coords: { lat: -27.25, lon: -65.95 },
    unesco: false,
  },

  // ── Cuyo ─────────────────────────────────────────────────────────────────
  {
    id: 'sierra-quijadas',
    name: 'Sierra de las Quijadas',
    province: 'San Luis',
    region: 'Cuyo',
    area_km2: 1500,
    highlights: 'Potrero de la Aguada · Cañones rojos · Huellas y fósiles de dinosaurios',
    size: '54 MB',
    photo: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=600&q=75&fit=crop',
    coords: { lat: -32.50, lon: -67.00 },
    unesco: false,
  },
  {
    id: 'el-leoncito',
    name: 'El Leoncito',
    province: 'San Juan',
    region: 'Cuyo',
    area_km2: 760,
    highlights: 'Observatorios astronómicos · Cielos más límpidos del país · Pampa del Leoncito',
    size: '50 MB',
    photo: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=600&q=75&fit=crop',
    coords: { lat: -31.80, lon: -69.30 },
    unesco: false,
  },
  {
    id: 'san-guillermo',
    name: 'San Guillermo',
    province: 'San Juan',
    region: 'Cuyo',
    area_km2: 1660,
    highlights: 'Vicuñas y guanacos · Puna de altura · Reserva de Biósfera UNESCO',
    size: '64 MB',
    photo: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=600&q=75&fit=crop',
    coords: { lat: -29.10, lon: -69.35 },
    unesco: true,
  },

  // ── Sierras Centrales ────────────────────────────────────────────────────
  {
    id: 'condorito',
    name: 'Quebrada del Condorito',
    province: 'Córdoba',
    region: 'Sierras Centrales',
    area_km2: 370,
    highlights: 'Cóndores andinos · Pampa de Achala · Balcón Norte y Sur',
    size: '44 MB',
    photo: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=600&q=75&fit=crop',
    coords: { lat: -31.65, lon: -64.68 },
    unesco: false,
  },

  // ── Patagonia ────────────────────────────────────────────────────────────
  {
    id: 'los-arrayanes',
    name: 'Los Arrayanes',
    province: 'Neuquén',
    region: 'Patagonia Norte',
    area_km2: 17,
    highlights: 'Bosque puro de arrayanes · Península Quetrihué · Villa La Angostura',
    size: '20 MB',
    photo: 'https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=600&q=75&fit=crop',
    coords: { lat: -40.55, lon: -71.55 },
    unesco: false,
  },
  {
    id: 'laguna-blanca',
    name: 'Laguna Blanca',
    province: 'Neuquén',
    region: 'Patagonia Norte',
    area_km2: 112,
    highlights: 'Laguna esteparia · Cisnes de cuello negro · Aves acuáticas',
    size: '30 MB',
    photo: 'https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=600&q=75&fit=crop',
    coords: { lat: -39.05, lon: -70.35 },
    unesco: false,
  },
  {
    id: 'perito-moreno-np',
    name: 'PN Perito Moreno',
    province: 'Santa Cruz',
    region: 'Patagonia Sur',
    area_km2: 1150,
    highlights: 'Lagos turquesa · Cerro San Lorenzo · Estepa virgen y aislamiento total',
    size: '70 MB',
    photo: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=75&fit=crop',
    coords: { lat: -47.88, lon: -72.10 },
    unesco: false,
  },
  {
    id: 'monte-leon',
    name: 'Monte León',
    province: 'Santa Cruz',
    region: 'Patagonia Sur',
    area_km2: 627,
    highlights: 'Costa atlántica · Pingüinera de Magallanes · La Olla y lobos marinos',
    size: '48 MB',
    photo: 'https://images.unsplash.com/photo-1457131760772-7017c6180f05?w=600&q=75&fit=crop',
    coords: { lat: -50.35, lon: -68.90 },
    unesco: false,
  },
  {
    id: 'bosques-petrificados',
    name: 'Bosques Petrificados',
    province: 'Santa Cruz',
    region: 'Patagonia Sur',
    area_km2: 615,
    highlights: 'Troncos petrificados jurásicos · Cerro Madre e Hija · Estepa fósil',
    size: '42 MB',
    photo: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=600&q=75&fit=crop',
    coords: { lat: -47.70, lon: -68.00 },
    unesco: false,
  },
  {
    id: 'lihue-calel',
    name: 'Lihué Calel',
    province: 'La Pampa',
    region: 'Sierras Centrales',
    area_km2: 325,
    highlights: 'Sierras en la llanura · Arte rupestre · Monte pampeano y pumas',
    size: '36 MB',
    photo: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=600&q=75&fit=crop',
    coords: { lat: -38.00, lon: -65.60 },
    unesco: false,
  },
];

// ─── Download card ────────────────────────────────────────────────────────────
function DownloadCard({
  park, c, onViewMap, iframeRef,
}: {
  park: typeof NATIONAL_PARKS[0];
  c: any;
  onViewMap?: (lat: number, lon: number) => void;
  iframeRef?: React.RefObject<HTMLIFrameElement | null>;
}) {
  const [pdfState, setPdfState] = useState<'idle' | 'working'>('idle');
  const [gpxState, setGpxState] = useState<'idle' | 'done'>('idle');
  const { width } = useWindowDimensions();
  const isNarrow = width < 400;

  // Pre-cache tiles for true offline use in the background (no UI state needed)
  React.useEffect(() => {
    if (isTileCachingSupported()) {
      isAreaCached(park.coords.lat, park.coords.lon).then((cached) => {
        if (!cached) {
          downloadAreaTiles(park.coords.lat, park.coords.lon, () => {}).catch(() => {});
        }
      });
    }
  }, []);

  function handleViewMap() {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      // Send postMessage to the embedded iframe — no new tab
      if (iframeRef?.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          { type: 'flyTo', lat: park.coords.lat, lng: park.coords.lon, zoom: 11 },
          '*',
        );
        // Scroll the iframe into view
        iframeRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    } else if (onViewMap) {
      onViewMap(park.coords.lat, park.coords.lon);
    }
  }

  function handleGpx() {
    const ok = downloadGpx(
      park.name,
      [{ lat: park.coords.lat, lon: park.coords.lon, name: park.name }],
      `${park.name} — ${park.province} · ${park.region}. ${park.highlights}`,
    );
    if (ok) {
      setGpxState('done');
      setTimeout(() => setGpxState('idle'), 2500);
    }
  }

  async function handlePdf() {
    if (pdfState === 'working') return;
    setPdfState('working');
    try {
      const { generateParkPDF } = await import('../../src/utils/parkPdf');
      await generateParkPDF({
        id: park.id,
        name: park.name,
        province: park.province,
        region: park.region,
        highlights: park.highlights,
        size: park.size,
        coords: park.coords,
      });
    } catch {
      // swallow — user can retry
    } finally {
      setPdfState('idle');
    }
  }

  return (
    <View style={[dlS.card, { borderColor: c.border, backgroundColor: c.elevated }]}>
      {/* Photo */}
      <View style={[dlS.photo, { backgroundColor: c.surface }]}>
        {Platform.OS === 'web' ? (
          // @ts-ignore
          <img src={park.photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={park.name} loading="lazy" />
        ) : null}
        <View style={dlS.photoOverlay} />
        <View style={dlS.sizeBadge}>
          <Text style={dlS.sizeTxt}>{park.size}</Text>
        </View>
        {park.unesco && (
          <View style={dlS.unescoBadge}>
            <Text style={dlS.unescoTxt}>UNESCO</Text>
          </View>
        )}
      </View>

      {/* Body */}
      <View style={dlS.body}>
        <Text style={[dlS.name, { color: c.text }]} numberOfLines={1}>{park.name}</Text>
        <Text style={[dlS.highlights, { color: c.muted }]} numberOfLines={isNarrow ? 1 : 2}>{park.highlights}</Text>
        <Text style={[dlS.meta, { color: c.muted }]}>{park.province} · {park.region}</Text>

        {pdfState === 'working' && (
          <View style={[dlS.progressTrack, { backgroundColor: c.border }]}>
            <Animated.View style={[dlS.progressFill, { width: '100%' }]} />
          </View>
        )}

        {/* Three actions: view map, GPX for GPS apps, PDF */}
        <View style={dlS.btnRow}>
          <TouchableOpacity style={[dlS.btn, dlS.btnView]} onPress={handleViewMap} activeOpacity={0.8}>
            <Ionicons name="map-outline" size={13} color="#16a34a" />
            <Text style={[dlS.btnTxt, { color: '#16a34a' }]}>Ver mapa</Text>
          </TouchableOpacity>
          {Platform.OS === 'web' && (
            <TouchableOpacity style={[dlS.btn, dlS.btnGpx]} onPress={handleGpx} activeOpacity={0.8}>
              <Ionicons
                name={gpxState === 'done' ? 'checkmark-outline' : 'navigate-outline'}
                size={13}
                color="#93c5fd"
              />
              <Text style={[dlS.btnTxt, { color: '#93c5fd' }]}>
                {gpxState === 'done' ? 'GPX listo' : 'GPX / OsmAnd'}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[dlS.btn, dlS.btnDownload]}
            onPress={handlePdf}
            activeOpacity={0.8}
            disabled={pdfState === 'working'}
          >
            <Ionicons
              name={pdfState === 'working' ? 'cloud-download-outline' : 'download-outline'}
              size={13}
              color="#fff"
            />
            <Text style={dlS.btnTxtWhite}>
              {pdfState === 'working' ? 'Generando…' : 'PDF'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const dlS = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
    flexDirection: 'row',
    minHeight: 130,
  },
  photo: { width: 110, flexShrink: 0, position: 'relative' },
  photoOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.15)' },
  sizeBadge: {
    position: 'absolute', top: 8, left: 8,
    backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  sizeTxt: { color: '#fff', fontSize: 9, fontWeight: '700' },
  unescoBadge: {
    position: 'absolute', bottom: 8, left: 8,
    backgroundColor: '#16a34a', borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  unescoTxt: { color: '#fff', fontSize: 9, fontWeight: '700' },
  body: { flex: 1, padding: 12, gap: 4, justifyContent: 'space-between' },
  name: { fontSize: 14, fontWeight: '700', lineHeight: 18 },
  highlights: { fontSize: 12, lineHeight: 16 },
  meta: { fontSize: 11 },
  progressTrack: { height: 3, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#22c55e', borderRadius: 2 },
  btnRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7,
  },
  btnDownload: { backgroundColor: '#16a34a' },
  btnView: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#16a34a' },
  btnGpx: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#3b82f6' },
  btnTxt: { fontSize: 12, fontWeight: '600' },
  btnTxtWhite: { fontSize: 12, fontWeight: '600', color: '#fff' },
});

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function MapasScreen() {
  const { isDark } = useTheme();
  const { isOffline } = useNetwork();
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [flyTo, setFlyTo] = useState<{ lat: number; lon: number } | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const c = isDark
    ? { bg: '#070b14', surface: '#0f1724', elevated: '#162035', border: '#1e2d42', text: '#f0f9ff', muted: '#64748b' }
    : { bg: '#f8fafc', surface: '#ffffff', elevated: '#f1f5f9', border: '#e2e8f0', text: '#0f172a', muted: '#64748b' };

  function handleViewMap(lat: number, lon: number) {
    setFlyTo({ lat, lon });
    setDownloadOpen(false);
  }

  // ── Native: full-screen map with Download FAB ─────────────────────────────
  if (Platform.OS !== 'web') {
    const { MapLeaflet } = require('../../src/components/map/MapLeaflet');
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <MapLeaflet
          center={flyTo ? [flyTo.lat, flyTo.lon] : [-40.5, -68.0]}
          zoom={flyTo ? 10 : 4}
          flyTo={flyTo ? { lat: flyTo.lat, lon: flyTo.lon, zoom: 10 } : null}
          height="100%"
          layer="argenmap"
        />
        <SafeAreaView edges={['bottom']} style={{ position: 'absolute', bottom: 0, right: 16 }}>
          <TouchableOpacity
            style={nS.fab}
            onPress={() => setDownloadOpen(true)}
          >
            <Ionicons name="download-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </SafeAreaView>

        <Modal visible={downloadOpen} animationType="slide" transparent onRequestClose={() => setDownloadOpen(false)}>
          <View style={nS.modalBackdrop}>
            <View style={[nS.sheet, { backgroundColor: c.surface }]}>
              {/* Handle */}
              <View style={[nS.handle, { backgroundColor: c.border }]} />
              {/* Header */}
              <View style={nS.sheetHeader}>
                <Text style={[nS.sheetTitle, { color: c.text }]}>Mapas sin conexión</Text>
                <TouchableOpacity onPress={() => setDownloadOpen(false)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                  <Ionicons name="close" size={22} color={c.muted} />
                </TouchableOpacity>
              </View>
              <Text style={[nS.sheetSub, { color: c.muted }]}>
                Descargá y accedé a los mapas sin señal.
              </Text>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
                {NATIONAL_PARKS.map((park) => (
                  <DownloadCard key={park.id} park={park} c={c} onViewMap={handleViewMap} />
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // ── Web: iframe map + offline downloads ──────────────────────────────────
  return (
    <ScrollView style={[s.root, { backgroundColor: c.bg }]} showsVerticalScrollIndicator={false}>
      <View style={[s.mapHeader, { borderBottomColor: c.border, backgroundColor: c.surface }]}>
        <View style={s.mapHeaderInner}>
          <View>
            <Text style={[s.eyebrow, { color: c.muted }]}>MAPA INTERACTIVO</Text>
            <Text style={[s.pageTitle, { color: c.text }]}>Parques Nacionales de Argentina</Text>
          </View>
          {isOffline && (
            <View style={[s.offlineBadge, { backgroundColor: 'rgba(251,191,36,0.12)', borderColor: 'rgba(251,191,36,0.3)' }]}>
              <Ionicons name="cloud-offline-outline" size={13} color="#fbbf24" />
              <Text style={{ color: '#fbbf24', fontSize: 12, fontWeight: '600' }}>Sin señal</Text>
            </View>
          )}
        </View>
      </View>

      <View style={s.iframeWrapper}>
        {/* @ts-ignore */}
        <iframe
          ref={iframeRef as any}
          src="/parques.html"
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="Mapa de Parques Nacionales de Argentina"
          loading="eager"
        />
      </View>

      <View style={[s.dlSection, { backgroundColor: c.bg }]}>
        <View style={s.dlHeader}>
          <Text style={[s.eyebrow, { color: c.muted }]}>CENTRO DE DESCARGAS</Text>
          <Text style={[s.sectionTitle, { color: c.text }]}>Mapas para llevar sin señal</Text>
          <Text style={[s.sectionSub, { color: c.muted }]}>
            Guardá la cartografía de cada parque. Disponibles sin conexión — tocá "Ver guardado offline" para abrirlo.
          </Text>
        </View>
        <View style={s.dlGrid}>
          {NATIONAL_PARKS.map((park) => (
            <DownloadCard key={park.id} park={park} c={c} iframeRef={iframeRef} />
          ))}
        </View>
      </View>

      <WebFooter />
    </ScrollView>
  );
}

const nS = StyleSheet.create({
  fab: {
    backgroundColor: '#16a34a', borderRadius: 28,
    width: 56, height: 56,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '88%', paddingHorizontal: 16, paddingTop: 12 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  sheetTitle: { fontSize: 18, fontWeight: '800' },
  sheetSub: { fontSize: 13, marginBottom: 16 },
});

const s = StyleSheet.create({
  root: { flex: 1 },
  mapHeader: { borderBottomWidth: 1, paddingVertical: 16, paddingHorizontal: 24 },
  mapHeaderInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', maxWidth: 1200, alignSelf: 'center', width: '100%' },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 },
  pageTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
  offlineBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  iframeWrapper: { width: '100%', height: 900 as any },
  dlSection: { paddingTop: 48, paddingBottom: 32 },
  dlHeader: { paddingHorizontal: 24, marginBottom: 24, maxWidth: 1200, alignSelf: 'center', width: '100%' },
  sectionTitle: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5, marginBottom: 8 },
  sectionSub: { fontSize: 15, lineHeight: 24 },
  dlGrid: { paddingHorizontal: 24, maxWidth: 1200, alignSelf: 'center', width: '100%' },
});
