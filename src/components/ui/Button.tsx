import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  size?: Size;
  fullWidth?: boolean;
}

const SIZE_CONFIG: Record<Size, { height: number; paddingHorizontal: number; fontSize: number; iconSize: number }> = {
  sm: { height: 40,  paddingHorizontal: 16, fontSize: 13, iconSize: 16 },
  md: { height: 52,  paddingHorizontal: 20, fontSize: 15, iconSize: 18 },
  lg: { height: 60,  paddingHorizontal: 24, fontSize: 17, iconSize: 20 },
};

const VARIANT_CONFIG: Record<
  Variant,
  { bg: string; activeBg: string; borderColor: string | null; textColor: string; iconColor: string; borderWidth: number }
> = {
  primary: {
    bg: '#16a34a',
    activeBg: '#15803d',
    borderColor: null,
    textColor: '#ffffff',
    iconColor: '#ffffff',
    borderWidth: 0,
  },
  secondary: {
    bg: 'transparent',
    activeBg: 'rgba(30,45,66,0.5)',
    borderColor: '#4a5568',
    textColor: '#e2e8f0',
    iconColor: '#e2e8f0',
    borderWidth: 1,
  },
  ghost: {
    bg: 'transparent',
    activeBg: 'rgba(30,45,66,0.3)',
    borderColor: null,
    textColor: '#22c55e',
    iconColor: '#22c55e',
    borderWidth: 0,
  },
  danger: {
    bg: '#dc2626',
    activeBg: '#b91c1c',
    borderColor: null,
    textColor: '#ffffff',
    iconColor: '#ffffff',
    borderWidth: 0,
  },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  leftIcon,
  size = 'md',
  fullWidth = false,
}: ButtonProps) {
  const [pressed, setPressed] = React.useState(false);
  const sz = SIZE_CONFIG[size];
  const vc = VARIANT_CONFIG[variant];

  const bgColor = pressed && !disabled && !loading ? vc.activeBg : vc.bg;
  const opacity = disabled || loading ? 0.45 : 1;

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      disabled={disabled || loading}
      activeOpacity={1}
      style={[
        styles.base,
        {
          height: sz.height,
          paddingHorizontal: sz.paddingHorizontal,
          backgroundColor: bgColor,
          borderRadius: 16,
          borderWidth: vc.borderWidth,
          borderColor: vc.borderColor ?? 'transparent',
          opacity,
          alignSelf: fullWidth ? 'stretch' : 'auto',
          width: fullWidth ? '100%' : undefined,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {loading ? (
        <ActivityIndicator size="small" color={vc.iconColor} />
      ) : (
        <View style={styles.inner}>
          {leftIcon ? (
            <Ionicons
              name={leftIcon}
              size={sz.iconSize}
              color={vc.iconColor}
              style={styles.iconGap}
            />
          ) : null}
          <Text style={[styles.label, { fontSize: sz.fontSize, color: vc.textColor }]} numberOfLines={1}>
            {label}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconGap: {
    marginRight: 8,
  },
  label: {
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
