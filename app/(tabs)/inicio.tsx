import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { OfflineAICard } from '../../src/components/ui/OfflineAICard';
import { Button } from '../../src/components/ui/Button';
import { useTheme } from '../../src/hooks/useTheme';
import { useAuthStore } from '../../src/store/authStore';

export default function InicioScreen() {
  const { isDark } = useTheme();
  const { user } = useAuthStore();
  const router = useRouter();

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── 1. HERO SECTION ── */}
        <View style={styles.hero}>
          <View style={styles.heroIconCircle}>
            <Ionicons name="triangle" size={36} color="#16a34a" />
          </View>

          <Text style={styles.heroTitle}>Explora sin límites</Text>

          <Text style={styles.heroSub}>
            PATAGONIA · TORRES DEL PAINE · IA OFFLINE
          </Text>

          <View style={styles.heroCtas}>
            <View style={styles.heroCtaPrimary}>
              <Button
                label="Planificar ruta"
                onPress={() => router.push('/(tabs)/planificar')}
                variant="primary"
                leftIcon="map-outline"
                size="md"
              />
            </View>
            <View style={styles.heroCtaSecondary}>
              <Button
                label="Ver mapas"
                onPress={() => router.push('/(tabs)/mapas')}
                variant="secondary"
                leftIcon="layers-outline"
                size="md"
              />
            </View>
          </View>
        </View>

        {/* ── 2. OFFLINE AI BANNER ── */}
        <View style={styles.sectionMx}>
          <OfflineAICard />
        </View>

        {/* ── 3. QUICK STATS ROW ── */}
        <View style={[styles.sectionMx, styles.mt6]}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>23</Text>
              <Text style={styles.statLabel}>Rutas</Text>
            </View>
            <View style={[styles.statCard, styles.statCardMx]}>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>Campamentos</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>8</Text>
              <Text style={styles.statLabel}>Refugios</Text>
            </View>
          </View>
        </View>

        {/* ── 4. QUICK ACTIONS ── */}
        <View style={[styles.sectionMx, styles.mt6]}>
          <Text style={styles.sectionLabel}>EXPLORAR</Text>

          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.75}
            onPress={() => router.push('/(tabs)/planificar')}
          >
            <View style={styles.actionIconCircle}>
              <Ionicons name="map-outline" size={22} color="#ffffff" />
            </View>
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>Planificar caminata</Text>
              <Text style={styles.actionDesc}>
                Traza tu próxima ruta y analízala con IA
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#4a5568" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, styles.mt3]}
            activeOpacity={0.75}
            onPress={() => router.push('/(tabs)/contribuir')}
          >
            <View style={styles.actionIconCircle}>
              <Ionicons name="pencil-outline" size={22} color="#ffffff" />
            </View>
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>Contribuir al mapa</Text>
              <Text style={styles.actionDesc}>
                Ayuda a la comunidad con datos de senderos
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#4a5568" />
          </TouchableOpacity>
        </View>

        {/* ── 5. PACK ACTIVO ── */}
        <View style={[styles.sectionMx, styles.mt6]}>
          <Text style={styles.sectionLabel}>PACK ACTIVO</Text>

          <View style={styles.packCard}>
            <View style={styles.packRow}>
              <View style={styles.packInfo}>
                <Text style={styles.packName}>Torres del Paine</Text>
                <Text style={styles.packRegion}>Patagonia, Chile</Text>
              </View>
              <View style={styles.packOfflineBadge}>
                <Ionicons name="cloud-done-outline" size={14} color="#34d399" />
                <Text style={styles.packOfflineText}>Disponible offline</Text>
              </View>
            </View>
            <View style={styles.packMeta}>
              <Text style={styles.packMetaText}>v2.4.1 · Región sur · 1.2 GB</Text>
            </View>
          </View>
        </View>

        {/* ── 6. AUTH BANNER ── */}
        {!user && (
          <TouchableOpacity
            style={styles.authBanner}
            activeOpacity={0.8}
            onPress={() => router.push('/(auth)/login')}
          >
            <Ionicons name="person-circle-outline" size={28} color="#16a34a" />
            <Text style={styles.authText}>
              Inicia sesión para guardar tus rutas
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#4a5568" />
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#070b14',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // Hero
  hero: {
    backgroundColor: '#070b14',
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 32,
    alignItems: 'flex-start',
  },
  heroIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(22,163,74,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(22,163,74,0.25)',
  },
  heroTitle: {
    fontSize: 46,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -1.5,
    lineHeight: 50,
    marginBottom: 8,
  },
  heroSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#78716c',
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginTop: 4,
    marginBottom: 28,
  },
  heroCtas: {
    flexDirection: 'row',
    gap: 10,
  },
  heroCtaPrimary: {
    flex: 1,
  },
  heroCtaSecondary: {
    flex: 1,
  },

  // Shared section
  sectionMx: {
    marginHorizontal: 16,
  },
  mt3: {
    marginTop: 12,
  },
  mt6: {
    marginTop: 24,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#78716c',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 12,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
  },
  statCard: {
    flex: 1,
    backgroundColor: '#0f1724',
    borderWidth: 1,
    borderColor: '#1e2d42',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statCardMx: {
    marginHorizontal: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4ade80',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    color: '#78716c',
    marginTop: 3,
    fontWeight: '500',
  },

  // Action cards
  actionCard: {
    backgroundColor: '#0f1724',
    borderWidth: 1,
    borderColor: '#1e2d42',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    flexShrink: 0,
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 3,
  },
  actionDesc: {
    fontSize: 12,
    color: '#78716c',
    lineHeight: 17,
  },

  // Pack activo
  packCard: {
    backgroundColor: '#0f1724',
    borderWidth: 1,
    borderColor: '#1e2d42',
    borderRadius: 24,
    padding: 20,
  },
  packRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  packInfo: {
    flex: 1,
  },
  packName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#f1f5f9',
    marginBottom: 2,
  },
  packRegion: {
    fontSize: 12,
    color: '#78716c',
  },
  packOfflineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52,211,153,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.25)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 5,
  },
  packOfflineText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#34d399',
  },
  packMeta: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1e2d42',
  },
  packMetaText: {
    fontSize: 11,
    color: '#78716c',
  },

  // Auth banner
  authBanner: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(22,163,74,0.2)',
    backgroundColor: 'rgba(22,163,74,0.05)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  authText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#d1d5db',
  },
});
