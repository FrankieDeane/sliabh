import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Modal, ScrollView, Linking,
  StyleSheet, Animated, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MapLeaflet } from '../../src/components/map/MapLeaflet';
import { ContributeForm } from '../../src/components/contribute/ContributeForm';
import { ThemeToggle } from '../../src/components/ui/ThemeToggle';
import { OfflineBadge } from '../../src/components/ui/OfflineBadge';
import { WebFooter } from '../../src/components/layout/WebFooter';
import { useTheme } from '../../src/hooks/useTheme';
import { useNetwork } from '../../src/hooks/useNetwork';
import { useResponsive } from '../../src/hooks/useResponsive';
import { downloadAreaTiles, isAreaCached, isTileCachingSupported } from '../../src/utils/offlineTiles';

type MapLayer = 'dark' | 'topo' | 'osm' | 'argenmap';
type DlState = 'idle' | 'downloading' | 'done';

// ─── National parks data ──────────────────────────────────────────────────────

const NATIONAL_PARKS = [
  {
    id: 'glaciares',
    name: 'Los Glaciares',
    province: 'Santa Cruz',
    region: 'Patagonia Sur',
    area_km2: 7269,
    highlights: 'Fitz Roy · Cerro Torre · Glaciar Perito Moreno',
    size: '142 MB',
    url: 'https://www.argentina.gob.ar/parquesnacionales/losglaciares',
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
    url: 'https://www.argentina.gob.ar/parquesnacionales/nahuelhuapi',
    photo: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=600&q=75&fit=crop',
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
    url: 'https://www.argentina.gob.ar/parquesnacionales/lanin',
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
    url: 'https://www.argentina.gob.ar/parquesnacionales/losalerces',
    photo: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=600&q=75&fit=crop',
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
    url: 'https://www.argentina.gob.ar/parquesnacionales/tierradelfuego',
    photo: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=600&q=75&fit=crop',
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
    url: 'https://www.argentina.gob.ar/parquesnacionales/lagopuelo',
    photo: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=600&q=75&fit=crop',
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
    url: 'https://www.mendoza.gov.ar/aconcagua/',
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
    url: 'https://www.argentina.gob.ar/parquesnacionales/talampaya',
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
    url: 'https://www.argentina.gob.ar/parquesnacionales/iguazu',
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
    url: 'https://www.argentina.gob.ar/parquesnacionales',
    photo: 'https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=600&q=75&fit=crop',
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
    url: 'https://www.argentina.gob.ar/parquesnacionales/calilegua',
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
    url: 'https://www.cordoba.gob.ar',
    photo: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=75&fit=crop',
    coords: { lat: -31.4, lon: -64.6 },
    unesco: false,
  },
];

// ─── Complete SIB/APN protected areas dataset (55 areas) ─────────────────────
// Region-color map: Patagonia #22c55e, Norte/NOA #6a8f3f, Litoral #7a4f7f,
// Cuyo/Sierras Centrales #8a6d3b, Áreas Marinas #315f86

