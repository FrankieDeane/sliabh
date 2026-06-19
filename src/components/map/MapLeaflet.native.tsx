import React, { useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

export interface MapMarker {
  id: string;
  lat: number;
  lon: number;
  name: string;
  subtitle?: string;
}

interface Props {
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
}

const TILE_URLS: Record<string, string> = {
  osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  topo: 'https://tile.opentopomap.org/{z}/{x}/{y}.png',
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
  argenmap: 'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
};

function buildHTML(
  center: [number, number],
  zoom: number,
  tileUrl: string,
  waypoints: Array<{ lat: number; lon: number; name: string }>,
  parkMarkers: MapMarker[] = [],
  showPolyline = true,
): string {
  const waypointsJson = JSON.stringify(waypoints);
  const parkMarkersJson = JSON.stringify(parkMarkers);
  const showPolylineJson = JSON.stringify(showPolyline);
  // Replace {s} with 'a' for native WebView since subdomains are handled in browser
  const nativeTileUrl = tileUrl.replace('{s}', 'a');
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { height: 100vh; width: 100vw; }
  </style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
(function() {
  var map = L.map('map', { zoomControl: false }).setView([${center[0]}, ${center[1]}], ${zoom});
  L.control.zoom({ position: 'topright' }).addTo(map);

  L.tileLayer('${nativeTileUrl}', {
    maxZoom: 18,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  var waypoints = ${waypointsJson};
  var markers = [];
  var routeLine = null;

  function renderWaypoints() {
    markers.forEach(function(m) { m.remove(); });
    markers = [];
    if (routeLine) { routeLine.remove(); routeLine = null; }
    if (!waypoints || !waypoints.length) return;

    var latlngs = [];
    waypoints.forEach(function(wp, i) {
      var icon = L.divIcon({
        html: '<div style="background:#16a34a;color:#fff;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:12px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4);">' + (i + 1) + '</div>',
        className: '',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -14]
      });
      var marker = L.marker([wp.lat, wp.lon], { icon: icon }).addTo(map);
      marker.bindPopup('<b>' + (i + 1) + '. ' + wp.name + '</b><br/>' + wp.lat.toFixed(5) + ', ' + wp.lon.toFixed(5));
      markers.push(marker);
      latlngs.push([wp.lat, wp.lon]);
    });

    if (latlngs.length > 1 && ${showPolylineJson}) {
      routeLine = L.polyline(latlngs, { color: '#16a34a', weight: 3, opacity: 0.85 }).addTo(map);
    }
  }

  renderWaypoints();

  var parkMarkers = ${parkMarkersJson};
  parkMarkers.forEach(function(p) {
    var icon = L.divIcon({
      html: '<div style="background:#16a34a;border-radius:50% 50% 50% 0;width:26px;height:26px;transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>',
      className: '',
      iconSize: [26, 26],
      iconAnchor: [13, 26],
      popupAnchor: [0, -26]
    });
    var marker = L.marker([p.lat, p.lon], { icon: icon }).addTo(map);
    marker.bindPopup('<b>' + p.name + '</b>' + (p.subtitle ? '<br/>' + p.subtitle : ''));
    marker.on('click', function() {
      try {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'markerPress', id: p.id }));
      } catch(err) {}
    });
  });

  map.on('click', function(e) {
    try {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'mapPress',
        lat: e.latlng.lat,
        lon: e.latlng.lng
      }));
    } catch(err) {}
  });

  // ── Locate me button (bottom-left) ─────────────────────────────────────────
  var userLocMarker = null;
  var LocateCtrl = L.Control.extend({
    options: { position: 'bottomleft' },
    onAdd: function() {
      var c = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
      c.innerHTML = '<button style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;background:#1d4ed8;color:#fff;border:2px solid #3b82f6;border-radius:4px;font-size:20px;cursor:pointer;padding:0;line-height:1;" title="Mi ubicación">◉</button>';
      var btn = c.querySelector('button');
      L.DomEvent.on(btn, 'click', function(e) {
        L.DomEvent.stopPropagation(e);
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(function(pos) {
          var lat = pos.coords.latitude, lng = pos.coords.longitude;
          if (userLocMarker) { userLocMarker.remove(); userLocMarker = null; }
          var icon = L.divIcon({
            html: '<div style="width:16px;height:16px;border-radius:50%;background:#3b82f6;border:3px solid #fff;box-shadow:0 0 0 6px rgba(59,130,246,.25);"></div>',
            className: '', iconSize: [16,16], iconAnchor: [8,8],
          });
          userLocMarker = L.marker([lat, lng], { icon: icon, zIndexOffset: 1000 }).addTo(map);
          userLocMarker.bindPopup('Tu ubicación / Your location').openPopup();
          map.flyTo([lat, lng], 13, { duration: 1.2 });
        }, function() {}, { enableHighAccuracy: true, timeout: 15000 });
      });
      L.DomEvent.disableClickPropagation(c);
      return c;
    }
  });
  new LocateCtrl().addTo(map);
})();
</script>
</body>
</html>`;
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
}: Props) {
  const tileUrl = TILE_URLS[layer] ?? TILE_URLS.osm;
  const effectiveCenter: [number, number] = flyTo ? [flyTo.lat, flyTo.lon] : center;
  const effectiveZoom = flyTo?.zoom ?? zoom;
  const html = buildHTML(effectiveCenter, effectiveZoom, tileUrl, waypoints, markers, showPolyline);

  const handleMessage = useCallback(
    (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'mapPress' && onMapPress) {
          onMapPress(data.lat, data.lon);
        }
        if (data.type === 'markerPress' && onMarkerPress) {
          onMarkerPress(data.id);
        }
      } catch {
        // ignore malformed messages
      }
    },
    [onMapPress, onMarkerPress],
  );

  return (
    <View
      style={[
        styles.container,
        {
          height: typeof height === 'number' ? height : undefined,
          flex: typeof height === 'string' ? 1 : undefined,
        },
      ]}
    >
      <WebView
        source={{ html, baseUrl: 'https://unpkg.com' }}
        onMessage={handleMessage}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        geolocationEnabled
        originWhitelist={['*']}
        mixedContentMode="always"
        scrollEnabled={false}
        allowFileAccess
        allowUniversalAccessFromFileURLs
        allowFileAccessFromFileURLs
      />
    </View>
  );
}

export default MapLeaflet;

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
