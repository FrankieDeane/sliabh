import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/hooks/useTheme';
import { useLangStore } from '../src/store/langStore';

export default function NotFound() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { t } = useLangStore();

  const bg = isDark ? '#070b14' : '#f8fafc';
  const text = isDark ? '#f0f9ff' : '#0f172a';
  const muted = isDark ? '#64748b' : '#94a3b8';

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <Text style={styles.emoji}>⛰️</Text>
      <Text style={[styles.title, { color: text }]}>
        {t('Página no encontrada', 'Page not found')}
      </Text>
      <Text style={[styles.sub, { color: muted }]}>
        {t(
          'Esta ruta no existe o no está disponible sin conexión.',
          'This route does not exist or is not available offline.',
        )}
      </Text>
      <TouchableOpacity
        style={styles.btn}
        onPress={() => router.replace('/(tabs)/inicio')}
        activeOpacity={0.85}
      >
        <Ionicons name="home-outline" size={16} color="#fff" />
        <Text style={styles.btnTxt}>{t('Ir al inicio', 'Go home')}</Text>
      </TouchableOpacity>
      {Platform.OS === 'web' && (
        <TouchableOpacity
          style={[styles.btn, styles.btnSecondary]}
          onPress={() => router.replace('/(tabs)/mis-recorridos')}
          activeOpacity={0.85}
        >
          <Ionicons name="footsteps-outline" size={16} color="#22c55e" />
          <Text style={[styles.btnTxt, { color: '#22c55e' }]}>
            {t('Mis recorridos', 'My hikes')}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  emoji: { fontSize: 52 },
  title: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  sub: { fontSize: 13, textAlign: 'center', maxWidth: 300, lineHeight: 19 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#16a34a',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 999,
    marginTop: 4,
  },
  btnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#22c55e',
  },
  btnTxt: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
