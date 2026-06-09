import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View, StyleSheet, Platform } from 'react-native';
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

const SIZE_CONFIG: Record<Size, { height: number; paddingHorizontal: number; fontSize: number; iconSize: number; borderRadius: number }> = {
  sm: { height: 38,  paddingHorizontal: 16, fontSize: 12, iconSize: 15, borderRadius: 10 },
  md: { height: 50,  paddingHorizontal: 22, fontSize: 14, iconSize: 17, borderRadius: 14 },
  lg: { height: 58,  paddingHorizontal: 28, fontSize: 16, iconSize: 19, borderRadius: 16 },
};

interface VariantStyle {
  bg: string;
  pressedBg: string;
  borderColor: string | null;
  textColor: string;
  iconColor: string;
  borderWidth: number;
  shadow?: object;
}

const VARIANT_CONFIG: Record<Variant, VariantStyle> = {
  primary: {
    bg: '#16a34a',
    pressedBg: '#15803d',
    borderColor: null,
    textColor: '#ffffff',
    iconColor: '#ffffff',
    borderWidth: 0,
    shadow: {
      shadowColor: '#22c55e',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.32,
      shadowRadius: 12,
      elevation: 6,
    },
  },
  secondary: {
    bg: 'rgba(30,45,66,0.4)',
    pressedBg: 'rgba(30,45,66,0.65)',
    borderColor: '#334155',
    textColor: '#e2e8f0',
    iconColor: '#94a3b8',
    borderWidth: 1,
    shadow: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 2,
    },
  },
  ghost: {
    bg: 'transparent',
    pressedBg: 'rgba(34,197,94,0.1)',
    borderColor: null,
    textColor: '#22c55e',
    iconColor: '#22c55e',
    borderWidth: 0,
  },
  danger: {
    bg: '#dc2626',
    pressedBg: '#b91c1c',
    borderColor: null,
    textColor: '#ffffff',
    iconColor: '#ffffff',
    borderWidth: 0,
    shadow: {
      shadowColor: '#dc2626',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.28,
      shadowRadius: 8,
      elevation: 4,
    },
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

  const bgColor = pressed && !disabled && !loading ? vc.pressedBg : vc.bg;
  const opacity = disabled ? 0.4 : 1;
  const pressScale = pressed && !disabled && !loading ? { transform: [{ scale: 0.97 }] } : {};

  const webProps = Platform.OS === 'web'
    ? ({ 'data-btn': variant } as any)
    : {};

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      disabled={disabled || loading}
      activeOpacity={1}
      accessibilityRole="button"
      accessibilityLabel={label}
      {...webProps}
      style={[
        styles.base,
        {
          height: sz.height,
          paddingHorizontal: sz.paddingHorizontal,
          backgroundColor: bgColor,
          borderRadius: sz.borderRadius,
          borderWidth: vc.borderWidth,
          borderColor: vc.borderColor ?? 'transparent',
          opacity,
          alignSelf: fullWidth ? 'stretch' : 'center',
          width: fullWidth ? '100%' : undefined,
        },
        vc.shadow,
        pressScale,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={vc.iconColor} />
      ) : (
        <View style={styles.inner}>
          {leftIcon && (
            <Ionicons
              name={leftIcon}
              size={sz.iconSize}
              color={vc.iconColor}
              style={styles.iconGap}
            />
          )}
          <Text
            style={[styles.label, { fontSize: sz.fontSize, color: vc.textColor }]}
            numberOfLines={1}
          >
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
    gap: 8,
  },
  iconGap: {},
  label: {
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
