import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';

export function ThemeToggle() {
  const { theme, toggle: toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <TouchableOpacity
      onPress={toggleTheme}
      style={[
        styles.button,
        {
          borderColor: isDark ? '#334155' : '#cbd5e1',
          backgroundColor: isDark ? '#0f1724' : '#f8fafc',
        },
      ]}
      accessibilityLabel={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      accessibilityRole="button"
    >
      <Ionicons
        name={isDark ? 'sunny-outline' : 'moon-outline'}
        size={18}
        color={isDark ? '#f0f9ff' : '#0f172a'}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
