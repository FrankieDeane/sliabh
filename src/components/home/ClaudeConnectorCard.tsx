import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Platform, Linking, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLangStore } from '../../store/langStore';

const DOCS_URL = 'https://sliabh.com.ar/claude/';
const ICON_URI = 'https://sliabh.com.ar/mcp-icon-128.png';

/**
 * Anuncio fijo en la home: Sliabh como conector de Claude (MCP en
 * sliabh.com.ar/mcp). Es parte del layout desde el primer render — no aparece
 * tarde ni empuja contenido, así que no suma CLS ni cuenta como interrupción.
 * Lleva a /claude/, la guía para conectarlo (página estática, fuera del SPA).
 */
export function ClaudeConnectorCard({ c }: { c: { surface: string; border: string; text: string; muted: string } }) {
  const { t } = useLangStore();
  const { width } = useWindowDimensions();
  const narrow = width < 640;

  const open = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') window.location.assign('/claude/');
    else Linking.openURL(DOCS_URL).catch(() => {});
  };

  return (
    <View style={[styles.card, narrow && styles.cardNarrow, { backgroundColor: c.surface, borderColor: c.border }]}>
      <Image
        source={{ uri: ICON_URI }}
        style={styles.logo}
        accessibilityLabel={t('Escudo de Sliabh', 'Sliabh crest')}
      />
      <View style={styles.body}>
        <View style={styles.badge}>
          <Ionicons name="sparkles" size={11} color="#04210f" />
          <Text style={styles.badgeTxt}>{t('NUEVO', 'NEW')}</Text>
        </View>
        <Text style={[styles.title, { color: c.text }]}>
          {t('Sliabh ahora está en Claude', 'Sliabh is now on Claude')}
        </Text>
        <Text style={[styles.desc, { color: c.muted }]}>
          {t(
            'Preguntale a Claude por las rutas de los 39 parques nacionales: “¿qué trekking fácil hay cerca de Bariloche?”. Gratis, sin cuenta.',
            'Ask Claude about trails in Argentina’s 39 national parks: “any easy hikes near Bariloche?”. Free, no account needed.',
          )}
        </Text>
      </View>
      <TouchableOpacity
        onPress={open}
        activeOpacity={0.85}
        accessibilityRole="link"
        accessibilityLabel={t('Cómo conectar Sliabh en Claude', 'How to connect Sliabh in Claude')}
        style={[styles.cta, narrow && styles.ctaNarrow]}
        {...(Platform.OS === 'web' ? ({ href: '/claude/' } as any) : {})}
      >
        <Text style={styles.ctaTxt}>{t('Conectar en Claude', 'Connect in Claude')}</Text>
        <Ionicons name="arrow-forward" size={15} color="#04210f" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  cardNarrow: { flexWrap: 'wrap', gap: 12 },
  logo: { width: 56, height: 56, borderRadius: 28 },
  body: { flex: 1, minWidth: 200, gap: 4 },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#22c55e',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeTxt: { color: '#04210f', fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
  title: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  desc: { fontSize: 13, lineHeight: 19 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#22c55e',
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 11,
    minHeight: 44,
  },
  ctaNarrow: { width: '100%' },
  ctaTxt: { color: '#04210f', fontSize: 14, fontWeight: '800' },
});
