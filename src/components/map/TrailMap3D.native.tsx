import React from 'react';
import { View, Text } from 'react-native';
import WebView from 'react-native-webview';
import { gpxTrackToGeoJSON } from '../../utils/geojson';

interface GpxPoint {
  lat: number;
  lon: number;
  ele?: number;
  name?: string;
}

interface TrailMap3DProps {
  track: GpxPoint[];
  trailName: string;
  height?: number | string;
  exaggeration?: number;
  mapTilerKey?: string;
}

/**
 * Native 3D trail map — renders MapLibre GL JS inside a WebView.
 * The GeoJSON route data is injected via postMessage after the page loads.
 */
export default function TrailMap3D({
  track,
  trailName,
  height = 300,
  exaggeration = 1.5,
  mapTilerKey,
}: TrailMap3DProps) {
  const webviewRef = React.useRef<WebView>(null);
  const containerH = typeof height === 'number' ? height : 300;

  const midIdx = Math.floor(track.length / 2);
  const center: [number, number] = [track[midIdx].lon, track[midIdx].lat];
  const lons = track.map((p) => p.lon);
  const lats = track.map((p) => p.lat);
  const bounds = {
    sw: [Math.min(...lons) - 0.05, Math.min(...lats) - 0.05],
    ne: [Math.max(...lons) + 0.05, Math.max(...lats) + 0.05],
  };

  const geoJSON = gpxTrackToGeoJSON(track);
  const terrainSource = mapTilerKey
    ? `{ type:'raster-dem', url:'https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${mapTilerKey}', tileSize:512 }`
    : `{ type:'raster-dem', tiles:['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'], tileSize:256, encoding:'terrarium', maxzoom:15 }`;
  const styleUrl = mapTilerKey
    ? `https://api.maptiler.com/maps/outdoor-v2/style.json?key=${mapTilerKey}`
    : 'https://tiles.openfreemap.org/styles/liberty';

  const html = `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="stylesheet" href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css">
<script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>
<style>*{margin:0;padding:0}body,#map{width:100%;height:100vh;}</style>
</head><body><div id="map"></div><script>
const map = new maplibregl.Map({
  container:'map',
  style:'${styleUrl}',
  center:${JSON.stringify(center)},
  zoom:9, pitch:55, bearing:0, antialias:true, maxTileCacheSize:30,
});
map.on('load',()=>{
  map.addSource('terrain-dem',${terrainSource});
  map.setTerrain({source:'terrain-dem',exaggeration:${exaggeration}});
  const geoJSON=${JSON.stringify(geoJSON)};
  map.addSource('trail',{type:'geojson',data:geoJSON});
  map.addLayer({id:'trail-glow',type:'line',source:'trail',paint:{'line-color':'#22c55e','line-width':8,'line-opacity':0.25,'line-blur':4}});
  map.addLayer({id:'trail-line',type:'line',source:'trail',paint:{'line-color':'#22c55e','line-width':3,'line-opacity':0.95}});
  map.fitBounds([${JSON.stringify(bounds.sw)},${JSON.stringify(bounds.ne)}],{padding:40,pitch:55,duration:1200});
});
</script></body></html>`;

  if (track.length < 2) return null;

  return (
    <View style={{ borderRadius: 16, overflow: 'hidden', height: containerH }}>
      <WebView
        ref={webviewRef}
        source={{ html }}
        style={{ flex: 1 }}
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        renderLoading={() => (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f1724' }}>
            <Text style={{ color: '#64748b', fontSize: 13 }}>Cargando mapa 3D…</Text>
          </View>
        )}
      />
    </View>
  );
}
