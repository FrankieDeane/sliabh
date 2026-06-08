import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../src/components/layout/ScreenHeader';
import { ContributeForm } from '../../src/components/contribute/ContributeForm';
import { Button } from '../../src/components/ui/Button';
import { useTheme } from '../../src/hooks/useTheme';
import { useNetwork } from '../../src/hooks/useNetwork';
import { useContribStore } from '../../src/store/contributionStore';

const STATS = [
  { value: '247', label: 'Rutas' },
  { value: '1.840', label: 'Contribuidores' },
  { value: '5.200', label: 'Puntos' },
];

const STEPS: { icon: keyof typeof Ionicons.glyphMap; title: string; desc: string }[] = [
  { icon: 'list-outline', title: 'Elige el tipo', desc: 'Ruta, punto de interés, alerta o nota' },
  { icon: 'create-outline', title: 'Añade detalles', desc: 'Nombre, descripción y ubicación' },
  { icon: 'checkmark-done-outline', title: 'Envía', desc: 'El equipo revisa en 24-48h' },
];

export default function ContribuirScreen() {
  const { isDark } = useTheme();
  const { isOffline } = useNetwork();
  const { pending } = useContribStore();
  const [modalOpen, setModalOpen] = useState(false);

  const c = isDark
    ? { bg: '#070b14', surface: '#0f1724', elevated: '#162035', border: '#1e2d42', text: '#f0f9ff', muted: '#64748b' }
    : { bg: '#f8fafc', surface: '#ffffff', elevated: '#f1f5f9', border: '#e2e8f0', text: '#0f172a', muted: '#64748b' };

  const unsynced = pending.filter((p) => !p.synced);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={['top']}>
      <ScreenHeader title="Contribuir" subtitle="Mejora los senderos" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Hero */}
        <View style={[styles.hero, { backgroundColor: c.surface, borderBottomColor: c.border }]}>
          <View style={[styles.heroIcon, { backgroundColor: '#16a34a' }]}>
            <Ionicons name="earth" size={28} color="#fff" />
          </View>
          <Text style={[styles.heroTitle, { color: c.text }]}>Construye el mapa de la montaña</Text>
          <Text style={[styles.heroSub, { color: c.muted }]}>
            Tu conocimiento ayuda a otros excursionistas a explorar con seguridad.
          </Text>
          <View style={styles.heroBtn}>
            <Button label="Nueva contribución" leftIcon="add" onPress={() => setModalOpen(true)} fullWidth />
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {STATS.map((s) => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: c.muted }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Pending */}
        {pending.length > 0 && (
          <View style={styles.section}>
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

        {/* How it works */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: c.muted }]}>¿CÓMO FUNCIONA?</Text>
          <View style={[styles.stepsCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            {STEPS.map((s, i) => (
              <View key={s.title} style={[styles.stepRow, i < STEPS.length - 1 && styles.stepRowBorder, i < STEPS.length - 1 && { borderBottomColor: c.border }]}>
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

        {/* Offline note */}
        <View style={[styles.offlineNote, { marginHorizontal: 16 }]}>
          <Ionicons name="flash-outline" size={16} color="#fbbf24" />
          <Text style={styles.offlineNoteText}>
            {isOffline && unsynced.length > 0
              ? `${unsynced.length} contribución(es) se enviarán al reconectar.`
              : 'Funciona sin conexión. Sincronización automática al reconectar.'}
          </Text>
        </View>
      </ScrollView>

      <Modal visible={modalOpen} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: c.bg }}>
          <View style={[styles.modalHeader, { borderBottomColor: c.border }]}>
            <Text style={[styles.modalTitle, { color: c.text }]}>Nueva contribución</Text>
            <TouchableOpacity onPress={() => setModalOpen(false)}>
              <Ionicons name="close" size={24} color={c.muted} />
            </TouchableOpacity>
          </View>
          <ContributeForm onClose={() => setModalOpen(false)} onSubmit={() => setModalOpen(false)} />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 24, paddingBottom: 28, borderBottomWidth: 1 },
  heroIcon: { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  heroTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center', letterSpacing: -0.4, marginBottom: 6 },
  heroSub: { fontSize: 14, textAlign: 'center', lineHeight: 21, maxWidth: 300 },
  heroBtn: { width: '100%', marginTop: 20 },
  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginTop: 20 },
  statCard: { flex: 1, alignItems: 'center', paddingVertical: 16, borderRadius: 18, borderWidth: 1 },
  statValue: { fontSize: 22, fontWeight: '800', color: '#22c55e' },
  statLabel: { fontSize: 11, fontWeight: '500', marginTop: 2 },
  section: { paddingHorizontal: 16, marginTop: 24 },
  sectionTitle: { fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 12 },
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
