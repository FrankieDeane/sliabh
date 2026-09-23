import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { TrackPoint } from '../../services/supabase';
import { useLangStore } from '../../store/langStore';

const TrackMap = Platform.OS === 'web'
  ? require('../map/MapLibreEsri.web').MapLibreEsri
  : require('../map/MapLibreEsri.native').MapLibreEsri;

interface Colors { surface: string; elevated: string; border: string; text: string; muted: string; accent: string }

/**
 * The line the walker actually walked, for a hike that is already finished.
 *
 * Numbers alone do not answer the question people actually have about a
 * recorded walk — *where did I go?* — so every hike, saved or still waiting to
 * upload, can show its own track without having to publish it first.
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

  if (points.length < 2) return null;

  const center: [number, number] = [points[0].lat, points[0].lon];

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

      {open && (
        <View style={{ borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}>
          <TrackMap
            center={center}
            zoom={14}
            height={280}
            layer="esri-topo"
            showPolyline={false}
            trackPoints={points}
            routePoints={routePoints}
          />
        </View>
      )}
    </View>
  );
}

export default TrackMapPreview;
