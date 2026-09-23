import React from 'react';
import { View, Modal, StatusBar } from 'react-native';
import WebView from 'react-native-webview';
import { buildTrailMapHtml, SITE } from './trailMapHtml';

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

function TrailWebView({ html, onMessage }: { html: string; onMessage: (type: string) => void }) {
  return (
    <WebView
      source={{ html, baseUrl: SITE }}
      style={{ flex: 1, backgroundColor: '#070b14' }}
      originWhitelist={['*']}
      javaScriptEnabled
      domStorageEnabled
      scrollEnabled={false}
      // Stops the trail page's ScrollView from stealing the gesture: without
      // it every vertical drag or two-finger twist on the map scrolled the page.
      nestedScrollEnabled
      overScrollMode="never"
      onMessage={(e) => {
        try {
          onMessage(JSON.parse(e.nativeEvent.data).type);
        } catch {
          // not ours
        }
      }}
    />
  );
}

export default function TrailMap3D({
  track,
  trailName,
  height = 320,
  exaggeration = 1.8,
}: TrailMap3DProps) {
  const [fullscreen, setFullscreen] = React.useState(false);
  const containerH = typeof height === 'number' ? height : 320;

  const trackKey = track.length ? `${track.length}:${track[0].lat},${track[0].lon}` : '';
  // A new string remounts the WebView (and replays the intro), so build once.
  const inlineHtml = React.useMemo(
    () => (track.length >= 2 ? buildTrailMapHtml(track, trailName, exaggeration, false) : ''),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trackKey, trailName, exaggeration],
  );
  const fullHtml = React.useMemo(
    () => (fullscreen && track.length >= 2 ? buildTrailMapHtml(track, trailName, exaggeration, true) : ''),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fullscreen, trackKey, trailName, exaggeration],
  );

  if (track.length < 2) return null;

  return (
    <View style={{ borderRadius: 16, overflow: 'hidden', height: containerH, backgroundColor: '#070b14' }}>
      <TrailWebView html={inlineHtml} onMessage={(type) => { if (type === 'fullscreen') setFullscreen(true); }} />
      <Modal
        visible={fullscreen}
        animationType="fade"
        onRequestClose={() => setFullscreen(false)}
        statusBarTranslucent
      >
        <StatusBar hidden />
        <View style={{ flex: 1, backgroundColor: '#070b14' }}>
          {fullscreen && (
            <TrailWebView html={fullHtml} onMessage={(type) => { if (type === 'close') setFullscreen(false); }} />
          )}
        </View>
      </Modal>
    </View>
  );
}
