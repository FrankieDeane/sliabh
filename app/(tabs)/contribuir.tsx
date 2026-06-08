import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ImageBackground,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ContributeForm } from '../../src/components/contribute/ContributeForm';
import { Button } from '../../src/components/ui/Button';
import { useTheme } from '../../src/hooks/useTheme';
import { useNetwork } from '../../src/hooks/useNetwork';
import { useContribStore } from '../../src/store/contributionStore';
import { WebFooter } from '../../src/components/layout/WebFooter';
import type { ContribType } from '../../src/store/contributionStore';

const MAX_CONTENT = 900;

const HERO_URI =
  'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=1200&q=85&fit=crop&auto=format';

const STATS = [
  { value: '247', label: 'Rutas', icon: 'trail-sign-outline' as const },
  { value: '1.840', label: 'Contribuidores', icon: 'people-outline' as const },
  { value: '5.200', label: 'Puntos', icon: 'star-outline' as const },
];

const CONTRIB_TYPES: Array<{
  id: ContribType;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  desc: string;
  color: string;
  bg: string;
}> = [
  {
    id: 'nueva_ruta',
    icon: 'trail-sign-outline',
    label: 'Nueva Ruta',
    desc: 'Agrega un sendero que aún no está en el mapa',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.12)',
  },
  {
    id: 'punto_interes',
    icon: 'location-outline',
    label: 'Punto de Interés',
    desc: 'Campamentos, refugios, fuentes de agua',
    color: '#38bdf8',
    bg: 'rgba(56,189,248,0.12)',
  },
  {
    id: 'alerta',
    icon: 'warning-outline',
    label: 'Alerta',
    desc: 'Peligros, caminos cortados, condiciones adversas',
    color: '#f87171',
    bg: 'rgba(248,113,113,0.12)',
  },
  {
    id: 'edicion_ruta',
    icon: 'create-outline',
    label: 'Corregir Ruta',
    desc: 'Actualiza datos incorrectos de una ruta existente',
    color: '#fbbf24',
    bg: 'rgba(251,191,36,0.12)',
  },
  {
    id: 'nota',
    icon: 'document-text-outline',
    label: 'Reporte de Sendero',
    desc: 'Condiciones actuales, temporada, nivel de dificultad',
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.12)',
  },
];

const RECENT_ACTIVITY = [
  {
    user: 'Martín R.',
    action: 'agregó una nueva ruta en Bariloche',
    time: 'hace 2h',
    icon: 'trail-sign-outline' as keyof typeof Ionicons.glyphMap,
    color: '#22c55e',
  },
  {
    user: 'Ana G.',
    action: 'reportó el estado del Circuito W',
    time: 'hace 5h',
    icon: 'document-text-outline' as keyof typeof Ionicons.glyphMap,
    color: '#a78bfa',
  },
  {
    user: 'Carlos P.',
    action: 'marcó un refugio cerca de Fitz Roy',
    time: 'hace 1d',
    icon: 'home-outline' as keyof typeof Ionicons.glyphMap,
    color: '#38bdf8',
  },
  {
    user: 'Laura M.',
    action: 'publicó alerta de nieve en Aconcagua',
    time: 'hace 2d',
    icon: 'warning-outline' as keyof typeof Ionicons.glyphMap,
    color: '#f87171',
  },
];

const STEPS: { icon: keyof typeof Ionicons.glyphMap; title: string; desc: string }[] = [
  { icon: 'list-outline', title: 'Elige el tipo', desc: 'Ruta, punto de interés, alerta o reporte' },
  { icon: 'create-outline', title: 'Añade detalles', desc: 'Nombre, descripción y ubicación' },
  { icon: 'checkmark-done-outline', title: 'Envía', desc: 'El equipo revisa en 24–48 horas' },
];

