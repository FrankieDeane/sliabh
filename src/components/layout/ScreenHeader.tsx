import React from 'react';
import { View, Text, SafeAreaView } from 'react-native';
import { ThemeToggle } from '../ui/ThemeToggle';
import { OfflineBadge } from '../ui/OfflineBadge';
import { useTheme } from '../../hooks/useTheme';

interface Props {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}

export function ScreenHeader({ title, subtitle, right }: Props) {
  const { isDark } = useTheme();
  const bgClass = isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200';
  const titleClass = isDark ? 'text-stone-50' : 'text-stone-900';
  const subtitleClass = isDark ? 'text-stone-400' : 'text-stone-500';

  return (
    <SafeAreaView className={`border-b ${bgClass}`}>
      <View className="flex-row items-center justify-between px-4 py-3">
        <View className="flex-1">
          <Text className={`text-xl font-bold ${titleClass}`}>{title}</Text>
          {subtitle && <Text className={`text-xs ${subtitleClass}`}>{subtitle}</Text>}
        </View>
        <View className="flex-row items-center gap-2">
          <OfflineBadge />
          <ThemeToggle />
          {right}
        </View>
      </View>
    </SafeAreaView>
  );
}
