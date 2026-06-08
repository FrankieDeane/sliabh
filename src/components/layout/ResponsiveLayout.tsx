import React from 'react';
import { View, ScrollView } from 'react-native';
import { useResponsive } from '../../hooks/useResponsive';
import { useTheme } from '../../hooks/useTheme';

interface Props {
  sidebar?: React.ReactNode;
  children: React.ReactNode;
  scrollable?: boolean;
}

export function ResponsiveLayout({ sidebar, children, scrollable = true }: Props) {
  const { isWide } = useResponsive();
  const { isDark } = useTheme();
  const bgClass = isDark ? 'bg-stone-900' : 'bg-stone-50';

  if (isWide && sidebar) {
    return (
      <View className={`flex-1 flex-row ${bgClass}`}>
        <View className={`w-80 border-r ${isDark ? 'border-stone-700 bg-stone-900' : 'border-stone-200 bg-white'}`}>
          {sidebar}
        </View>
        <View className="flex-1">
          {scrollable ? <ScrollView className="flex-1">{children}</ScrollView> : children}
        </View>
      </View>
    );
  }

  return scrollable ? (
    <ScrollView className={`flex-1 ${bgClass}`}>{children}</ScrollView>
  ) : (
    <View className={`flex-1 ${bgClass}`}>{children}</View>
  );
}