export default function ContribuirScreen() {
  const { isDark } = useTheme();
  const { isOffline } = useNetwork();
  const { pending } = useContribStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ContribType | undefined>(undefined);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const contentW = Math.min(width, MAX_CONTENT);
  const sidePad = Math.max(16, (width - contentW) / 2);

  const c = isDark
    ? { bg: '#070b14', surface: '#0f1724', elevated: '#162035', border: '#1e2d42', text: '#f0f9ff', muted: '#64748b' }
    : { bg: '#f8fafc', surface: '#ffffff', elevated: '#f1f5f9', border: '#e2e8f0', text: '#0f172a', muted: '#64748b' };

  const unsynced = pending.filter((p) => !p.synced);

  const openModal = (type?: ContribType) => {
    setModalType(type);
    setModalOpen(true);
  };

  const isWide = width >= 600;

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

        {/* ── HERO ── */}
        <ImageBackground
          source={{ uri: HERO_URI }}
          style={[styles.hero, { minHeight: Math.min(width * 0.55, 400) }]}
          resizeMode="cover"
        >
          <View style={[StyleSheet.absoluteFillObject, styles.heroOverlay]} />
          <View style={[styles.heroInner, { paddingTop: insets.top + 20, paddingHorizontal: sidePad }]}>
            <View style={styles.heroBrand}>
              <Ionicons name="people" size={13} color="#22c55e" />
              <Text style={styles.heroBrandText}>COMUNIDAD</Text>
            </View>
            <Text style={styles.heroTitle}>Sé parte del{'\n'}mapa vivo</Text>
            <Text style={styles.heroSub}>
              Tu conocimiento en la montaña tiene valor. Más de 1.800 senderistas
              ya contribuyeron a hacer este mapa mejor.
            </Text>
            <View style={styles.heroCtas}>
              <Button label="Añadir contribución" leftIcon="add" onPress={() => openModal()} />
            </View>
          </View>
        </ImageBackground>

        {/* ── STATS ── */}
        <View style={[styles.statsRow, { marginHorizontal: sidePad }]}>
          {STATS.map((s) => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Ionicons name={s.icon} size={18} color="#22c55e" style={{ marginBottom: 6 }} />
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: c.muted }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ── CONTRIBUTION TYPES ── */}
        <View style={[styles.section, { paddingHorizontal: sidePad }]}>
          <Text style={[styles.sectionTitle, { color: c.muted }]}>¿QUÉ PUEDES APORTAR?</Text>
          <View style={[styles.typesGrid, isWide && styles.typesGridWide]}>
            {CONTRIB_TYPES.map((t) => (
              <TouchableOpacity
                key={t.id}
                onPress={() => openModal(t.id)}
                activeOpacity={0.78}
                style={[
                  styles.typeCard,
                  isWide && styles.typeCardWide,
                  { backgroundColor: c.surface, borderColor: c.border },
                ]}
              >
                <View style={[styles.typeIconWrap, { backgroundColor: t.bg }]}>
                  <Ionicons name={t.icon} size={22} color={t.color} />
                </View>
                <View style={styles.typeText}>
                  <Text style={[styles.typeLabel, { color: c.text }]}>{t.label}</Text>
                  <Text style={[styles.typeDesc, { color: c.muted }]}>{t.desc}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={c.muted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── COMMUNITY ACTIVITY ── */}
        <View style={[styles.section, { paddingHorizontal: sidePad }]}>
          <Text style={[styles.sectionTitle, { color: c.muted }]}>ACTIVIDAD RECIENTE</Text>
          <View style={[styles.activityCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            {RECENT_ACTIVITY.map((a, i) => (
              <View
                key={i}
                style={[
                  styles.activityRow,
                  i < RECENT_ACTIVITY.length - 1 && { borderBottomWidth: 1, borderBottomColor: c.border },
                ]}
              >
                <View style={[styles.activityIcon, { backgroundColor: c.elevated }]}>
                  <Ionicons name={a.icon} size={14} color={a.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.activityText, { color: c.text }]}>
                    <Text style={{ fontWeight: '700' }}>{a.user}</Text>
                    {' '}{a.action}
                  </Text>
                  <Text style={[styles.activityTime, { color: c.muted }]}>{a.time}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ── MY CONTRIBUTIONS ── */}
        {pending.length > 0 && (
          <View style={[styles.section, { paddingHorizontal: sidePad }]}>
            <Text style={[styles.sectionTitle, { color: c.muted }]}>MIS CONTRIBUCIONES</Text>
            {pending.slice(0, 5).map((p) => (
              <View key={p.id} style={[styles.pendingRow, { backgroundColor: c.surface, borderColor: c.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.pendingTitle, { color: c.text }]} numberOfLines={1}>{p.title}</Text>
                  <Text style={[styles.pendingType, { color: c.muted }]}>{p.type.replace('_', ' ')}</Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: p.synced ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)' }]}>
                  <Text style={[styles.statusText, { color: p.synced ? '#22c55e' : '#fbbf24' }]}>
                    {p.synced ? 'Enviada' : 'Pendiente'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── HOW IT WORKS ── */}
        <View style={[styles.section, { paddingHorizontal: sidePad }]}>
          <Text style={[styles.sectionTitle, { color: c.muted }]}>¿CÓMO FUNCIONA?</Text>
          <View style={[styles.stepsCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            {STEPS.map((s, i) => (
              <View
                key={s.title}
                style={[
                  styles.stepRow,
                  i < STEPS.length - 1 && styles.stepRowBorder,
                  i < STEPS.length - 1 && { borderBottomColor: c.border },
                ]}
              >
                <View style={[styles.stepIcon, { backgroundColor: c.elevated }]}>
                  <Ionicons name={s.icon} size={20} color="#22c55e" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.stepTitle, { color: c.text }]}>{s.title}</Text>
                  <Text style={[styles.stepDesc, { color: c.muted }]}>{s.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ── OFFLINE NOTE ── */}
        <View style={[styles.offlineNote, { marginHorizontal: sidePad }]}>
          <Ionicons name="flash-outline" size={16} color="#fbbf24" />
          <Text style={styles.offlineNoteText}>
            {isOffline && unsynced.length > 0
              ? `${unsynced.length} contribución(es) se enviarán al reconectar.`
              : 'Funciona sin conexión. Sincronización automática al reconectar.'}
          </Text>
        </View>

        {Platform.OS === 'web' && <WebFooter />}
      </ScrollView>

      <Modal visible={modalOpen} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: c.bg }}>
          <View style={[styles.modalHeader, { borderBottomColor: c.border }]}>
            <Text style={[styles.modalTitle, { color: c.text }]}>Nueva contribución</Text>
            <TouchableOpacity onPress={() => setModalOpen(false)}>
              <Ionicons name="close" size={24} color={c.muted} />
            </TouchableOpacity>
          </View>
          <ContributeForm
            key={modalType ?? 'general'}
            onClose={() => setModalOpen(false)}
            onSubmit={() => setModalOpen(false)}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { width: '100%' },
  heroOverlay: { backgroundColor: 'rgba(7,11,20,0.60)' },
  heroInner: { paddingBottom: 36, minHeight: 200, justifyContent: 'flex-end' },
  heroBrand: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  heroBrandText: { fontSize: 10, fontWeight: '800', color: '#22c55e', letterSpacing: 3.5 },
  heroTitle: { fontSize: 36, fontWeight: '900', color: '#fff', letterSpacing: -1, lineHeight: 42, marginBottom: 12 },
  heroSub: { fontSize: 14, color: 'rgba(255,255,255,0.70)', lineHeight: 22, marginBottom: 24, maxWidth: 480 },
  heroCtas: { alignSelf: 'flex-start' },

  statsRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 16, borderRadius: 18, borderWidth: 1 },
  statValue: { fontSize: 20, fontWeight: '800', color: '#22c55e' },
  statLabel: { fontSize: 11, fontWeight: '500', marginTop: 2 },

  section: { marginTop: 28 },
  sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 14 },

  typesGrid: { gap: 10 },
  typesGridWide: { flexDirection: 'row', flexWrap: 'wrap' },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  typeCardWide: { width: '48.5%' },
  typeIconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  typeText: { flex: 1 },
  typeLabel: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  typeDesc: { fontSize: 12, lineHeight: 17 },

  activityCard: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 16 },
  activityRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingVertical: 14 },
  activityIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  activityText: { fontSize: 13, lineHeight: 18 },
  activityTime: { fontSize: 11, marginTop: 3 },

  pendingRow: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 8 },
  pendingTitle: { fontSize: 14, fontWeight: '600' },
  pendingType: { fontSize: 12, marginTop: 2, textTransform: 'capitalize' },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusText: { fontSize: 11, fontWeight: '700' },

  stepsCard: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 16 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16 },
  stepRowBorder: { borderBottomWidth: 1 },
  stepIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stepTitle: { fontSize: 15, fontWeight: '700' },
  stepDesc: { fontSize: 13, marginTop: 2 },

  offlineNote: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24,
    backgroundColor: 'rgba(245,158,11,0.12)', borderRadius: 14, padding: 14,
  },
  offlineNoteText: { color: '#fbbf24', fontSize: 12, fontWeight: '500', flex: 1 },

  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 17, fontWeight: '700' },
});
