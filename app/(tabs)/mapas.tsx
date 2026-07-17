import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Modal, ScrollView,
  StyleSheet, Platform, useWindowDimensions, ImageBackground,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { WebFooter } from '../../src/components/layout/WebFooter';
import { SenderoCorrection } from '../../src/components/contribute/SenderoCorrection';
import { useTheme } from '../../src/hooks/useTheme';
import { useNetwork } from '../../src/hooks/useNetwork';
import { useLangStore } from '../../src/utils/../store/langStore';
import { downloadAreaTiles, isAreaCached, isTileCachingSupported, estimateAreaSizeMb } from '../../src/utils/offlineTiles';
import { downloadGpx } from '../../src/utils/gpx';
import { ARGENTINA_TRAILS } from '../../src/data/argentinaTrails';
import { BARILOCHE_TRAILS } from '../../src/data/barilocheTreks';
import { buildMapTrailPayload } from '../../src/utils/mapTrailPayload';
import { fetchWikiImage } from '../../src/utils/wikiImage';

// All trails with a GPX track, pushed to the map iframe for rendering
const MAP_TRAIL_PAYLOAD = buildMapTrailPayload([
  ...ARGENTINA_TRAILS,
  ...(BARILOCHE_TRAILS as any),
] as any);

type DlState = 'idle' | 'downloading' | 'done';

