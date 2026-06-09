import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';

// Inject Leaflet CSS synchronously at module load — before any MapContainer renders
if (typeof document !== 'undefined') {
  const cssId = 'leaflet-css-sync';
  if (!document.getElementById(cssId)) {
    const link = document.createElement('link');
    link.id = cssId;
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.prepend(link);
  }
}

let MapContainer: any, TileLayer: any, useMapEvents: any, Marker: any, Popup: any, Polyline: any;
if (typeof window !== 'undefined') {
  const rl = require('react-leaflet');
  const L = require('leaflet');
  MapContainer = rl.MapContainer;
  TileLayer = rl.TileLayer;
  useMapEvents = rl.useMapEvents;
  Marker = rl.Marker;
  Popup = rl.Popup;
  Polyline = rl.Polyline;
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

interface MapLeafletProps {
  onMapPress?: (lat: number, lon: number) => void;
  waypoints?: Array<{ lat: number; lon: number; name: string }>;
  center?: [number, number];
  zoom?: number;
  height?: number | string;
  layer?: 'osm' | 'topo' | 'dark';
}

const TILE_URLS = {
  osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  topo: 'https://tile.opentopomap.org/{z}/{x}/{y}.png',
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
};

const TILE_ATTRIBUTIONS = {
  osm: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  topo: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
  dark: '&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; OpenStreetMap',
};

function ClickHandler({ onMapPress }: { onMapPress?: (lat: number, lon: number) => void }) {
  if (!useMapEvents) return null;
  useMapEvents({
    click(e: any) {
      onMapPress?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function MapLeaflet({
  onMapPress,
  waypoints = [],
  center = [-51.0, -73.0],
  zoom = 10,
  height = 400,
  layer = 'osm',
}: MapLeafletProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Ensure Leaflet CSS is present (injectWebStyles pre-injects it, this is a safety net)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const id = 'leaflet-css';
    if (!document.getElementById(id)) {
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.prepend(link); // prepend so it loads before any render
    }
  }, []);

  if (typeof window === 'undefined' || !MapContainer) {
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
    height: isFullHeight ? 'calc(100vh - 58px)' : `${height}px`,
    minHeight: 300,
    // Ensure the container is a positioned block so Leaflet can measure it
    position: 'relative',
    display: 'block',
  };

  const polylinePositions = waypoints.map((w) => [w.lat, w.lon] as [number, number]);

  return (
    <div ref={wrapperRef} style={containerStyle}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom
      >
        <TileLayer
          url={TILE_URLS[layer] ?? TILE_URLS.osm}
          attribution={TILE_ATTRIBUTIONS[layer] ?? TILE_ATTRIBUTIONS.osm}
          maxZoom={18}
        />
        <ClickHandler onMapPress={onMapPress} />
        {waypoints.map((wp, index) => (
          <Marker key={`${wp.lat}-${wp.lon}-${index}`} position={[wp.lat, wp.lon]}>
            <Popup>
              <strong>{index + 1}. {wp.name}</strong><br />
              {wp.lat.toFixed(5)}, {wp.lon.toFixed(5)}
            </Popup>
          </Marker>
        ))}
        {polylinePositions.length >= 2 && (
          <Polyline positions={polylinePositions} color="#22c55e" weight={3} opacity={0.85} />
        )}
      </MapContainer>
    </div>
  );
}

export default MapLeaflet;
