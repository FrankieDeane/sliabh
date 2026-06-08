import React from 'react';
import { View, ViewProps } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface CardProps extends ViewProps {
  children: React.ReactNode;
  padding?: 'sm' | 'md' | 'lg';
}

export function Card({ children, padding = 'md', className = '', ...props }: CardProps) {
  const { isDark } = useTheme();
  const padClass = padding === 'sm' ? 'p-3' : padding === 'lg' ? 'p-6' : 'p-4';
  const bgClass = isDark ? 'bg-stone-800 border-stone-700' : 'bg-white border-stone-200';
  return (
    <View className={`rounded-2xl border ${bgClass} ${padClass} ${className}`} {...props}>
      {children}
    </View>
  );
}
