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

// Deepest level Esri actually serves in rural Argentina. Past it the tile
// server answers with nothing and the map went blank white; with maxzoom set,
// MapLibre stretches the last real tile instead.
const ESRI_MAXZOOM: Record<EsriLayer, number> = {
  'esri-topo': 16,
  'esri-satellite': 17,
  'esri-streets': 17,
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
  /** The hiker's own walked track, drawn in blue. */
  trackPoints?: LatLon[];
  onLocationError?: () => void;
  /** Frame the whole walked track (and route) once it arrives, instead of `center`/`zoom`. */
  fitToTrack?: boolean;
}

function buildHTML(
  center: [number, number],
  zoom: number,
  layer: EsriLayer,
  routePoints: LatLon[] = [],
  fitToTrack = false,
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
#map{touch-action:none;}
body{font-family:-apple-system,system-ui,sans-serif;}

#recenter{
  display:none;position:absolute;left:12px;bottom:18px;z-index:25;
  align-items:center;gap:6px;background:rgba(15,23,42,0.88);
  border:1px solid rgba(255,255,255,0.22);border-radius:999px;
  padding:11px 16px;color:#fff;font-size:13px;font-weight:700;cursor:pointer;
  box-shadow:0 3px 10px rgba(0,0,0,0.35);
}
#recenter.off{background:#2563eb;border-color:#93c5fd;}
</style>
</head>
<body>
<div id="map"></div>
<div id="recenter">◎ Centrar en mí</div>
<script>
(function(){
  var trailRoute = ${trailRouteJson};

  // Hike mode can ask for tracking before the style is ready; remember the
  // request so no fix is lost while MapLibre is still loading.
  window.__hikePending=false;
  window.startHikeTracking=function(){window.__hikePending=true;};
  window.stopHikeTracking=function(){window.__hikePending=false;};
  // The app owns the GPS (a foreground service in hike mode) and pushes the
  // position and the walked track in; hold the latest until the map is ready.
  window.__pendingUser=null;window.__pendingTrack=null;
  window.setUserPos=function(lat,lng){window.__pendingUser=[lng,lat];};
  window.setUserTrack=function(c){window.__pendingTrack=c;};
  window.setBaseLayer=function(u,mz){window.__pendingLayer=[u,mz];};
  var fitToTrack=${fitToTrack ? 'true' : 'false'};

  var esriStyle = {
    version:8,
    sources:{
      esri:{
        type:'raster',
        tiles:['${tileUrl}'],
        tileSize:256,
        maxzoom:${ESRI_MAXZOOM[layer]},
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

  // Top-left: the hike screen puts its map/satellite switch top-right.
  map.addControl(new maplibregl.NavigationControl({showCompass:false}),'top-left');

  // Swap topo/satellite in place: rebuilding the page would drop the camera,
  // the walker's dot and the track for a few seconds every time.
  // maxzoom cannot change on a live source, so a layer switch rebuilds just
  // the raster source and layer under the lines.
  window.setBaseLayer=function(u,mz){
    if(!map.isStyleLoaded()){window.__pendingLayer=[u,mz];return;}
    var src=map.getSource('esri');
    if(src&&src.tiles&&src.tiles[0]===u) return;
    var before=map.getLayer('trail-route-casing')?'trail-route-casing':undefined;
    if(map.getLayer('esri-layer')) map.removeLayer('esri-layer');
    if(src) map.removeSource('esri');
    map.addSource('esri',{type:'raster',tiles:[u],tileSize:256,maxzoom:mz||17,
      attribution:'&copy; Esri, HERE, Garmin, FAO, NOAA, USGS'});
    map.addLayer({id:'esri-layer',type:'raster',source:'esri'},before);
  };

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

    function placeUser(lng,lat){
      if(!hikeMarker){
        var el=document.createElement('div');
        el.style.cssText='position:relative;width:34px;height:34px;';
        el.innerHTML='<div style="position:absolute;inset:0;border-radius:50%;background:rgba(59,130,246,0.3);animation:hp 1.8s ease-out infinite;"></div>'
          +'<div style="position:absolute;top:8px;left:8px;width:18px;height:18px;border-radius:50%;background:#3b82f6;border:3px solid #fff;box-shadow:0 0 0 1.5px rgba(2,6,23,0.75),0 3px 10px rgba(0,0,0,0.55);"></div>'
          +'<style>@keyframes hp{0%{transform:scale(1);opacity:.65}100%{transform:scale(2.4);opacity:0}}</style>';
        hikeMarker=new maplibregl.Marker({element:el,anchor:'center'}).setLngLat([lng,lat]).addTo(map);
        // First fix: bring the walker into view, close enough to read the trail.
        map.jumpTo({center:[lng,lat],zoom:Math.max(map.getZoom(),15)});
        var rb=document.getElementById('recenter');
        if(rb) rb.style.display='flex';
        drawTrack();
        return;
      }
      hikeMarker.setLngLat([lng,lat]);
      drawTrack();
      if(following) map.panTo([lng,lat],{animate:true,duration:500});
    }
    // The recorded track only keeps good fixes, so on its own it trails behind
    // the dot; drawing it through the current position keeps the line on you.
    function drawTrack(){
      var src=map.getSource('user-track');
      if(!src) return;
      var c=hikeTrack.slice();
      if(hikeMarker){var p=hikeMarker.getLngLat();c.push([p.lng,p.lat]);}
      src.setData(lineFeature(c.length>1?c:[]));
    }
    window.setUserPos=function(lat,lng){
      if(!isFinite(lat)||!isFinite(lng)) return;
      placeUser(lng,lat);
    };
    var framed=false;
    function frameTrack(){
      if(!fitToTrack||framed) return;
      var all=hikeTrack.concat(trailRoute);
      if(all.length<2) return;
      var b=new maplibregl.LngLatBounds(all[0],all[0]);
      all.forEach(function(c){b.extend(c);});
      framed=true;
      map.fitBounds(b,{padding:36,maxZoom:16,duration:0});
    }
    window.setUserTrack=function(coords){
      hikeTrack=(coords||[]).filter(function(c){return c&&isFinite(c[0])&&isFinite(c[1]);});
      drawTrack();
      frameTrack();
    };
    if(window.__pendingLayer){window.setBaseLayer(window.__pendingLayer[0],window.__pendingLayer[1]);window.__pendingLayer=null;}
    if(window.__pendingTrack){window.setUserTrack(window.__pendingTrack);window.__pendingTrack=null;}
    if(window.__pendingUser){placeUser(window.__pendingUser[0],window.__pendingUser[1]);window.__pendingUser=null;}

    // Panning by hand releases the camera so the live fix stops yanking the
    // map back while the walker reads the terrain ahead.
    function releaseFollow(e){
      if(!e || !e.originalEvent || !following) return;
      following=false;
      var btn=document.getElementById('recenter');
      if(btn) btn.classList.add('off');
    }
    map.on('dragstart',releaseFollow);
    map.on('zoomstart',releaseFollow);
    map.on('rotatestart',releaseFollow);

    var recenterBtn=document.getElementById('recenter');
    if(recenterBtn){
      recenterBtn.addEventListener('click',function(){
        following=true;
        recenterBtn.classList.remove('off');
        var here=hikeMarker?hikeMarker.getLngLat():null;
        var last=here?[here.lng,here.lat]:hikeTrack[hikeTrack.length-1];
        if(last) map.easeTo({center:last,zoom:Math.max(map.getZoom(),16),bearing:0,duration:600});
      });
    }

    window.startHikeTracking=function(){
      if(hikeWatchId!==null) return;
      hikeWatchId=navigator.geolocation.watchPosition(function(pos){
        var lat=pos.coords.latitude,lng=pos.coords.longitude;
        var last=hikeTrack[hikeTrack.length-1];
        if(!last || metersBetween(last,[lng,lat])>=4) hikeTrack.push([lng,lat]);
        placeUser(lng,lat);
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
  userPosition,
  trackPoints,
  fitToTrack = false,
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
  // The base layer is swapped in place (setBaseLayer), so it is not a
  // dependency: changing it must not rebuild the page.
  const layerRef = useRef(layer);
  layerRef.current = layer;
  const html = React.useMemo(
    () => buildHTML(effectiveCenter, effectiveZoom, layerRef.current, routePoints ?? [], fitToTrack),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [effectiveCenter[0], effectiveCenter[1], effectiveZoom, routeKey],
  );
  // A rebuilt page must announce itself (onLoad) before anything is sent to it.
  React.useEffect(() => () => { loaded.current = false; }, [html]);

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

  // The latest position and track, replayed after every (re)load of the page.
  const userRef = useRef(userPosition);
  userRef.current = userPosition;
  const trackRef = useRef(trackPoints);
  trackRef.current = trackPoints;

  const pushUser = useCallback(() => {
    const u = userRef.current;
    if (!loaded.current || !u || !Number.isFinite(u.lat) || !Number.isFinite(u.lon)) return;
    webviewRef.current?.injectJavaScript(`window.setUserPos && window.setUserPos(${u.lat},${u.lon}); true;`);
  }, []);

  const pushTrack = useCallback(() => {
    if (!loaded.current) return;
    const coords = (trackRef.current ?? [])
      .filter((p) => Number.isFinite(p?.lat) && Number.isFinite(p?.lon))
      .map((p) => [p.lon, p.lat]);
    webviewRef.current?.injectJavaScript(`window.setUserTrack && window.setUserTrack(${JSON.stringify(coords)}); true;`);
  }, []);

  function handleLoad() {
    loaded.current = true;
    if (markers.length) pendingMarkers.current = markers;
    if (flyTo) pendingFly.current = flyTo;
    flush();
    pushLayer();
    pushTrack();
    pushUser();
  }

  function pushLayer() {
    if (!loaded.current) return;
    const l = layerRef.current;
    webviewRef.current?.injectJavaScript(`window.setBaseLayer && window.setBaseLayer(${JSON.stringify(ESRI_TILES[l])},${ESRI_MAXZOOM[l]}); true;`);
  }
  React.useEffect(() => { pushLayer(); }, [layer]);

  React.useEffect(() => { pushUser(); }, [userPosition?.lat, userPosition?.lon, pushUser]);
  React.useEffect(() => { pushTrack(); }, [trackPoints, pushTrack]);

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
        // Android: let pan/pinch reach the map when it sits inside a ScrollView
        // instead of the page scroll stealing the gesture.
        nestedScrollEnabled
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
