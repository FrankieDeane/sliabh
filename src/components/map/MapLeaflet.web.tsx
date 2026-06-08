import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';

interface MapLeafletProps {
  onMapPress?: (lat: number, lon: number) => void;
  waypoints?: Array<{ lat: number; lon: number; name: string }>;
  center?: [number, number];
  zoom?: number;
  height?: number | string;
  layer?: 'osm' | 'topo';
}

const TILE_URLS = {
  osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  topo: 'https://tile.opentopomap.org/{z}/{x}/{y}.png',
};

const ATTRIBUTIONS = {
  osm: '© <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
  topo: '© <a href="https://opentopomap.org">OpenTopoMap</a>, © OpenStreetMap contributors',
};

export default function MapLeaflet({
  onMapPress,
  waypoints = [],
  center = [-51.0, -73.0],
  zoom = 10,
  height = 400,
  layer = 'osm',
}: MapLeafletProps) {
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const polylineRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (initializedRef.current) return;

    // Inject Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }

    const init = async () => {
      const L = (await import('leaflet')).default;

      // Fix marker icons
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      if (!containerRef.current) return;
      const map = L.map(containerRef.current).setView(center, zoom);
      mapRef.current = map;
      initializedRef.current = true;

      L.tileLayer(TILE_URLS[layer], { attribution: ATTRIBUTIONS[layer], maxZoom: 18 }).addTo(map);

      if (onMapPress) {
        map.on('click', (e: any) => onMapPress(e.latlng.lat, e.latlng.lng));
      }

      // Add initial waypoints
      addWaypointMarkers(L, map);
    };

    init().catch(console.error);

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        initializedRef.current = false;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addWaypointMarkers = (L: any, map: any) => {
    // Clear existing
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    if (polylineRef.current) { polylineRef.current.remove(); polylineRef.current = null; }

    if (!waypoints.length) return;

    const latlngs: [number, number][] = [];
    waypoints.forEach((wp, i) => {
      const icon = L.divIcon({
        html: `<div style="background:#16a34a;color:white;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:12px;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,0.3)">${i + 1}</div>`,
        className: '',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });
      const marker = L.marker([wp.lat, wp.lon], { icon }).addTo(map);
      marker.bindPopup(`<b>${wp.name}</b>`);
      markersRef.current.push(marker);
      latlngs.push([wp.lat, wp.lon]);
    });

    if (latlngs.length > 1) {
      polylineRef.current = L.polyline(latlngs, { color: '#16a34a', weight: 3, opacity: 0.8 }).addTo(map);
    }
  };

  // Sync waypoints when they change
  useEffect(() => {
    if (!mapRef.current || typeof window === 'undefined') return;
    import('leaflet').then(({ default: L }) => addWaypointMarkers(L, mapRef.current));
  }, [waypoints]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={{ height: typeof height === 'number' ? height : undefined, flex: typeof height === 'string' ? 1 : undefined }}>
      <div
        ref={containerRef}
        style={{ width: '100%', height: typeof height === 'number' ? height : '100%', minHeight: 300 }}
      />
    </View>
  );
}
