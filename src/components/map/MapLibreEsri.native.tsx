import React, { useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

export interface MapLibreEsriHandle {
  startHikeTracking: () => void;
  stopHikeTracking: () => void;
}

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
  markers?: MapMarker[];
  flyTo?: { lat: number; lon: number; zoom?: number } | null;
  center?: [number, number];
  zoom?: number;
  height?: number | string;
  showHikingRoute?: boolean;
  layer?: EsriLayer;
  userPosition?: { lat: number; lon: number } | null;
  showPolyline?: boolean;
}

// Ruta al Pico San Miguel — route coordinates [lon, lat]
const ROUTE: [number, number][] = [
  [-64.9600, -31.9950],
  [-64.9520, -31.9900],
  [-64.9450, -31.9857],
  [-64.9395, -31.9818],
  [-64.9348, -31.9778],
  [-64.9290, -31.9732],
  [-64.9240, -31.9690],
  [-64.9185, -31.9645],
  [-64.9130, -31.9600],
  [-64.9082, -31.9558],
  [-64.9035, -31.9515],
  [-64.8985, -31.9472],
  [-64.8952, -31.9495],
  [-64.8918, -31.9518],
  [-64.8882, -31.9532],
  [-64.8840, -31.9545],
  [-64.8795, -31.9555],
  [-64.8755, -31.9565],
  [-64.8700, -31.9578],
];

const HIKING_WAYPOINTS = [
  { c: [-64.9600, -31.9950], t: 'inicio', n: 'INICIO', s: 'Parking y Refugio · Alt. 1250m' },
  { c: [-64.9348, -31.9778], t: 'wp',     n: 'Refugio de Montaña', s: 'Punto 1 · 1580m' },
  { c: [-64.8998, -31.9555], t: 'peak',   n: 'Cerro del Águila', s: '2104m' },
  { c: [-64.9130, -31.9600], t: 'wp',     n: 'Cresta de la Peña', s: '1950m' },
  { c: [-64.8985, -31.9472], t: 'cumbre', n: 'CUMBRE', s: 'Pico San Miguel · Alt. 2314m' },
  { c: [-64.8840, -31.9545], t: 'wp',     n: 'Mirador del Valle', s: 'Punto 2 · 1980m' },
  { c: [-64.8700, -31.9578], t: 'final',  n: 'FINAL', s: 'Aparcamiento · Alt. 1420m' },
];

const GEO_LABELS = [
  { c: [-64.9780, -31.9760], txt: 'Barranco Hondo',   col: '#4b5563', rot: '-25deg' },
  { c: [-64.9850, -31.9575], txt: 'Bosque del Oso',   col: '#16a34a', rot: '0deg'   },
  { c: [-64.9350, -31.9870], txt: 'Arroyo del Valle', col: '#2563eb', rot: '-12deg' },
  { c: [-64.9620, -32.0080], txt: 'Río Valle',        col: '#2563eb', rot: '-5deg'  },
  { c: [-64.9750, -32.0200], txt: 'Carretera de Acceso', col: '#6b7280', rot: '0deg' },
  { c: [-64.8790, -31.9460], txt: 'Senda Cresta',     col: '#4b5563', rot: '-18deg' },
  { c: [-64.8550, -31.9720], txt: 'Barranco Hondo',   col: '#4b5563', rot: '-25deg' },
  { c: [-64.9260, -31.9720], txt: 'SENDERO PRINCIPAL',col: '#dc2626', rot: '-42deg' },
];

const DIST_LABELS = [
  { c: [-64.9495, -31.9880], txt: '2km' },
  { c: [-64.9175, -31.9640], txt: '2km' },
];

function buildHTML(
  center: [number, number],
  zoom: number,
  showHikingRoute: boolean,
  layer: EsriLayer,
): string {
  const routeJson = JSON.stringify(ROUTE);
  const wpJson = JSON.stringify(HIKING_WAYPOINTS);
  const geoJson = JSON.stringify(GEO_LABELS);
  const distJson = JSON.stringify(DIST_LABELS);
  const tileUrl = ESRI_TILES[layer];

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css"/>
<script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
html,body,#map{height:100vh;width:100vw;}
body{font-family:-apple-system,system-ui,sans-serif;}

#title-bar{
  position:absolute;top:0;left:0;right:0;z-index:20;
  background:rgba(255,255,255,0.94);border-bottom:1.5px solid rgba(0,0,0,0.12);
  padding:8px 12px;text-align:center;
}
#title-bar span{font-size:11.5px;font-weight:800;color:#1e293b;letter-spacing:0.5px;}

