import React, { useRef, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

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

function buildHTML(
  center: [number, number],
  zoom: number,
  tileUrl: string,
  waypoints: Array<{ lat: number; lon: number; name: string }>,
): string {
  const waypointsJson = JSON.stringify(waypoints);
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <style>html,body,#map{margin:0;padding:0;height:100vh;width:100vw;}</style>
</head>
<body>
<div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
var map = L.map('map').setView([${center[0]},${center[1]}], ${zoom});
L.tileLayer('${tileUrl}', {maxZoom:18}).addTo(map);

var waypoints = ${waypointsJson};
var markers = [];
var polyline = null;

function renderWaypoints() {
  markers.forEach(function(m){m.remove();});
  markers=[];
  if(polyline){polyline.remove();polyline=null;}
  if(!waypoints.length) return;
  var latlngs=[];
  waypoints.forEach(function(wp,i){
    var icon = L.divIcon({
      html: '<div style="background:#16a34a;color:white;border-radius:50%;width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-weight:bold;font-size:12px;border:2px solid white;">'+(i+1)+'</div>',
      className:'',iconSize:[28,28],iconAnchor:[14,14]
    });
    var m = L.marker([wp.lat,wp.lon],{icon:icon}).addTo(map);
    m.bindPopup('<b>'+wp.name+'</b>');
    markers.push(m);
    latlngs.push([wp.lat,wp.lon]);
  });
  if(latlngs.length>1){
    polyline=L.polyline(latlngs,{color:'#16a34a',weight:3}).addTo(map);
  }
}

renderWaypoints();

map.on('click', function(e){
  window.ReactNativeWebView.postMessage(JSON.stringify({type:'mapPress',lat:e.latlng.lat,lon:e.latlng.lng}));
});
</script>
</body>
</html>`;
}

export default function MapLeaflet({
  onMapPress,
  waypoints = [],
  center = [-51.0, -73.0],
  zoom = 10,
  height = 400,
  layer = 'osm',
}: MapLeafletProps) {
  const tileUrl = TILE_URLS[layer];
  const html = buildHTML(center, zoom, tileUrl, waypoints);

  const handleMessage = useCallback(
    (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'mapPress' && onMapPress) {
          onMapPress(data.lat, data.lon);
        }
      } catch {
        // ignore
      }
    },
    [onMapPress],
  );

  return (
    <View style={[styles.container, { height: typeof height === 'number' ? height : undefined, flex: typeof height === 'string' ? 1 : undefined }]}>
      <WebView
        source={{ html }}
        onMessage={handleMessage}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={['*']}
        mixedContentMode="compatibility"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden', borderRadius: 0 },
  webview: { flex: 1 },
});
