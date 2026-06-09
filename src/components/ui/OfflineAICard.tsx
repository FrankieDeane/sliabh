import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { useLangStore } from '../../store/langStore';

const PILLS_ES = ['Consultas', 'Rutas', 'Seguridad'];
const PILLS_EN = ['Queries', 'Routes', 'Safety'];

export function OfflineAICard() {
  const { isDark } = useTheme();
  const { lang, t } = useLangStore();
  const router = useRouter();
  const isWeb = Platform.OS === 'web';

  const titleColor = isDark ? '#f0f9ff' : '#0f172a';
  const pills = lang === 'es' ? PILLS_ES : PILLS_EN;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={() => router.push('/(tabs)/asistente')}
      accessibilityRole="button"
      accessibilityLabel={t('Abrir asistente IA', 'Open AI assistant')}
      {...(Platform.OS === 'web' ? ({ 'data-interactive-card': true } as any) : {})}
    >
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Ionicons name="sparkles" size={20} color="#22c55e" />
        </View>
        <View style={styles.textBlock}>
          <Text style={[styles.title, { color: titleColor }]}>
            {isWeb
              ? t('Asistente IA con Claude', 'AI Assistant with Claude')
              : t('IA disponible sin internet', 'AI available offline')}
          </Text>
          <Text style={styles.subtitle}>
            {isWeb
              ? t('Claude · Nube · Requiere conexión', 'Claude · Cloud · Requires connection')
              : t('Gemma 3 · Modelo local · Sin límites', 'Gemma 3 · Local model · No limits')}
          </Text>
        </View>
        <View style={styles.chevron}>
          <Ionicons name="arrow-forward" size={16} color="#22c55e" />
        </View>
      </View>

      <View style={styles.pillRow}>
        {pills.map((pill) => (
          <View key={pill} style={styles.pill}>
            <Text style={styles.pillText}>{pill}</Text>
          </View>
        ))}
        <View style={[styles.pill, styles.pillCta]}>
          <Text style={[styles.pillText, styles.pillCtaText]}>
            {t('Preguntar ahora →', 'Ask now →')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.3)',
    backgroundColor: '#0f1f12',
    padding: 16,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(22,163,74,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(22,163,74,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
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
  chevron: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(34,197,94,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pill: {
    backgroundColor: 'rgba(22,163,74,0.15)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(22,163,74,0.2)',
  },
  pillText: {
    color: '#4ade80',
    fontSize: 11,
    fontWeight: '600',
  },
  pillCta: {
    backgroundColor: 'rgba(22,163,74,0.25)',
    borderColor: 'rgba(22,163,74,0.4)',
  },
  pillCtaText: {
    color: '#22c55e',
    fontWeight: '700',
  },
});
