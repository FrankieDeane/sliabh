import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { TrackPoint } from '../../services/supabase';
import { elevationStats, paceMinPerKm, formatPace, formatGain } from '../../utils/trackStats';
import { useLangStore } from '../../store/langStore';

interface Colors { border: string; text: string; muted: string; accent: string }

function fmtDistance(km: number): string {
  return km >= 1 ? `${km.toFixed(2)} km` : `${Math.round(km * 1000)} m`;
}

function fmtDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  return h > 0 ? `${h} h ${m} min` : `${m} min`;
}

/**
 * The four figures that describe a walk, wherever it is shown.
 *
 * Distance and time were all a recorded hike reported, and for hiking that is
 * the less interesting half: eight kilometres with 900 m of climb is a
 * different day out from eight flat ones, and the app used to show them
 * identically. Climb and pace are computed from the track itself rather than
 * stored, so the seven hikes recorded before altitude was captured show a dash
 * instead of a fabricated zero.
 */
export function TrackStatsRow({
  points,
  distanceKm,
  durationS,
  colors,
  compact = false,
}: {
  points: TrackPoint[];
  distanceKm: number;
  durationS: number;
  colors: Colors;
  /** Smaller type, for a list row rather than a page header. */
  compact?: boolean;
}) {
  const { t } = useLangStore();
  const elevation = React.useMemo(() => elevationStats(points), [points]);
  const pace = paceMinPerKm(distanceKm, durationS);

  const items: Array<{ icon: React.ComponentProps<typeof Ionicons>['name']; label: string; value: string }> = [
    { icon: 'walk-outline', label: t('Distancia', 'Distance'), value: fmtDistance(distanceKm) },
    { icon: 'time-outline', label: t('Tiempo', 'Time'), value: fmtDuration(durationS) },
    { icon: 'trending-up-outline', label: t('Desnivel', 'Climb'), value: formatGain(elevation) },
    { icon: 'speedometer-outline', label: t('Ritmo', 'Pace'), value: formatPace(pace) },
  ];

  return (
    <View style={{ flexDirection: 'row', gap: compact ? 6 : 10, flexWrap: 'wrap' }}>
      {items.map((item) => (
        <View
          key={item.label}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 5,
            borderWidth: 1, borderColor: colors.border, borderRadius: 999,
            paddingHorizontal: compact ? 8 : 11, paddingVertical: compact ? 4 : 6,
          }}
        >
          <Ionicons name={item.icon} size={compact ? 11 : 13} color={colors.muted} />
          <Text style={{ color: colors.text, fontSize: compact ? 11 : 12.5, fontWeight: '700' }}>
            {item.value}
          </Text>
          <Text style={{ color: colors.muted, fontSize: compact ? 9.5 : 11 }}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

export default TrackStatsRow;
