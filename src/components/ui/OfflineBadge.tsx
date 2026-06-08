import React from 'react';
import { View, Text } from 'react-native';
import { useNetwork } from '../../hooks/useNetwork';

export function OfflineBadge() {
  const { isOffline } = useNetwork();
  if (!isOffline) return null;
  return (
    <View className="flex-row items-center gap-1 bg-amber-500/20 border border-amber-500/40 px-3 py-1 rounded-full">
      <Text className="text-amber-400 text-xs font-semibold">⚡ Sin conexión — IA disponible</Text>
    </View>
  );
}
