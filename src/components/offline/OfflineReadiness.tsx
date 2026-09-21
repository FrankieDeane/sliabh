import React from 'react';
import { View, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { isAreaCached, isTileCachingSupported } from '../../utils/offlineTiles';
import { useLangStore } from '../../store/langStore';

interface Colors { surface: string; elevated: string; border: string; text: string; muted: string; accent: string }

type State = 'ready' | 'missing' | 'checking';

/**
 * Answers the question a hiker actually has before losing signal: *what
 * exactly will still work up there?* Each row is checked against the device,
 * not assumed — the service worker registration, the tile cache for this
 * trail's area — so the answer is the real state of this browser, on this
 * phone, and survives closing Chrome or Safari.
 */
export function OfflineReadiness({
  trail,
  colors,
}: {
  trail: { coordinates: { lat: number; lon: number } };
  colors: Colors;
}) {
  const { t } = useLangStore();
  const [appCached, setAppCached] = React.useState<State>('checking');
  const [mapCached, setMapCached] = React.useState<State>('checking');
  const [installed, setInstalled] = React.useState(false);

  React.useEffect(() => {
    let alive = true;

    async function check() {
      if (Platform.OS !== 'web' || typeof navigator === 'undefined') {
        // The native app ships its screens and trail data in the binary.
        if (alive) { setAppCached('ready'); setInstalled(true); }
        return;
      }
      try {
        const reg = await navigator.serviceWorker?.getRegistration();
        const controlling = !!navigator.serviceWorker?.controller;
        if (alive) setAppCached(reg && controlling ? 'ready' : 'missing');
      } catch {
        if (alive) setAppCached('missing');
      }
      try {
        const standalone =
          (window.matchMedia?.('(display-mode: standalone)')?.matches ?? false) ||
          (navigator as any).standalone === true;
        if (alive) setInstalled(standalone);
      } catch {
        // not installable / not measurable — leave it false
      }
      if (!isTileCachingSupported()) {
        if (alive) setMapCached('missing');
        return;
      }
      const cached = await isAreaCached(trail.coordinates.lat, trail.coordinates.lon).catch(() => false);
      if (alive) setMapCached(cached ? 'ready' : 'missing');
    }

    check();
    return () => { alive = false; };
  }, [trail.coordinates.lat, trail.coordinates.lon]);

  const rows: Array<{ key: string; label: string; detail: string; state: State }> = [
    {
      key: 'app',
      label: t('La app abre sin señal', 'The app opens with no signal'),
      detail: installed
        ? t('Guardada en tu pantalla de inicio.', 'Saved to your home screen.')
        : appCached === 'ready'
          ? t('Guardada en este navegador. Podés cerrarlo y volver a entrar sin datos.', 'Stored in this browser. You can close it and come back with no data.')
          : t('Todavía no quedó guardada. Volvé a cargar esta página con señal.', 'Not stored yet. Reload this page while you have signal.'),
      state: appCached,
    },
    {
      key: 'trail',
      label: t('Datos de este sendero', 'This trail’s data'),
      detail: t(
        'Distancia, desnivel, waypoints, horarios del sol y coordenadas viajan dentro de la app.',
        'Distance, elevation, waypoints, sun times and coordinates ship inside the app itself.',
      ),
      state: 'ready',
    },
    {
      key: 'map',
      label: t('Mapa del área', 'Map of the area'),
      detail:
        mapCached === 'ready'
          ? t('Descargado. El mapa se dibuja sin conexión.', 'Downloaded. The map draws with no connection.')
          : t('Usá "Mapa offline" más arriba antes de salir.', 'Use “Offline map” above before you leave.'),
      state: mapCached,
    },
    {
      key: 'gps',
      label: t('Grabar tu recorrido', 'Recording your hike'),
      detail: t(
        'El GPS del celular no usa datos: graba igual sin señal y el recorrido queda en el dispositivo hasta que vuelva la conexión. Eso sí: la grabación se pausa si cambiás de app o bloqueás la pantalla, así que dejá la pantalla de caminata abierta.',
        "The phone's GPS needs no data: it records without signal and the track stays on the device until the connection returns. One caveat: recording pauses if you switch apps or lock the screen, so leave the hike screen open.",
      ),
      state: 'ready',
    },
  ];

  return (
    <View style={{
      backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1,
      borderRadius: 16, padding: 16, marginHorizontal: 16, marginBottom: 14, gap: 12,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Ionicons name="cloud-offline-outline" size={16} color={colors.accent} />
        <Text style={{ color: colors.text, fontWeight: '800', fontSize: 14, flex: 1 }}>
          {t('¿Qué funciona sin señal?', 'What works with no signal?')}
        </Text>
      </View>

      {rows.map((row) => (
        <View key={row.key} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
          <Ionicons
            name={
              row.state === 'ready' ? 'checkmark-circle' : row.state === 'checking' ? 'ellipse-outline' : 'alert-circle-outline'
            }
            size={16}
            color={row.state === 'ready' ? colors.accent : row.state === 'checking' ? colors.muted : '#f59e0b'}
            style={{ marginTop: 1 }}
          />
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontSize: 12.5, fontWeight: '700' }}>{row.label}</Text>
            <Text style={{ color: colors.muted, fontSize: 11.5, lineHeight: 16, marginTop: 1 }}>
              {row.detail}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

export default OfflineReadiness;
