import React from 'react';
import { View, Text, TouchableOpacity, Platform, Modal, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { TrackPoint } from '../../services/supabase';
import { useLangStore } from '../../store/langStore';

const TrackMap = Platform.OS === 'web'
  ? require('../map/MapLibreEsri.web').MapLibreEsri
  : require('../map/MapLibreEsri.native').MapLibreEsri;

interface Colors { surface: string; elevated: string; border: string; text: string; muted: string; accent: string }

type BaseLayer = 'esri-topo' | 'esri-satellite';

/**
 * The line the walker actually walked, for a hike that is already finished.
 *
 * Numbers alone do not answer the question people actually have about a
 * recorded walk — *where did I go?* — so every hike, saved or still waiting to
 * upload, can show its own track without having to publish it first. The map
 * opens framed on the whole track, switches between topo and satellite, and
 * expands to full screen, where pan and pinch are not shared with the page
 * scroll.
 */
export function TrackMapPreview({
  points,
  colors,
  routePoints,
}: {
  points: TrackPoint[];
  colors: Colors;
  /** The trail's own line, drawn underneath for comparison. */
  routePoints?: Array<{ lat: number; lon: number }>;
}) {
  const { t } = useLangStore();
  const [open, setOpen] = React.useState(false);
  const [layer, setLayer] = React.useState<BaseLayer>('esri-topo');
  const [fullscreen, setFullscreen] = React.useState(false);

  if (points.length < 2) return null;

  const center: [number, number] = [points[0].lat, points[0].lon];

  const renderMap = (height: number | string) => (
    <TrackMap
      center={center}
      zoom={14}
      height={height}
      layer={layer}
      showPolyline={false}
      trackPoints={points}
      routePoints={routePoints}
      fitToTrack
    />
  );

  // The web map puts its zoom buttons top-right; the native one, top-left.
  const controlsPos = Platform.OS === 'web' ? { top: 10, right: 52 } : { top: 10, right: 10 };

  const controls = (inFullscreen: boolean) => (
    <View style={{ position: 'absolute', ...controlsPos, flexDirection: 'row', gap: 8 }}>
      <MapChip
        icon={layer === 'esri-satellite' ? 'map-outline' : 'globe-outline'}
        label={layer === 'esri-satellite' ? t('Topo', 'Topo') : t('Satélite', 'Satellite')}
        onPress={() => setLayer((l) => (l === 'esri-satellite' ? 'esri-topo' : 'esri-satellite'))}
      />
      <MapChip
        icon={inFullscreen ? 'contract-outline' : 'expand-outline'}
        label={inFullscreen ? t('Cerrar', 'Close') : undefined}
        accessibilityLabel={inFullscreen ? t('Cerrar pantalla completa', 'Exit full screen') : t('Pantalla completa', 'Full screen')}
        onPress={() => setFullscreen(!inFullscreen)}
      />
    </View>
  );

  return (
    <View style={{ gap: 8 }}>
      <TouchableOpacity
        onPress={() => setOpen((v) => !v)}
        activeOpacity={0.85}
        accessibilityRole="button"
        style={{
          flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
          borderWidth: 1, borderColor: colors.border, borderRadius: 999,
          paddingHorizontal: 12, paddingVertical: 7,
        }}
      >
        <Ionicons name={open ? 'chevron-up' : 'map-outline'} size={14} color={colors.text} />
        <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700' }}>
          {open ? t('Ocultar mapa', 'Hide map') : t('Ver mi recorrido', 'See my track')}
        </Text>
      </TouchableOpacity>

      {open && !fullscreen && (
        <View style={{ borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}>
          {renderMap(320)}
          {controls(false)}
        </View>
      )}

      {fullscreen && (
        <Modal visible animationType="fade" onRequestClose={() => setFullscreen(false)} statusBarTranslucent>
          <View
            style={{
              flex: 1,
              backgroundColor: '#070b14',
              paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : Platform.OS === 'ios' ? 44 : 0,
            }}
          >
            <View style={{ flex: 1 }}>
              {renderMap('100%')}
              {controls(true)}
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

function MapChip({
  icon,
  label,
  onPress,
  accessibilityLabel,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label?: string;
  onPress: () => void;
  accessibilityLabel?: string;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(15,23,42,0.85)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: label ? 12 : 9,
      }}
    >
      <Ionicons name={icon} size={16} color="#fff" />
      {!!label && <Text style={{ color: '#fff', fontSize: 12.5, fontWeight: '700' }}>{label}</Text>}
    </TouchableOpacity>
  );
}

export default TrackMapPreview;
