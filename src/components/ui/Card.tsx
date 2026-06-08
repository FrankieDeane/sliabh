import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  padding?: 'sm' | 'md' | 'lg';
  elevated?: boolean;
  className?: string;
}

const PADDING_MAP = { sm: 12, md: 16, lg: 24 } as const;

export function Card({ children, padding = 'md', elevated = false, style, ...props }: CardProps) {
  const { isDark } = useTheme();

  const bgColor = isDark
    ? elevated ? '#162035' : '#0f1724'
    : elevated ? '#f1f5f9' : '#ffffff';

  const borderColor = isDark ? '#1e2d42' : '#e2e8f0';

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: bgColor,
          borderColor,
          padding: PADDING_MAP[padding],
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
