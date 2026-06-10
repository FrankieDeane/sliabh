import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';

const STORAGE_KEY = 'sliabh_cookie_consent';

function getConsent(): string | null {
  if (Platform.OS !== 'web' || typeof localStorage === 'undefined') return 'accepted';
  return localStorage.getItem(STORAGE_KEY);
}

function setConsent(value: 'accepted' | 'rejected') {
  if (Platform.OS !== 'web' || typeof localStorage === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, value);
}

export function CookieBanner() {
  const isDark = useThemeStore((s) => s.theme === 'dark');
  const [visible, setVisible] = useState(false);
  const slideAnim = React.useRef(new Animated.Value(120)).current;

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const consent = getConsent();
    if (!consent) {
      // Small delay so it doesn't flash on page load
      const timer = setTimeout(() => {
        setVisible(true);
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 60,
          friction: 12,
          useNativeDriver: true,
        }).start();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  function dismiss(choice: 'accepted' | 'rejected') {
    setConsent(choice);
    Animated.timing(slideAnim, {
      toValue: 120,
      duration: 280,
      useNativeDriver: true,
    }).start(() => setVisible(false));
  }

  if (!visible) return null;

  const c = isDark
    ? { bg: '#0f1724', border: '#1e2d42', text: '#f0f9ff', muted: '#64748b' }
    : { bg: '#ffffff', border: '#e2e8f0', text: '#0f172a', muted: '#64748b' };

  return (
    <Animated.View
      style={[styles.wrapper, { transform: [{ translateY: slideAnim }] }]}
    >
      <View style={[styles.banner, { backgroundColor: c.bg, borderColor: c.border }]}>
        <View style={styles.left}>
          <View style={styles.iconWrap}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#22c55e" />
          </View>
          <View style={styles.textBlock}>
            <Text style={[styles.title, { color: c.text }]}>
              Usamos cookies
            </Text>
            <Text style={[styles.body, { color: c.muted }]}>
              Guardamos preferencias de tema e idioma en tu navegador. No rastreamos tu actividad ni compartimos datos con terceros.{' '}
              <Text style={styles.link}>Política de privacidad</Text>
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.btnReject, { borderColor: c.border }]}
            onPress={() => dismiss('rejected')}
            activeOpacity={0.75}
          >
            <Text style={[styles.btnRejectTxt, { color: c.muted }]}>Rechazar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btnAccept}
            onPress={() => dismiss('accepted')}
            activeOpacity={0.85}
          >
            <Text style={styles.btnAcceptTxt}>Aceptar</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.close}
          onPress={() => dismiss('rejected')}
          activeOpacity={0.7}
          hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
        >
          <Ionicons name="close" size={16} color={c.muted} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute' as any,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  banner: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    flexDirection: 'row' as any,
    alignItems: 'flex-start' as any,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    maxWidth: 760,
    alignSelf: 'center' as any,
    width: '100%' as any,
  },
  left: {
    flex: 1,
    flexDirection: 'row' as any,
    gap: 12,
    alignItems: 'flex-start' as any,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.25)',
    alignItems: 'center' as any,
    justifyContent: 'center' as any,
    flexShrink: 0,
  },
  textBlock: { flex: 1 },
  title: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
  },
  body: {
    fontSize: 12,
    lineHeight: 18,
  },
  link: {
    color: '#22c55e',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row' as any,
    gap: 8,
    alignItems: 'center' as any,
    flexShrink: 0,
  },
  btnReject: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  btnRejectTxt: {
    fontSize: 12,
    fontWeight: '600',
  },
  btnAccept: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: '#16a34a',
  },
  btnAcceptTxt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  close: {
    width: 24,
    height: 24,
    alignItems: 'center' as any,
    justifyContent: 'center' as any,
    flexShrink: 0,
    marginTop: 2,
  },
});
