import React from 'react';
import { View, Text } from 'react-native';
import type { Refuge } from '../knowledge/types';

interface Props {
  refuge: Refuge;
}

export function RefugeCard({ refuge }: Props) {
  return (
    <View className="bg-stone-800 rounded-2xl p-4 mb-3 mx-4">
      <View className="flex-row items-start justify-between mb-1">
        <Text className="text-white font-semibold text-base flex-1 mr-2">{refuge.name}</Text>
        <Text className="text-stone-400 text-xs">{refuge.elevation_m}m</Text>
      </View>

      <Text className="text-stone-400 text-xs mb-2">
        Season: {refuge.season.open}–{refuge.season.close} · Capacity: {refuge.capacity}
      </Text>

      <View className="flex-row flex-wrap gap-1">
        {refuge.services.map((s) => (
          <View key={s} className="bg-stone-700 rounded-full px-2 py-0.5">
            <Text className="text-stone-300 text-xs">{s.replace(/_/g, ' ')}</Text>
          </View>
        ))}
      </View>

      {refuge.booking_required && (
        <Text className="text-brand-500 text-xs mt-2">Booking required</Text>
      )}
    </View>
  );
}
