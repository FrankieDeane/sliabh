import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { ThemeToggle } from '../ui/ThemeToggle';
import { OfflineBadge } from '../ui/OfflineBadge';
import { useTheme } from '../../hooks/useTheme';

interface Props {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}

export function ScreenHeader({ title, subtitle, right }: Props) {
  // WebHeader already provides the navigation chrome on web
  if (Platform.OS === 'web') return null;

  const { isDark } = useTheme();

  const bgColor = isDark ? '#070b14' : '#ffffff';
  const borderColor = isDark ? '#1e2d42' : '#e2e8f0';
  const titleColor = isDark ? '#f0f9ff' : '#0f172a';
  const subtitleColor = '#64748b';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: bgColor,
          borderBottomColor: borderColor,
        },
      ]}
    >
      <View style={styles.left}>
        <Text style={[styles.title, { color: titleColor }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: subtitleColor }]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={styles.right}>
        <OfflineBadge />
        <ThemeToggle />
        {right ?? null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  left: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
