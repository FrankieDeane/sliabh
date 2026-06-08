import React, { useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

interface Props {
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
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
};

function buildHTML(
  center: [number, number],
  zoom: number,
  tileUrl: string,
  waypoints: Array<{ lat: number; lon: number; name: string }>,
): string {
  const waypointsJson = JSON.stringify(waypoints);
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
  var map = L.map('map', { zoomControl: true }).setView([${center[0]}, ${center[1]}], ${zoom});

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

    if (latlngs.length > 1) {
      routeLine = L.polyline(latlngs, { color: '#16a34a', weight: 3, opacity: 0.85 }).addTo(map);
    }
  }

  renderWaypoints();

  map.on('click', function(e) {
    try {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'mapPress',
        lat: e.latlng.lat,
        lon: e.latlng.lng
      }));
    } catch(err) {}
  });
})();
</script>
</body>
</html>`;
}

export function MapLeaflet({
  onMapPress,
  waypoints = [],
  center = [-51.0, -73.0],
  zoom = 10,
  height = 400,
  layer = 'osm',
}: Props) {
  const tileUrl = TILE_URLS[layer] ?? TILE_URLS.osm;
  const html = buildHTML(center, zoom, tileUrl, waypoints);

  const handleMessage = useCallback(
    (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'mapPress' && onMapPress) {
          onMapPress(data.lat, data.lon);
        }
      } catch {
        // ignore malformed messages
      }
    },
    [onMapPress],
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
        source={{ html }}
        onMessage={handleMessage}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={['*']}
        mixedContentMode="compatibility"
        scrollEnabled={false}
        allowFileAccess
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
