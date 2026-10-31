/**
 * Mapa offline que sobrevive a cerrar la app.
 *
 * El botón 💾 del mapa guarda los tiles de Esri en el Cache Storage del
 * teléfono ('sliabh-tiles-v1'), pero MapLibre los pide directo a internet:
 * nadie leía esa caché. Mientras la app seguía abierta "funcionaba" porque
 * MapLibre los tenía en memoria; al reabrirla sin señal, el mapa quedaba en
 * blanco y parecía que se había perdido lo descargado.
 *
 * Esto registra un protocolo de MapLibre ('sliabhtile://') que:
 *   1. busca el tile en la caché guardada (también si el mapa lo pide a
 *      server.arcgisonline.com y se guardó como services.arcgisonline.com:
 *      es el mismo tile con otro nombre de host);
 *   2. si no está, lo pide a internet como siempre;
 *   3. sin señal y sin ese tile, recorta y agranda el tile guardado de un zoom
 *      menor, así acercar más de lo descargado se ve borroso pero no en blanco.
 *
 * Mantener igual a la copia en public/parques.html (es HTML estático y no puede
 * importar este archivo). tests/offline-tiles.mjs prueba las dos.
 */
export const OFFLINE_TILES_JS = `(function(){
  var CACHE='sliabh-tiles-v1', PROTO='sliabhtile';
  function canon(u){ return u.replace('://server.arcgisonline.com/','://services.arcgisonline.com/'); }
  function zyx(u){ var m=/\\/tile\\/(\\d+)\\/(\\d+)\\/(\\d+)(?:[?#]|$)/.exec(u); return m?{z:+m[1],y:+m[2],x:+m[3]}:null; }
  function at(u,z,y,x){ return u.replace(/\\/tile\\/\\d+\\/\\d+\\/\\d+/,'/tile/'+z+'/'+y+'/'+x); }
  function fromCache(u){
    try { return caches.open(CACHE).then(function(c){ return c.match(canon(u)); })
      .then(function(r){ return r ? r.blob() : null; }).catch(function(){ return null; }); }
    catch(e){ return Promise.resolve(null); }
  }
  function crop(blob,k,t){
    var s=1<<k;
    return createImageBitmap(blob).then(function(img){
      var size=img.width/s, cv=document.createElement('canvas');
      cv.width=cv.height=256;
      var g=cv.getContext('2d');
      g.drawImage(img,(t.x%s)*size,(t.y%s)*size,size,size,0,0,256,256);
      if(img.close) img.close();
      return new Promise(function(res){ cv.toBlob(res,'image/jpeg',0.9); });
    });
  }
  function overzoom(u){
    var t=zyx(u); if(!t) return Promise.resolve(null);
    var k=0;
    function next(){
      k++; if(k>6||t.z-k<0) return Promise.resolve(null);
      var s=1<<k;
      return fromCache(at(u,t.z-k,Math.floor(t.y/s),Math.floor(t.x/s))).then(function(b){
        return b ? crop(b,k,t) : next();
      });
    }
    return next();
  }
  function load(url,signal){
    var real=url.replace(new RegExp('^'+PROTO+'://'),'https://');
    return fromCache(real).then(function(hit){
      if(hit) return hit.arrayBuffer();
      return fetch(real,{mode:'cors',signal:signal}).then(function(r){
        if(!r.ok) throw new Error('tile HTTP '+r.status);
        return r.arrayBuffer();
      }).catch(function(err){
        if(signal&&signal.aborted) throw err;
        return overzoom(real).then(function(b){ if(b) return b.arrayBuffer(); throw err; });
      });
    });
  }
  window.__sliabhTileLoad=load;
  window.sliabhTiles=function(u){ return window.__sliabhTilesOn ? String(u).replace(/^https:\\/\\//,PROTO+'://') : u; };
  try {
    if(window.maplibregl&&maplibregl.addProtocol&&('caches' in window)){
      maplibregl.addProtocol(PROTO,function(p,ac){
        return load(p.url,ac&&ac.signal).then(function(d){ return {data:d}; });
      });
      window.__sliabhTilesOn=true;
    }
  } catch(e){}
})();`;
