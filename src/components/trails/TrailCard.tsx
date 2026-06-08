import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ArgentinaTrail } from '../../data/argentinaTrails';
import { DIFFICULTY_LABEL, DIFFICULTY_COLOR, ACTIVITY_ICON } from '../../data/argentinaTrails';

interface FeaturedProps {
  trail: ArgentinaTrail;
  onPress: () => void;
}

export function FeaturedTrailCard({ trail, onPress }: FeaturedProps) {
  const diff = DIFFICULTY_COLOR[trail.difficulty];

  return (
    <TouchableOpacity style={styles.featured} onPress={onPress} activeOpacity={0.88}>
      <ImageBackground
        source={{ uri: trail.photo_uri }}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      >
        <View style={[StyleSheet.absoluteFillObject, styles.featuredOverlay]} />
        <View style={styles.featuredContent}>
          <View style={styles.featuredTop}>
            <View style={[styles.activityPill, { backgroundColor: 'rgba(0,0,0,0.45)' }]}>
              <Ionicons
                name={ACTIVITY_ICON[trail.activity] as any}
                size={12}
                color="rgba(255,255,255,0.9)"
              />
              <Text style={styles.activityText}>{trail.activity.replace('_', ' ')}</Text>
            </View>
            <View style={[styles.diffPill, { backgroundColor: diff.bg }]}>
              <Text style={[styles.diffText, { color: diff.text }]}>
                {DIFFICULTY_LABEL[trail.difficulty]}
              </Text>
            </View>
          </View>

          <View style={{ flex: 1 }} />

          <Text style={styles.featuredTitle}>{trail.name}</Text>
          <Text style={styles.featuredSub}>
            {trail.province} · {trail.area}
          </Text>

          <View style={styles.statsRow}>
            <StatBadge icon="footsteps-outline" value={`${trail.distance_km} km`} />
            <StatBadge icon="arrow-up-outline" value={`${trail.elevation_gain_m} m`} />
            <StatBadge
              icon="time-outline"
              value={
                trail.duration.min === trail.duration.max
                  ? `${trail.duration.min} ${trail.duration.unit}`
                  : `${trail.duration.min}–${trail.duration.max} ${trail.duration.unit}`
              }
            />
          </View>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
}

interface ListProps {
  trail: ArgentinaTrail;
  onPress: () => void;
  colors: { surface: string; border: string; text: string; muted: string; elevated: string };
}

export function TrailListCard({ trail, onPress, colors: c }: ListProps) {
  const diff = DIFFICULTY_COLOR[trail.difficulty];

  return (
    <TouchableOpacity
      style={[styles.listCard, { backgroundColor: c.surface, borderColor: c.border }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.listThumb}>
        <ImageBackground
          source={{ uri: trail.photo_uri }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
      </View>

      <View style={styles.listBody}>
        <View style={styles.listTop}>
          <Text style={[styles.listTitle, { color: c.text }]} numberOfLines={1}>
            {trail.name}
          </Text>
          <View style={[styles.diffPillSm, { backgroundColor: diff.bg }]}>
            <Text style={[styles.diffTextSm, { color: diff.text }]}>
              {DIFFICULTY_LABEL[trail.difficulty]}
            </Text>
          </View>
        </View>

        <Text style={[styles.listSub, { color: c.muted }]} numberOfLines={1}>
          {trail.province} · {trail.area}
        </Text>

        <View style={styles.listStats}>
          <MiniStat icon="footsteps-outline" value={`${trail.distance_km} km`} color={c.muted} />
          <MiniStat
            icon="arrow-up-outline"
            value={`+${trail.elevation_gain_m} m`}
            color={c.muted}
          />
          <MiniStat
            icon="time-outline"
            value={
              trail.duration.min === trail.duration.max
                ? `${trail.duration.min} ${trail.duration.unit}`
                : `${trail.duration.min}–${trail.duration.max} ${trail.duration.unit}`
            }
            color={c.muted}
          />
        </View>

        {trail.permits_required && (
          <View style={styles.permitRow}>
            <Ionicons name="document-text-outline" size={11} color="#fbbf24" />
            <Text style={styles.permitText}>Permiso requerido</Text>
          </View>
        )}
      </View>

      <View style={[styles.seasonBadge, { backgroundColor: c.elevated }]}>
        <Text style={[styles.seasonText, { color: c.muted }]}>{trail.best_season}</Text>
      </View>
    </TouchableOpacity>
  );
}

function StatBadge({ icon, value }: { icon: any; value: string }) {
  return (
    <View style={styles.statBadge}>
      <Ionicons name={icon} size={12} color="rgba(255,255,255,0.7)" />
      <Text style={styles.statBadgeText}>{value}</Text>
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

const styles = StyleSheet.create({
  // Featured
  featured: { borderRadius: 24, overflow: 'hidden', height: 340 },
  featuredOverlay: { backgroundColor: 'rgba(0,0,0,0.42)' },
  featuredContent: { flex: 1, padding: 18 },
  featuredTop: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  activityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  activityText: { fontSize: 11, color: 'rgba(255,255,255,0.9)', fontWeight: '600', textTransform: 'capitalize' },
  diffPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  diffText: { fontSize: 11, fontWeight: '700' },
  featuredTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  featuredSub: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginBottom: 14 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.38)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  statBadgeText: { fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: '600' },

  // List card
  listCard: {
    flexDirection: 'row',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
  },
  listThumb: { width: 100, height: 100 },
  listBody: { flex: 1, padding: 12, justifyContent: 'center' },
  listTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  listTitle: { fontSize: 14, fontWeight: '700', flex: 1 },
  diffPillSm: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, flexShrink: 0 },
  diffTextSm: { fontSize: 10, fontWeight: '700' },
  listSub: { fontSize: 11, marginTop: 2, marginBottom: 6 },
  listStats: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  miniStat: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  miniStatText: { fontSize: 11, fontWeight: '500' },
  permitRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  permitText: { fontSize: 10, color: '#fbbf24', fontWeight: '600' },
  seasonBadge: {
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 56,
  },
  seasonText: { fontSize: 9, fontWeight: '600', textAlign: 'center', lineHeight: 13 },
});
