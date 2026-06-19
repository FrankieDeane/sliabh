import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useLangStore } from '../../store/langStore';

const CONSENT_KEY = 'sliabh-cookie-consent';

export function CookieBanner() {
  const { theme } = useThemeStore();
  const { t } = useLangStore();
  const isDark = theme === 'dark';
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    try {
      const val = localStorage.getItem(CONSENT_KEY);
      if (!val) setVisible(true);
    } catch {
      // localStorage unavailable
    }
  }, []);

  function accept() {
    try { localStorage.setItem(CONSENT_KEY, 'accepted'); } catch {}
    setVisible(false);
  }

  function dismiss() {
    try { localStorage.setItem(CONSENT_KEY, 'dismissed'); } catch {}
    setVisible(false);
  }

  if (!visible) return null;

  const c = isDark
    ? { bg: '#0f1724', border: '#1e2d42', text: '#f0f9ff', muted: '#94a3b8' }
    : { bg: '#1e293b', border: '#334155', text: '#f8fafc', muted: '#94a3b8' };

  return (
    <View style={[styles.bar, { backgroundColor: c.bg, borderTopColor: c.border }]}>
      <View style={styles.inner}>
        <View style={styles.textWrap}>
          <Ionicons name="shield-checkmark-outline" size={16} color="#22c55e" style={{ flexShrink: 0 }} />
          <Text style={[styles.txt, { color: c.muted }]}>
            {t(
              'Usamos almacenamiento local (localStorage, Cache API) para mapas offline, preferencias y sesión. No usamos cookies de rastreo de terceros.',
              'We use local storage (localStorage, Cache API) for offline maps, preferences and session. We do not use third-party tracking cookies.',
            )}
          </Text>
        </View>
        <View style={styles.btns}>
          <TouchableOpacity style={styles.btnAccept} onPress={accept} activeOpacity={0.8}>
            <Text style={styles.btnAcceptTxt}>{t('Acepto', 'Accept')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnDismiss} onPress={dismiss} activeOpacity={0.8}>
            <Ionicons name="close" size={16} color={c.muted} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'fixed' as any,
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    zIndex: 9999,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
    flexWrap: 'wrap' as any,
  },
  textWrap: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, flex: 1, minWidth: 220 },
  txt: { fontSize: 12, lineHeight: 18, flex: 1 },
  btns: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 },
  btnAccept: {
    backgroundColor: '#16a34a', borderRadius: 999,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  btnAcceptTxt: { color: '#fff', fontSize: 12, fontWeight: '700' },
  btnDismiss: {
    padding: 6, borderRadius: 999,
    borderWidth: 1, borderColor: '#334155',
  },
});