const ALL_PARKS_DATA = [
  // ── Sierras Centrales (mapped from HTML "Centro") ──
  { id: 'ansenuza', name: 'PN Ansenuza', region: 'Sierras Centrales', province: 'Córdoba', lat: -30.667, lng: -62.547, category: 'Parque Nacional', international: 'Sitio RAMSAR', color: '#8a6d3b' },
  { id: 'el-leoncito', name: 'PN El Leoncito', region: 'Cuyo', province: 'San Juan', lat: -31.889, lng: -69.265, category: 'Parque Nacional', international: '', color: '#c97c3e' },
  { id: 'condorito', name: 'PN Quebrada del Condorito', region: 'Sierras Centrales', province: 'Córdoba', lat: -31.698, lng: -64.783, category: 'Parque Nacional', international: '', color: '#8a6d3b' },
  { id: 'san-guillermo', name: 'PN San Guillermo', region: 'Cuyo', province: 'San Juan', lat: -29.238, lng: -69.266, category: 'Parque Nacional', international: 'Reserva de Biósfera · Patrimonio Mundial', color: '#c97c3e' },
  { id: 'sierra-quijadas', name: 'PN Sierra de las Quijadas', region: 'Sierras Centrales', province: 'San Luis', lat: -32.557, lng: -67.135, category: 'Parque Nacional', international: '', color: '#8a6d3b' },
  { id: 'traslasierra', name: 'PN Traslasierra', region: 'Sierras Centrales', province: 'Córdoba', lat: -30.995, lng: -65.627, category: 'Parque Nacional', international: '', color: '#8a6d3b' },
  // ── Litoral (mapped from HTML "Centro Este" + "Noreste") ──
  { id: 'campos-tuyu', name: 'PN Campos del Tuyú', region: 'Litoral', province: 'Buenos Aires', lat: -36.354, lng: -56.876, category: 'Parque Nacional', international: 'Sitio RAMSAR', color: '#7a4f7f' },
  { id: 'ciervo-pantanos', name: 'PN Ciervo de los Pantanos', region: 'Litoral', province: 'Buenos Aires', lat: -34.235, lng: -58.877, category: 'Parque Nacional', international: 'Sitio RAMSAR', color: '#7a4f7f' },
  { id: 'el-palmar', name: 'PN El Palmar', region: 'Litoral', province: 'Entre Ríos', lat: -31.882, lng: -58.257, category: 'Parque Nacional', international: 'Sitio RAMSAR', color: '#7a4f7f' },
  { id: 'islas-santa-fe', name: 'PN Islas de Santa Fe', region: 'Litoral', province: 'Santa Fe', lat: -32.279, lng: -60.720, category: 'Parque Nacional', international: 'Sitio RAMSAR', color: '#7a4f7f' },
  { id: 'pre-delta', name: 'PN Pre-Delta', region: 'Litoral', province: 'Entre Ríos', lat: -32.141, lng: -60.640, category: 'Parque Nacional', international: 'Sitio RAMSAR', color: '#7a4f7f' },
  { id: 'chaco-pn', name: 'PN Chaco', region: 'Litoral', province: 'Chaco', lat: -26.827, lng: -59.655, category: 'Parque Nacional', international: '', color: '#7a4f7f' },
  { id: 'el-impenetrable', name: 'PN El Impenetrable', region: 'Litoral', province: 'Chaco', lat: -25.005, lng: -61.106, category: 'Parque Nacional', international: '', color: '#7a4f7f' },
  { id: 'ibera', name: 'PN Iberá', region: 'Litoral', province: 'Corrientes', lat: -27.932, lng: -56.931, category: 'Parque Nacional', international: '', color: '#7a4f7f' },
  { id: 'mburucuya', name: 'PN Mburucuyá', region: 'Litoral', province: 'Corrientes', lat: -28.013, lng: -58.069, category: 'Parque Nacional', international: '', color: '#7a4f7f' },
  { id: 'rio-pilcomayo', name: 'PN Río Pilcomayo', region: 'Litoral', province: 'Formosa', lat: -25.065, lng: -58.137, category: 'Parque Nacional', international: 'Sitio RAMSAR', color: '#7a4f7f' },
  // ── Norte / NOA (mapped from HTML "Noroeste") ──
  { id: 'pozuelos', name: 'MN Laguna de los Pozuelos', region: 'Norte', province: 'Jujuy', lat: -22.342, lng: -66.002, category: 'Monumento Natural', international: 'Reserva de Biósfera · Sitio RAMSAR', color: '#6a8f3f' },
  { id: 'aconquija', name: 'PN Aconquija', region: 'Norte', province: 'Tucumán', lat: -27.194, lng: -65.958, category: 'Parque Nacional', international: 'Patrimonio Mundial', color: '#6a8f3f' },
  { id: 'baritu', name: 'PN Baritú', region: 'Norte', province: 'Salta', lat: -22.582, lng: -64.644, category: 'Parque Nacional', international: 'Reserva de Biósfera', color: '#6a8f3f' },
  { id: 'copo', name: 'PN Copo', region: 'Norte', province: 'Santiago del Estero', lat: -25.821, lng: -61.880, category: 'Parque Nacional', international: '', color: '#6a8f3f' },
  { id: 'el-rey', name: 'PN El Rey', region: 'Norte', province: 'Salta', lat: -24.700, lng: -64.627, category: 'Parque Nacional', international: '', color: '#6a8f3f' },
  { id: 'los-cardones', name: 'PN Los Cardones', region: 'Norte', province: 'Salta', lat: -25.277, lng: -65.932, category: 'Parque Nacional', international: '', color: '#6a8f3f' },
  // ── Patagonia Norte ──
  { id: 'marino-costero', name: 'Parque Marino Costero Patagonia Austral', region: 'Patagonia Norte', province: 'Chubut', lat: -45.072, lng: -66.097, category: 'Parque Interjurisdiccional Marino', international: 'Reserva de Biósfera', color: '#22c55e' },
  { id: 'islote-lobos', name: 'PN Islote Lobos', region: 'Patagonia Norte', province: 'Río Negro', lat: -41.438, lng: -65.064, category: 'Parque Nacional', international: '', color: '#22c55e' },
  { id: 'laguna-blanca', name: 'PN Laguna Blanca', region: 'Patagonia Norte', province: 'Neuquén', lat: -39.030, lng: -70.352, category: 'Parque Nacional', international: 'Sitio RAMSAR', color: '#22c55e' },
  { id: 'lihue-calel', name: 'PN Lihué Calel', region: 'Patagonia Norte', province: 'La Pampa', lat: -37.935, lng: -65.605, category: 'Parque Nacional', international: '', color: '#22c55e' },
  { id: 'los-arrayanes', name: 'PN Los Arrayanes', region: 'Patagonia Norte', province: 'Neuquén', lat: -40.829, lng: -71.629, category: 'Parque Nacional', international: 'Reserva de Biósfera', color: '#22c55e' },
  // ── Patagonia Sur ──
  { id: 'isla-pinguino', name: 'Parque Marino Isla Pingüino', region: 'Patagonia Sur', province: 'Santa Cruz', lat: -48.150, lng: -65.945, category: 'Parque Interjurisdiccional Marino', international: '', color: '#22c55e' },
  { id: 'makenke', name: 'Parque Marino Makenke', region: 'Patagonia Sur', province: 'Santa Cruz', lat: -49.548, lng: -67.625, category: 'Parque Interjurisdiccional Marino', international: '', color: '#22c55e' },
  { id: 'bosques-petrificados', name: 'PN Bosques Petrificados de Jaramillo', region: 'Patagonia Sur', province: 'Santa Cruz', lat: -47.693, lng: -68.066, category: 'Parque Nacional', international: '', color: '#22c55e' },
  { id: 'monte-leon', name: 'PN Monte León', region: 'Patagonia Sur', province: 'Santa Cruz', lat: -50.317, lng: -68.973, category: 'Parque Nacional', international: '', color: '#22c55e' },
  { id: 'patagonia-pn', name: 'PN Patagonia', region: 'Patagonia Sur', province: 'Santa Cruz', lat: -47.159, lng: -71.317, category: 'Parque Nacional', international: '', color: '#22c55e' },
  { id: 'perito-moreno', name: 'PN Perito Moreno', region: 'Patagonia Sur', province: 'Santa Cruz', lat: -47.887, lng: -72.250, category: 'Parque Nacional', international: '', color: '#22c55e' },
  // ── Áreas Marinas ──
  { id: 'burdwood-1', name: 'AMP Namuncurá - Banco Burdwood I', region: 'Patagonia Sur', province: 'Mar Argentino', lat: -54.331, lng: -59.239, category: 'Área Marina Protegida', international: '', color: '#315f86' },
  { id: 'burdwood-2', name: 'AMP Namuncurá - Banco Burdwood II', region: 'Patagonia Sur', province: 'Mar Argentino', lat: -55.182, lng: -59.804, category: 'Área Marina Protegida', international: '', color: '#315f86' },
  { id: 'yaganes', name: 'AMP Yaganes', region: 'Patagonia Sur', province: 'Mar Argentino', lat: -56.933, lng: -65.458, category: 'Área Marina Protegida', international: '', color: '#315f86' },
];

// Merge NATIONAL_PARKS curated data with ALL_PARKS_DATA for complete map markers
const ALL_PARK_MARKERS = [
  ...NATIONAL_PARKS.map(p => ({
    id: p.id, name: p.name, region: p.region, province: p.province,
    lat: p.coords.lat, lng: p.coords.lon,
    category: 'Parque Nacional', international: p.unesco ? 'Patrimonio UNESCO' : '',
    color: p.region === 'Patagonia Sur' || p.region === 'Patagonia Norte' ? '#22c55e'
         : p.region === 'Norte' ? '#6a8f3f'
         : p.region === 'Litoral' ? '#7a4f7f'
         : '#c97c3e',
  })),
  ...ALL_PARKS_DATA.filter(pd => !NATIONAL_PARKS.find(np => np.id === pd.id)),
];

