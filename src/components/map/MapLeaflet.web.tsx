import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';

// Only import on web
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
  // Fix default marker icon
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
  layer?: 'osm' | 'topo';
}

const TILE_URLS = {
  osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  topo: 'https://tile.opentopomap.org/{z}/{x}/{y}.png',
};

const TILE_ATTRIBUTIONS = {
  osm: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  topo: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
};

function ClickHandler({ onMapPress }: { onMapPress?: (lat: number, lon: number) => void }) {
  if (!useMapEvents) return null;
  useMapEvents({
    click(e: any) {
      if (onMapPress) {
        onMapPress(e.latlng.lat, e.latlng.lng);
      }
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
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const id = 'leaflet-css';
    if (!document.getElementById(id)) {
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);
    }
  }, []);

  if (typeof window === 'undefined' || !MapContainer) {
    return (
      <View
        style={{
          height: typeof height === 'number' ? height : undefined,
          flex: height === '100%' ? 1 : undefined,
          backgroundColor: '#1c1917',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      />
    );
  }

  const containerStyle: React.CSSProperties = {
    height: typeof height === 'number' ? `${height}px` : height,
    width: '100%',
    flex: height === '100%' ? 1 : undefined,
    minHeight: typeof height === 'string' && height !== '100%' ? undefined : 300,
  };

  const polylinePositions = waypoints.map((w) => [w.lat, w.lon] as [number, number]);

  return (
    <div style={containerStyle}>
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
              <strong>{index + 1}. {wp.name}</strong>
              <br />
              {wp.lat.toFixed(5)}, {wp.lon.toFixed(5)}
            </Popup>
          </Marker>
        ))}
        {polylinePositions.length >= 2 && (
          <Polyline
            positions={polylinePositions}
            color="#22c55e"
            weight={3}
            opacity={0.8}
          />
        )}
      </MapContainer>
    </div>
  );
}

export default MapLeaflet;
