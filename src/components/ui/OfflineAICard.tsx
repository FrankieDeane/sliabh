import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';

const PILLS = ['Consultas', 'Rutas', 'Seguridad'] as const;

export function OfflineAICard() {
  const { isDark } = useTheme();
  const isWeb = Platform.OS === 'web';

  const titleColor = isDark ? '#f0f9ff' : '#0f172a';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Ionicons name="sparkles" size={20} color="#22c55e" />
        </View>
        <View style={styles.textBlock}>
          <Text style={[styles.title, { color: titleColor }]}>
            {isWeb ? 'Asistente IA con Claude' : 'IA disponible sin internet'}
          </Text>
          <Text style={styles.subtitle}>
            {isWeb
              ? 'Claude · Nube · Requiere conexión a internet'
              : 'Gemma 3 · Modelo local · Sin límites en la montaña'}
          </Text>
        </View>
      </View>

      <View style={styles.pillRow}>
        {PILLS.map((pill) => (
          <View key={pill} style={styles.pill}>
            <Text style={styles.pillText}>{pill}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(22,163,74,0.3)',
    backgroundColor: '#162035',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 3,
    letterSpacing: 0.1,
  },
  subtitle: {
    color: '#64748b',
    fontSize: 11,
    lineHeight: 15,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    backgroundColor: 'rgba(22,163,74,0.2)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  pillText: {
    color: '#22c55e',
    fontSize: 11,
    fontWeight: '600',
  },
});