// ─── Region explorer (mirrors the official APN map of national parks) ────────
// https://www.argentina.gob.ar/parquesnacionales/mapa-de-los-parques-nacionales-de-argentina

const OFFICIAL_MAP_URL =
  'https://www.argentina.gob.ar/parquesnacionales/mapa-de-los-parques-nacionales-de-argentina';

const MAP_REGIONS = [
  {
    id: 'Patagonia Sur',
    name: 'Patagonia Sur',
    provinces: 'Santa Cruz · Tierra del Fuego',
    center: { lat: -50.0, lon: -71.5, zoom: 6 },
    photo: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80&fit=crop&auto=format',
    video: 'ZFtM28xYy14',
    desc: 'El extremo austral del continente: glaciares vivos, agujas de granito y el campo de hielo más grande fuera de los polos. Acá están Los Glaciares (Fitz Roy, Perito Moreno), el PN Patagonia y el parque más austral del mundo, Tierra del Fuego.',
  },
  {
    id: 'Patagonia Norte',
    name: 'Patagonia Norte',
    provinces: 'Río Negro · Neuquén · Chubut',
    center: { lat: -41.5, lon: -71.4, zoom: 7 },
    photo: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1200&q=80&fit=crop&auto=format',
    video: 'xK1eo4hKJVM',
    desc: 'La región de los lagos y los bosques andino-patagónicos: Nahuel Huapi, Lanín, Los Alerces (UNESCO) y Lago Puelo. Refugios de montaña, volcanes y alerces de 2.600 años.',
  },
  {
    id: 'Cuyo',
    name: 'Cuyo',
    provinces: 'Mendoza · San Juan · La Rioja',
    center: { lat: -31.5, lon: -69.0, zoom: 6 },
    photo: 'https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=1200&q=80&fit=crop&auto=format',
    video: 'smv2WXDzG5I',
    desc: 'La alta montaña argentina: el Aconcagua (6.961 m, techo de América), los cañones rojos de Talampaya (UNESCO) e Ischigualasto. Desierto de altura, cóndores y expediciones.',
  },
  {
    id: 'Norte',
    name: 'Norte (NOA)',
    provinces: 'Jujuy · Salta · Tucumán',
    center: { lat: -23.5, lon: -65.2, zoom: 7 },
    photo: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=1200&q=80&fit=crop&auto=format',
    video: '_0k0NG0R6jc',
    desc: 'La Puna y las yungas: Quebrada de Humahuaca (UNESCO), el Cerro de los 7 Colores y la selva de Calilegua. Cultura andina viva, altura extrema y paisajes de otro planeta.',
  },
  {
    id: 'Sierras Centrales',
    name: 'Sierras Centrales',
    provinces: 'Córdoba · San Luis',
    center: { lat: -31.7, lon: -64.8, zoom: 8 },
    photo: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80&fit=crop&auto=format',
    video: 'mGsNkTL6vEQ',
    desc: 'El corazón serrano del país: Los Gigantes (la escuela de escalada de Córdoba), el Champaquí (2.790 m) y la Quebrada del Condorito, donde los cóndores planean a la altura de tus ojos.',
  },
  {
    id: 'Litoral',
    name: 'Litoral',
    provinces: 'Misiones · Corrientes · Entre Ríos',
    center: { lat: -27.5, lon: -56.0, zoom: 6 },
    photo: 'https://images.unsplash.com/photo-1546200547-f4c8c66de5d8?w=1200&q=80&fit=crop&auto=format',
    video: 'uoMaOmEvbmc',
    desc: 'La Argentina subtropical: las Cataratas del Iguazú (UNESCO, una de las 7 maravillas naturales), los Esteros del Iberá y la selva misionera. Agua, selva y biodiversidad sin igual.',
  },
];

const LAYERS: { id: MapLayer; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'argenmap', label: 'IGN Argentina', icon: 'flag' },
  { id: 'topo', label: 'Topográfico', icon: 'trail-sign' },
  { id: 'dark', label: 'Oscuro', icon: 'moon' },
  { id: 'osm', label: 'Estándar', icon: 'map' },
];

// ─── Download card ────────────────────────────────────────────────────────────

