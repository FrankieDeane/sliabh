import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';

export interface MapMarker {
  id: string;
  lat: number;
  lon: number;
  name: string;
  subtitle?: string;
}

export type EsriLayer = 'esri-topo' | 'esri-satellite' | 'esri-streets';

export interface LatLon { lat: number; lon: number }

/** GPS fixes closer than this to the previous one are jitter, not movement. */
const MIN_TRACK_MOVE_M = 4;

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
  /** Reference route of the trail (the suggested path), drawn in green. */
  routePoints?: LatLon[];
  /** Live breadcrumb of where the user has actually walked, drawn in blue. */
  trackPoints?: LatLon[];
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
  el.style.cssText = `width:20px;height:20px;border-radius:50%;background:${color};border:3px solid rgba(255,255,255,0.95);box-shadow:0 2px 10px rgba(0,0,0,0.5);cursor:pointer;`;
  return el;
}

function metersBetween(a: [number, number], b: [number, number]): number {
  const R = 6371000;
  const dLat = ((b[1] - a[1]) * Math.PI) / 180;
  const dLon = ((b[0] - a[0]) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a[1] * Math.PI) / 180) * Math.cos((b[1] * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

/** GeoJSON LineString from lat/lon points; `minMoveM` drops GPS jitter. */
function lineFeature(points: LatLon[] | undefined, minMoveM = 0) {
  const coords: [number, number][] = [];
  (points ?? []).forEach((p) => {
    if (!Number.isFinite(p?.lat) || !Number.isFinite(p?.lon)) return;
    const next: [number, number] = [p.lon, p.lat];
    const last = coords[coords.length - 1];
    if (last && minMoveM > 0 && metersBetween(last, next) < minMoveM) return;
    coords.push(next);
  });
  return { type: 'Feature' as const, geometry: { type: 'LineString' as const, coordinates: coords }, properties: {} };
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
  routePoints,
  trackPoints,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerInstancesRef = useRef<any[]>([]);
  const userMarkerRef = useRef<any>(null);
  const readyRef = useRef(false);
  const routeRef = useRef(routePoints);
  const trackRef = useRef(trackPoints);
  const followRef = useRef(true);
  const [following, setFollowing] = useState(true);

  routeRef.current = routePoints;
  trackRef.current = trackPoints;

  const setLineData = useCallback((sourceId: string, points: LatLon[] | undefined, minMoveM: number) => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    const src = map.getSource(sourceId);
    if (src) src.setData(lineFeature(points, minMoveM));
  }, []);

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

      // Panning or zooming by hand releases the camera, so the live position
      // can no longer yank the map back while the user reads the terrain.
      const release = (e: any) => {
        if (!e?.originalEvent || !followRef.current) return;
        followRef.current = false;
        setFollowing(false);
      };
      map.on('dragstart', release);
      map.on('zoomstart', release);
      map.on('rotatestart', release);

      // Add markers and route/track layers after style loads
      map.on('load', () => {
        if (cancelled) return;
        readyRef.current = true;

        map.addSource('trail-route', { type: 'geojson', data: lineFeature(routeRef.current) });
        map.addLayer({
          id: 'trail-route-casing', type: 'line', source: 'trail-route',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: { 'line-color': '#04260f', 'line-width': 7, 'line-opacity': 0.45 },
        });
        map.addLayer({
          id: 'trail-route-line', type: 'line', source: 'trail-route',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: { 'line-color': '#22c55e', 'line-width': 3.5, 'line-dasharray': [2, 1.6] },
        });

        map.addSource('user-track', { type: 'geojson', data: lineFeature(trackRef.current, MIN_TRACK_MOVE_M) });
        map.addLayer({
          id: 'user-track-casing', type: 'line', source: 'user-track',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: { 'line-color': '#ffffff', 'line-width': 8, 'line-opacity': 0.55 },
        });
        map.addLayer({
          id: 'user-track-line', type: 'line', source: 'user-track',
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: { 'line-color': '#3b82f6', 'line-width': 4.5 },
        });

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
      readyRef.current = false;
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

  // Reference route of the trail
  useEffect(() => {
    setLineData('trail-route', routePoints, 0);
  }, [routePoints, setLineData]);

  // Breadcrumb of the walked path — redrawn on every new fix
  useEffect(() => {
    setLineData('user-track', trackPoints, MIN_TRACK_MOVE_M);
  }, [trackPoints, setLineData]);

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
    if (followRef.current) {
      map.panTo([userPosition.lon, userPosition.lat], { animate: true, duration: 500 });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPosition?.lat, userPosition?.lon]);

  const recenter = useCallback(() => {
    followRef.current = true;
    setFollowing(true);
    const map = mapRef.current;
    if (map && userPosition) {
      map.easeTo({ center: [userPosition.lon, userPosition.lat], duration: 600 });
    }
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
  const resolvedHeight = isFullHeight
    ? 'calc(100vh - 58px)'
    : typeof height === 'number' ? `${height}px` : String(height);
  const containerStyle: React.CSSProperties = {
    width: '100%',
    height: resolvedHeight,
    minHeight: 300,
    position: 'relative',
    display: 'block',
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: resolvedHeight, minHeight: 300 }}>
      <div ref={containerRef} style={containerStyle} />
      {!following && userPosition && (
        <button
          type="button"
          onClick={recenter}
          style={{
            position: 'absolute',
            left: 14,
            bottom: 18,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 999,
            padding: '8px 14px',
            background: 'rgba(15,23,42,0.85)',
            color: '#fff',
            fontSize: 12.5,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          ◎ Centrar / Recenter
        </button>
      )}
    </div>
  );
}

export default MapLibreEsri;
