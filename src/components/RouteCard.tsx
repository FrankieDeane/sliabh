import React from 'react';
import { View, Text } from 'react-native';
import type { Route } from '../knowledge/types';

const DIFFICULTY_COLOR: Record<string, string> = {
  easy: 'bg-green-800 text-green-300',
  moderate: 'bg-yellow-800 text-yellow-300',
  hard: 'bg-orange-800 text-orange-300',
  expert: 'bg-red-800 text-red-300',
};

interface Props {
  route: Route;
}

export function RouteCard({ route }: Props) {
  const diffClass = DIFFICULTY_COLOR[route.difficulty] ?? 'bg-stone-700 text-stone-300';

  return (
    <View className="bg-stone-800 rounded-2xl p-4 mb-3 mx-4">
      <View className="flex-row items-start justify-between mb-2">
        <Text className="text-white font-semibold text-base flex-1 mr-2">{route.name}</Text>
        <View className={`rounded-full px-2 py-0.5 ${diffClass.split(' ')[0]}`}>
          <Text className={`text-xs capitalize ${diffClass.split(' ')[1]}`}>
            {route.difficulty}
          </Text>
        </View>
      </View>

      <View className="flex-row gap-4 mb-2">
        <StatPill label="Distance" value={`${route.distance_km} km`} />
        <StatPill
          label="Duration"
          value={
            route.duration_days.min === route.duration_days.max
              ? `${route.duration_days.min}d`
              : `${route.duration_days.min}–${route.duration_days.max}d`
          }
        />
        <StatPill label="Gain" value={`${route.elevation_gain_m}m`} />
      </View>

      {route.permits_required && (
        <Text className="text-yellow-400 text-xs">⚠ Permit required</Text>
      )}

      {route.warnings.length > 0 && (
        <Text className="text-stone-500 text-xs mt-1" numberOfLines={1}>
          {route.warnings.map((w) => w.replace(/_/g, ' ')).join(' · ')}
        </Text>
      )}
    </View>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text className="text-stone-500 text-xs">{label}</Text>
      <Text className="text-white text-sm font-medium">{value}</Text>
    </View>
  );
}
