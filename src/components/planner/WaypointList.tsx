import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { usePlannerStore } from '../../store/plannerStore';
import { useTheme } from '../../hooks/useTheme';

export function WaypointList() {
  const { waypoints, removeWaypoint } = usePlannerStore();
  const { isDark } = useTheme();
  const textClass = isDark ? 'text-stone-100' : 'text-stone-900';
  const mutedClass = isDark ? 'text-stone-400' : 'text-stone-500';
  const itemBg = isDark ? 'bg-stone-800' : 'bg-white';

  if (waypoints.length === 0) {
    return (
      <View className="flex-1 items-center justify-center p-6">
        <Text className="text-3xl mb-2">📍</Text>
        <Text className={`text-center ${mutedClass}`}>Toca el mapa para añadir puntos de ruta</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1">
      {waypoints.map((wp, i) => (
        <View key={wp.id} className={`flex-row items-center p-3 mx-3 mb-2 rounded-xl border ${itemBg} ${isDark ? 'border-stone-700' : 'border-stone-200'}`}>
          <View className="w-7 h-7 rounded-full bg-brand-600 items-center justify-center mr-3">
            <Text className="text-white text-xs font-bold">{i + 1}</Text>
          </View>
          <View className="flex-1">
            <Text className={`font-medium text-sm ${textClass}`}>{wp.name}</Text>
            <Text className={`text-xs ${mutedClass}`}>{wp.lat.toFixed(5)}, {wp.lon.toFixed(5)}</Text>
            {wp.elevation_m && (
              <Text className={`text-xs ${mutedClass}`}>⛰ {wp.elevation_m}m</Text>
            )}
          </View>
          <TouchableOpacity onPress={() => removeWaypoint(wp.id)} className="p-2">
            <Text className="text-red-400 text-lg">✕</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}
