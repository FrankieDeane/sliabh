import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

export function ThemeToggle() {
  const { isDark, toggle } = useTheme();
  return (
    <TouchableOpacity
      onPress={toggle}
      className="flex-row items-center gap-1 px-2 py-1 rounded-full border border-stone-600"
      accessibilityLabel={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      <Text className="text-base">{isDark ? '☀️' : '🌙'}</Text>
    </TouchableOpacity>
  );
}
