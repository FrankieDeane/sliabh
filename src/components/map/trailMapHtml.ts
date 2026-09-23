import { gpxTrackToGeoJSON, trackToSlopeSegments } from '../../utils/geojson';
import { MAP_SKY_JS } from './mapSky';

export interface TrailMapPoint {
  lat: number;
  lon: number;
  ele?: number;
  name?: string;
}

// Served by the site itself (public/vendor), so the app does not depend on a
// third-party CDN being up in the middle of Patagonia.
export const SITE = 'https://sliabh.com.ar';

/**
 * The same map the website shows on a trail page (TrailMap3DCinematic.web):
 * Esri satellite/topo, terrain, fly-through intro, compass, one-finger rotate,
 * 2D/3D and the slope overlay. It runs as HTML because MapLibre GL JS only
 * exists on the web; the controls live inside it so both copies look alike.
 */
export function buildTrailMapHtml(
  track: TrailMapPoint[],
  trailName: string,
  exaggeration: number,
  fullscreen: boolean,
  site: string = SITE,
): string {
  const line = gpxTrackToGeoJSON(track);
  const slope = trackToSlopeSegments(track);
  const named = track
    .filter((p) => p.name)
    .map((p) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [p.lon, p.lat] }, properties: { name: p.name } }));
  const pts = track.map((p) => [p.lon, p.lat]);
  const data = JSON.stringify({
    line, slope, named, pts,
    name: trailName,
    startName: track[0].name ?? 'Inicio',
    endName: track[track.length - 1].name ?? 'Fin',
    exaggeration,
    intro: !fullscreen,
    fullscreen,
  }).replace(/</g, '\\u003c');

  return `<!DOCTYPE html><html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="${site}/vendor/maplibre-gl-4.7.1.css">
<script src="${site}/vendor/maplibre-gl-4.7.1.js"></script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body,#map{width:100%;height:100%;background:#070b14;overflow:hidden}
body{font-family:-apple-system,system-ui,sans-serif;-webkit-tap-highlight-color:transparent}
.btn{background:rgba(15,23,36,.85);border:1px solid rgba(34,197,94,.4);color:#22c55e;border-radius:8px;
  padding:7px 10px;font-size:11px;font-weight:700;letter-spacing:.8px;line-height:1}
.btn.on{background:rgba(34,197,94,.25);border-color:#22c55e}
.btn.slope{color:#eab308;border-color:rgba(234,179,8,.4)}
.btn.slope.on{background:rgba(234,179,8,.18);border-color:#eab308}
.row{position:absolute;bottom:12px;display:none;gap:6px;z-index:5}
#left{left:12px}#right{right:12px}
#fs{position:absolute;top:10px;right:10px;z-index:6;width:36px;height:36px;padding:0;font-size:17px;
  display:flex;align-items:center;justify-content:center}
#badge{position:absolute;top:12px;left:12px;z-index:5;display:none;background:rgba(7,11,20,.72);
  border:1px solid rgba(255,255,255,.1);border-radius:6px;padding:4px 8px;color:rgba(255,255,255,.6);
  font-size:9px;font-weight:700;letter-spacing:1px}
#legend{position:absolute;left:12px;right:12px;bottom:52px;z-index:5;display:none;justify-content:center;gap:8px;
  background:rgba(7,11,20,.85);border:1px solid rgba(255,255,255,.1);border-radius:8px;padding:6px 10px}
#legend div{display:flex;flex-direction:column;align-items:center;gap:2px;color:rgba(255,255,255,.65);font-size:8px}
#legend i{display:block;width:14px;height:6px;border-radius:3px}
#intro{position:absolute;left:0;right:0;bottom:16px;z-index:6;display:none;justify-content:center}
#intro>div{background:rgba(7,11,20,.72);border:1px solid rgba(34,197,94,.25);border-radius:12px;
  padding:10px 18px;display:flex;flex-direction:column;align-items:center;gap:8px;max-width:92%}
#intro b{color:#f0f9ff;font-size:13px;text-align:center}
#msg{position:absolute;inset:0;z-index:7;display:flex;align-items:center;justify-content:center;
  background:rgba(7,11,20,.85);color:#64748b;font-size:13px;text-align:center;padding:24px}
.maplibregl-ctrl-top-right{top:50px}
.maplibregl-ctrl-top-left{top:34px}
.pin{width:14px;height:14px;border-radius:50%;border:2.5px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.6)}
</style></head><body>
<div id="map"></div>
<div id="msg">Cargando vista satelital…</div>
<div id="badge"></div>
<button id="fs" class="btn">${fullscreen ? '✕' : '⛶'}</button>
<div id="intro"><div><b id="iname"></b><button id="skip" class="btn">SALTAR INTRO</button></div></div>
<div id="legend">
  <div><i style="background:#22c55e"></i>0°</div><div><i style="background:#84cc16"></i>15°</div>
  <div><i style="background:#eab308"></i>25°</div><div><i style="background:#f97316"></i>35°</div>
  <div><i style="background:#ef4444"></i>45°</div><div><i style="background:#a21caf"></i>60°+</div>
</div>
<div id="left" class="row"><button id="sat" class="btn">TOPO</button><button id="slope" class="btn slope">PENDIENTE</button></div>
<div id="right" class="row"><button id="rot" class="btn">↻ GIRAR</button><button id="dim" class="btn">2D</button></div>
<script>
(function(){
  var D = ${data};
  function post(m){ try{ window.ReactNativeWebView.postMessage(JSON.stringify(m)); }catch(e){} }
  function $(id){ return document.getElementById(id); }
  var msg = $('msg');
  document.getElementById('iname').textContent = D.name;
  $('fs').addEventListener('click', function(){ post({type: D.fullscreen ? 'close' : 'fullscreen'}); });

  if (typeof maplibregl === 'undefined') { msg.textContent = 'Sin conexión: el mapa 3D necesita internet para cargar.'; return; }

  function bearing(a,b){
    var dL=(b[0]-a[0])*Math.PI/180, l1=a[1]*Math.PI/180, l2=b[1]*Math.PI/180;
    var y=Math.sin(dL)*Math.cos(l2), x=Math.cos(l1)*Math.sin(l2)-Math.sin(l1)*Math.cos(l2)*Math.cos(dL);
    return (Math.atan2(y,x)*180/Math.PI+360)%360;
  }
  var pts = D.pts;
  var lons = pts.map(function(p){return p[0];}), lats = pts.map(function(p){return p[1];});
  var bounds = [[Math.min.apply(null,lons)-0.02, Math.min.apply(null,lats)-0.02],[Math.max.apply(null,lons)+0.02, Math.max.apply(null,lats)+0.02]];
  var overview = { center:[(Math.min.apply(null,lons)+Math.max.apply(null,lons))/2,(Math.min.apply(null,lats)+Math.max.apply(null,lats))/2],
    zoom:9.5, pitch:50, bearing:bearing(pts[0],pts[pts.length-1]), duration:4000 };
  var n = Math.min(5, pts.length), step = (pts.length-1)/(n-1), frames=[overview];
  for (var i=0;i<n;i++){
    var idx=Math.round(i*step), nxt=pts[Math.min(idx+1,pts.length-1)], last=i===n-1;
    frames.push({center:pts[idx], zoom:last?13.5:11+i*0.3, pitch:last?72:58+i*2, bearing:bearing(pts[idx],nxt), duration:last?5000:6000});
  }

  var map = new maplibregl.Map({
    container:'map',
    style:{version:8,
      sources:{
        satellite:{type:'raster',tiles:['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],tileSize:256,maxzoom:18,attribution:'© Esri'},
        topo:{type:'raster',tiles:['https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}'],tileSize:256,maxzoom:18,attribution:'© Esri'}
      },
      layers:[
        {id:'satellite-bg',type:'raster',source:'satellite',paint:{'raster-brightness-max':0.9}},
        {id:'topo-bg',type:'raster',source:'topo',layout:{visibility:'none'}}
      ]},
    center: D.intro ? overview.center : [ (bounds[0][0]+bounds[1][0])/2, (bounds[0][1]+bounds[1][1])/2 ],
    zoom: D.intro ? 8 : 11, pitch: D.intro ? 30 : 58, bearing: overview.bearing,
    // Phone GPUs lose the WebGL context on 3x buffers with terrain: cap it,
    // exactly as the website does on small screens.
    antialias:false, pixelRatio:Math.min(window.devicePixelRatio||1,1.5),
    maxTileCacheSize:50, dragRotate:true, touchZoomRotate:true, touchPitch:true,
    // Bottom corners hold the buttons; the compact credit goes under the badge.
    attributionControl:false
  });
  map.addControl(new maplibregl.AttributionControl({compact:true}),'top-left');
  var canvas = map.getCanvas();
  canvas.addEventListener('webglcontextlost', function(ev){ ev.preventDefault(); msg.style.display='flex';
    msg.textContent='El mapa 3D superó los recursos gráficos del teléfono.'; }, false);
  canvas.addEventListener('webglcontextrestored', function(){ msg.style.display='none'; map.resize(); }, false);
  setTimeout(function(){ if (msg.style.display!=='none' && msg.textContent.indexOf('Cargando')===0)
    msg.textContent='El mapa tarda en cargar. Revisá la conexión.'; }, 20000);

  var phase='loading', timer=null, is3D=true, sat=true, slope=false, rotate=false;

  map.on('load', function(){
    map.addSource('terrain-dem',{type:'raster-dem',tiles:['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],tileSize:256,encoding:'terrarium',maxzoom:15});
    map.setTerrain({source:'terrain-dem',exaggeration:D.exaggeration});
    if (map.setSky) map.setSky(${MAP_SKY_JS});

    map.addSource('trail',{type:'geojson',data:D.line});
    map.addLayer({id:'trail-glow',type:'line',source:'trail',paint:{'line-color':'#22c55e','line-width':12,'line-opacity':0.2,'line-blur':6}});
    map.addLayer({id:'trail-line',type:'line',source:'trail',paint:{'line-color':'#4ade80','line-width':3,'line-opacity':0.95}});
    map.addSource('trail-slope',{type:'geojson',data:D.slope});
    map.addLayer({id:'trail-slope-line',type:'line',source:'trail-slope',layout:{visibility:'none','line-cap':'round','line-join':'round'},
      paint:{'line-width':5,'line-color':['interpolate',['linear'],['get','slopeDeg'],0,'#22c55e',15,'#84cc16',25,'#eab308',35,'#f97316',45,'#ef4444',60,'#a21caf']}});
    if (D.named.length){
      map.addSource('trail-points',{type:'geojson',data:{type:'FeatureCollection',features:D.named}});
      map.addLayer({id:'trail-points-halo',type:'circle',source:'trail-points',paint:{'circle-radius':10,'circle-color':'#22c55e','circle-opacity':0.2}});
      map.addLayer({id:'trail-points-dot',type:'circle',source:'trail-points',paint:{'circle-radius':4,'circle-color':'#4ade80','circle-stroke-width':1.5,'circle-stroke-color':'#fff'}});
    }
    function pin(color){ var d=document.createElement('div'); d.className='pin'; d.style.background=color; return d; }
    new maplibregl.Marker({element:pin('#22c55e')}).setLngLat(pts[0]).setPopup(new maplibregl.Popup({offset:14}).setText(D.startName)).addTo(map);
    new maplibregl.Marker({element:pin('#f97316')}).setLngLat(pts[pts.length-1]).setPopup(new maplibregl.Popup({offset:14}).setText(D.endName)).addTo(map);

    msg.style.display='none';
    $('left').style.display='flex'; $('badge').style.display='block'; badge();
    if (D.intro) startIntro(); else interactive(false);
  });
  map.on('error', function(e){ console.warn('maplibre', e && e.error); });

  function badge(){ $('badge').textContent=(sat?'SAT':'TOPO')+' · '+(is3D?'3D':'2D'); }
  function startIntro(){
    phase='flying'; $('intro').style.display='flex';
    var s=0;
    function next(){
      if (s>=frames.length){ interactive(true); return; }
      var f=frames[s++];
      map.flyTo({center:f.center,zoom:f.zoom,pitch:f.pitch,bearing:f.bearing,duration:f.duration,
        easing:function(t){return t<0.5?2*t*t:-1+(4-2*t)*t;},essential:true});
      timer=setTimeout(next,f.duration+200);
    }
    timer=setTimeout(next,800);
  }
  function interactive(animate){
    if (phase==='interactive') return;
    phase='interactive';
    if (timer){ clearTimeout(timer); timer=null; }
    $('intro').style.display='none'; $('right').style.display='flex';
    map.addControl(new maplibregl.NavigationControl({showCompass:true,showZoom:true,visualizePitch:true}),'top-right');
    map.fitBounds(bounds,{padding:40,pitch:58,duration:animate?2000:0});
  }
  $('skip').addEventListener('click', function(){ interactive(true); });
  map.on('touchstart', function(){ if (phase==='flying') interactive(true); });

  $('sat').addEventListener('click', function(){
    sat=!sat; this.textContent=sat?'TOPO':'SAT';
    map.setLayoutProperty('satellite-bg','visibility',sat?'visible':'none');
    map.setLayoutProperty('topo-bg','visibility',sat?'none':'visible'); badge();
  });
  $('slope').addEventListener('click', function(){
    slope=!slope; this.classList.toggle('on',slope); this.textContent=slope?'OCULTAR':'PENDIENTE';
    map.setLayoutProperty('trail-slope-line','visibility',slope?'visible':'none');
    map.setLayoutProperty('trail-line','visibility',slope?'none':'visible');
    map.setLayoutProperty('trail-glow','visibility',slope?'none':'visible');
    $('legend').style.display=slope?'flex':'none';
  });
  $('dim').addEventListener('click', function(){
    is3D=!is3D; this.textContent=is3D?'2D':'3D';
    map.easeTo({pitch:is3D?58:0,bearing:0,duration:600});
    map.setTerrain(is3D?{source:'terrain-dem',exaggeration:D.exaggeration}:null); badge();
  });

  // One finger turns the map around the trail instead of panning it: the
  // gesture that is hard to find with two fingers on a phone.
  var sx=null, sb=0;
  $('rot').addEventListener('click', function(){
    rotate=!rotate; this.classList.toggle('on',rotate); this.textContent=rotate?'↻ GIRANDO':'↻ GIRAR';
    if (rotate) map.dragPan.disable(); else { map.dragPan.enable(); sx=null; }
  });
  canvas.addEventListener('touchstart', function(e){ if(!rotate||e.touches.length!==1) return; sx=e.touches[0].clientX; sb=map.getBearing(); }, {passive:true});
  canvas.addEventListener('touchmove', function(e){ if(!rotate||sx===null||e.touches.length!==1) return; e.preventDefault();
    map.setBearing(sb-(e.touches[0].clientX-sx)*0.4); }, {passive:false});
  canvas.addEventListener('touchend', function(){ sx=null; });
})();
</script></body></html>`;
}
