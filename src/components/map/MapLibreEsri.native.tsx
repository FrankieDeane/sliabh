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

export interface LatLon { lat: number; lon: number }

interface Props {
  onMarkerPress?: (id: string) => void;
  onLocationUpdate?: (lat: number, lon: number) => void;
  markers?: MapMarker[];
  flyTo?: { lat: number; lon: number; zoom?: number } | null;
  center?: [number, number];
  zoom?: number;
  height?: number | string;
  layer?: EsriLayer;
  userPosition?: { lat: number; lon: number } | null;
  showPolyline?: boolean;
  /** Reference route of the trail (the suggested path), drawn in green. */
  routePoints?: LatLon[];
  onLocationError?: () => void;
}

function buildHTML(
  center: [number, number],
  zoom: number,
  layer: EsriLayer,
  routePoints: LatLon[] = [],
): string {
  const trailRouteJson = JSON.stringify(
    routePoints
      .filter((p) => Number.isFinite(p?.lat) && Number.isFinite(p?.lon))
      .map((p) => [p.lon, p.lat]),
  );
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

#recenter{
  display:none;position:absolute;left:12px;bottom:18px;z-index:25;
  align-items:center;gap:6px;background:rgba(15,23,42,0.88);
  border:1px solid rgba(255,255,255,0.22);border-radius:999px;
  padding:9px 15px;color:#fff;font-size:12.5px;font-weight:700;cursor:pointer;
}
</style>
</head>
<body>
<div id="map"></div>
<div id="recenter">◎ Centrar</div>
<script>
(function(){
  var trailRoute = ${trailRouteJson};

  // Hike mode can ask for tracking before the style is ready; remember the
  // request so no fix is lost while MapLibre is still loading.
  window.__hikePending=false;
  window.startHikeTracking=function(){window.__hikePending=true;};
  window.stopHikeTracking=function(){window.__hikePending=false;};

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

    // ── Trail reference route + the user's own walked track ──────────────────
    function lineFeature(coords){
      return {type:'Feature',geometry:{type:'LineString',coordinates:coords||[]},properties:{}};
    }

    map.addSource('trail-route',{type:'geojson',data:lineFeature(trailRoute)});
    map.addLayer({
      id:'trail-route-casing',type:'line',source:'trail-route',
      layout:{'line-cap':'round','line-join':'round'},
      paint:{'line-color':'#04260f','line-width':7,'line-opacity':0.45}
    });
    map.addLayer({
      id:'trail-route-line',type:'line',source:'trail-route',
      layout:{'line-cap':'round','line-join':'round'},
      paint:{'line-color':'#22c55e','line-width':3.5,'line-dasharray':[2,1.6]}
    });

    map.addSource('user-track',{type:'geojson',data:lineFeature([])});
    map.addLayer({
      id:'user-track-casing',type:'line',source:'user-track',
      layout:{'line-cap':'round','line-join':'round'},
      paint:{'line-color':'#ffffff','line-width':8,'line-opacity':0.55}
    });
    map.addLayer({
      id:'user-track-line',type:'line',source:'user-track',
      layout:{'line-cap':'round','line-join':'round'},
      paint:{'line-color':'#3b82f6','line-width':4.5}
    });


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
    var hikeTrack=[];
    var following=true;

    function metersBetween(a,b){
      var R=6371000;
      var dLat=(b[1]-a[1])*Math.PI/180, dLon=(b[0]-a[0])*Math.PI/180;
      var s=Math.pow(Math.sin(dLat/2),2)
        +Math.cos(a[1]*Math.PI/180)*Math.cos(b[1]*Math.PI/180)*Math.pow(Math.sin(dLon/2),2);
      return R*2*Math.atan2(Math.sqrt(s),Math.sqrt(1-s));
    }

    // Panning by hand releases the camera so the live fix stops yanking the
    // map back while the walker reads the terrain ahead.
    function releaseFollow(e){
      if(!e || !e.originalEvent || !following) return;
      following=false;
      var btn=document.getElementById('recenter');
      if(btn) btn.style.display='flex';
    }
    map.on('dragstart',releaseFollow);
    map.on('zoomstart',releaseFollow);
    map.on('rotatestart',releaseFollow);

    var recenterBtn=document.getElementById('recenter');
    if(recenterBtn){
      recenterBtn.addEventListener('click',function(){
        following=true;
        recenterBtn.style.display='none';
        var last=hikeTrack[hikeTrack.length-1];
        if(last) map.easeTo({center:last,duration:600});
      });
    }

    window.startHikeTracking=function(){
      if(hikeWatchId!==null) return;
      hikeWatchId=navigator.geolocation.watchPosition(function(pos){
        var lat=pos.coords.latitude,lng=pos.coords.longitude;
        var last=hikeTrack[hikeTrack.length-1];
        if(!last || metersBetween(last,[lng,lat])>=4){
          hikeTrack.push([lng,lat]);
          var src=map.getSource('user-track');
          if(src) src.setData(lineFeature(hikeTrack));
        }
        if(!hikeMarker){
          var el=document.createElement('div');
          el.style.cssText='position:relative;width:34px;height:34px;';
          el.innerHTML='<div style="position:absolute;inset:0;border-radius:50%;background:rgba(59,130,246,0.3);animation:hp 1.8s ease-out infinite;"></div>'
            +'<div style="position:absolute;top:8px;left:8px;width:18px;height:18px;border-radius:50%;background:#3b82f6;border:3px solid #fff;box-shadow:0 0 0 1.5px rgba(2,6,23,0.75),0 3px 10px rgba(0,0,0,0.55);"></div>'
            +'<style>@keyframes hp{0%{transform:scale(1);opacity:.65}100%{transform:scale(2.4);opacity:0}}</style>';
          hikeMarker=new maplibregl.Marker({element:el,anchor:'center'}).setLngLat([lng,lat]).addTo(map);
        } else {
          hikeMarker.setLngLat([lng,lat]);
        }
        if(following) map.panTo([lng,lat],{animate:true,duration:500});
        try{window.ReactNativeWebView.postMessage(JSON.stringify({type:'locationUpdate',lat:lat,lon:lng}));}catch(e){}
      },function(err){
        try{window.ReactNativeWebView.postMessage(JSON.stringify({type:'locationError',code:err&&err.code}));}catch(e){}
      },{enableHighAccuracy:true,maximumAge:3000,timeout:20000});
    };
    window.stopHikeTracking=function(){
      if(hikeWatchId!==null){navigator.geolocation.clearWatch(hikeWatchId);hikeWatchId=null;}
      if(hikeMarker){hikeMarker.remove();hikeMarker=null;}
    };
    // The hike modal may call these before the style finishes loading.
    if(window.__hikePending){window.__hikePending=false;window.startHikeTracking();}

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
  onLocationError,
  markers = [],
  flyTo,
  center = [-31.970, -64.910],
  zoom = 12,
  height = 400,
  layer = 'esri-topo',
  routePoints,
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

  const routeKey = routePoints?.length ? `${routePoints.length}:${routePoints[0].lat},${routePoints[0].lon}` : '';
  // Rebuilding the string remounts the WebView, so keep it stable across renders.
  const html = React.useMemo(
    () => buildHTML(effectiveCenter, effectiveZoom, layer, routePoints ?? []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [effectiveCenter[0], effectiveCenter[1], effectiveZoom, layer, routeKey],
  );

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
        if (data.type === 'locationError' && onLocationError) {
          onLocationError();
        }
      } catch {
        // ignore
      }
    },
    [onMarkerPress, onLocationUpdate, onLocationError],
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
