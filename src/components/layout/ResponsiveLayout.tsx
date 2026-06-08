import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
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

  const bgColor = isDark ? '#070b14' : '#f8fafc';
  const sidebarBgColor = isDark ? '#0f1724' : '#ffffff';
  const borderColor = isDark ? '#1e2d42' : '#e2e8f0';

  if (isWide && sidebar) {
    return (
      <View style={[styles.row, { backgroundColor: bgColor }]}>
        <View
          style={[
            styles.sidebar,
            {
              backgroundColor: sidebarBgColor,
              borderRightColor: borderColor,
            },
          ]}
        >
          {sidebar}
        </View>
        <View style={styles.content}>
          {scrollable ? (
            <ScrollView style={styles.fill} contentContainerStyle={styles.scrollContent}>
              {children}
            </ScrollView>
          ) : (
            children
          )}
        </View>
      </View>
    );
  }

  return scrollable ? (
    <ScrollView
      style={[styles.fill, { backgroundColor: bgColor }]}
      contentContainerStyle={styles.scrollContent}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.fill, { backgroundColor: bgColor }]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 320,
    borderRightWidth: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
