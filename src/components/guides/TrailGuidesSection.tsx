import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeStore } from '../../store/themeStore';
import type { Guide } from '../../services/supabase';

/**
 * Per-trail guide listing, embedded near the bottom of each ruta/[id] page
 * (see OverviewTab). Anchored with id="guias-sendero" so the hero's "Ver
 * guías" button can scroll straight to it. `guides` is fetched once by the
 * parent screen (not re-fetched per render) — see TrailDetailScreen.
 */
export function TrailGuidesSection({
  guides,
  t,
}: {
  guides: Guide[];
  t: (es: string, en: string) => string;
}) {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const router = useRouter();

  const c = isDark
    ? { surface: '#0f1724', surface2: '#162035', border: '#1e2d42', text: '#f0f9ff', muted: '#8ea0b8', accent: '#22c55e', accentInk: '#052e16' }
    : { surface: '#ffffff', surface2: '#f1f5f9', border: '#e2e8f0', text: '#0f172a', muted: '#475569', accent: '#16a34a', accentInk: '#ffffff' };

  return (
    <View {...({ id: 'guias-sendero' } as any)} style={[styles.wrap, { borderColor: c.border, backgroundColor: c.surface }]}>
      <View style={styles.header}>
        <Ionicons name="compass-outline" size={18} color={c.accent} />
        <Text style={[styles.title, { color: c.text }]}>
          {guides.length > 0
            ? t(`Guías expertos en este sendero (${guides.length})`, `Expert guides for this trail (${guides.length})`)
            : t('Guías expertos en este sendero', 'Expert guides for this trail')}
        </Text>
      </View>

      {guides.length === 0 ? (
        <Text style={[styles.emptyTxt, { color: c.muted }]}>
          {t('Todavía no hay guías publicados para este sendero.', 'No guides published for this trail yet.')}
        </Text>
      ) : (
        <View style={styles.grid}>
          {guides.map((g) => <GuideCard key={g.id} guide={g} c={c} t={t} />)}
        </View>
      )}

      <TouchableOpacity onPress={() => router.push('/(tabs)/guias' as any)} style={[styles.cta, { borderColor: c.accent }]}>
        <Text style={[styles.ctaTxt, { color: c.accent }]}>
          {t('¿Sos guía de este sendero? Publicá tu perfil →', 'Are you a guide for this trail? List your profile →')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function GuideCard({ guide, c, t }: { guide: Guide; c: any; t: (es: string, en: string) => string }) {
  const link = guide.website || (guide.instagram ? `https://instagram.com/${guide.instagram.replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//, '')}` : null);
  return (
    <View style={[styles.card, { borderColor: c.border, backgroundColor: c.surface2 }]}>
      <View style={styles.cardHead}>
        {guide.photo_url ? (
          <Image source={{ uri: guide.photo_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: c.border }]}>
            <Ionicons name="person" size={20} color={c.muted} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={[styles.guideName, { color: c.text }]}>{guide.full_name}</Text>
          {guide.certification && <Text style={[styles.guideCert, { color: c.muted }]}>{guide.certification}</Text>}
        </View>
      </View>
      {guide.specialties && <Text style={[styles.guideSpec, { color: c.text }]}>{guide.specialties}</Text>}
      {guide.bio && <Text style={[styles.guideBio, { color: c.muted }]} numberOfLines={4}>{guide.bio}</Text>}
      {link && (
        <TouchableOpacity onPress={() => Linking.openURL(link)} style={styles.guideLinkRow}>
          <Ionicons name="link-outline" size={13} color={c.accent} />
          <Text style={[styles.guideLinkTxt, { color: c.accent }]}>{t('Ver contacto', 'View contact')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { borderWidth: 1, borderRadius: 18, padding: 20, marginTop: 24 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  title: { fontSize: 16, fontWeight: '800' },
  emptyTxt: { fontSize: 13.5, lineHeight: 20, marginBottom: 16 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  card: { width: Platform.OS === 'web' ? 260 : '100%', maxWidth: '100%', borderWidth: 1, borderRadius: 14, padding: 14, gap: 6 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  guideName: { fontSize: 14.5, fontWeight: '800' },
  guideCert: { fontSize: 11, fontWeight: '600', marginTop: 1 },
  guideSpec: { fontSize: 12.5, lineHeight: 18 },
  guideBio: { fontSize: 12, lineHeight: 17 },
  guideLinkRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  guideLinkTxt: { fontSize: 12, fontWeight: '700' },

  cta: { borderWidth: 1.5, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  ctaTxt: { fontSize: 13, fontWeight: '800' },
});
