import React from 'react';
import { View, Text } from 'react-native';

export function SafetyDisclaimer() {
  return (
    <View className="mx-4 mb-4 bg-stone-800 rounded-2xl p-4">
      <Text className="text-brand-500 font-semibold text-xs mb-1">SLIABH — PATAGONIA TRAIL ASSISTANT</Text>
      <Text className="text-stone-400 text-xs leading-4">
        This app provides offline trail information only. It is not a GPS navigator,
        rescue service, or emergency authority. Always inform someone of your route
        before departure. In an emergency, contact CONAF: +56 61 2691931.
      </Text>
    </View>
  );
}
