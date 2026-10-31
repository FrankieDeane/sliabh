import React, { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Linking, ActivityIndicator, StyleSheet } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { useRouter } from 'expo-router';
import { SITE } from './trailMapHtml';
import { getQuickFix } from '../../services/quickFix';
import { offlineParksPage, primeOfflineMapShell, PARKS_PAGE_PATH } from '../../services/offlineMapShell';
import { useNetworkStore } from '../../store/networkStore';

// Same page and version the website embeds on /mapas, so the app shows the
// exact same general map: 3D terrain, trail clusters visible from all of
// Argentina, trail lines, OSM circuits, provinces and parks.
const PAGE = `${SITE}${PARKS_PAGE_PATH}?v=20260923a&ctx=mapas`;

// Con una rayita de señal la página puede quedar cargando para siempre. Si en
// este tiempo no terminó y hay una copia guardada, se abre la copia.
const SLOW_LOAD_MS = 12_000;

// parques.html talks to its host through window.parent (an iframe on the
// web). A WebView page is its own parent, so it would never speak: route
// window.parent.postMessage to React Native before the page's scripts run.
//
// It also replaces navigator.geolocation with the phone's own location (see
// getQuickFix): the WebView's often times out on Android before any fix.
export const BRIDGE = `(function(){
  try {
    window.parent = { postMessage: function(m){
      try { window.ReactNativeWebView.postMessage(JSON.stringify(m)); } catch(e){}
    } };
  } catch(e) {}
  try {
    var pending = {}, seq = 0, watches = {};
    window.__rnGeoReply = function(id, r){
      var cb = pending[id]; if (!cb) return; delete pending[id];
      if (r && r.ok) cb.s({ coords: r.coords, timestamp: r.timestamp });
      else if (cb.e) cb.e({ code: (r && r.code) || 2, message: (r && r.message) || '',
        PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 });
    };
    var geo = {
      getCurrentPosition: function(s, e){
        var id = ++seq; pending[id] = { s: s, e: e };
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'geo', id: id }));
      },
      watchPosition: function(s, e){
        var id = ++seq;
        var tick = function(){ geo.getCurrentPosition(s, e); };
        tick(); watches[id] = setInterval(tick, 5000);
        return id;
      },
      clearWatch: function(id){ clearInterval(watches[id]); delete watches[id]; }
    };
    Object.defineProperty(navigator, 'geolocation', { configurable: true, get: function(){ return geo; } });
  } catch(e) {}
})(); true;`;

// Blob downloads do nothing inside an Android WebView, so the GPX button
// hands the trail to the app, whose trail screen saves the file natively.
export const AFTER_LOAD = `(function(){
  window.downloadGpx = function(t){
    try { window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'gpx', id: t && t.id })); } catch(e){}
  };
})(); true;`;

export interface ParksMapHandle {
  flyTo: (lat: number, lng: number, zoom?: number) => void;
}

interface Props {
  lang: 'es' | 'en';
  trails: unknown[];
  colors: { bg: string; text: string; muted: string };
}

