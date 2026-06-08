import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  fullWidth?: boolean;
}

const variantStyles: Record<Variant, { container: string; text: string }> = {
  primary: { container: 'bg-brand-600 active:bg-brand-700', text: 'text-white font-semibold' },
  secondary: { container: 'bg-stone-700 active:bg-stone-600 border border-stone-600', text: 'text-white font-medium' },
  ghost: { container: 'active:bg-stone-800', text: 'text-brand-500 font-medium' },
  danger: { container: 'bg-red-600 active:bg-red-700', text: 'text-white font-semibold' },
};

export function Button({ label, onPress, variant = 'primary', loading, disabled, icon, fullWidth }: ButtonProps) {
  const styles = variantStyles[variant];
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      className={`flex-row items-center justify-center gap-2 px-4 py-3 rounded-xl ${styles.container} ${fullWidth ? 'w-full' : ''} ${disabled || loading ? 'opacity-50' : ''}`}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <>
          {icon && <Text className="text-base">{icon}</Text>}
          <Text className={styles.text}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}
