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

let MapContainer: any, TileLayer: any, useMapEvents: any, useMap: any, Marker: any, Popup: any, Polyline: any;
let Leaflet: any;
if (typeof window !== 'undefined') {
  const rl = require('react-leaflet');
  const L = require('leaflet');
  Leaflet = L;
  MapContainer = rl.MapContainer;
  TileLayer = rl.TileLayer;
  useMapEvents = rl.useMapEvents;
  useMap = rl.useMap;
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

export interface MapMarker {
  id: string;
  lat: number;
  lon: number;
  name: string;
  subtitle?: string;
  color?: string;
}

interface MapLeafletProps {
  onMapPress?: (lat: number, lon: number) => void;
  waypoints?: Array<{ lat: number; lon: number; name: string }>;
  markers?: MapMarker[];
  onMarkerPress?: (id: string) => void;
  flyTo?: { lat: number; lon: number; zoom?: number } | null;
  center?: [number, number];
  zoom?: number;
  height?: number | string;
  layer?: 'osm' | 'topo' | 'dark' | 'argenmap';
  showPolyline?: boolean;
  userPosition?: { lat: number; lon: number } | null;
}

const TILE_URLS = {
  osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  topo: 'https://tile.opentopomap.org/{z}/{x}/{y}.png',
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  argenmap: 'https://wms.ign.gob.ar/geoserver/gwc/service/tms/1.0.0/capabaseargenmap@EPSG%3A3857@png/{z}/{x}/{-y}.png',
};

const TILE_ATTRIBUTIONS = {
  osm: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  topo: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
  dark: '&copy; <a href="https://carto.com/attributions">CARTO</a> &copy; OpenStreetMap',
  argenmap: 'IGN Argentina &copy; Leaflet',
};

function makeMarkerIcon(color: string) {
  if (!Leaflet) return null;
  return Leaflet.divIcon({
    html: `<div style="width:20px;height:20px;border-radius:50%;background:${color};border:3px solid rgba(255,255,255,0.95);box-shadow:0 2px 10px rgba(0,0,0,0.5);"></div>`,
    className: '',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -12],
  });
}

// Cache icons by color to avoid creating new Leaflet objects on every render
const iconCache: Record<string, any> = {};
function getCachedIcon(color: string) {
  if (!iconCache[color]) iconCache[color] = makeMarkerIcon(color);
  return iconCache[color] ?? undefined;
}

function MarkerLayer({ markers, parkIcon, onMarkerPress }: {
  markers: MapMarker[];
  parkIcon: any;
  onMarkerPress?: (id: string) => void;
}) {
  return (
    <>
      {markers.map((m) => {
        const icon = m.color ? getCachedIcon(m.color) : (parkIcon ?? undefined);
        return (
          <Marker
            key={m.id}
            position={[m.lat, m.lon]}
            icon={icon}
            eventHandlers={{ click: () => onMarkerPress?.(m.id) }}
          >
            <Popup>
              <strong>{m.name}</strong>
              {m.subtitle ? <><br />{m.subtitle}</> : null}
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}

function FlyToHandler({ flyTo }: { flyTo?: { lat: number; lon: number; zoom?: number } | null }) {
  const map = useMap ? useMap() : null;
  useEffect(() => {
    if (map && flyTo) {
      map.flyTo([flyTo.lat, flyTo.lon], flyTo.zoom ?? 10, { duration: 1.2 });
    }
  }, [map, flyTo?.lat, flyTo?.lon]);
  return null;
}

const parkIcon = Leaflet
  ? Leaflet.divIcon({
      html: '<div style="background:#16a34a;border-radius:50% 50% 50% 0;width:26px;height:26px;transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;"><div style="transform:rotate(45deg);color:#fff;font-size:13px;line-height:1;">⛰</div></div>',
      className: '',
      iconSize: [26, 26],
      iconAnchor: [13, 26],
      popupAnchor: [0, -26],
    })
  : null;

function ClickHandler({ onMapPress }: { onMapPress?: (lat: number, lon: number) => void }) {
  if (!useMapEvents) return null;
  useMapEvents({
    click(e: any) {
      onMapPress?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

const userPosIcon = Leaflet
  ? Leaflet.divIcon({
      html: `<div style="position:relative;width:20px;height:20px;">
        <div style="position:absolute;inset:0;border-radius:50%;background:rgba(59,130,246,0.25);animation:hike-pulse 1.8s ease-out infinite;"></div>
        <div style="position:absolute;top:4px;left:4px;width:12px;height:12px;border-radius:50%;background:#3b82f6;border:2.5px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div>
      </div>
      <style>@keyframes hike-pulse{0%{transform:scale(1);opacity:.6}100%{transform:scale(2.5);opacity:0}}</style>`,
      className: '',
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    })
  : null;

function UserPositionMarker({ position }: { position: { lat: number; lon: number } | null | undefined }) {
  const map = useMap ? useMap() : null;
  useEffect(() => {
    if (map && position) {
      map.panTo([position.lat, position.lon], { animate: true, duration: 0.5 });
    }
  }, [map, position?.lat, position?.lon]);
  if (!position || !Marker || !userPosIcon) return null;
  return (
    <Marker position={[position.lat, position.lon]} icon={userPosIcon}>
      <Popup>Tu ubicación / Your location</Popup>
    </Marker>
  );
}

export function MapLeaflet({
  onMapPress,
  waypoints = [],
  markers = [],
  onMarkerPress,
  flyTo,
  center = [-51.0, -73.0],
  zoom = 10,
  height = 400,
  layer = 'osm',
  showPolyline = true,
  userPosition,
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
        <FlyToHandler flyTo={flyTo} />
        <MarkerLayer markers={markers} parkIcon={parkIcon} onMarkerPress={onMarkerPress} />
        <UserPositionMarker position={userPosition} />
        {waypoints.map((wp, index) => (
          <Marker key={`${wp.lat}-${wp.lon}-${index}`} position={[wp.lat, wp.lon]}>
            <Popup>
              <strong>{index + 1}. {wp.name}</strong><br />
              {wp.lat.toFixed(5)}, {wp.lon.toFixed(5)}
            </Popup>
          </Marker>
        ))}
        {showPolyline && polylinePositions.length >= 2 && (
          <Polyline positions={polylinePositions} color="#22c55e" weight={3} opacity={0.85} />
        )}
      </MapContainer>
    </div>
  );
}

export default MapLeaflet;
