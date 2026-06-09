import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { LOGO_URI } from '../../constants/logo';

const MAX_CONTENT = 1200;

const MAIN_NAV = [
  { label: 'Inicio', href: '/(tabs)/inicio' as const },
  { label: 'Rutas Argentina', href: '/(tabs)/rutas' as const },
  { label: 'Mapas', href: '/(tabs)/mapas' as const },
  { label: 'Planificar', href: '/(tabs)/planificar' as const },
  { label: 'Asistente IA', href: '/(tabs)/asistente' as const },
  { label: 'Contribuir', href: '/(tabs)/contribuir' as const },
];

export function WebFooter() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const { width } = useWindowDimensions();

  const c = isDark
    ? { bg: '#040810', surface: '#070b14', border: '#1e2d42', text: '#f0f9ff', muted: '#64748b' }
    : { bg: '#f1f5f9', surface: '#e2e8f0', border: '#cbd5e1', text: '#0f172a', muted: '#64748b' };

  const contentW = Math.min(width, MAX_CONTENT);
  const sidePad = Math.max(20, (width - contentW) / 2);
  const isWide = width >= 720;

  return (
    <View style={[styles.footer, { backgroundColor: c.bg, borderTopColor: c.border }]}>
      <View style={[styles.inner, { paddingHorizontal: sidePad }]}>

        {/* Top section */}
        <View style={[styles.top, isWide ? styles.topWide : styles.topNarrow]}>

          {/* Brand column */}
          <View style={styles.brandCol}>
            <TouchableOpacity
              style={styles.brand}
              onPress={() => router.push('/(tabs)/inicio')}
              activeOpacity={0.8}
            >
              <Image source={{ uri: LOGO_URI }} style={styles.logo} />
              <View>
                <Text style={[styles.brandName, { color: c.text }]}>Sliabh</Text>
                <Text style={[styles.brandSub, { color: c.muted }]}>Argaelic</Text>
              </View>
            </TouchableOpacity>
            <Text style={[styles.tagline, { color: c.muted }]}>
              Explora la montaña con IA.{'\n'}Rutas, mapas y planificación para{'\n'}Patagonia y toda Argentina.
            </Text>
          </View>

          {/* Nav links */}
          <View style={styles.navCol}>
            <Text style={[styles.navTitle, { color: c.muted }]}>MENÚ PRINCIPAL</Text>
            {MAIN_NAV.map((n) => (
              <TouchableOpacity
                key={n.href}
                onPress={() => router.push(n.href)}
                style={styles.navItem}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-forward" size={11} color="#22c55e" />
                <Text style={[styles.navLabel, { color: c.muted }]}>{n.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Info column */}
          <View style={styles.navCol}>
            <Text style={[styles.navTitle, { color: c.muted }]}>SOBRE EL PROYECTO</Text>
            <Text style={[styles.infoText, { color: c.muted }]}>
              Sliabh es gaélico para{' '}
              <Text style={{ color: '#22c55e', fontStyle: 'italic' }}>"montaña"</Text>.
            </Text>
            <Text style={[styles.infoText, { color: c.muted, marginTop: 8 }]}>
              IA local con Ollama + Gemma.{'\n'}Funciona sin señal de red.
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View style={[styles.divider, { backgroundColor: c.border }]} />

        {/* Bottom copyright */}
        <View style={[styles.bottom, isWide ? styles.bottomWide : null]}>
          <Text style={[styles.copy, { color: c.muted }]}>
            © 2026 <Text style={{ color: '#22c55e', fontWeight: '700' }}>Sliabh Argaelic Team</Text>
          </Text>
          <View style={styles.copyRight}>
            <Ionicons name="leaf-outline" size={12} color="#22c55e" />
            <Text style={[styles.copySmall, { color: c.muted }]}>
              Hecho con ❤ para exploradores de montaña
            </Text>
          </View>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    width: '100%',
    borderTopWidth: 1,
  },
  inner: {
    paddingTop: 40,
    paddingBottom: 24,
  },

  // Top section
  top: { gap: 32, marginBottom: 32 },
  topWide: { flexDirection: 'row', alignItems: 'flex-start' },
  topNarrow: { flexDirection: 'column' },

  // Brand
  brandCol: { flex: 1.4, gap: 14 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 44, height: 44, borderRadius: 22 },
  brandName: { fontSize: 18, fontWeight: '800', letterSpacing: -0.4 },
  brandSub: { fontSize: 9, fontWeight: '600', letterSpacing: 2.5, textTransform: 'uppercase' },
  tagline: { fontSize: 13, lineHeight: 20 },

  // Nav columns
  navCol: { flex: 1, gap: 10 },
  navTitle: { fontSize: 9, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 },
  navItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  navLabel: { fontSize: 13, fontWeight: '500' },

  // Info column
  infoText: { fontSize: 12, lineHeight: 19 },
  clanCard: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, marginTop: 12,
  },
  clanText: { fontSize: 11, fontWeight: '500' },

  // Bottom
  divider: { height: 1, marginBottom: 20 },
  bottom: { gap: 8 },
  bottomWide: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  copy: { fontSize: 12, lineHeight: 18 },
  copyRight: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  copySmall: { fontSize: 11 },
});