const NATIONAL_PARKS = [
  {
    id: 'sierra-valdivieso-circuit',
    name: 'Circuito Sierra Valdivieso',
    province: 'Tierra del Fuego',
    region: 'Patagonia Sur',
    area_km2: 0,
    highlights: 'Paso de la Oveja · Paso Valdivieso · Valle Andorra · Valle Carbajal · 4-5 días',
    size: '55 MB',
    photo: '/sliabh-circuito-sierra-valdivieso.webp',
    coords: { lat: -54.7200, lon: -68.4200 },
    unesco: false,
    trailId: 'sierra-valdivieso-circuit',
  },
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
    trailId: 'fitz-roy-laguna-tres',
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
    trailId: 'refugio-frey-bariloche',
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
    trailId: 'volcan-lanin',
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
    trailId: 'alerces-cascada-arrayanes',
  },
  {
    id: 'bahia-mitre',
    name: 'Bahía Mitre',
    province: 'Tierra del Fuego',
    region: 'Patagonia Sur',
    area_km2: 3680,
    highlights: 'Costa atlántica virgen · Travesía extrema · Aislamiento total · Bosque subantártico',
    size: '85 MB',
    photo: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=75&fit=crop',
    coords: { lat: -54.8750, lon: -66.6500 },
    unesco: false,
    trailId: 'bahia-mitre',
    gpxPoints: [
      { lat: -54.8820, lon: -67.6200, name: 'Bahía Mitre — Inicio / punto de extracción' },
      { lat: -54.8720, lon: -67.4100, name: 'Río Overand — cruce vadera' },
      { lat: -54.8650, lon: -67.3000, name: 'Paso Sierra Beauvoir (510 m)' },
      { lat: -54.9124, lon: -67.0497, name: 'Bahía Aguirre — Campamento costero' },
      { lat: -54.8700, lon: -66.8600, name: 'Río San Pablo — cruce' },
      { lat: -54.8720, lon: -66.6200, name: 'Río Cangrejo — cruce vadera' },
      { lat: -54.8780, lon: -66.4400, name: 'Bahía Sloggett' },
      { lat: -54.8750, lon: -66.3500, name: 'Río Ewan — cruce vadera' },
      { lat: -54.8620, lon: -66.0800, name: 'Desembocadura Río Grande' },
      { lat: -54.8450, lon: -65.6700, name: 'Cabo San Diego — Punta más oriental de Argentina' },
    ],
  },
  {
    id: 'tierradelfuego',
    name: 'Tierra del Fuego',
    province: 'Tierra del Fuego',
    region: 'Patagonia Sur',
    area_km2: 630,
    highlights: 'Ushuaia · Canal Beagle · Lapataia · Fin del mundo',
    size: '73 MB',
    photo: 'https://images.unsplash.com/photo-hgKzuj2nAsI?w=600&q=75&fit=crop',
    mapOverlayUrl: 'https://turismoushuaia.com/wp-content/uploads/2023/01/mapa-esp-1024x622.jpg',
    coords: { lat: -54.8, lon: -68.5 },
    unesco: false,
    trailId: 'tierra-del-fuego-costera',
  },
  {
    id: 'senda-costera-zaratiegui',
    name: 'Senda Costera — Zaratiegui',
    province: 'Tierra del Fuego',
    region: 'Patagonia Sur',
    area_km2: 0,
    highlights: 'Canal Beagle · Ensenada Zaratiegui · Bosque subantártico · Fauna marina',
    size: '18 MB',
    photo: '/sliabh-bahia-ensenada.webp',
    coords: { lat: -54.8466, lon: -68.4818 },
    unesco: false,
    trailId: 'senda-costera-zaratiegui',
  },
  {
    id: 'dientes-navarino',
    name: 'Dientes de Navarino',
    province: 'Magallanes (Chile)',
    region: 'Patagonia Sur',
    area_km2: 0,
    highlights: 'Circuito más austral del mundo · Isla Navarino · Pasos de alta montaña · Lagunas glaciarias',
    size: '62 MB',
    photo: 'https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=600&q=75&fit=crop',
    coords: { lat: -54.932, lon: -67.613 },
    unesco: false,
    trailId: 'dientes-circuit',
    gpxPoints: [
      { lat: -54.9320, lon: -67.6130, name: 'Puerto Williams (inicio)' },
      { lat: -54.9640, lon: -67.5700, name: 'Base Dientes' },
      { lat: -54.9810, lon: -67.5460, name: 'Paso de los Dientes' },
      { lat: -55.0030, lon: -67.5080, name: 'Laguna del Salto' },
      { lat: -55.0120, lon: -67.4760, name: 'Paso Virginia' },
      { lat: -55.0010, lon: -67.4440, name: 'Laguna Virginia' },
      { lat: -54.9820, lon: -67.4120, name: 'Paso Guerrico' },
      { lat: -54.9320, lon: -67.6130, name: 'Puerto Williams (fin)' },
    ],
  },
  // ── Senderos Tierra del Fuego (OSM) ──────────────────────────────────────
  {
    id: 'laguna-esmeralda-ushuaia',
    name: 'Laguna Esmeralda',
    province: 'Tierra del Fuego',
    region: 'Patagonia Sur',
    area_km2: 0,
    highlights: 'Laguna glaciar · Turbera · Valle Tierra Mayor · Moderado',
    size: '12 MB',
    photo: 'https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=600&q=75&fit=crop',
    coords: { lat: -54.7082, lon: -68.1247 },
    unesco: false,
    trailId: 'laguna-esmeralda-ushuaia',
  },
  {
    id: 'laguna-del-caminante',
    name: 'Laguna del Caminante',
    province: 'Tierra del Fuego',
    region: 'Patagonia Sur',
    area_km2: 0,
    highlights: 'Sendero técnico · Bosque magallánico · Panoramas · Difícil',
    size: '14 MB',
    photo: 'https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=600&q=75&fit=crop',
    coords: { lat: -54.7795, lon: -68.4150 },
    unesco: false,
    trailId: 'laguna-del-caminante',
  },
  {
    id: 'laguna-5-hermanos',
    name: 'Lagunas de los Cinco Hermanos',
    province: 'Tierra del Fuego',
    region: 'Patagonia Sur',
    area_km2: 0,
    highlights: 'Cinco lagunas · Bosque subantártico · Vistas al Beagle · Moderado',
    size: '11 MB',
    photo: 'https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=600&q=75&fit=crop',
    coords: { lat: -54.7639, lon: -68.1735 },
    unesco: false,
    trailId: 'laguna-5-hermanos',
  },
  {
    id: 'laguna-submarino',
    name: 'Laguna Submarino',
    province: 'Tierra del Fuego',
    region: 'Patagonia Sur',
    area_km2: 0,
    highlights: 'Laguna remota · Bosque virgen · Moderado',
    size: '10 MB',
    photo: 'https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=600&q=75&fit=crop',
    coords: { lat: -54.7382, lon: -68.0822 },
    unesco: false,
    trailId: 'laguna-submarino',
  },
  {
    id: 'laguna-negra-tdf',
    name: 'Laguna Negra',
    province: 'Tierra del Fuego',
    region: 'Patagonia Sur',
    area_km2: 0,
    highlights: 'Laguna oscura · Turbera · Fácil · PN Tierra del Fuego',
    size: '8 MB',
    photo: '/tierra-del-fuego.webp',
    coords: { lat: -54.8458, lon: -68.5850 },
    unesco: false,
    trailId: 'laguna-negra-tdf',
  },
  {
    id: 'hito-xxiv-tdf',
    name: 'Hito XXIV',
    province: 'Tierra del Fuego',
    region: 'Patagonia Sur',
    area_km2: 0,
    highlights: 'Hito fronterizo · Canal Beagle · Lapataia · Fácil',
    size: '7 MB',
    photo: '/tierra-del-fuego.webp',
    coords: { lat: -54.8181, lon: -68.5787 },
    unesco: false,
    trailId: 'hito-xxiv-tdf',
  },
  {
    id: 'laguna-verde-tdf',
    name: 'Laguna Verde',
    province: 'Tierra del Fuego',
    region: 'Patagonia Sur',
    area_km2: 0,
    highlights: 'Laguna esmeralda · Bosque nativo · Fácil · PN Tierra del Fuego',
    size: '7 MB',
    photo: '/tierra-del-fuego.webp',
    coords: { lat: -54.8448, lon: -68.5688 },
    unesco: false,
    trailId: 'laguna-verde-tdf',
  },
  {
    id: 'mirador-tdf',
    name: 'Senda del Mirador',
    province: 'Tierra del Fuego',
    region: 'Patagonia Sur',
    area_km2: 0,
    highlights: 'Mirador panorámico · Beagle · Fácil · PN Tierra del Fuego',
    size: '6 MB',
    photo: '/tierra-del-fuego.webp',
    coords: { lat: -54.8522, lon: -68.5797 },
    unesco: false,
    trailId: 'mirador-tdf',
  },
  {
    id: 'baliza-tdf',
    name: 'Senda de la Baliza',
    province: 'Tierra del Fuego',
    region: 'Patagonia Sur',
    area_km2: 0,
    highlights: 'Costa Beagle · Fauna marina · Fácil · PN Tierra del Fuego',
    size: '6 MB',
    photo: '/tierra-del-fuego.webp',
    coords: { lat: -54.8579, lon: -68.5691 },
    unesco: false,
    trailId: 'baliza-tdf',
  },
  {
    id: 'turbal-tdf',
    name: 'Senda del Turbal',
    province: 'Tierra del Fuego',
    region: 'Patagonia Sur',
    area_km2: 0,
    highlights: 'Ecosistema de turbera · Interpretación ambiental · Fácil',
    size: '6 MB',
    photo: '/tierra-del-fuego.webp',
    coords: { lat: -54.8538, lon: -68.5858 },
    unesco: false,
    trailId: 'turbal-tdf',
  },
  {
    id: 'senda-costera-lapataia',
    name: 'Senda Costera — Lapataia',
    province: 'Tierra del Fuego',
    region: 'Patagonia Sur',
    area_km2: 0,
    highlights: 'Bahía Lapataia · Costa Beagle · Bosque · Fácil',
    size: '9 MB',
    photo: '/tierra-del-fuego.webp',
    coords: { lat: -54.8506, lon: -68.5073 },
    unesco: false,
    trailId: 'senda-costera-lapataia',
  },
  {
    id: 'ensenada-zaratiegui-osm',
    name: 'Ensenada Zaratiegui',
    province: 'Tierra del Fuego',
    region: 'Patagonia Sur',
    area_km2: 0,
    highlights: 'Ensenada protegida · Canal Beagle · Bosque nativo · Fácil',
    size: '8 MB',
    photo: '/sliabh-bahia-ensenada.webp',
    coords: { lat: -54.8324, lon: -68.4880 },
    unesco: false,
    trailId: 'ensenada-zaratiegui-osm',
  },
  {
    id: 'rio-pipo-tdf',
    name: 'Senda Río Pipo',
    province: 'Tierra del Fuego',
    region: 'Patagonia Sur',
    area_km2: 0,
    highlights: 'Río Pipo · Bosque subantártico · Interpretativo · Fácil',
    size: '7 MB',
    photo: '/tierra-del-fuego.webp',
    coords: { lat: -54.8171, lon: -68.4767 },
    unesco: false,
    trailId: 'rio-pipo-tdf',
  },
  // ── Patagonia Sur ─────────────────────────────────────────────────────────
  {
    id: 'cerro-torre-base',
    name: 'Cerro Torre — Laguna Torre',
    province: 'Santa Cruz',
    region: 'Patagonia Sur',
    area_km2: 0,
    highlights: 'Laguna Torre · Glaciar Grande · PN Los Glaciares · Moderado',
    size: '28 MB',
    photo: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=75&fit=crop',
    coords: { lat: -49.3055, lon: -72.9614 },
    unesco: false,
    trailId: 'cerro-torre-base',
  },
  {
    id: 'lago-desierto-patagonia',
    name: 'Lago del Desierto',
    province: 'Santa Cruz',
    region: 'Patagonia Sur',
    area_km2: 0,
    highlights: 'Lago glaciar · Bosque andino · Vistas al Fitz Roy · Fácil',
    size: '22 MB',
    photo: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=75&fit=crop',
    coords: { lat: -49.1047, lon: -72.8422 },
    unesco: false,
    trailId: 'lago-desierto-patagonia',
  },
  {
    id: 'pn-patagonia-ascension',
    name: 'PN Patagonia — La Ascensión',
    province: 'Santa Cruz',
    region: 'Patagonia Sur',
    area_km2: 0,
    highlights: 'Estepa patagónica · Lago Cochrane · Huemul · Moderado',
    size: '30 MB',
    photo: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&q=75&fit=crop',
    coords: { lat: -47.2100, lon: -72.1830 },
    unesco: false,
    trailId: 'pn-patagonia-ascension',
  },
  // ── Patagonia Norte ───────────────────────────────────────────────────────
  {
    id: 'cerro-lopez-bariloche',
    name: 'Cerro López — Refugio López',
    province: 'Río Negro',
    region: 'Patagonia Norte',
    area_km2: 0,
    highlights: 'Refugio López · Vistas Nahuel Huapi · Glaciar · Moderado',
    size: '18 MB',
    photo: 'https://bariloche.org/wp-content/uploads/2024/02/tronador-bariloche-febrero2024-franciscoraggio-barilocheorg.jpg',
    coords: { lat: -41.0817, lon: -71.5133 },
    unesco: false,
    trailId: 'cerro-lopez-bariloche',
  },
  {
    id: 'cerro-tronador-bariloche',
    name: 'Cerro Tronador — Glaciar Negro',
    province: 'Río Negro',
    region: 'Patagonia Norte',
    area_km2: 0,
    highlights: 'Ventisquero Negro · Garganta del Diablo · 3491 m · Moderado',
    size: '20 MB',
    photo: 'https://bariloche.org/wp-content/uploads/2024/02/tronador-bariloche-febrero2024-franciscoraggio-barilocheorg.jpg',
    coords: { lat: -41.2535, lon: -71.7755 },
    unesco: false,
    trailId: 'cerro-tronador-bariloche',
  },
  // ── Sierras Centrales ─────────────────────────────────────────────────────
  {
    id: 'cerro-champaqui',
    name: 'Cerro Champaquí — Cima',
    province: 'Córdoba',
    region: 'Sierras Centrales',
    area_km2: 0,
    highlights: '2884 m · Pico más alto de Córdoba · Bosque serrano · Moderado',
    size: '15 MB',
    photo: '/sliabh-sierras-de-cordoba.webp',
    coords: { lat: -31.9838, lon: -64.9292 },
    unesco: false,
    trailId: 'cerro-champaqui',
  },
  {
    id: 'los-gigantes-cordoba',
    name: 'Los Gigantes — Pared Sur',
    province: 'Córdoba',
    region: 'Sierras Centrales',
    area_km2: 0,
    highlights: 'Formaciones rocosas · Escalada · 2374 m · Difícil',
    size: '14 MB',
    photo: '/sliabh-sierras-de-cordoba.webp',
    coords: { lat: -31.3682, lon: -64.7397 },
    unesco: false,
    trailId: 'los-gigantes-cordoba',
  },
  // ── Buenos Aires ──────────────────────────────────────────────────────────
  {
    id: 'cerro-la-ventana',
    name: 'Cerro La Ventana',
    province: 'Buenos Aires',
    region: 'Buenos Aires',
    area_km2: 0,
    highlights: 'Ventana natural en la roca · 1134 m · Sierras de Ventania · Moderado',
    size: '12 MB',
    photo: 'https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=600&q=75&fit=crop',
    coords: { lat: -38.0722, lon: -62.0258 },
    unesco: false,
    trailId: 'cerro-la-ventana',
  },
  {
    id: 'lago-puelo',
    name: 'Lago Puelo',
    province: 'Chubut',
    region: 'Patagonia Norte',
    area_km2: 276,
    highlights: 'Microclima único · Bosque valdiviano · Trekking',
    size: '48 MB',
    photo: '/sliabh-lago-puelo.webp',
    coords: { lat: -42.07, lon: -71.63 },
    unesco: false,
    trailId: 'lago-puelo-los-hitos',
  },
  {
    id: 'aconcagua',
    name: 'Aconcagua',
    province: 'Mendoza',
    region: 'Cuyo',
    area_km2: 710,
    highlights: '6961 m · Ruta Normal · Valle de los Horcones',
    size: '96 MB',
    photo: '/sliabh-aconcagua-.webp',
    coords: { lat: -32.65, lon: -70.01 },
    unesco: false,
    trailId: 'aconcagua-ruta-normal',
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
    trailId: 'quebrada-humahuaca-trek',
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
    trailId: 'los-gigantes-cordoba',
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

// Download list grouped by province (alphabetical), rendered with a header per
// province in the web download center and in the native download sheet.
const PARKS_BY_PROVINCE = (() => {
  const groups = new Map<string, typeof NATIONAL_PARKS>();
  for (const park of NATIONAL_PARKS) {
    const list = groups.get(park.province) ?? [];
    list.push(park);
    groups.set(park.province, list);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b, 'es'))
    .map(([province, parks]) => ({ province, parks }));
})();

