import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';

export interface MapMarker {
  id: string;
  lat: number;
  lon: number;
  name: string;
  subtitle?: string;
}

export type EsriLayer = 'esri-topo' | 'esri-satellite' | 'esri-streets';

const ESRI_TILES: Record<EsriLayer, string> = {
  'esri-topo':      'https://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
  'esri-satellite': 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  'esri-streets':   'https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
};

interface Props {
  onMarkerPress?: (id: string) => void;
  onLocationUpdate?: (lat: number, lon: number) => void;
  onMapPress?: (lat: number, lon: number) => void;
  markers?: MapMarker[];
  waypoints?: Array<{ lat: number; lon: number; name: string }>;
  flyTo?: { lat: number; lon: number; zoom?: number } | null;
  center?: [number, number];
  zoom?: number;
  height?: number | string;
  showHikingRoute?: boolean;
  showPolyline?: boolean;
  layer?: EsriLayer;
  userPosition?: { lat: number; lon: number } | null;
}

// Load MapLibre GL JS from CDN once (no npm dep needed)
let _ml: any = null;
let _mlPromise: Promise<any> | null = null;

function getMapLibre(): Promise<any> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (_ml) return Promise.resolve(_ml);
  if (_mlPromise) return _mlPromise;
  _mlPromise = new Promise((resolve) => {
    if (!document.getElementById('maplibre-gl-css-web')) {
      const link = document.createElement('link');
      link.id = 'maplibre-gl-css-web';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css';
      document.head.prepend(link);
    }
    if ((window as any).maplibregl) {
      _ml = (window as any).maplibregl;
      resolve(_ml);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js';
    script.onload = () => { _ml = (window as any).maplibregl; resolve(_ml); };
    document.head.appendChild(script);
  });
  return _mlPromise;
}

function buildStyle(layer: EsriLayer) {
  return {
    version: 8 as const,
    sources: {
      esri: {
        type: 'raster' as const,
        tiles: [ESRI_TILES[layer]],
        tileSize: 256,
        attribution: '&copy; Esri, HERE, Garmin, FAO, NOAA, USGS',
      },
    },
    layers: [{ id: 'esri-layer', type: 'raster' as const, source: 'esri' }],
  };
}

function makeMarkerEl(color = '#16a34a') {
  const el = document.createElement('div');
  el.style.cssText = `width:14px;height:14px;border-radius:50%;background:${color};border:2.5px solid rgba(255,255,255,0.9);box-shadow:0 2px 8px rgba(0,0,0,0.35);cursor:pointer;`;
  return el;
}

export function MapLibreEsri({
  onMarkerPress,
  onMapPress,
  markers = [],
  flyTo,
  center = [-31.970, -64.910],
  zoom = 12,
  height = 400,
  layer = 'esri-topo',
  userPosition,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerInstancesRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);

  // Init map (re-create when layer changes)
  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;
    let cancelled = false;

    getMapLibre().then((ml) => {
      if (cancelled || !containerRef.current || !ml) return;

      const map = new ml.Map({
        container: containerRef.current,
        style: buildStyle(layer),
        center: [center[1], center[0]],
        zoom,
        maxZoom: 18,
        attributionControl: true,
      });
      mapRef.current = map;

      map.addControl(new ml.NavigationControl({ showCompass: false }), 'top-right');

      if (onMapPress) {
        map.on('click', (e: any) => onMapPress(e.lngLat.lat, e.lngLat.lng));
      }

      // Add markers after style loads
      map.on('load', () => {
        markers.forEach((m) => {
          const el = makeMarkerEl();
          el.addEventListener('click', () => onMarkerPress?.(m.id));
          const instance = new ml.Marker({ element: el, anchor: 'center' })
            .setLngLat([m.lon, m.lat])
            .addTo(map);
          markerInstancesRef.current.push(instance);
        });
      });
    });

    return () => {
      cancelled = true;
      markerInstancesRef.current = [];
      userMarkerRef.current = null;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layer]);

  // Update markers when list changes (after map init)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !_ml) return;
    markerInstancesRef.current.forEach((m) => m.remove());
    markerInstancesRef.current = [];
    markers.forEach((m) => {
      const el = makeMarkerEl();
      el.addEventListener('click', () => onMarkerPress?.(m.id));
      const instance = new _ml.Marker({ element: el, anchor: 'center' })
        .setLngLat([m.lon, m.lat])
        .addTo(map);
      markerInstancesRef.current.push(instance);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markers]);

  // FlyTo
  useEffect(() => {
    if (flyTo && mapRef.current) {
      mapRef.current.flyTo({ center: [flyTo.lon, flyTo.lat], zoom: flyTo.zoom ?? 10, duration: 1200 });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flyTo?.lat, flyTo?.lon, flyTo?.zoom]);

  // User position marker
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !_ml) return;
    if (!userPosition) { userMarkerRef.current?.remove(); userMarkerRef.current = null; return; }
    if (userMarkerRef.current) {
      userMarkerRef.current.setLngLat([userPosition.lon, userPosition.lat]);
    } else {
      const el = document.createElement('div');
      el.style.cssText = 'position:relative;width:20px;height:20px;';
      el.innerHTML = '<div style="position:absolute;inset:0;border-radius:50%;background:rgba(59,130,246,0.25);animation:hike-pulse-web 1.8s ease-out infinite;"></div>'
        + '<div style="position:absolute;top:4px;left:4px;width:12px;height:12px;border-radius:50%;background:#3b82f6;border:2.5px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div>'
        + '<style>@keyframes hike-pulse-web{0%{transform:scale(1);opacity:.6}100%{transform:scale(2.5);opacity:0}}</style>';
      userMarkerRef.current = new _ml.Marker({ element: el, anchor: 'center' })
        .setLngLat([userPosition.lon, userPosition.lat])
        .addTo(map);
    }
    map.panTo([userPosition.lon, userPosition.lat], { animate: true, duration: 500 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPosition?.lat, userPosition?.lon]);

  if (typeof window === 'undefined') {
    return (
      <View
        style={{
          height: typeof height === 'number' ? height : undefined,
          flex: height === '100%' ? 1 : undefined,
          backgroundColor: '#0f1724',
        }}
      />
    );
  }

  const isFullHeight = height === '100%';
  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: isFullHeight ? 'calc(100vh - 58px)' : typeof height === 'number' ? `${height}px` : String(height),
    minHeight: 300,
    position: 'relative',
    display: 'block',
  };

  return <div ref={containerRef} style={containerStyle} />;
}

export default MapLibreEsri;
