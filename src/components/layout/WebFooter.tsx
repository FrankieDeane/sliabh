import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { LOGO_URI } from '../../constants/logo';

const MAX_CONTENT = 1200;

const REGION_LINKS = [
  { label: 'Patagonia Sur', region: 'Patagonia Sur' },
  { label: 'Patagonia Norte', region: 'Patagonia Norte' },
  { label: 'Cuyo & Aconcagua', region: 'Cuyo' },
  { label: 'Norte (NOA)', region: 'Norte' },
  { label: 'Sierras Centrales', region: 'Sierras Centrales' },
  { label: 'Litoral', region: 'Litoral' },
];

const PREPARAR_LINKS = [
  { label: 'Mapas offline', href: '/(tabs)/mapas' as const },
  { label: 'Planificar ruta', href: '/(tabs)/planificar' as const },
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
        <View style={[styles.top, isWide ? styles.topWide : styles.topNarrow]}>

          {/* Brand column */}
          <View style={styles.brandCol}>
            <TouchableOpacity style={styles.brand} onPress={() => router.push('/(tabs)/inicio')} activeOpacity={0.8}>
              <Image source={{ uri: LOGO_URI }} style={styles.logo} />
              <View>
                <Text style={[styles.brandName, { color: c.text }]}>Sliabh</Text>
                <Text style={[styles.brandSub, { color: c.muted }]}>Argaelic</Text>
              </View>
            </TouchableOpacity>
            <Text style={[styles.tagline, { color: c.muted }]}>
              La plataforma de senderismo{'\n'}para explorar Argentina.{'\n'}Funciona con y sin señal.
            </Text>
            <View style={[styles.emergencyBadge, { borderColor: c.border }]}>
              <Ionicons name="call-outline" size={12} color="#ef4444" />
              <Text style={[styles.emergencyTxt, { color: c.muted }]}>Emergencias APN: 105</Text>
            </View>
          </View>

          {/* Explorar column */}
          <View style={styles.navCol}>
            <Text style={[styles.navTitle, { color: c.muted }]}>EXPLORAR</Text>
            <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/rutas')} activeOpacity={0.7}>
              <Ionicons name="chevron-forward" size={11} color="#22c55e" />
              <Text style={[styles.navLabel, { color: c.muted }]}>Todas las rutas</Text>
            </TouchableOpacity>
            {REGION_LINKS.map((r) => (
              <TouchableOpacity
                key={r.region}
                style={styles.navItem}
                onPress={() => router.push({ pathname: '/(tabs)/rutas', params: { region: r.region } } as any)}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-forward" size={11} color="#22c55e" />
                <Text style={[styles.navLabel, { color: c.muted }]}>{r.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Preparar column */}
          <View style={styles.navCol}>
            <Text style={[styles.navTitle, { color: c.muted }]}>PREPARAR</Text>
            {PREPARAR_LINKS.map((n) => (
              <TouchableOpacity key={n.label} style={styles.navItem} onPress={() => router.push(n.href)} activeOpacity={0.7}>
                <Ionicons name="chevron-forward" size={11} color="#22c55e" />
                <Text style={[styles.navLabel, { color: c.muted }]}>{n.label}</Text>
              </TouchableOpacity>
            ))}
            <View style={[styles.infoCard, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Text style={[styles.infoCardTxt, { color: c.muted }]}>
                <Text style={{ color: '#22c55e', fontStyle: 'italic' }}>Sliabh</Text> es gaélico para{' '}
                <Text style={{ color: '#22c55e' }}>"montaña"</Text>.
              </Text>
            </View>
          </View>

        </View>

        <View style={[styles.divider, { backgroundColor: c.border }]} />

        <View style={[styles.bottom, isWide ? styles.bottomWide : null]}>
          <Text style={[styles.copy, { color: c.muted }]}>
            © 2026 <Text style={{ color: '#22c55e', fontWeight: '700' }}>Sliabh Argaelic</Text> — Argentina
          </Text>
          <View style={styles.copyRight}>
            <Ionicons name="leaf-outline" size={12} color="#22c55e" />
            <Text style={[styles.copySmall, { color: c.muted }]}>Hecho para exploradores de montaña</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: { width: '100%', borderTopWidth: 1 },
  inner: { paddingTop: 48, paddingBottom: 28 },
  top: { gap: 32, marginBottom: 32 },
  topWide: { flexDirection: 'row', alignItems: 'flex-start' },
  topNarrow: { flexDirection: 'column' },
  brandCol: { flex: 1.6, gap: 14 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 44, height: 44, borderRadius: 22 },
  brandName: { fontSize: 18, fontWeight: '800', letterSpacing: -0.4 },
  brandSub: { fontSize: 9, fontWeight: '600', letterSpacing: 2.5, textTransform: 'uppercase' },
  tagline: { fontSize: 13, lineHeight: 20 },
  emergencyBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  emergencyTxt: { fontSize: 11, fontWeight: '600' },
  navCol: { flex: 1, gap: 10 },
  navTitle: { fontSize: 9, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 },
  navItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  navLabel: { fontSize: 13, fontWeight: '500' },
  infoCard: {
    marginTop: 8, borderRadius: 10, borderWidth: 1,
    paddingHorizontal: 10, paddingVertical: 8,
  },
  infoCardTxt: { fontSize: 11, lineHeight: 17 },
  divider: { height: 1, marginBottom: 20 },
  bottom: { gap: 8 },
  bottomWide: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  copy: { fontSize: 12, lineHeight: 18 },
  copyRight: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  copySmall: { fontSize: 11 },
});