// ─── Download card ────────────────────────────────────────────────────────────
function DownloadCard({
  park, c, onViewMap, onFlyTo, onShowTrack,
}: {
  park: typeof NATIONAL_PARKS[0];
  c: any;
  onViewMap?: (lat: number, lon: number) => void;
  onFlyTo?: (lat: number, lng: number, zoom: number) => void;
  onShowTrack?: (points: Array<{lat: number; lon: number; name: string}>) => void;
}) {
  const [gpxState, setGpxState] = useState<'idle' | 'done'>('idle');
  const [cacheState, setCacheState] = useState<'idle' | 'downloading' | 'done'>('idle');
  const [cacheProgress, setCacheProgress] = useState(0);
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { t } = useLangStore();
  const isNarrow = width < 400;

  // Resolve a real Wikimedia photo for this place (overrides random stock).
  const [wikiPhoto, setWikiPhoto] = useState<string | null>(null);
  React.useEffect(() => {
    if (Platform.OS !== 'web') return;
    let alive = true;
    const query = (park as any).wikiQuery || park.name;
    fetchWikiImage(query).then((url) => { if (alive && url) setWikiPhoto(url); });
    return () => { alive = false; };
  }, [park.name]);

  React.useEffect(() => {
    if (isTileCachingSupported()) {
      isAreaCached(park.coords.lat, park.coords.lon).then((cached) => {
        if (cached) setCacheState('done');
      });
    }
  }, []);

  async function handleCache() {
    if (cacheState !== 'idle') return;
    if (!isTileCachingSupported()) {
      if (typeof window !== 'undefined') {
        window.alert(
          t(
            'Tu navegador no soporta almacenamiento offline. Abrí el sitio en HTTPS para activarlo.',
            'Your browser does not support offline storage. Open the site over HTTPS to enable it.',
          ),
        );
      }
      return;
    }
    setCacheState('downloading');
    setCacheProgress(0);
    try {
      await downloadAreaTiles(park.coords.lat, park.coords.lon, (done, total) => {
        setCacheProgress(Math.round((done / total) * 100));
      });
      setCacheState('done');
    } catch {
      setCacheState('idle');
    }
  }

  function handleViewMap() {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      onFlyTo?.(park.coords.lat, park.coords.lon, 11);
    } else if (onViewMap) {
      onViewMap(park.coords.lat, park.coords.lon);
    }
  }

  function handleMoreInfo() {
    const trailId = (park as any).trailId;
    if (trailId) {
      router.push({ pathname: '/(tabs)/ruta/[id]', params: { id: trailId } } as any);
    }
  }

  function handleGpx() {
    const gpxPoints = (park as any).gpxPoints;
    const points = gpxPoints ?? [{ lat: park.coords.lat, lon: park.coords.lon, name: park.name }];
    const ok = downloadGpx(
      park.name,
      points,
      `${park.name} — ${park.province} · ${park.region}. ${park.highlights}`,
    );
    if (ok) {
      setGpxState('done');
      onShowTrack?.(points);
      setTimeout(() => setGpxState('idle'), 2500);
    }
  }

  return (
    <View style={[dlS.card, { borderColor: c.border, backgroundColor: c.elevated }]}>
      {/* Photo */}
      <View style={[dlS.photo, { backgroundColor: c.surface }]}>
        {Platform.OS === 'web' ? (
          // @ts-ignore
          <img src={wikiPhoto || park.photo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={park.name} loading="lazy" />
        ) : null}
        <View style={dlS.photoOverlay} />
        <View style={dlS.sizeBadge}>
          <Text style={dlS.sizeTxt}>{Platform.OS === 'web' ? `~${estimateAreaSizeMb()} MB` : park.size}</Text>
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

        {/* Actions: view map, GPX for GPS apps, save offline, More Info */}
        <View style={dlS.btnRow}>
          <TouchableOpacity style={[dlS.btn, dlS.btnView]} onPress={handleViewMap} activeOpacity={0.8}>
            <Ionicons name="map-outline" size={13} color="#16a34a" />
            <Text style={[dlS.btnTxt, { color: '#16a34a' }]}>{t('Ver mapa', 'View map')}</Text>
          </TouchableOpacity>
          {Platform.OS === 'web' && (
            <TouchableOpacity style={[dlS.btn, dlS.btnGpx]} onPress={handleGpx} activeOpacity={0.8}>
              <Ionicons
                name={gpxState === 'done' ? 'checkmark-outline' : 'navigate-outline'}
                size={13}
                color="#93c5fd"
              />
              <Text style={[dlS.btnTxt, { color: '#93c5fd' }]}>
                {gpxState === 'done' ? t('GPX listo', 'GPX ready') : 'GPX / OsmAnd'}
              </Text>
            </TouchableOpacity>
          )}
          {Platform.OS === 'web' && (
            <TouchableOpacity
              style={[dlS.btn, cacheState === 'done' ? dlS.btnCacheDone : dlS.btnCache]}
              onPress={handleCache}
              activeOpacity={0.8}
            >
              <Ionicons
                name={cacheState === 'done' ? 'checkmark-circle-outline' : cacheState === 'downloading' ? 'time-outline' : 'save-outline'}
                size={13}
                color="#22c55e"
              />
              <Text style={[dlS.btnTxt, { color: '#22c55e' }]}>
                {cacheState === 'downloading' ? `${cacheProgress}%` : cacheState === 'done' ? t('Guardado', 'Saved') : t('Offline', 'Offline')}
              </Text>
            </TouchableOpacity>
          )}
          {(park as any).trailId && (
            <TouchableOpacity
              style={[dlS.btn, dlS.btnInfo]}
              onPress={handleMoreInfo}
              activeOpacity={0.8}
            >
              <Ionicons name="information-circle-outline" size={13} color="#fff" />
              <Text style={dlS.btnTxtWhite}>{t('Más info', 'More info')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const dlS = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
    flexDirection: 'row',
    minHeight: 200,
  },
  photo: { width: 140, flexShrink: 0, position: 'relative' },
  photoOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.15)' },
  sizeBadge: {
    position: 'absolute', top: 10, left: 10,
    backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  sizeTxt: { color: '#fff', fontSize: 10, fontWeight: '700' },
  unescoBadge: {
    position: 'absolute', bottom: 10, left: 10,
    backgroundColor: '#16a34a', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  unescoTxt: { color: '#fff', fontSize: 10, fontWeight: '700' },
  body: { flex: 1, padding: 16, gap: 6, justifyContent: 'space-between' },
  name: { fontSize: 17, fontWeight: '700', lineHeight: 22 },
  highlights: { fontSize: 14, lineHeight: 20 },
  meta: { fontSize: 13 },
  btnRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  btn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9,
  },
  btnInfo: { backgroundColor: '#16a34a' },
  btnView: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#16a34a' },
  btnGpx: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#3b82f6' },
  btnCache: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#22c55e' },
  btnCacheDone: { backgroundColor: 'rgba(34,197,94,0.12)', borderWidth: 1, borderColor: '#22c55e' },

  btnTxt: { fontSize: 13, fontWeight: '600' },
  btnTxtWhite: { fontSize: 13, fontWeight: '600', color: '#fff' },
});

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function MapasScreen() {
  const { isDark } = useTheme();
  const { isOffline } = useNetwork();
  const { lang, t } = useLangStore();
  const { width, height } = useWindowDimensions();
  const isMobile = width < 720;
  // Desktop: size the map to the viewport so the embedded park map and its
  // white trail info panels have room to render fully instead of being clipped
  // by a short fixed height. Floor keeps it usable on short laptop screens.
  const desktopMapHeight = Math.max(760, Math.round(height - 150));
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [flyTo, setFlyTo] = useState<{ lat: number; lon: number } | null>(null);
  const [esriLayer, setEsriLayer] = useState<'esri-topo' | 'esri-satellite' | 'esri-streets'>('esri-topo');
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const iframeLoaded = useRef(false);
  const pendingFlyTo = useRef<{ lat: number; lng: number; zoom: number } | null>(null);

  function sendFlyTo(lat: number, lng: number, zoom: number) {
    const msg = { type: 'flyTo', lat, lng, zoom };
    if (iframeLoaded.current && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(msg, '*');
    } else {
      // Queue it; the onLoad handler will send it once the iframe is ready
      pendingFlyTo.current = msg;
    }
  }

  function handleIframeLoad() {
    iframeLoaded.current = true;
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: 'setLang', lang }, '*');
      iframeRef.current.contentWindow.postMessage({ type: 'setTrails', trails: MAP_TRAIL_PAYLOAD }, '*');
    }
    if (pendingFlyTo.current && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(pendingFlyTo.current, '*');
      pendingFlyTo.current = null;
    }
  }

  // Keep the iframe language in sync with the React app language
  React.useEffect(() => {
    if (iframeLoaded.current && iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: 'setLang', lang }, '*');
    }
  }, [lang]);

  // (Re)push trail data whenever the iframe map signals it's ready
  React.useEffect(() => {
    if (Platform.OS !== 'web') return;
    function onMessage(e: MessageEvent) {
      if (e.data?.type === 'mapReady' && iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage({ type: 'setTrails', trails: MAP_TRAIL_PAYLOAD }, '*');
      }
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  const c = isDark
    ? { bg: '#070b14', surface: '#0f1724', elevated: '#162035', border: '#1e2d42', text: '#f0f9ff', muted: '#64748b' }
    : { bg: '#f8fafc', surface: '#ffffff', elevated: '#f1f5f9', border: '#e2e8f0', text: '#0f172a', muted: '#64748b' };

  function handleViewMap(lat: number, lon: number) {
    setFlyTo({ lat, lon });
    setDownloadOpen(false);
  }

  // ── Native: ESRI MapLibre full-screen map + layer switcher + Download FAB ──
  if (Platform.OS !== 'web') {
    const { MapLibreEsri } = require('../../src/components/map/MapLibreEsri');
    const ESRI_LAYERS: Array<{ key: 'esri-topo' | 'esri-satellite' | 'esri-streets'; label: string }> = [
      { key: 'esri-topo',      label: t('Topo', 'Topo') },
      { key: 'esri-satellite', label: t('Satélite', 'Satellite') },
      { key: 'esri-streets',   label: t('Calles', 'Streets') },
    ];
    const parkMarkers = NATIONAL_PARKS.filter(p => p.coords).map(p => ({
      id: p.id,
      lat: p.coords.lat,
      lon: p.coords.lon,
      name: p.name,
      subtitle: p.province,
    }));
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <MapLibreEsri
          center={flyTo ? [flyTo.lat, flyTo.lon] : [-31.970, -64.910]}
          zoom={flyTo ? 11 : 12}
          flyTo={flyTo ? { lat: flyTo.lat, lon: flyTo.lon, zoom: 11 } : null}
          height="100%"
          layer={esriLayer}
          markers={parkMarkers}
          showHikingRoute
          onMarkerPress={(id: string) => {
            const park = NATIONAL_PARKS.find(p => p.id === id);
            if (park) setFlyTo({ lat: park.coords.lat, lon: park.coords.lon });
          }}
        />

        {/* ESRI layer switcher — top-left */}
        <SafeAreaView edges={['top']} style={nS.layerBar} pointerEvents="box-none">
          <View style={[nS.layerPill, { backgroundColor: isDark ? 'rgba(15,23,36,0.88)' : 'rgba(248,250,252,0.92)', borderColor: c.border }]}>
            {ESRI_LAYERS.map((l) => (
              <TouchableOpacity
                key={l.key}
                style={[nS.layerBtn, esriLayer === l.key && nS.layerBtnActive]}
                onPress={() => setEsriLayer(l.key)}
                activeOpacity={0.75}
              >
                <Text style={[nS.layerTxt, esriLayer === l.key && nS.layerTxtActive, { color: esriLayer === l.key ? '#fff' : c.muted }]}>
                  {l.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </SafeAreaView>

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
                <Text style={[nS.sheetTitle, { color: c.text }]}>{t('Mapas sin conexión', 'Offline maps')}</Text>
                <TouchableOpacity onPress={() => setDownloadOpen(false)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                  <Ionicons name="close" size={22} color={c.muted} />
                </TouchableOpacity>
              </View>
              <Text style={[nS.sheetSub, { color: c.muted }]}>
                {t('Descargá y accedé a los mapas sin señal.', 'Download and access maps without signal.')}
              </Text>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
                {PARKS_BY_PROVINCE.map((group) => (
                  <View key={group.province}>
                    <View style={nS.provinceHeader}>
                      <Ionicons name="location-outline" size={13} color="#22c55e" />
                      <Text style={[nS.provinceName, { color: c.text }]}>{group.province}</Text>
                      <View style={[nS.provinceLine, { backgroundColor: c.border }]} />
                      <Text style={[nS.provinceCount, { color: c.muted }]}>
                        {group.parks.length} {group.parks.length === 1 ? t('mapa', 'map') : t('mapas', 'maps')}
                      </Text>
                    </View>
                    {group.parks.map((park) => (
                      <DownloadCard key={park.id} park={park} c={c} onViewMap={handleViewMap} />
                    ))}
                  </View>
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
            <Text style={[s.eyebrow, { color: c.muted }]}>{t('MAPA INTERACTIVO', 'INTERACTIVE MAP')}</Text>
            <Text style={[s.pageTitle, { color: c.text }]}>{t('Parques Nacionales de Argentina', 'National Parks of Argentina')}</Text>
          </View>
          {isOffline && (
            <View style={[s.offlineBadge, { backgroundColor: 'rgba(251,191,36,0.12)', borderColor: 'rgba(251,191,36,0.3)' }]}>
              <Ionicons name="cloud-offline-outline" size={13} color="#fbbf24" />
              <Text style={{ color: '#fbbf24', fontSize: 12, fontWeight: '600' }}>{t('Sin señal', 'Offline')}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={[s.iframeWrapper, isMobile ? { height: Math.round(width * 1.4) } as any : { height: desktopMapHeight } as any]}>
        {/* @ts-ignore */}
        <iframe
          ref={iframeRef as any}
          src="/parques.html?v=20260630c&ctx=mapas"
          style={{ width: '100%', height: '100%', border: 'none' }}
          title="Mapa de Parques Nacionales de Argentina"
          loading="eager"
          onLoad={handleIframeLoad}
        />
      </View>

      {/* ── GPS OFFLINE BANNER ── */}
      {isMobile ? (
        <View style={s.gpsBannerCompact}>
          <Ionicons name="navigate" size={14} color="#22c55e" />
          <Text style={s.gpsBannerCompactTxt}>
            {t('GPS sin señal — descargá el mapa abajo', 'Offline GPS — download the map below')}
          </Text>
        </View>
      ) : (
        <ImageBackground
          source={{ uri: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=1400&q=85&fit=crop' }}
          style={s.gpsBannerBg}
          resizeMode="cover"
        >
          <View style={s.gpsBannerOverlay} />
          <View style={s.gpsBannerContent}>
            <View style={{ flex: 1, gap: 12 }}>
              <View style={s.gpsBannerBadge}>
                <Ionicons name="navigate" size={13} color="#22c55e" />
                <Text style={s.gpsBannerBadgeTxt}>{t('GPS SIN SEÑAL', 'OFFLINE GPS')}</Text>
              </View>
              <Text style={s.gpsBannerTitle}>
                {t('Descargá el mapa.\nNavegá sin internet.', 'Download the map.\nNavigate without internet.')}
              </Text>
              <Text style={s.gpsBannerSub}>
                {t(
                  'El chip GPS de tu celular recibe señal de satélites sin necesitar datos. Descargá el mapa del parque antes de salir — tu posición aparece en tiempo real aunque no tengas señal.',
                  "Your phone's GPS chip receives satellite signals without data. Download the park map before you leave — your position appears in real time even without signal.",
                )}
              </Text>
            </View>
            <View style={s.gpsBannerSteps}>
              {([
                { num: '1', es: 'Descargá abajo', en: 'Download below' },
                { num: '2', es: 'Salí sin señal', en: 'Go off-grid' },
                { num: '3', es: 'GPS en tiempo real', en: 'Real-time GPS' },
              ] as const).map((step) => (
                <View key={step.num} style={s.gpsBannerStep}>
                  <View style={s.gpsBannerStepNum}>
                    <Text style={s.gpsBannerStepNumTxt}>{step.num}</Text>
                  </View>
                  <Text style={s.gpsBannerStepTxt}>{t(step.es, step.en)}</Text>
                </View>
              ))}
            </View>
          </View>
        </ImageBackground>
      )}

      <View style={[s.dlSection, { backgroundColor: c.bg }]}>
        <View style={s.dlHeader}>
          <Text style={[s.eyebrow, { color: c.muted }]}>{t('CENTRO DE DESCARGAS', 'DOWNLOAD CENTER')}</Text>
          <Text style={[s.sectionTitle, { color: c.text }, isMobile && { fontSize: 22 }]}>{t('Mapas para llevar sin señal', 'Maps to take offline')}</Text>
          <Text style={[s.sectionSub, { color: c.muted }]}>
            {t(
              'Guardá la cartografía de cada parque. Disponibles sin conexión — tocá "Ver mapa" para ubicarlo.',
              'Save each park\'s cartography. Available offline — tap "View map" to locate it.',
            )}
          </Text>
        </View>
        <View style={s.dlGrid}>
          {PARKS_BY_PROVINCE.map((group) => (
            <View key={group.province}>
              <View style={s.provinceHeader}>
                <Ionicons name="location-outline" size={14} color="#22c55e" />
                <Text style={[s.provinceName, { color: c.text }]}>{group.province}</Text>
                <View style={[s.provinceLine, { backgroundColor: c.border }]} />
                <Text style={[s.provinceCount, { color: c.muted }]}>
                  {group.parks.length} {group.parks.length === 1 ? t('mapa', 'map') : t('mapas', 'maps')}
                </Text>
              </View>
              {group.parks.map((park) => (
                <DownloadCard
                  key={park.id}
                  park={park}
                  c={c}
                  onFlyTo={(lat, lng, zoom) => {
                    iframeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    setTimeout(() => sendFlyTo(lat, lng, zoom), 450);
                  }}
                  onShowTrack={(points) => {
                    if (iframeLoaded.current && iframeRef.current?.contentWindow) {
                      iframeRef.current.contentWindow.postMessage({ type: 'showTrack', points }, '*');
                    }
                    iframeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                />
              ))}
            </View>
          ))}
        </View>
      </View>

      {/* Community: report the correct location of a mis-drawn trail */}
      <View style={{ maxWidth: 1200, alignSelf: 'center', width: '100%', paddingHorizontal: 24, paddingBottom: 40 }}>
        <SenderoCorrection colors={c} />
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
  layerBar: {
    position: 'absolute', top: 0, left: 12,
    zIndex: 10, pointerEvents: 'box-none' as any,
  },
  layerPill: {
    flexDirection: 'row', borderRadius: 999, borderWidth: 1,
    overflow: 'hidden', marginTop: 8,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  layerBtn: { paddingHorizontal: 14, paddingVertical: 8 },
  layerBtnActive: { backgroundColor: '#16a34a' },
  layerTxt: { fontSize: 12, fontWeight: '700' },
  layerTxtActive: { color: '#fff' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '88%', paddingHorizontal: 16, paddingTop: 12 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  sheetTitle: { fontSize: 18, fontWeight: '800' },
  sheetSub: { fontSize: 13, marginBottom: 16 },
  provinceHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, marginBottom: 12 },
  provinceName: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5, textTransform: 'uppercase' },
  provinceLine: { flex: 1, height: 1, opacity: 0.6 },
  provinceCount: { fontSize: 11, fontWeight: '600' },
});

const s = StyleSheet.create({
  root: { flex: 1 },
  mapHeader: { borderBottomWidth: 1, paddingVertical: 16, paddingHorizontal: 24 },
  mapHeaderInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', maxWidth: 1200, alignSelf: 'center', width: '100%' },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 },
  pageTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
  offlineBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  iframeWrapper: { width: '100%', height: 900 as any },
  // GPS offline banner — compact mobile strip
  gpsBannerCompact: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(34,197,94,0.1)', borderTopWidth: 1, borderBottomWidth: 1,
    borderColor: 'rgba(34,197,94,0.25)', paddingHorizontal: 16, paddingVertical: 10,
  },
  gpsBannerCompactTxt: { fontSize: 12, fontWeight: '600', color: '#22c55e', flex: 1 },
  // GPS offline banner — desktop full
  gpsBannerBg: { width: '100%' },
  gpsBannerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(7,11,20,0.72)' },
  gpsBannerContent: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 32,
    paddingHorizontal: 32, paddingVertical: 40,
    maxWidth: 1200, alignSelf: 'center', width: '100%',
  },
  gpsBannerBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    backgroundColor: 'rgba(34,197,94,0.15)', borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.3)', borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  gpsBannerBadgeTxt: { fontSize: 10, fontWeight: '700', letterSpacing: 2, color: '#22c55e' },
  gpsBannerTitle: { fontSize: 28, fontWeight: '800', color: '#f0f9ff', letterSpacing: -0.6, lineHeight: 34 },
  gpsBannerSub: { fontSize: 14, color: 'rgba(240,249,255,0.72)', lineHeight: 22, maxWidth: 560 },
  gpsBannerSteps: { justifyContent: 'center', gap: 14, minWidth: 200 },
  gpsBannerStep: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  gpsBannerStepNum: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#22c55e',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  gpsBannerStepNumTxt: { fontSize: 12, fontWeight: '800', color: '#000' },
  gpsBannerStepTxt: { fontSize: 14, color: 'rgba(240,249,255,0.85)', fontWeight: '600' },
  dlSection: { paddingTop: 48, paddingBottom: 32 },
  dlHeader: { paddingHorizontal: 24, marginBottom: 24, maxWidth: 1200, alignSelf: 'center', width: '100%' },
  sectionTitle: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5, marginBottom: 8 },
  sectionSub: { fontSize: 15, lineHeight: 24 },
  dlGrid: { paddingHorizontal: 24, maxWidth: 1200, alignSelf: 'center', width: '100%' },
  provinceHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 20, marginBottom: 14 },
  provinceName: { fontSize: 13, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase' },
  provinceLine: { flex: 1, height: 1, opacity: 0.6 },
  provinceCount: { fontSize: 11, fontWeight: '600' },
});
