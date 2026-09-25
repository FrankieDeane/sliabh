import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { useLangStore } from '../../store/langStore';
import { regionMeta } from '../../data/hubs';
import { hubSeo } from '../../utils/hubSeo';
import { TrailListCard } from '../trails/TrailCard';
import { SeoHead, NoIndex } from '../ui/SeoHead';
import { WebFooter } from '../layout/WebFooter';

const MAX_CONTENT = 900;

// react-native-web renders accessibilityRole="header" as <h1> unless told the level.
const H2 = { 'aria-level': 2 } as any;
const H3 = { 'aria-level': 3 } as any;

interface HubScreenProps {
  kind: 'region' | 'park';
  slug: string;
}

/**
 * Shared screen for the two "hub" page types between the homepage and a
 * trail page: /region/<slug> and /parque/<slug>. See src/data/hubs.ts for
 * why they exist; every tag and all the copy come from src/utils/hubSeo.ts,
 * which scripts/prerender-hubs.mjs also uses for the static HTML.
 */
export function HubScreen({ kind, slug }: HubScreenProps) {
  const { isDark } = useTheme();
  const { t, lang } = useLangStore();
  // Same palette /rutas passes to TrailListCard.
  const c = isDark
    ? { bg: '#070b14', surface: '#0f1724', elevated: '#162035', border: '#1e2d42', text: '#f0f9ff', muted: '#64748b' }
    : { bg: '#f8fafc', surface: '#ffffff', elevated: '#f1f5f9', border: '#e2e8f0', text: '#0f172a', muted: '#64748b' };

  const seo = hubSeo(kind, slug, lang);

  if (!seo) {
    return (
      <View style={[styles.container, { backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center', padding: 32 }]}>
        <NoIndex />
        <Text style={{ color: c.text, fontSize: 16, fontWeight: '700', textAlign: 'center' }}>
          {t('No encontramos esta página', "We couldn't find this page")}
        </Text>
        <Link href="/rutas" asChild>
          <TouchableOpacity style={{ marginTop: 16 }}>
            <Text style={{ color: '#22c55e', fontWeight: '700' }}>{t('Ver todas las rutas', 'See all trails')}</Text>
          </TouchableOpacity>
        </Link>
      </View>
    );
  }

  const { name, intro, region, park, trails, childParks, faqs } = seo;
  const provinces = [...new Set(trails.map((tr) => tr.province))];
  const parentRegion = park ? regionMeta(park.region) : undefined;

  // Real <a href> links (expo-router Link) so crawlers follow them, in the
  // page's own language.
  const prefix = lang === 'en' ? '/en' : '';

  return (
    <ScrollView style={[styles.container, { backgroundColor: c.bg }]} contentContainerStyle={{ flexGrow: 1 }}>
      <SeoHead
        title={seo.title}
        description={seo.description}
        path={seo.path}
        image={seo.image}
        jsonLd={seo.jsonLd}
        keywords={seo.keywords}
        alternates={{ es: seo.urlEs.replace('https://sliabh.com.ar', ''), en: seo.urlEn.replace('https://sliabh.com.ar', '') }}
      />

      <View style={styles.content}>
        {/* Breadcrumb */}
        <View style={styles.breadcrumbRow}>
          <Link href="/rutas" asChild>
            <TouchableOpacity>
              <Text style={[styles.breadcrumbText, { color: c.muted }]}>{t('Rutas', 'Trails')}</Text>
            </TouchableOpacity>
          </Link>
          <Text style={[styles.breadcrumbText, { color: c.muted }]}>{'  /  '}</Text>
          {parentRegion && (
            <>
              <Link href={`${prefix}/region/${parentRegion.slug}` as any} asChild>
                <TouchableOpacity>
                  <Text style={[styles.breadcrumbText, { color: c.muted }]}>
                    {lang === 'en' ? parentRegion.en.name : parentRegion.es.name}
                  </Text>
                </TouchableOpacity>
              </Link>
              <Text style={[styles.breadcrumbText, { color: c.muted }]}>{'  /  '}</Text>
            </>
          )}
          <Text style={[styles.breadcrumbText, { color: c.text, fontWeight: '700' }]}>{name}</Text>
        </View>

        <Text accessibilityRole="header" style={[styles.h1, { color: c.text }]}>
          {kind === 'region' ? t(`Trekking en ${name}`, `Hiking in ${name}`) : t(`Rutas de trekking en ${name}`, `Hiking trails in ${name}`)}
        </Text>
        <Text style={[styles.statsLine, { color: c.muted }]}>
          {trails.length} {t('rutas', 'trails')} · {provinces.join(', ')}
        </Text>

        <Text style={[styles.intro, { color: c.text }]}>{intro}</Text>

        {region && (
          <Text style={[styles.bestTime, { color: c.muted }]}>
            {t('Mejor época: ', 'Best time to go: ')}
            {lang === 'en' ? region.en.bestTime : region.es.bestTime}
          </Text>
        )}

        {childParks.length > 0 && (
          <View style={{ marginTop: 28 }}>
            <Text accessibilityRole="header" {...H2} style={[styles.h2, { color: c.text }]}>
              {t('Parques y áreas en esta región', 'Parks & areas in this region')}
            </Text>
            <View style={styles.chipsRow}>
              {childParks.map((p) => (
                <Link key={p.slug} href={`${prefix}/parque/${p.slug}` as any} asChild>
                  <TouchableOpacity style={StyleSheet.flatten([styles.chip, { borderColor: c.border, backgroundColor: c.surface }])}>
                    <Ionicons name="business-outline" size={13} color="#22c55e" />
                    <Text style={[styles.chipText, { color: c.text }]}>{lang === 'en' ? p.en.name : p.es.name}</Text>
                  </TouchableOpacity>
                </Link>
              ))}
            </View>
          </View>
        )}

        <View style={{ marginTop: 28 }}>
          <Text accessibilityRole="header" {...H2} style={[styles.h2, { color: c.text }]}>
            {t(`Rutas en ${name}`, `Trails in ${name}`)}
          </Text>
          <View style={{ gap: 12, marginTop: 12 }}>
            {trails.map((tr) => (
              <TrailListCard key={tr.id} trail={tr} href={`${prefix}/ruta/${tr.id}`} colors={c} />
            ))}
          </View>
        </View>

        <View style={{ marginTop: 32 }}>
          <Text accessibilityRole="header" {...H2} style={[styles.h2, { color: c.text }]}>
            {t('Preguntas frecuentes', 'Frequently asked questions')}
          </Text>
          <View style={{ marginTop: 12, gap: 16 }}>
            {faqs.map((f, i) => (
              <View key={i}>
                <Text accessibilityRole="header" {...H3} style={[styles.faqQ, { color: c.text }]}>{f.q}</Text>
                <Text style={[styles.faqA, { color: c.muted }]}>{f.a}</Text>
              </View>
            ))}
          </View>
        </View>

        {region && (
          <Link href={{ pathname: '/rutas', params: { region: region.filterLabel } } as any} asChild>
            <TouchableOpacity style={StyleSheet.flatten([styles.mapLink, { borderColor: c.border }])}>
              <Ionicons name="map-outline" size={16} color="#22c55e" />
              <Text style={{ color: '#22c55e', fontWeight: '700' }}>
                {t('Ver todas en el mapa interactivo', 'See all on the interactive map')}
              </Text>
            </TouchableOpacity>
          </Link>
        )}
      </View>

      {Platform.OS === 'web' && <WebFooter />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { width: '100%', maxWidth: MAX_CONTENT, alignSelf: 'center', paddingHorizontal: 20, paddingTop: 28, paddingBottom: 40 },
  breadcrumbRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 },
  breadcrumbText: { fontSize: 12.5 },
  h1: { fontSize: 30, fontWeight: '800', letterSpacing: -0.3, lineHeight: 36 },
  h2: { fontSize: 19, fontWeight: '800', letterSpacing: -0.2 },
  statsLine: { fontSize: 13, fontWeight: '600', marginTop: 6 },
  intro: { fontSize: 15, lineHeight: 23, marginTop: 16 },
  bestTime: { fontSize: 13.5, fontStyle: 'italic', marginTop: 10 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  chipText: { fontSize: 12.5, fontWeight: '700' },
  faqQ: { fontSize: 14.5, fontWeight: '700', marginBottom: 4 },
  faqA: { fontSize: 13.5, lineHeight: 20 },
  mapLink: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10, alignSelf: 'flex-start', marginTop: 28 },
});