#north-arrow{
  position:absolute;top:52px;left:10px;z-index:20;
  background:rgba(255,255,255,0.92);border:1px solid rgba(0,0,0,0.18);
  border-radius:4px;padding:3px 6px;text-align:center;
}
#north-arrow .na{font-size:10px;font-weight:800;color:#1e293b;line-height:1;}
#north-arrow .ns{font-size:18px;color:#1e293b;line-height:1;}

#scale-bar{
  position:absolute;bottom:64px;left:10px;z-index:20;
  background:rgba(255,255,255,0.92);border:1px solid rgba(0,0,0,0.18);
  border-radius:4px;padding:3px 8px;
}
.sb-line{display:flex;}
.sb-seg{height:5px;border:1px solid #1e293b;}
.sb-blk{background:#1e293b;width:36px;}
.sb-wht{background:white;width:36px;}
.sb-labels{display:flex;justify-content:space-between;width:108px;}
.sb-lbl{font-size:8px;font-weight:700;color:#1e293b;}

#legend{
  position:absolute;bottom:14px;right:10px;z-index:20;
  background:rgba(255,255,255,0.94);border:1px solid rgba(0,0,0,0.18);
  border-radius:6px;padding:7px 10px;
}
.li{display:flex;align-items:center;gap:7px;margin-bottom:4px;font-size:10px;color:#1e293b;}
.li:last-child{margin-bottom:0;}
.ld-red{width:24px;border-top:2px dashed #dc2626;}
.ld-gray{width:24px;border-top:1px dashed #9ca3af;}
.larrow{width:24px;text-align:center;font-size:12px;}

.ml{
  display:inline-block;background:rgba(255,255,255,0.95);border-radius:3px;
  padding:1px 4px;font-size:8.5px;font-weight:700;color:#1e293b;
  margin-top:2px;white-space:nowrap;box-shadow:0 1px 3px rgba(0,0,0,0.2);
  line-height:1.3;text-align:center;
}
.ms{font-weight:400;color:#64748b;font-size:7.5px;}
.geo-label{
  font-size:9.5px;font-style:italic;font-weight:500;
  white-space:nowrap;pointer-events:none;cursor:default;
  text-shadow:0.5px 0.5px 0 rgba(255,255,255,0.9),-0.5px -0.5px 0 rgba(255,255,255,0.9),
              0.5px -0.5px 0 rgba(255,255,255,0.9),-0.5px 0.5px 0 rgba(255,255,255,0.9);
}
.maplibregl-ctrl-bottom-right{bottom:50px;}
</style>
</head>
<body>
<div id="map"></div>
${showHikingRoute ? `
<div id="title-bar"><span>MAPA DE SENDERISMO: RUTA AL PICO SAN MIGUEL</span></div>
<div id="north-arrow"><div class="na">N</div><div class="ns">↑</div></div>
<div id="scale-bar">
  <div class="sb-line">
    <div class="sb-seg sb-blk"></div>
    <div class="sb-seg sb-wht"></div>
    <div class="sb-seg sb-blk"></div>
  </div>
  <div class="sb-labels">
    <span class="sb-lbl">0</span><span class="sb-lbl">1km</span><span class="sb-lbl">2km</span>
  </div>
</div>
<div id="legend">
  <div class="li"><div class="ld-red"></div><span>Ruta de Senderismo</span></div>
  <div class="li"><div class="ld-red"></div><span>Sendero Principal</span></div>
  <div class="li"><div class="ld-gray"></div><span>Relieve sutil</span></div>
  <div class="li"><div class="larrow">→</div><span>Flechas de dirección</span></div>
</div>
` : ''}
<script>
(function(){
  var showRoute = ${showHikingRoute};
  var route = ${routeJson};
  var waypoints = ${wpJson};
  var geoLabels = ${geoJson};
  var distLabels = ${distJson};

  var esriStyle = {
    version:8,
    sources:{
      esri:{
        type:'raster',
        tiles:['${tileUrl}'],
        tileSize:256,
        attribution:'&copy; Esri, HERE, Garmin, FAO, NOAA, USGS'
      }
    },
    layers:[{id:'esri-layer',type:'raster',source:'esri'}]
  };

  var map = new maplibregl.Map({
    container:'map',
    style:esriStyle,
    center:[${center[1]}, ${center[0]}],
    zoom:${zoom},
    maxZoom:18,
    attributionControl:true
  });

  map.addControl(new maplibregl.NavigationControl({showCompass:false}),'top-right');

  function mkEl(css,html){
    var d=document.createElement('div');
    d.style.cssText=css;
    if(html) d.innerHTML=html;
    return d;
  }

  map.on('load',function(){

    if(showRoute){
      // ── Route line ──────────────────────────────────────────────────────────
      map.addSource('route',{
        type:'geojson',
        data:{type:'Feature',geometry:{type:'LineString',coordinates:route},properties:{}}
      });
      map.addLayer({
        id:'route-glow',type:'line',source:'route',
        paint:{'line-color':'#ff0000','line-width':6,'line-opacity':0.12}
      });
      map.addLayer({
        id:'route-line',type:'line',source:'route',
        paint:{'line-color':'#dc2626','line-width':2.5,'line-dasharray':[3,3]}
      });

      // ── Direction arrows ─────────────────────────────────────────────────────
      [2,5,8,11,14,17].forEach(function(i){
        if(i>=route.length-1) return;
        var prev=route[Math.max(0,i-1)];
        var next=route[Math.min(i+1,route.length-1)];
        var bearing=Math.atan2(next[0]-prev[0],next[1]-prev[1])*180/Math.PI;
        var el=mkEl('font-size:13px;color:#1e293b;font-weight:bold;cursor:default;width:16px;height:16px;line-height:16px;text-align:center;transform:rotate('+bearing+'deg);','→');
        new maplibregl.Marker({element:el,anchor:'center'}).setLngLat(route[i]).addTo(map);
      });

      // ── Geographic labels ────────────────────────────────────────────────────
      geoLabels.forEach(function(gl){
        var el=document.createElement('div');
        el.className='geo-label';
        el.style.color=gl.col;
        el.style.transform='rotate('+gl.rot+')';
        el.textContent=gl.txt;
        new maplibregl.Marker({element:el,anchor:'center'}).setLngLat(gl.c).addTo(map);
      });

      // ── Distance labels ──────────────────────────────────────────────────────
      distLabels.forEach(function(dl){
        var el=mkEl('font-size:9px;color:#1e293b;font-weight:700;background:rgba(255,255,255,0.85);border-radius:3px;padding:1px 3px;white-space:nowrap;',dl.txt);
        new maplibregl.Marker({element:el,anchor:'center'}).setLngLat(dl.c).addTo(map);
      });

      // ── Hiking waypoints ─────────────────────────────────────────────────────
      waypoints.forEach(function(wp){
        var wrap=mkEl('display:flex;flex-direction:column;align-items:center;cursor:pointer;');
        var icon;
        if(wp.t==='inicio'||wp.t==='final'){
          icon=mkEl('width:18px;height:18px;border-radius:50%;background:#16a34a;border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);flex-shrink:0;');
        } else if(wp.t==='cumbre'){
          icon=mkEl('display:flex;flex-direction:column;align-items:center;gap:1px;');
          icon.innerHTML='<div style="font-size:9px;font-weight:800;color:#f97316;letter-spacing:0.3px;">CUMBRE</div>'
            +'<div style="position:relative;width:0;height:0;border-left:10px solid transparent;border-right:10px solid transparent;border-bottom:18px solid #f97316;"><div style="position:absolute;top:3px;left:50%;transform:translateX(-50%);color:white;font-size:8px;font-weight:bold;">✝</div></div>';
        } else if(wp.t==='peak'){
          icon=mkEl('font-size:13px;color:#6b7280;line-height:1;cursor:default;','▲');
        } else {
          icon=mkEl('width:10px;height:10px;border-radius:50%;background:#6b7280;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3);flex-shrink:0;');
        }
        var lbl=mkEl('margin-top:2px;');
        lbl.innerHTML='<div class="ml">'+wp.n+'<br><span class="ms">'+wp.s+'</span></div>';
        wrap.appendChild(icon);
        if(wp.t!=='cumbre') wrap.appendChild(lbl);
        else {
          var sub=mkEl('margin-top:2px;');
          sub.innerHTML='<div class="ml"><span class="ms">'+wp.s+'</span></div>';
          wrap.appendChild(sub);
        }
        new maplibregl.Marker({element:wrap,anchor:'bottom'}).setLngLat(wp.c).addTo(map);
      });
    } // end showRoute

    // ── Park markers (injected via postMessage) ──────────────────────────────
    var parkMarkers=[];
    function renderParkMarkers(list){
      parkMarkers.forEach(function(m){m.remove();});
      parkMarkers=[];
      (list||[]).forEach(function(p){
        var wrap=mkEl('display:flex;flex-direction:column;align-items:center;cursor:pointer;');
        var dot=mkEl('width:14px;height:14px;border-radius:50% 50% 50% 0;background:#16a34a;transform:rotate(-45deg);border:2px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.35);');
        var lbl=mkEl('margin-top:2px;background:rgba(255,255,255,0.95);border-radius:3px;padding:1px 4px;font-size:8px;font-weight:700;color:#1e293b;white-space:nowrap;box-shadow:0 1px 2px rgba(0,0,0,0.15);max-width:70px;overflow:hidden;text-overflow:ellipsis;');
        lbl.textContent=p.name;
        wrap.appendChild(dot);
        wrap.appendChild(lbl);
        var m=new maplibregl.Marker({element:wrap,anchor:'bottom'}).setLngLat([p.lon,p.lat]).addTo(map);
        wrap.addEventListener('click',function(){
          try{window.ReactNativeWebView.postMessage(JSON.stringify({type:'markerPress',id:p.id}));}catch(e){}
        });
        parkMarkers.push(m);
      });
    }

    // ── Hike tracking ────────────────────────────────────────────────────────
    var hikeWatchId=null;
    var hikeMarker=null;
    window.startHikeTracking=function(){
      if(hikeWatchId!==null) return;
      hikeWatchId=navigator.geolocation.watchPosition(function(pos){
        var lat=pos.coords.latitude,lng=pos.coords.longitude;
        if(!hikeMarker){
          var el=document.createElement('div');
          el.style.cssText='position:relative;width:20px;height:20px;';
          el.innerHTML='<div style="position:absolute;inset:0;border-radius:50%;background:rgba(59,130,246,0.25);animation:hp 1.8s ease-out infinite;"></div>'
            +'<div style="position:absolute;top:4px;left:4px;width:12px;height:12px;border-radius:50%;background:#3b82f6;border:2.5px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.4);"></div>'
            +'<style>@keyframes hp{0%{transform:scale(1);opacity:.6}100%{transform:scale(2.5);opacity:0}}</style>';
          hikeMarker=new maplibregl.Marker({element:el,anchor:'center'}).setLngLat([lng,lat]).addTo(map);
        } else {
          hikeMarker.setLngLat([lng,lat]);
        }
        map.panTo([lng,lat],{animate:true,duration:500});
        try{window.ReactNativeWebView.postMessage(JSON.stringify({type:'locationUpdate',lat:lat,lon:lng}));}catch(e){}
      },function(){},{enableHighAccuracy:true,maximumAge:3000,timeout:20000});
    };
    window.stopHikeTracking=function(){
      if(hikeWatchId!==null){navigator.geolocation.clearWatch(hikeWatchId);hikeWatchId=null;}
      if(hikeMarker){hikeMarker.remove();hikeMarker=null;}
    };

    // Listen for messages from React Native
    document.addEventListener('message',handleMsg);
    window.addEventListener('message',handleMsg);
    function handleMsg(evt){
      try{
        var data=typeof evt.data==='string'?JSON.parse(evt.data):evt.data;
        if(data.type==='flyTo'){
          map.flyTo({center:[data.lng,data.lat],zoom:data.zoom||12,duration:1200});
        } else if(data.type==='parkMarkers'){
          renderParkMarkers(data.markers);
        }
      }catch(e){}
    }
  });
})();
</script>
</body>
</html>`;
}

export const MapLibreEsri = forwardRef<MapLibreEsriHandle, Props>(function MapLibreEsri({
  onMarkerPress,
  onLocationUpdate,
  markers = [],
  flyTo,
  center = [-31.970, -64.910],
  zoom = 12,
  height = 400,
  showHikingRoute = true,
  layer = 'esri-topo',
}: Props, ref) {
  const webviewRef = useRef<WebView>(null);
  const loaded = useRef(false);

  useImperativeHandle(ref, () => ({
    startHikeTracking() {
      webviewRef.current?.injectJavaScript('window.startHikeTracking && window.startHikeTracking(); true;');
    },
    stopHikeTracking() {
      webviewRef.current?.injectJavaScript('window.stopHikeTracking && window.stopHikeTracking(); true;');
    },
  }));
  const pendingMarkers = useRef<MapMarker[] | null>(null);
  const pendingFly = useRef<{ lat: number; lon: number; zoom?: number } | null>(null);

  const effectiveCenter: [number, number] = flyTo
    ? [flyTo.lat, flyTo.lon]
    : center;
  const effectiveZoom = flyTo?.zoom ?? zoom;

  const html = buildHTML(effectiveCenter, effectiveZoom, showHikingRoute, layer);

  function flush() {
    if (!loaded.current || !webviewRef.current) return;
    const cw = webviewRef.current;
    if (pendingMarkers.current !== null) {
      const msg = JSON.stringify({ type: 'parkMarkers', markers: pendingMarkers.current });
      cw.injectJavaScript(`(function(){try{window.postMessage(${JSON.stringify(msg)},'*');}catch(e){}})();true;`);
      pendingMarkers.current = null;
    }
    if (pendingFly.current !== null) {
      const f = pendingFly.current;
      const msg = JSON.stringify({ type: 'flyTo', lat: f.lat, lng: f.lon, zoom: f.zoom ?? 10 });
      cw.injectJavaScript(`(function(){try{window.postMessage(${JSON.stringify(msg)},'*');}catch(e){}})();true;`);
      pendingFly.current = null;
    }
  }

  function handleLoad() {
    loaded.current = true;
    if (markers.length) pendingMarkers.current = markers;
    if (flyTo) pendingFly.current = flyTo;
    flush();
  }

  // Send markers whenever they change
  React.useEffect(() => {
    if (!loaded.current) {
      pendingMarkers.current = markers;
    } else {
      pendingMarkers.current = markers;
      flush();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markers]);

  // Send flyTo whenever it changes
  React.useEffect(() => {
    if (flyTo) {
      if (!loaded.current) {
        pendingFly.current = flyTo;
      } else {
        pendingFly.current = flyTo;
        flush();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flyTo?.lat, flyTo?.lon, flyTo?.zoom]);

  const handleMessage = useCallback(
    (event: any) => {
      try {
        const data = JSON.parse(event.nativeEvent.data);
        if (data.type === 'markerPress' && onMarkerPress) {
          onMarkerPress(data.id);
        }
        if (data.type === 'locationUpdate' && onLocationUpdate) {
          onLocationUpdate(data.lat, data.lon);
        }
      } catch {
        // ignore
      }
    },
    [onMarkerPress, onLocationUpdate],
  );

  const containerStyle = [
    styles.container,
    typeof height === 'number'
      ? { height }
      : height === '100%'
      ? { flex: 1 }
      : undefined,
  ];

  return (
    <View style={containerStyle}>
      <WebView
        ref={webviewRef}
        key={layer}
        source={{ html, baseUrl: 'https://unpkg.com' }}
        onMessage={handleMessage}
        onLoad={handleLoad}
        style={styles.webview}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={['*']}
        mixedContentMode="always"
        scrollEnabled={false}
        allowFileAccess
        allowUniversalAccessFromFileURLs
        allowFileAccessFromFileURLs
      />
    </View>
  );
});

export default MapLibreEsri;

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
