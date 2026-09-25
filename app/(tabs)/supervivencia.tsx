import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { useLangStore } from '../../src/store/langStore';
import { WebFooter } from '../../src/components/layout/WebFooter';
import { SeoHead } from '../../src/components/ui/SeoHead';
import { coreSeo } from '../../src/data/coreSeo';
import {
  GUIDES,
  survivalJsonLd,
  SURVIVAL_KEYWORDS_ES,
  SURVIVAL_KEYWORDS_EN,
  type Guide,
} from '../../src/data/survivalGuides';

const MAX_CONTENT = 860;

function GuideCard({ guide, c, t, expanded, onToggle }: {
  guide: Guide;
  c: any;
  t: (es: string, en: string) => string;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: c.surface, borderColor: expanded ? guide.color + '55' : c.border }]}
      activeOpacity={0.88}
      onPress={onToggle}
      {...(Platform.OS === 'web' ? ({ 'data-interactive-card': true } as any) : {})}
    >
      {/* Photo banner */}
      <View style={styles.cardPhoto}>
        {Platform.OS === 'web' && (
          // @ts-ignore
          <img
            src={guide.photo}
            alt=""
            loading="lazy"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
        <View style={styles.cardPhotoOverlay} />
        <View style={[styles.cardIcon, { backgroundColor: guide.color + 'E6' }]}>
          <Ionicons name={guide.icon} size={22} color="#fff" />
        </View>
        <View style={styles.cardPhotoText}>
          <Text style={styles.cardTitle}>{t(guide.titleEs, guide.titleEn)}</Text>
          <Text style={styles.cardTagline}>{t(guide.taglineEs, guide.taglineEn)}</Text>
        </View>
        <View style={styles.cardChevron}>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color="#fff" />
        </View>
      </View>

      {/* Quick bullets — always visible */}
      <View style={styles.quickList}>
        {(t(guide.quickEs.join('||'), guide.quickEn.join('||')).split('||')).map((line, i) => (
          <View key={i} style={styles.quickItem}>
            <View style={[styles.quickDot, { backgroundColor: guide.color }]} />
            <Text style={[styles.quickTxt, { color: c.text }]}>{line}</Text>
          </View>
        ))}
      </View>

      {/* Expanded body */}
      {expanded && (
        <View style={styles.expandedBody}>
          <View style={[styles.bodyDivider, { backgroundColor: c.border }]} />
          <Text style={[styles.bodyTxt, { color: c.muted }]}>
            {t(guide.bodyEs, guide.bodyEn)}
          </Text>
          {(guide.warningEs || guide.warningEn) && (
            <View style={styles.warningBox}>
              <Ionicons name="warning-outline" size={14} color="#f59e0b" />
              <Text style={styles.warningTxt}>
                {t(guide.warningEs ?? '', guide.warningEn ?? '')}
              </Text>
            </View>
          )}
          <View style={styles.disclaimerRow}>
            <Ionicons name="information-circle-outline" size={13} color={c.muted} />
            <Text style={[styles.disclaimerTxt, { color: c.muted }]}>
              {t(
                'Este contenido no reemplaza formación ni guías habilitados. Registrá tu trekking en la intendencia.',
                'This content does not replace training or licensed guides. Register your trek at the ranger station.',
              )}
            </Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function SupervivenciaScreen() {
  const { isDark } = useTheme();
  const { t, lang } = useLangStore();
  const { width } = useWindowDimensions();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const contentW = Math.min(width, MAX_CONTENT);
  const sidePad = Math.max(16, (width - contentW) / 2);

  const c = isDark
    ? { bg: '#070b14', surface: '#0f1724', elevated: '#162035', border: '#1e2d42', text: '#f0f9ff', muted: '#64748b' }
    : { bg: '#f8fafc', surface: '#ffffff', elevated: '#f1f5f9', border: '#e2e8f0', text: '#0f172a', muted: '#64748b' };

  function toggle(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <SeoHead
          {...coreSeo('supervivencia', lang)}
        keywords={lang === 'en' ? SURVIVAL_KEYWORDS_EN : SURVIVAL_KEYWORDS_ES}
        jsonLd={survivalJsonLd(lang)}
      />

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero band — editorial full-bleed */}
        <View style={[styles.hero, { backgroundColor: '#0a0f1a' }]}>
          {Platform.OS === 'web' && (
            // @ts-ignore
            <img
              src="https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=1920&q=85&fit=crop&auto=format"
              alt=""
              style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                objectFit: 'cover', opacity: 0.45,
              }}
            />
          )}
          <View style={{ paddingHorizontal: sidePad, paddingVertical: 110 }}>
            <Text
              style={styles.heroPillTxt}
              {...(Platform.OS === 'web' ? ({ 'data-eyebrow': true } as any) : {})}
            >
              {t('SEGURIDAD EN MONTAÑA — GUÍAS OFFLINE', 'MOUNTAIN SAFETY — OFFLINE GUIDES')}
            </Text>
            <Text
              accessibilityRole="header"
              style={[
                styles.heroTitle,
                Platform.OS === 'web' ? ({ fontSize: 'clamp(38px, 6vw, 84px)' } as any) : { fontSize: 34 },
              ]}
              {...(Platform.OS === 'web' ? ({ 'data-display-xl': true } as any) : {})}
            >
              {t('Cuando no hay señal,\nhay preparación.', 'When there is no signal,\nthere is preparation.')}
            </Text>
            <Text
              style={styles.heroSub}
              {...(Platform.OS === 'web' ? ({ 'data-serif': true } as any) : {})}
            >
              {t(
                `${GUIDES.length} guías de emergencia, escritas para la montaña argentina.\nUna vez visitadas, funcionan sin conexión.`,
                `${GUIDES.length} emergency guides, written for the Argentine mountains.\nOnce visited, they work without connection.`,
              )}
            </Text>
            <View style={styles.heroStats}>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatNum}>105</Text>
                <Text style={styles.heroStatLbl}>{t('Emergencias APN', 'APN Emergencies')}</Text>
              </View>
              <View style={styles.heroStatDiv} />
              <View style={styles.heroStat}>
                <Text style={styles.heroStatNum}>911</Text>
                <Text style={styles.heroStatLbl}>{t('Policía / SAME', 'Police / SAME')}</Text>
              </View>
              <View style={styles.heroStatDiv} />
              <View style={styles.heroStat}>
                <Text style={styles.heroStatNum}>{GUIDES.length}</Text>
                <Text style={styles.heroStatLbl}>{t('guías offline', 'offline guides')}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Offline notice */}
        <View style={[styles.offlineNotice, { paddingHorizontal: sidePad, backgroundColor: isDark ? '#0f1724' : '#f0fdf4', borderColor: isDark ? '#1e2d42' : '#bbf7d0' }]}>
          <Ionicons name="cloud-offline-outline" size={16} color="#22c55e" />
          <Text style={[styles.offlineNoticeTxt, { color: c.muted }]}>
            {t(
              'Este contenido se guarda en tu navegador. Una vez visitado, estará disponible sin conexión.',
              'This content is saved in your browser. Once visited, it will be available offline.',
            )}
          </Text>
        </View>

        {/* Link to the standalone 3D risk map (static page in public/, web only) */}
        {Platform.OS === 'web' && (
          <View style={{ paddingHorizontal: sidePad, paddingTop: 24 }}>
            <Text
              {...({ href: t('/supervivencia/zonas-seguras', '/en/supervivencia/zonas-seguras') } as any)}
              accessibilityRole="link"
              style={[styles.mapCard, { backgroundColor: c.surface, borderColor: c.border }]}
            >
              <Text style={styles.mapCardEyebrow}>{t('NUEVO · MAPA 3D', 'NEW · 3D MAP')}</Text>
              {'\n'}
              <Text style={[styles.mapCardTitle, { color: c.text }]}>{t('Mapa de zonas seguras de Argentina', 'Safe-areas map of Argentina')}</Text>
              {'\n'}
              <Text style={[styles.mapCardBody, { color: c.muted }]}>
                {t(
                  'Riesgos, refugios y simuladores de explosión nuclear, nube tóxica, ceniza volcánica y terremotos →',
                  'Risks, refuges and simulators for a nuclear blast, toxic cloud, volcanic ash and earthquakes →',
                )}
              </Text>
            </Text>
          </View>
        )}

        {/* Guide cards */}
        <View style={[styles.guides, { paddingHorizontal: sidePad }]}>
          {GUIDES.map((guide) => (
            <GuideCard
              key={guide.id}
              guide={guide}
              c={c}
              t={t}
              expanded={expandedId === guide.id}
              onToggle={() => toggle(guide.id)}
            />
          ))}
        </View>

        {/* Responsible use banner */}
        <View style={[styles.responsibleBanner, { marginHorizontal: sidePad, backgroundColor: c.surface, borderColor: c.border }]}>
          <View style={styles.responsibleIcon}>
            <Ionicons name="leaf-outline" size={20} color="#22c55e" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.responsibleTitle, { color: c.text }]}>
              {t('Uso responsable de los parques', 'Responsible use of national parks')}
            </Text>
            <Text style={[styles.responsibleBody, { color: c.muted }]}>
              {t(
                'Argentina cuenta con 39 parques nacionales. Todos son ecosistemas protegidos. Conocer las normas antes de salir protege tanto al visitante como al ambiente.',
                'Argentina has 39 national parks. All are protected ecosystems. Knowing the rules before you leave protects both the visitor and the environment.',
              )}
            </Text>
          </View>
        </View>

        {Platform.OS === 'web' && <WebFooter />}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 48 },

  // Hero
  hero: { position: 'relative', overflow: 'hidden' },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 20,
  },
  heroPillTxt: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 4,
    marginBottom: 24,
  },
  heroTitle: {
    fontWeight: '400',
    color: '#fff',
    letterSpacing: -1,
    lineHeight: undefined,
    marginBottom: 22,
  },
  heroSub: {
    fontSize: 17,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 27,
    marginBottom: 40,
    fontStyle: 'italic',
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  heroStat: { gap: 2, alignItems: 'center', paddingHorizontal: 12 },
  heroStatNum: { fontSize: 22, fontWeight: '900', color: '#f0f9ff', letterSpacing: -1 },
  heroStatLbl: { fontSize: 10, color: 'rgba(240,249,255,0.45)', fontWeight: '600', letterSpacing: 0.3 },
  heroStatDiv: { width: 1, height: 28, backgroundColor: 'rgba(240,249,255,0.12)' },

  // Offline notice
  offlineNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  offlineNoticeTxt: { fontSize: 12, lineHeight: 18, flex: 1 },

  // Guides
  guides: { gap: 12, paddingTop: 24 },
  mapCard: { display: 'flex' as any, borderWidth: 1, borderRadius: 18, padding: 18, lineHeight: 22 },
  mapCardEyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 2, color: '#22c55e' },
  mapCardTitle: { fontSize: 18, fontWeight: '800', lineHeight: 30 },
  mapCardBody: { fontSize: 13.5, lineHeight: 20 },

  // Card
  card: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    gap: 0,
  },
  cardPhoto: {
    height: 160,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#0f172a',
  },
  cardPhotoOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5,10,20,0.55)',
  },
  cardIcon: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardPhotoText: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    right: 48,
    gap: 3,
  },
  cardChevron: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { fontSize: 17, fontWeight: '700', letterSpacing: -0.3, color: '#fff' },
  cardTagline: { fontSize: 12, lineHeight: 17, color: 'rgba(255,255,255,0.75)' },

  // Quick bullets
  quickList: { gap: 7, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14 },
  quickItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  quickDot: { width: 5, height: 5, borderRadius: 3, marginTop: 7, flexShrink: 0 },
  quickTxt: { fontSize: 13, lineHeight: 19, flex: 1, fontWeight: '500' },

  // Expanded
  expandedBody: { gap: 12 },
  bodyDivider: { height: 1 },
  bodyTxt: { fontSize: 13, lineHeight: 21 },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(245,158,11,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.25)',
    borderRadius: 10,
    padding: 10,
  },
  warningTxt: { color: '#f59e0b', fontSize: 12, lineHeight: 18, flex: 1, fontWeight: '600' },
  disclaimerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  disclaimerTxt: { fontSize: 11, lineHeight: 16, flex: 1, fontStyle: 'italic' },

  // Responsible use
  responsibleBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    marginTop: 24,
    marginBottom: 8,
  },
  responsibleIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(34,197,94,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  responsibleTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  responsibleBody: { fontSize: 12, lineHeight: 19 },
});
