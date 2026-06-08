import React from 'react';
import { View, Text } from 'react-native';
import { Card } from './Card';
import { useTheme } from '../../hooks/useTheme';

export function OfflineAICard() {
  const { isDark } = useTheme();
  const textMuted = isDark ? 'text-stone-400' : 'text-stone-500';
  const textPrimary = isDark ? 'text-stone-100' : 'text-stone-900';
  return (
    <Card className="border-brand-600/40 bg-brand-900/30">
      <View className="flex-row items-center gap-3 mb-2">
        <Text className="text-2xl">🤖</Text>
        <View className="flex-1">
          <Text className={`font-bold text-base ${textPrimary}`}>IA disponible sin internet</Text>
          <Text className={`text-xs ${textMuted}`}>Gemma · Modelo local · Funciona en la montaña</Text>
        </View>
        <View className="bg-brand-600 px-2 py-0.5 rounded-full">
          <Text className="text-white text-xs font-semibold">OFFLINE</Text>
        </View>
      </View>
      <Text className={`text-sm ${textMuted} leading-5`}>
        Pregunta sobre rutas, clima, equipamiento o emergencias — sin necesidad de señal.
      </Text>
    </Card>
  );
}
