import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ArgentinaTrail } from '../../data/argentinaTrails';
import { difficultyLabel, DIFFICULTY_COLOR, ACTIVITY_ICON } from '../../data/argentinaTrails';
import { fetchWikiImage } from '../../utils/wikiImage';
import { useLangStore, Lang } from '../../store/langStore';

/** Translate a trail duration unit ('horas'/'dias') for display. */
function unitLabel(unit: string, lang: Lang): string {
  if (unit === 'horas') return lang === 'es' ? 'horas' : 'hours';
  if (unit === 'dias') return lang === 'es' ? 'días' : 'days';
  return unit;
}

// Resolve a real Wikimedia photo for the trail's place; falls back to its photo.
function useWikiPhoto(trail: ArgentinaTrail): string {
  const [url, setUrl] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (Platform.OS !== 'web') return;
    let alive = true;
    const place = (trail.name || '').split('—')[0].trim();
    const query = `${place} ${(trail as any).area || ''}`.trim();
    fetchWikiImage(query).then((u) => { if (alive && u) setUrl(u); });
    return () => { alive = false; };
  }, [trail.name]);
  return url || trail.photo_uri;
}

// ── Featured card — full-bleed hero, AllTrails-style ────────────────────────

interface FeaturedProps {
  trail: ArgentinaTrail;
  onPress: () => void;
}

export function FeaturedTrailCard({ trail, onPress }: FeaturedProps) {
  const diff = DIFFICULTY_COLOR[trail.difficulty];
  const photo = useWikiPhoto(trail);
  const { t, lang } = useLangStore();

  return (
    <TouchableOpacity style={styles.featured} onPress={onPress} activeOpacity={0.9}>
      <ImageBackground
        source={{ uri: photo }}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      />
      {/* Bottom gradient overlay */}
      <View style={styles.featuredGradient} />

      {/* Top badges */}
      <View style={styles.featuredTop}>
        <View style={[styles.diffBadge, { backgroundColor: diff.bg }]}>
          <Text style={[styles.diffBadgeText, { color: diff.text }]}>
            {difficultyLabel(trail.difficulty, lang)}
          </Text>
        </View>
        {trail.permits_required && (
          <View style={styles.permitBadge}>
            <Ionicons name="document-text-outline" size={10} color="#fbbf24" />
            <Text style={styles.permitBadgeText}>{t('Permiso', 'Permit')}</Text>
          </View>
        )}
      </View>

      {/* Bottom content */}
      <View style={styles.featuredBottom}>
        <Text style={styles.featuredTitle} numberOfLines={2}>{trail.name}</Text>
        <Text style={styles.featuredRegion}>
          {trail.province} · {trail.area}
        </Text>
        <View style={styles.statsRow}>
          <StatChip icon="footsteps-outline" value={`${trail.distance_km} km`} />
          <StatChip icon="trending-up-outline" value={`+${trail.elevation_gain_m} m`} />
          <StatChip
            icon="time-outline"
            value={`${trail.duration.min}–${trail.duration.max} ${unitLabel(trail.duration.unit, lang)}`}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── List card — AllTrails horizontal layout ──────────────────────────────────

interface ListProps {
  trail: ArgentinaTrail;
  onPress: () => void;
  colors: { surface: string; border: string; text: string; muted: string; elevated: string };
}

export function TrailListCard({ trail, onPress, colors: c }: ListProps) {
  const diff = DIFFICULTY_COLOR[trail.difficulty];
  const photo = useWikiPhoto(trail);
  const { lang } = useLangStore();

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Photo */}
      <View style={styles.photoWrap}>
        <ImageBackground
          source={{ uri: photo }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
        <View style={[styles.diffCorner, { backgroundColor: diff.bg }]}>
          <Text style={[styles.diffCornerText, { color: diff.text }]}>
            {difficultyLabel(trail.difficulty, lang)}
          </Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.cardBody}>
        <Text style={[styles.cardTitle, { color: c.text }]} numberOfLines={2}>
          {trail.name}
        </Text>
        <View style={styles.cardRegionRow}>
          <Ionicons name="location-outline" size={11} color={c.muted} />
          <Text style={[styles.cardRegion, { color: c.muted }]} numberOfLines={1}>
            {trail.province} · {trail.area}
          </Text>
        </View>

        <View style={styles.cardStats}>
          <MiniStat icon="footsteps-outline" value={`${trail.distance_km} km`} color={c.muted} />
          <MiniStat icon="trending-up-outline" value={`+${trail.elevation_gain_m} m`} color={c.muted} />
          <MiniStat
            icon="time-outline"
            value={`${trail.duration.min}–${trail.duration.max} ${unitLabel(trail.duration.unit, lang)}`}
            color={c.muted}
          />
        </View>

        <View style={styles.cardFooter}>
          <View style={[styles.activityTag, { backgroundColor: c.elevated, borderColor: c.border }]}>
            <Ionicons name={ACTIVITY_ICON[trail.activity] as any} size={10} color={c.muted} />
            <Text style={[styles.activityTagText, { color: c.muted }]}>
              {trail.activity.replace('_', ' ')}
            </Text>
          </View>
          {trail.best_season && (
            <Text style={[styles.seasonText, { color: c.muted }]}>{trail.best_season}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatChip({ icon, value }: { icon: any; value: string }) {
  return (
    <View style={styles.statChip}>
      <Ionicons name={icon} size={11} color="rgba(255,255,255,0.75)" />
      <Text style={styles.statChipText}>{value}</Text>
    </View>
  );
}

function MiniStat({ icon, value, color }: { icon: any; value: string; color: string }) {
  return (
    <View style={styles.miniStat}>
      <Ionicons name={icon} size={11} color={color} />
      <Text style={[styles.miniStatText, { color }]}>{value}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Featured card
  featured: {
    height: 380,
    borderRadius: 24,
    overflow: 'hidden',
  },
  featuredGradient: {
    ...StyleSheet.absoluteFillObject,
    // Simulated gradient via overlapping views
    backgroundColor: 'rgba(7,11,20,0)',
    top: '40%',
  },
  featuredTop: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 8,
  },
  featuredBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'rgba(7,11,20,0.82)',
  },
  featuredTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
    lineHeight: 28,
    marginBottom: 4,
  },
  featuredRegion: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  statChipText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600',
  },
  diffBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  diffBadgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  permitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(251,191,36,0.18)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.3)',
  },
  permitBadgeText: { fontSize: 10, color: '#fbbf24', fontWeight: '700' },

  // List card — AllTrails style
  card: {
    flexDirection: 'row',
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
    minHeight: 112,
  },
  photoWrap: {
    width: 112,
    alignSelf: 'stretch',
    position: 'relative',
  },
  diffCorner: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  diffCornerText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.3 },
  cardBody: {
    flex: 1,
    padding: 14,
    gap: 4,
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
    letterSpacing: -0.1,
  },
  cardRegionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  cardRegion: {
    fontSize: 11,
    flex: 1,
  },
  cardStats: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    marginTop: 2,
  },
  miniStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  miniStatText: { fontSize: 11, fontWeight: '500' },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  activityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  activityTagText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize' as const,
  },
  gpxBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(59,130,246,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.35)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  gpxBadgeText: { fontSize: 9, fontWeight: '800', color: '#93c5fd', letterSpacing: 0.5 },
  seasonText: { fontSize: 10 },
});