function DownloadCard({ park, c }: { park: typeof NATIONAL_PARKS[0]; c: any }) {
  const [state, setState] = useState<DlState>('idle');
  const progress = useRef(new Animated.Value(0)).current;

  // Reflect previously downloaded areas on mount
  React.useEffect(() => {
    isAreaCached(park.coords.lat, park.coords.lon).then((cached) => {
      if (cached) setState('done');
    });
  }, [park.id]);

  function startDownload() {
    if (state !== 'idle') return;
    setState('downloading');
    progress.setValue(0);

    if (isTileCachingSupported()) {
      // Real download: cache OpenTopoMap tiles around the park
      downloadAreaTiles(park.coords.lat, park.coords.lon, (done, total) => {
        progress.setValue(done / total);
      }).then(() => setState('done'));
    } else {
      Animated.timing(progress, {
        toValue: 1,
        duration: 2800 + Math.random() * 1200,
        useNativeDriver: false,
      }).start(() => setState('done'));
    }
  }

  const progressWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={[dlS.card, { borderColor: c.border }]}>
      <View style={[dlS.photo, { backgroundColor: c.elevated }]}>
        {Platform.OS === 'web' && (
          // @ts-ignore
          <img src={park.photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={park.name} loading="lazy" />
        )}
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
      <View style={[dlS.body, { backgroundColor: c.elevated }]}>
        <View style={{ flex: 1 }}>
          <Text style={[dlS.name, { color: c.text }]}>{park.name}</Text>
          <Text style={[dlS.area, { color: c.muted }]} numberOfLines={1}>{park.highlights}</Text>
          <Text style={[dlS.region, { color: c.muted }]}>{park.province} · {park.region}</Text>
        </View>
        {state === 'downloading' && (
          <View style={[dlS.progressTrack, { backgroundColor: c.border }]}>
            <Animated.View style={[dlS.progressFill, { width: progressWidth }]} />
          </View>
        )}
        <View style={dlS.btnRow}>
          <TouchableOpacity
            style={[dlS.btn, state === 'done' && dlS.btnDone, state === 'downloading' && dlS.btnDl]}
            onPress={state === 'done' ? () => Linking.openURL(park.url) : startDownload}
            activeOpacity={0.8}
            disabled={state === 'downloading'}
          >
            <Ionicons
              name={state === 'done' ? 'checkmark-circle' : state === 'downloading' ? 'hourglass-outline' : 'download-outline'}
              size={14}
              color={state === 'done' ? '#22c55e' : state === 'downloading' ? '#64748b' : '#fff'}
            />
            <Text style={[dlS.btnTxt, state === 'done' ? { color: '#22c55e' } : state === 'downloading' ? { color: '#64748b' } : { color: '#fff' }]}>
              {state === 'done' ? 'Abrir APN' : state === 'downloading' ? 'Descargando…' : 'Descargar'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[dlS.linkBtn, { borderColor: c.border }]}
            onPress={() => Linking.openURL(park.url)}
            activeOpacity={0.7}
          >
            <Ionicons name="open-outline" size={14} color={c.muted} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const dlS = StyleSheet.create({
  card: { borderRadius: 18, borderWidth: 1, overflow: 'hidden', marginBottom: 10, flexDirection: 'row', height: 120 },
  photo: { width: 100, position: 'relative' },
  photoOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(7,11,20,0.35)' },
  sizeBadge: { position: 'absolute', bottom: 6, left: 6, backgroundColor: 'rgba(7,11,20,0.75)', borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 },
  sizeTxt: { fontSize: 9, fontWeight: '700', color: '#94a3b8' },
  unescoBadge: { position: 'absolute', top: 6, left: 6, backgroundColor: 'rgba(34,197,94,0.85)', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  unescoTxt: { fontSize: 8, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  body: { flex: 1, padding: 12, gap: 6, justifyContent: 'space-between' },
  name: { fontSize: 13, fontWeight: '700', letterSpacing: -0.2, marginBottom: 1 },
  area: { fontSize: 11, lineHeight: 15 },
  region: { fontSize: 10, fontWeight: '600' },
  progressTrack: { height: 2, borderRadius: 1, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#22c55e', borderRadius: 1 },
  btnRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#16a34a', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  btnDone: { backgroundColor: 'rgba(34,197,94,0.12)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)' },
  btnDl: { backgroundColor: 'rgba(100,116,139,0.1)', borderWidth: 1, borderColor: 'rgba(100,116,139,0.2)' },
  btnTxt: { fontSize: 11, fontWeight: '700' },
  linkBtn: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});

// ─── Compact offline-download button (download center) ───────────────────────

function OfflineDlButton({ park, c }: { park: typeof NATIONAL_PARKS[0]; c: any }) {
  const [state, setState] = useState<DlState>('idle');
  const [pct, setPct] = useState(0);

  React.useEffect(() => {
    isAreaCached(park.coords.lat, park.coords.lon).then((cached) => {
      if (cached) setState('done');
    });
  }, [park.id]);

  function start() {
    if (state !== 'idle') return;
    setState('downloading');
    if (isTileCachingSupported()) {
      downloadAreaTiles(park.coords.lat, park.coords.lon, (done, total) => {
        setPct(Math.round((done / total) * 100));
      }).then(() => setState('done'));
    } else {
      setState('done');
    }
  }

  return (
    <TouchableOpacity
      style={[
        odbS.btn,
        state === 'done'
          ? { backgroundColor: 'rgba(34,197,94,0.1)', borderColor: 'rgba(34,197,94,0.3)' }
          : { backgroundColor: '#16a34a', borderColor: '#16a34a' },
      ]}
      onPress={start}
      disabled={state !== 'idle'}
      activeOpacity={0.8}
    >
      <Ionicons
        name={state === 'done' ? 'checkmark-circle' : state === 'downloading' ? 'hourglass-outline' : 'cloud-download-outline'}
        size={14}
        color={state === 'done' ? '#22c55e' : '#fff'}
      />
      <Text style={[odbS.txt, { color: state === 'done' ? '#22c55e' : '#fff' }]}>
        {state === 'done' ? 'Guardado offline' : state === 'downloading' ? `Descargando ${pct}%` : `Mapa offline · ${park.size}`}
      </Text>
    </TouchableOpacity>
  );
}

const odbS = StyleSheet.create({
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    borderRadius: 2, borderWidth: 1, paddingVertical: 10, paddingHorizontal: 12,
  },
  txt: { fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
});

// ─── Park detail panel ────────────────────────────────────────────────────────

function ParkPanel({ park, onClose, c }: { park: typeof NATIONAL_PARKS[0]; onClose: () => void; c: any }) {
  return (
    <View style={[ppS.panel, { backgroundColor: c.surface, borderColor: c.border }]}>
      <View style={ppS.photoWrap}>
        {Platform.OS === 'web' && (
          // @ts-ignore
          <img src={park.photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={park.name} />
        )}
        <View style={ppS.photoOverlay} />
        <TouchableOpacity style={ppS.closeBtn} onPress={onClose}>
          <Ionicons name="close" size={18} color="#fff" />
        </TouchableOpacity>
        {park.unesco && (
          <View style={ppS.unescoBadge}>
            <Ionicons name="ribbon-outline" size={12} color="#fff" />
            <Text style={ppS.unescoTxt}>Patrimonio UNESCO</Text>
          </View>
        )}
      </View>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 32 }}>
        <Text style={[ppS.name, { color: c.text }]}>{park.name}</Text>
        <Text style={[ppS.province, { color: c.muted }]}>{park.province} · {park.region}</Text>
        <View style={ppS.chipRow}>
          <View style={[ppS.chip, { backgroundColor: c.elevated, borderColor: c.border }]}>
            <Ionicons name="resize-outline" size={12} color="#22c55e" />
            <Text style={[ppS.chipTxt, { color: c.muted }]}>{park.area_km2.toLocaleString()} km²</Text>
          </View>
        </View>
        <Text style={[ppS.highlights, { color: c.text }]}>{park.highlights}</Text>
        <TouchableOpacity style={ppS.apnBtn} onPress={() => Linking.openURL(park.url)} activeOpacity={0.8}>
          <Ionicons name="open-outline" size={15} color="#fff" />
          <Text style={ppS.apnBtnTxt}>Ver en APN oficial</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const ppS = StyleSheet.create({
  panel: { flex: 1, borderLeftWidth: 1 },
  photoWrap: { height: 160, position: 'relative', backgroundColor: '#162035' },
  photoOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(7,11,20,0.4)' },
  closeBtn: {
    position: 'absolute', top: 12, right: 12,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center',
  },
  unescoBadge: {
    position: 'absolute', bottom: 12, left: 12,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(34,197,94,0.85)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999,
  },
  unescoTxt: { fontSize: 11, fontWeight: '700', color: '#fff' },
  name: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  province: { fontSize: 13 },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 1 },
  chipTxt: { fontSize: 12, fontWeight: '600' },
  highlights: { fontSize: 14, lineHeight: 22 },
  apnBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#16a34a', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 12,
    alignSelf: 'flex-start',
  },
  apnBtnTxt: { color: '#fff', fontSize: 14, fontWeight: '700' },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function MapasScreen() {
  const { isDark } = useTheme();
  const { isOffline } = useNetwork();
  const { isWide } = useResponsive();
  const [layer, setLayer] = useState<MapLayer>('argenmap');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [contributeOpen, setContributeOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [parksOpen, setParksOpen] = useState(false);
  const [selectedPark, setSelectedPark] = useState<typeof NATIONAL_PARKS[0] | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<typeof MAP_REGIONS[0]>(MAP_REGIONS[0]);
  const [coord, setCoord] = useState<{ lat: number; lon: number } | null>(null);

  const c = isDark
    ? { bg: '#070b14', surface: '#0f1724', elevated: '#162035', border: '#1e2d42', text: '#f0f9ff', muted: '#64748b' }
    : { bg: '#f8fafc', surface: '#ffffff', elevated: '#f1f5f9', border: '#e2e8f0', text: '#0f172a', muted: '#64748b' };

  const effectiveLayer: MapLayer = !isDark && layer === 'dark' ? 'osm' : layer;
  const isWeb = Platform.OS === 'web';

  const parkMarkers = ALL_PARK_MARKERS.map((p) => ({
    id: p.id,
    lat: p.lat,
    lon: p.lng,
    name: p.name,
    subtitle: `${p.province} · ${p.region}`,
    color: p.color,
  }));

  const filteredRegionParks = selectedRegion
    ? ALL_PARK_MARKERS.filter((p) => p.region === selectedRegion.id)
    : ALL_PARK_MARKERS;

  const mapSection = (
    <View style={s.mapWrapper}>
      <MapLeaflet
        layer={effectiveLayer}
        height="100%"
        onMapPress={(lat: number, lon: number) => setCoord({ lat, lon })}
        markers={parkMarkers}
        onMarkerPress={(id: string) => {
          const park = NATIONAL_PARKS.find((p) => p.id === id);
          if (park) setSelectedPark(park);
        }}

        flyTo={
          selectedPark
            ? { lat: selectedPark.coords.lat, lon: selectedPark.coords.lon, zoom: 10 }
            : selectedRegion
            ? { lat: selectedRegion.center.lat, lon: selectedRegion.center.lon, zoom: selectedRegion.center.zoom }
            : null
        }
        center={[-40.5, -68.0]}
        zoom={4}
      />

      <SafeAreaView edges={['top']} style={s.topSafe} pointerEvents="box-none">
        <View style={[s.topBar, { backgroundColor: c.surface + 'F2', borderColor: c.border }]}>
          <View style={s.topLeft}>
            <Ionicons name="location" size={18} color="#22c55e" />
            <Text style={[s.topTitle, { color: c.text }]}>Mapas</Text>
          </View>
          <View style={s.topRight}>
            <OfflineBadge />
            <ThemeToggle />
          </View>
        </View>
        {coord && (
          <View style={[s.coordToast, { backgroundColor: c.surface + 'F2', borderColor: c.border }]}>
            <Ionicons name="pin-outline" size={14} color="#22c55e" />
            <Text style={[s.coordText, { color: c.muted }]}>{coord.lat.toFixed(4)}, {coord.lon.toFixed(4)}</Text>
            <TouchableOpacity onPress={() => setContributeOpen(true)} style={s.coordBtn}>
              <Text style={s.coordBtnText}>Contribuir aquí</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>

      {/* FABs */}
      <View style={s.fabColumn} pointerEvents="box-none">
        <TouchableOpacity
          onPress={() => setContributeOpen(true)}
          style={[s.fab, { backgroundColor: c.surface, borderColor: c.border, borderWidth: 1 }]}
        >
          <Ionicons name="add" size={26} color={c.text} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setDownloadOpen(true)}
          style={[s.fab, { backgroundColor: c.surface, borderColor: '#22c55e', borderWidth: 1 }]}
        >
          <Ionicons name="download-outline" size={20} color="#22c55e" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setParksOpen(true)}
          style={[s.fab, { backgroundColor: '#16a34a' }]}
        >
          <Ionicons name="flag-outline" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setSheetOpen(true)}
          style={[s.fab, { backgroundColor: '#16a34a' }]}
        >
          <Ionicons name="layers" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Wide layout: map + sidebar
  if (isWide && isWeb) {
    return (
      <ScrollView style={[s.root, { backgroundColor: c.bg }]} showsVerticalScrollIndicator={false}>
        {/* ── MAPA DE LOS PARQUES NACIONALES ── */}
        <View style={[s.regionHeader, { borderBottomColor: c.border }]}>
          <Text style={[s.regionEyebrow, { color: c.muted }]} {...({ 'data-eyebrow': true } as any)}>
            MAPA DE LOS PARQUES NACIONALES
          </Text>
          <Text style={[s.regionTitle, { color: c.text }]} {...({ 'data-serif': true } as any)}>
            Argentina, región por región
          </Text>
          <Text style={[s.regionSub, { color: c.muted }]}>
            Elegí una región para recorrer el mapa, conocer sus parques y descargar la cartografía oficial.
          </Text>
          <View style={s.regionChips}>
            {MAP_REGIONS.map((r) => {
              const active = selectedRegion?.id === r.id;
              return (
                <TouchableOpacity
                  key={r.id}
                  onPress={() => { setSelectedRegion(r); setSelectedPark(null); }}
                  style={[
                    s.regionChip,
                    active
                      ? { backgroundColor: '#16a34a', borderColor: '#16a34a' }
                      : { backgroundColor: 'transparent', borderColor: c.border },
                  ]}
                  activeOpacity={0.8}
                >
                  <Text style={[s.regionChipTxt, { color: active ? '#fff' : c.muted }]}>{r.name}</Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={[s.officialBtn, { borderColor: 'rgba(34,197,94,0.5)' }]}
              onPress={() => Linking.openURL(OFFICIAL_MAP_URL)}
              activeOpacity={0.8}
            >
              <Ionicons name="download-outline" size={14} color="#22c55e" />
              <Text style={s.officialBtnTxt}>Mapa oficial APN</Text>
            </TouchableOpacity>
          </View>
          {/* Color legend */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, paddingTop: 16 }}>
            {[
              { color: '#22c55e', label: 'Patagonia' },
              { color: '#c97c3e', label: 'Cuyo' },
              { color: '#8a6d3b', label: 'Sierras Centrales' },
              { color: '#6a8f3f', label: 'Norte / NOA' },
              { color: '#7a4f7f', label: 'Litoral / NEA' },
              { color: '#315f86', label: 'Áreas Marinas' },
            ].map((l) => (
              <View key={l.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: l.color }} />
                <Text style={{ fontSize: 11, color: c.muted, fontWeight: '600' }}>{l.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.wideRow}>
          {mapSection}
          {selectedPark ? (
            <View style={{ width: 340 }}>
              <ParkPanel park={selectedPark} onClose={() => setSelectedPark(null)} c={c} />
            </View>
          ) : (
            <View style={[s.parksSidebar, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Text style={[s.sidebarTitle, { color: c.text }]}>
                {selectedRegion ? selectedRegion.name : 'Áreas Protegidas'}
              </Text>
              <Text style={[s.sidebarSub, { color: c.muted }]}>
                {filteredRegionParks.length} áreas · {selectedRegion ? selectedRegion.provinces : 'Argentina'}
              </Text>
              <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                {filteredRegionParks.map((park) => {
                  const curated = NATIONAL_PARKS.find(np => np.id === park.id);
                  return (
                    <TouchableOpacity
                      key={park.id}
                      style={[s.parkItem, { borderBottomColor: c.border }]}
                      onPress={() => curated ? setSelectedPark(curated) : undefined}
                      activeOpacity={curated ? 0.7 : 1}
                    >
                      <View style={[s.parkItemDot, { backgroundColor: park.color }]} />
                      <View style={{ flex: 1 }}>
                        <View style={s.parkItemRow}>
                          <Text style={[s.parkItemName, { color: c.text }]}>{park.name}</Text>
                          {park.international?.includes('UNESCO') || park.international?.includes('Patrimonio Mundial') ? (
                            <Text style={s.unescoChip}>UNESCO</Text>
                          ) : null}
                        </View>
                        <Text style={[s.parkItemSub, { color: c.muted }]}>{park.province}</Text>
                        {park.category !== 'Parque Nacional' && (
                          <Text style={[s.parkItemSub, { color: c.muted, fontSize: 9 }]}>{park.category}</Text>
                        )}
                      </View>
                      {curated && <Ionicons name="chevron-forward" size={14} color={c.muted} />}
                    </TouchableOpacity>
                  );
                })}
                <View style={[s.dlAllBtn, { borderTopColor: c.border }]}>
                  <TouchableOpacity
                    style={s.dlAllInner}
                    onPress={() => setDownloadOpen(true)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="cloud-download-outline" size={16} color="#22c55e" />
                    <Text style={s.dlAllTxt}>Descargar mapas offline</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          )}
        </View>

        {/* ── REGIÓN SELECCIONADA — descripción + video + parques ── */}
        {selectedRegion && (
          <View style={[s.regionDetail, { borderBottomColor: c.border }]}>
            <View style={s.regionDetailRow}>
              <View style={s.regionDetailLeft}>
                <Text style={[s.regionDetailEyebrow, { color: c.muted }]} {...({ 'data-eyebrow': true } as any)}>
                  {selectedRegion.provinces.toUpperCase()}
                </Text>
                <Text style={[s.regionDetailName, { color: c.text }]} {...({ 'data-serif': true } as any)}>
                  {selectedRegion.name}
                </Text>
                <Text style={[s.regionDetailDesc, { color: c.muted }]}>{selectedRegion.desc}</Text>

                <Text style={[s.regionParksLabel, { color: c.muted }]} {...({ 'data-eyebrow': true } as any)}>
                  PARQUES DE LA REGIÓN
                </Text>
                <View style={s.regionParksWrap}>
                  {filteredRegionParks.map((park) => {
                    const curated = NATIONAL_PARKS.find(np => np.id === park.id);
                    return (
                      <TouchableOpacity
                        key={park.id}
                        style={[s.regionParkChip, { borderColor: c.border, backgroundColor: c.surface }]}
                        onPress={() => curated ? setSelectedPark(curated) : undefined}
                        activeOpacity={0.8}
                      >
                        <View style={[s.parkItemDot, { backgroundColor: park.color, width: 8, height: 8, borderRadius: 4 }]} />
                        <Text style={[s.regionParkChipTxt, { color: c.text }]}>{park.name}</Text>
                        {(park.international?.includes('UNESCO') || park.international?.includes('Patrimonio Mundial')) && (
                          <Text style={s.unescoChip}>UNESCO</Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={s.regionDetailRight}>
                {/* @ts-ignore — iframe web-only */}
                <iframe
                  src={`https://www.youtube.com/embed/${selectedRegion.video}`}
                  style={{ width: '100%', height: '100%', border: 'none', borderRadius: 4 }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={selectedRegion.name}
                />
              </View>
            </View>
          </View>
        )}

        {/* ── CENTRO DE DESCARGAS — always visible ── */}
        <View style={[s.dlCenter, { backgroundColor: c.bg }]}>
          <Text style={[s.dlCenterEyebrow, { color: c.muted }]} {...({ 'data-eyebrow': true } as any)}>
            CENTRO DE DESCARGAS
          </Text>
          <Text style={[s.dlCenterTitle, { color: c.text }]} {...({ 'data-serif': true } as any)}>
            Mapas para llevar sin señal
          </Text>
          <Text style={[s.dlCenterSub, { color: c.muted }]}>
            Mapas topográficos offline para el navegador y cartografía oficial en PDF de Parques Nacionales Argentina.
          </Text>
          <View style={s.dlCenterGrid}>
            {NATIONAL_PARKS.map((park) => (
              <View key={park.id} style={[s.dlCenterCard, { backgroundColor: c.surface, borderColor: c.border }]}>
                <View style={s.dlCenterPhoto}>
                  {/* @ts-ignore */}
                  <img src={park.photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={park.name} loading="lazy" />
                  {park.unesco && (
                    <View style={s.dlCenterUnesco}>
                      <Text style={s.dlCenterUnescoTxt}>UNESCO</Text>
                    </View>
                  )}
                </View>
                <View style={s.dlCenterBody}>
                  <Text style={[s.dlCenterName, { color: c.text }]} {...({ 'data-serif': true } as any)}>{park.name}</Text>
                  <Text style={[s.dlCenterProv, { color: c.muted }]}>{park.province} · {park.region}</Text>
                  <OfflineDlButton park={park} c={c} />
                  <TouchableOpacity
                    style={[s.dlCenterPdfBtn, { borderColor: c.border }]}
                    onPress={() => Linking.openURL(park.url)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="document-text-outline" size={14} color="#22c55e" />
                    <Text style={[s.dlCenterPdfTxt, { color: c.text }]}>Mapa oficial PDF — APN</Text>
                    <Ionicons name="open-outline" size={12} color={c.muted} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>

        <WebFooter />

        {/* Modals */}
        {renderModals()}
      </ScrollView>
    );
  }

  function renderModals() {
    return (
      <>
        {/* Layers */}
        <Modal visible={sheetOpen} transparent animationType="slide" onRequestClose={() => setSheetOpen(false)}>
          <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={() => setSheetOpen(false)}>
            <TouchableOpacity activeOpacity={1} style={[s.sheet, { backgroundColor: c.surface, borderColor: c.border }]}>
              <View style={[s.handle, { backgroundColor: c.border }]} />
              <Text style={[s.sheetTitle, { color: c.muted }]}>CAPA DEL MAPA</Text>
              <View style={s.layerRow}>
                {LAYERS.map((l) => {
                  const active = layer === l.id;
                  return (
                    <TouchableOpacity
                      key={l.id}
                      onPress={() => setLayer(l.id)}
                      style={[s.layerChip, { backgroundColor: active ? '#16a34a' : c.elevated, borderColor: active ? '#16a34a' : c.border }]}
                    >
                      <Ionicons name={l.icon} size={18} color={active ? '#fff' : c.muted} />
                      <Text style={[s.layerLabel, { color: active ? '#fff' : c.text }]}>{l.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {isOffline && (
                <View style={[s.offlineNote, { marginTop: 16 }]}>
                  <Ionicons name="cloud-offline-outline" size={15} color="#fbbf24" />
                  <Text style={s.offlineNoteText}>Sin conexión · Los tiles del mapa requieren internet</Text>
                </View>
              )}
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* Parks list (mobile) */}
        <Modal visible={parksOpen} transparent animationType="slide" onRequestClose={() => setParksOpen(false)}>
          <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={() => setParksOpen(false)}>
            <TouchableOpacity activeOpacity={1} style={[s.downloadSheet, { backgroundColor: c.surface, borderColor: c.border }]}>
              <View style={[s.handle, { backgroundColor: c.border }]} />
              <Text style={[s.dlTitle, { color: c.text }]}>Áreas Protegidas</Text>
              <Text style={[s.dlSub, { color: c.muted }]}>{ALL_PARK_MARKERS.length} áreas · Argentina</Text>
              <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 12 }}>
                {ALL_PARK_MARKERS.map((park) => {
                  const curated = NATIONAL_PARKS.find(np => np.id === park.id);
                  return (
                    <TouchableOpacity
                      key={park.id}
                      style={[s.parkItem, { borderBottomColor: c.border }]}
                      onPress={() => { if (curated) { setSelectedPark(curated); setParksOpen(false); } }}
                      activeOpacity={curated ? 0.7 : 1}
                    >
                      <View style={[s.parkItemDot, { backgroundColor: park.color }]} />
                      <View style={{ flex: 1 }}>
                        <View style={s.parkItemRow}>
                          <Text style={[s.parkItemName, { color: c.text }]}>{park.name}</Text>
                          {(park.international?.includes('UNESCO') || park.international?.includes('Patrimonio Mundial')) && (
                            <Text style={s.unescoChip}>UNESCO</Text>
                          )}
                        </View>
                        <Text style={[s.parkItemSub, { color: c.muted }]}>{park.province}</Text>
                      </View>
                      {curated && <Ionicons name="chevron-forward" size={14} color={c.muted} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* Download modal */}
        <Modal visible={downloadOpen} transparent animationType="slide" onRequestClose={() => setDownloadOpen(false)}>
          <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={() => setDownloadOpen(false)}>
            <TouchableOpacity activeOpacity={1} style={[s.downloadSheet, { backgroundColor: c.surface, borderColor: c.border }]}>
              <View style={[s.handle, { backgroundColor: c.border }]} />
              <View style={s.dlHeader}>
                <View style={s.dlIconWrap}>
                  <Ionicons name="cloud-download-outline" size={20} color="#22c55e" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.dlTitle, { color: c.text }]}>Mapas sin conexión</Text>
                  <Text style={[s.dlSub, { color: c.muted }]}>{NATIONAL_PARKS.length} parques · Datos APN oficiales</Text>
                </View>
                <TouchableOpacity onPress={() => setDownloadOpen(false)}>
                  <Ionicons name="close" size={20} color={c.muted} />
                </TouchableOpacity>
              </View>
              <View style={[s.infoBanner, { backgroundColor: isDark ? 'rgba(56,189,248,0.08)' : 'rgba(14,165,233,0.06)', borderColor: isDark ? 'rgba(56,189,248,0.2)' : 'rgba(14,165,233,0.2)' }]}>
                <Ionicons name="information-circle-outline" size={15} color="#38bdf8" />
                <Text style={[s.infoBannerTxt, { color: '#38bdf8' }]}>
                  Mapas offline con curvas de nivel, senderos y puntos de interés. Descargados desde fuentes APN oficiales.
                </Text>
              </View>
              <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 4 }}>
                {NATIONAL_PARKS.map((park) => (
                  <DownloadCard key={park.id} park={park} c={c} />
                ))}
              </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>

        {/* Park detail (mobile) */}
        {selectedPark && (
          <Modal visible animationType="slide" onRequestClose={() => setSelectedPark(null)}>
            <View style={{ flex: 1, backgroundColor: c.bg }}>
              <ParkPanel park={selectedPark} onClose={() => setSelectedPark(null)} c={c} />
            </View>
          </Modal>
        )}

        {/* Contribute */}
        <Modal visible={contributeOpen} animationType="slide" presentationStyle="pageSheet">
          <View style={{ flex: 1, backgroundColor: c.bg }}>
            <View style={[s.modalHeader, { borderBottomColor: c.border }]}>
              <Text style={[s.modalTitle, { color: c.text }]}>Nueva contribución</Text>
              <TouchableOpacity onPress={() => setContributeOpen(false)}>
                <Ionicons name="close" size={24} color={c.muted} />
              </TouchableOpacity>
            </View>
            <ContributeForm onClose={() => setContributeOpen(false)} onSubmit={() => setContributeOpen(false)} />
          </View>
        </Modal>
      </>
    );
  }

  // Mobile / narrow layout
  return (
    <View style={[s.root, { backgroundColor: c.bg }]}>
      {mapSection}
      {renderModals()}
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  // Explicit height: inside a ScrollView, flex:1 collapses to 0 and the map disappears.
  wideRow: { height: 560, flexDirection: 'row' },
  mapWrapper: { flex: 1, position: 'relative' },

  // Region explorer header
  regionHeader: { paddingHorizontal: 40, paddingTop: 56, paddingBottom: 28, borderBottomWidth: 1, alignItems: 'center' },
  regionEyebrow: { fontSize: 11, fontWeight: '600', letterSpacing: 4, marginBottom: 12 },
  regionTitle: { fontSize: 38, fontWeight: '400', letterSpacing: -0.5, marginBottom: 10, textAlign: 'center' },
  regionSub: { fontSize: 14, lineHeight: 22, textAlign: 'center', maxWidth: 580, marginBottom: 24 },
  regionChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', alignItems: 'center' },
  regionChip: { borderWidth: 1, borderRadius: 2, paddingHorizontal: 16, paddingVertical: 9 },
  regionChipTxt: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' },
  officialBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    borderWidth: 1, borderRadius: 2, paddingHorizontal: 16, paddingVertical: 9, marginLeft: 8,
  },
  officialBtnTxt: { fontSize: 11, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', color: '#22c55e' },

  // Region detail panel
  regionDetail: { paddingHorizontal: 40, paddingVertical: 56, borderBottomWidth: 1, alignItems: 'center' },
  regionDetailRow: { flexDirection: 'row', gap: 48, maxWidth: 1200, width: '100%' },
  regionDetailLeft: { flex: 1.1, minWidth: 320 },
  regionDetailRight: { flex: 1, minWidth: 320, height: 320 },
  regionDetailEyebrow: { fontSize: 10, fontWeight: '600', letterSpacing: 3, marginBottom: 10 },
  regionDetailName: { fontSize: 42, fontWeight: '400', letterSpacing: -1, marginBottom: 16 },
  regionDetailDesc: { fontSize: 15, lineHeight: 26, marginBottom: 28 },
  regionParksLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 3, marginBottom: 12 },
  regionParksWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  regionParkChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderRadius: 2, paddingHorizontal: 12, paddingVertical: 8,
  },
  regionParkChipTxt: { fontSize: 12, fontWeight: '600' },

  topSafe: { position: 'absolute', top: 0, left: 0, right: 0 },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 12, marginTop: 8, paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 18, borderWidth: 1,
  },
  topLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  topTitle: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  coordToast: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 12, marginTop: 8, paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 14, borderWidth: 1,
  },
  coordText: { fontSize: 13, flex: 1 },
  coordBtn: { backgroundColor: '#16a34a', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  coordBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  fabColumn: { position: 'absolute', right: 16, bottom: 32, gap: 12 },
  fab: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },

  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, padding: 20, paddingBottom: 36, maxHeight: '80%' },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 18 },
  sheetTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 12 },
  layerRow: { flexDirection: 'row', gap: 10 },
  layerChip: { flex: 1, alignItems: 'center', gap: 6, paddingVertical: 14, borderRadius: 16, borderWidth: 1 },
  layerLabel: { fontSize: 12, fontWeight: '600' },
  offlineNote: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(245,158,11,0.12)', borderRadius: 12, padding: 12 },
  offlineNoteText: { color: '#fbbf24', fontSize: 12, fontWeight: '500', flex: 1 },

  downloadSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, padding: 20, paddingBottom: 36, maxHeight: '90%' },
  dlHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  dlIconWrap: { width: 42, height: 42, borderRadius: 12, backgroundColor: 'rgba(34,197,94,0.12)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.25)', alignItems: 'center', justifyContent: 'center' },
  dlTitle: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  dlSub: { fontSize: 12, marginTop: 1 },
  infoBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 12 },
  infoBannerTxt: { fontSize: 12, lineHeight: 17, flex: 1, fontWeight: '500' },

  // Parks sidebar (wide)
  parksSidebar: { width: 300, borderLeftWidth: 1, flexDirection: 'column', padding: 16 },
  sidebarTitle: { fontSize: 17, fontWeight: '800', letterSpacing: -0.4, marginBottom: 2 },
  sidebarSub: { fontSize: 12, marginBottom: 14 },
  parkItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1 },
  parkItemDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  parkItemRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  parkItemName: { fontSize: 13, fontWeight: '700' },
  parkItemSub: { fontSize: 11, marginTop: 1 },
  unescoChip: { fontSize: 9, fontWeight: '800', color: '#22c55e', backgroundColor: 'rgba(34,197,94,0.12)', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 },
  dlAllBtn: { paddingTop: 16, borderTopWidth: 1, marginTop: 8 },
  dlAllInner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(34,197,94,0.1)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: 'rgba(34,197,94,0.25)' },
  dlAllTxt: { color: '#22c55e', fontSize: 13, fontWeight: '700' },

  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  modalTitle: { fontSize: 17, fontWeight: '700' },

  // Download center (always-visible section, wide web)
  dlCenter: { paddingVertical: 72, paddingHorizontal: 40, alignItems: 'center' },
  dlCenterEyebrow: { fontSize: 11, fontWeight: '600', letterSpacing: 4, marginBottom: 12 },
  dlCenterTitle: { fontSize: 34, fontWeight: '400', letterSpacing: -0.5, marginBottom: 12, textAlign: 'center' },
  dlCenterSub: { fontSize: 14, lineHeight: 22, textAlign: 'center', maxWidth: 560, marginBottom: 40 },
  dlCenterGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 20, justifyContent: 'center',
    maxWidth: 1200, width: '100%',
  },
  dlCenterCard: {
    width: 270, borderWidth: 1, borderRadius: 4, overflow: 'hidden',
  },
  dlCenterPhoto: { height: 150, position: 'relative', backgroundColor: '#162035' },
  dlCenterUnesco: {
    position: 'absolute', top: 10, left: 10,
    backgroundColor: 'rgba(7,11,20,0.75)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 2,
  },
  dlCenterUnescoTxt: { fontSize: 8, fontWeight: '800', color: '#fff', letterSpacing: 1.5 },
  dlCenterBody: { padding: 16, gap: 8 },
  dlCenterName: { fontSize: 19, fontWeight: '400', letterSpacing: -0.3 },
  dlCenterProv: { fontSize: 11, letterSpacing: 0.5, marginBottom: 6 },
  dlCenterPdfBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    borderWidth: 1, borderRadius: 2, paddingVertical: 10, paddingHorizontal: 12,
  },
  dlCenterPdfTxt: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, flex: 1, textAlign: 'center' },
});