export const ParksMap = forwardRef<ParksMapHandle, Props>(function ParksMap({ lang, trails, colors }, ref) {
  const router = useRouter();
  const webRef = useRef<WebView>(null);
  const [failed, setFailed] = useState(false);
  const online = useNetworkStore((s) => s.isOnline);
  // Sin señal se abre la copia guardada de la página (con su MapLibre adentro).
  // Mismo origen que la de internet, así que ve los mismos tiles guardados.
  const [useSaved, setUseSaved] = useState(!online);
  const [savedHtml, setSavedHtml] = useState<string | null>(() => offlineParksPage());
  const loadedOk = useRef(false);

  React.useEffect(() => {
    let alive = true;
    primeOfflineMapShell().then(() => { if (alive) setSavedHtml(offlineParksPage()); });
    return () => { alive = false; };
  }, []);

  // Si se corta la señal antes de que la página termine de cargar, pasar a la copia.
  React.useEffect(() => {
    if (!online && !loadedOk.current) setUseSaved(true);
  }, [online]);

  const fallBack = useCallback(() => {
    if (offlineParksPage()) setUseSaved(true);
    else setFailed(true);
  }, []);

  React.useEffect(() => {
    if (useSaved) return;
    const timer = setTimeout(() => { if (!loadedOk.current) fallBack(); }, SLOW_LOAD_MS);
    return () => clearTimeout(timer);
  }, [useSaved, fallBack]);

  const send = useCallback((msg: object) => {
    const js = `try{window.postMessage(${JSON.stringify(msg).replace(/</g, '\\u003c')},'*');}catch(e){} true;`;
    webRef.current?.injectJavaScript(js);
  }, []);

  const pushState = useCallback(() => {
    send({ type: 'setLang', lang });
    // The page buffers these until its map finishes loading.
    send({ type: 'setTrails', trails });
  }, [lang, trails, send]);

  useImperativeHandle(ref, () => ({
    flyTo: (lat, lng, zoom = 11) => send({ type: 'flyTo', lat, lng, zoom }),
  }), [send]);

  React.useEffect(() => { send({ type: 'setLang', lang }); }, [lang, send]);

  function openTrail(id: string) {
    router.push(`/ruta/${id}` as any);
  }

  function onMessage(e: WebViewMessageEvent) {
    let data: any;
    try { data = JSON.parse(e.nativeEvent.data); } catch { return; }
    if (data?.type === 'mapReady') pushState();
    else if (data?.type === 'geo' && Number.isFinite(data.id)) {
      getQuickFix().then((r) => {
        webRef.current?.injectJavaScript(`window.__rnGeoReply && window.__rnGeoReply(${Number(data.id)}, ${JSON.stringify(r)}); true;`);
      });
    }
    else if (data?.type === 'gpx' && data.id) openTrail(String(data.id));
  }

  // Everything but the map page itself leaves the WebView: a trail guide
  // opens the app's own trail screen, anything else opens in the browser.
  function onShouldStart(req: { url: string }): boolean {
    const url = req.url;
    if (url.startsWith(`${SITE}/parques.html`) || url.startsWith('about:') || url.startsWith('data:') || url.startsWith('blob:')) {
      return true;
    }
    const trail = url.match(/^https:\/\/sliabh\.com\.ar\/(?:en\/)?ruta\/([^/?#]+)/);
    if (trail) {
      openTrail(decodeURIComponent(trail[1]));
      return false;
    }
    if (/^(https?|mailto|tel):/.test(url)) Linking.openURL(url).catch(() => {});
    return false;
  }

  if (failed) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12, backgroundColor: colors.bg }}>
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700', textAlign: 'center' }}>
          {lang === 'en' ? 'The general map needs internet' : 'El mapa general necesita internet'}
        </Text>
        <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 19, textAlign: 'center' }}>
          {lang === 'en'
            ? 'Open it once with signal and it stays saved on the phone for next time. Your recorded hikes still work offline.'
            : 'Abrilo una vez con señal y queda guardado en el teléfono para la próxima. Tus recorridos siguen funcionando sin señal.'}
        </Text>
        <TouchableOpacity
          onPress={() => { loadedOk.current = false; setUseSaved(false); setFailed(false); }}
          style={{ marginTop: 6, backgroundColor: '#16a34a', borderRadius: 999, paddingHorizontal: 18, paddingVertical: 10 }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>{lang === 'en' ? 'Try again' : 'Reintentar'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <WebView
      ref={webRef}
      source={useSaved && savedHtml ? { html: savedHtml, baseUrl: PAGE } : { uri: PAGE }}
      style={{ flex: 1, backgroundColor: colors.bg }}
      injectedJavaScriptBeforeContentLoaded={BRIDGE}
      injectedJavaScript={AFTER_LOAD}
      onMessage={onMessage}
      onLoadEnd={pushState}
      onLoad={() => { loadedOk.current = true; }}
      onShouldStartLoadWithRequest={onShouldStart}
      onOpenWindow={(e) => { Linking.openURL(e.nativeEvent.targetUrl).catch(() => {}); }}
      onError={() => { if (useSaved) setFailed(true); else fallBack(); }}
      onHttpError={(e) => { if (e.nativeEvent.statusCode >= 500 && !useSaved) fallBack(); }}
      startInLoadingState
      renderLoading={() => (
        <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }]}>
          <ActivityIndicator color="#22c55e" />
        </View>
      )}
      javaScriptEnabled
      domStorageEnabled
      geolocationEnabled
      originWhitelist={['https://*', 'about:*', 'data:*', 'blob:*']}
      setSupportMultipleWindows
      allowsBackForwardNavigationGestures={false}
    />
  );
});

export default ParksMap;
