import React from 'react';
import { View, Text } from 'react-native';
import type { Campground } from '../knowledge/types';

interface Props {
  camp: Campground;
}

export function CampgroundCard({ camp }: Props) {
  return (
    <View className="bg-stone-800 rounded-2xl p-4 mb-3 mx-4">
      <View className="flex-row items-start justify-between mb-1">
        <Text className="text-white font-semibold text-base flex-1 mr-2">{camp.name}</Text>
        <Text className="text-stone-400 text-xs">{camp.elevation_m}m</Text>
      </View>

      <View className="flex-row gap-4 mb-2">
        <View>
          <Text className="text-stone-500 text-xs">Fee</Text>
          <Text className="text-white text-sm">{camp.fee_usd === 0 ? 'Free' : `$${camp.fee_usd}`}</Text>
        </View>
        <View>
          <Text className="text-stone-500 text-xs">Capacity</Text>
          <Text className="text-white text-sm">{camp.capacity}</Text>
        </View>
        <View>
          <Text className="text-stone-500 text-xs">Water</Text>
          <Text className={`text-sm ${camp.water_available ? 'text-brand-500' : 'text-red-400'}`}>
            {camp.water_available ? 'Yes' : 'No'}
          </Text>
        </View>
      </View>

      {camp.services.length > 0 && (
        <View className="flex-row flex-wrap gap-1">
          {camp.services.map((s) => (
            <View key={s} className="bg-stone-700 rounded-full px-2 py-0.5">
              <Text className="text-stone-300 text-xs">{s.replace(/_/g, ' ')}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
