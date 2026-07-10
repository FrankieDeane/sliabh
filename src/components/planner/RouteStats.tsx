import React from 'react';
import { View, Text } from 'react-native';
import { usePlannerStore, Waypoint } from '../../store/plannerStore';
import { useTheme } from '../../hooks/useTheme';
import { useLangStore } from '../../store/langStore';

function haversineKm(a: Waypoint, b: Waypoint): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function naismithHours(distKm: number, elevGainM: number): number {
  return distKm / 5 + elevGainM / 600;
}

export function RouteStats() {
  const { waypoints } = usePlannerStore();
  const { isDark } = useTheme();
  const { t } = useLangStore();
  const bgClass = isDark ? 'bg-stone-800 border-stone-700' : 'bg-white border-stone-200';
  const textClass = isDark ? 'text-stone-100' : 'text-stone-900';
  const mutedClass = isDark ? 'text-stone-400' : 'text-stone-500';

  if (waypoints.length < 2) return null;

  let totalKm = 0;
  let elevGain = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    totalKm += haversineKm(waypoints[i], waypoints[i + 1]);
    const a = waypoints[i].elevation_m ?? 0;
    const b = waypoints[i + 1].elevation_m ?? 0;
    if (b > a) elevGain += b - a;
  }
  const hours = naismithHours(totalKm, elevGain);
  const days = hours / 8;

  const stats = [
    { icon: '📏', label: t('Distancia', 'Distance'), value: `${totalKm.toFixed(1)} km` },
    { icon: '⛰', label: t('Desnivel', 'Elevation'), value: `+${elevGain} m` },
    { icon: '⏱', label: t('Tiempo est.', 'Est. time'), value: hours < 8 ? `${hours.toFixed(1)}h` : `${days.toFixed(1)} ${t('días', 'days')}` },
    { icon: '📍', label: t('Puntos', 'Points'), value: `${waypoints.length}` },
  ];

  return (
    <View className={`mx-3 mb-3 p-3 rounded-2xl border ${bgClass}`}>
      <Text className={`text-xs font-semibold mb-2 ${mutedClass}`}>{t('ESTADÍSTICAS DE RUTA', 'ROUTE STATS')}</Text>
      <View className="flex-row flex-wrap gap-3">
        {stats.map((s) => (
          <View key={s.label} className="items-center flex-1 min-w-16">
            <Text className="text-lg">{s.icon}</Text>
            <Text className={`text-base font-bold ${textClass}`}>{s.value}</Text>
            <Text className={`text-xs ${mutedClass}`}>{s.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
