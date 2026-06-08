import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { LOGO_URI } from '../../constants/logo';

if (Platform.OS !== 'web') {
  // This component must never render on native — bail early.
  module.exports = { WebHeader: () => null };
}

const NAV = [
  { label: 'Inicio', href: '/(tabs)/inicio' as const },
  { label: 'Rutas', href: '/(tabs)/rutas' as const },
  { label: 'Mapas', href: '/(tabs)/mapas' as const },
  { label: 'Planificar', href: '/(tabs)/planificar' as const },
  { label: 'IA', href: '/(tabs)/asistente' as const },
];

const MAX_CONTENT = 1200;

export function WebHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useAuthStore();
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const { width } = useWindowDimensions();

  const c = isDark
    ? { bg: '#070b14', border: '#1e2d42', text: '#f0f9ff', muted: '#64748b', surface: '#0f1724' }
    : { bg: '#ffffff', border: '#e2e8f0', text: '#0f172a', muted: '#64748b', surface: '#f8fafc' };

  const contentW = Math.min(width, MAX_CONTENT);
  const sidePad = Math.max(16, (width - contentW) / 2);
  const isCompact = width < 720;

  return (
    <View style={[styles.bar, { backgroundColor: c.bg, borderBottomColor: c.border }]}>
      <View style={[styles.inner, { paddingHorizontal: sidePad }]}>
        {/* Logo + wordmark */}
        <TouchableOpacity
          style={styles.brand}
          onPress={() => router.push('/(tabs)/inicio')}
          activeOpacity={0.8}
        >
          <Image source={{ uri: LOGO_URI }} style={styles.logo} />
          {!isCompact && (
            <View>
              <Text style={[styles.brandName, { color: c.text }]}>Sliabh</Text>
              <Text style={[styles.brandSub, { color: c.muted }]}>Argaelic</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Nav links (hidden on very small screens) */}
        {!isCompact && (
          <View style={styles.nav}>
            {NAV.map((n) => {
              const active = pathname.includes(n.href.replace('/(tabs)', ''));
              return (
                <TouchableOpacity
                  key={n.href}
                  onPress={() => router.push(n.href)}
                  style={styles.navItem}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.navLabel,
                      { color: active ? '#22c55e' : c.muted },
                    ]}
                  >
                    {n.label}
                  </Text>
                  {active && <View style={styles.navDot} />}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Right: login / user */}
        <View style={styles.right}>
          {user ? (
            <View style={styles.userRow}>
              {!isCompact && (
                <Text style={[styles.userName, { color: c.muted }]} numberOfLines={1}>
                  {user.display_name ?? user.email.split('@')[0]}
                </Text>
              )}
              <TouchableOpacity
                onPress={signOut}
                style={[styles.loginBtn, { borderColor: c.border }]}
                activeOpacity={0.8}
              >
                <Ionicons name="log-out-outline" size={15} color={c.muted} />
                {!isCompact && <Text style={[styles.loginBtnTxt, { color: c.muted }]}>Salir</Text>}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={() => router.push('/(auth)/login')}
              activeOpacity={0.85}
            >
              <Ionicons name="person-outline" size={15} color="#22c55e" />
              <Text style={styles.loginBtnTxt}>Iniciar sesión</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    width: '100%',
    borderBottomWidth: 1,
    zIndex: 100,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 58,
    gap: 24,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  brandName: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
    lineHeight: 18,
  },
  brandSub: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  nav: {
    flexDirection: 'row',
    flex: 1,
    gap: 4,
    justifyContent: 'center',
  },
  navItem: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 3,
  },
  navLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  navDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#22c55e',
  },
  right: {
    flexShrink: 0,
    marginLeft: 'auto',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  userName: {
    fontSize: 13,
    fontWeight: '500',
    maxWidth: 120,
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.5)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  loginBtnTxt: {
    fontSize: 13,
    fontWeight: '700',
    color: '#22c55e',
  },
});
