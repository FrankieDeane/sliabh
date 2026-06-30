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
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ContributeForm } from '../../src/components/contribute/ContributeForm';
import { Button } from '../../src/components/ui/Button';
import { useTheme } from '../../src/hooks/useTheme';
import { useNetwork } from '../../src/hooks/useNetwork';
import { useContribStore } from '../../src/store/contributionStore';
import { useLangStore } from '../../src/store/langStore';
import { WebFooter } from '../../src/components/layout/WebFooter';
import type { ContribType } from '../../src/store/contributionStore';

const MAX_CONTENT = 900;

const HERO_URI =
  'https://images.unsplash.com/photo-1522163182402-834f871fd851?w=1200&q=85&fit=crop&auto=format';

const STATS = [
  { value: '247', labelEs: 'Rutas', labelEn: 'Routes', icon: 'trail-sign-outline' as const },
  { value: '1.840', labelEs: 'Contribuidores', labelEn: 'Contributors', icon: 'people-outline' as const },
  { value: '5.200', labelEs: 'Puntos', labelEn: 'Points', icon: 'star-outline' as const },
];

const CONTRIB_TYPES: Array<{
  id: ContribType;
  icon: keyof typeof Ionicons.glyphMap;
  labelEs: string;
  labelEn: string;
  descEs: string;
  descEn: string;
  color: string;
  bg: string;
}> = [
  {
    id: 'nueva_ruta',
    icon: 'trail-sign-outline',
    labelEs: 'Nueva Ruta',
    labelEn: 'New Route',
    descEs: 'Agrega un sendero que aún no está en el mapa',
    descEn: 'Add a trail that is not yet on the map',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.12)',
  },
  {
    id: 'punto_interes',
    icon: 'location-outline',
    labelEs: 'Punto de Interés',
    labelEn: 'Point of Interest',
    descEs: 'Campamentos, refugios, fuentes de agua',
    descEn: 'Campsites, huts, water sources',
    color: '#38bdf8',
    bg: 'rgba(56,189,248,0.12)',
  },
  {
    id: 'alerta',
    icon: 'warning-outline',
    labelEs: 'Alerta',
    labelEn: 'Alert',
    descEs: 'Peligros, caminos cortados, condiciones adversas',
    descEn: 'Hazards, closed paths, adverse conditions',
    color: '#f87171',
    bg: 'rgba(248,113,113,0.12)',
  },
  {
    id: 'edicion_ruta',
    icon: 'create-outline',
    labelEs: 'Corregir Ruta',
    labelEn: 'Correct Route',
    descEs: 'Actualiza datos incorrectos de una ruta existente',
    descEn: 'Update incorrect data on an existing route',
    color: '#fbbf24',
    bg: 'rgba(251,191,36,0.12)',
  },
  {
    id: 'nota',
    icon: 'document-text-outline',
    labelEs: 'Reporte de Sendero',
    labelEn: 'Trail Report',
    descEs: 'Condiciones actuales, temporada, nivel de dificultad',
    descEn: 'Current conditions, season, difficulty level',
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.12)',
  },
];

const RECENT_ACTIVITY = [
  {
    user: 'Martín R.',
    actionEs: 'agregó una nueva ruta en Bariloche',
    actionEn: 'added a new route in Bariloche',
    timeEs: 'hace 2h',
    timeEn: '2h ago',
    icon: 'trail-sign-outline' as keyof typeof Ionicons.glyphMap,
    color: '#22c55e',
  },
  {
    user: 'Ana G.',
    actionEs: 'reportó el estado del Circuito W',
    actionEn: 'reported the condition of Circuito W',
    timeEs: 'hace 5h',
    timeEn: '5h ago',
    icon: 'document-text-outline' as keyof typeof Ionicons.glyphMap,
    color: '#a78bfa',
  },
  {
    user: 'Carlos P.',
    actionEs: 'marcó un refugio cerca de Fitz Roy',
    actionEn: 'marked a hut near Fitz Roy',
    timeEs: 'hace 1d',
    timeEn: '1d ago',
    icon: 'home-outline' as keyof typeof Ionicons.glyphMap,
    color: '#38bdf8',
  },
  {
    user: 'Laura M.',
    actionEs: 'publicó alerta de nieve en Aconcagua',
    actionEn: 'posted a snow alert on Aconcagua',
    timeEs: 'hace 2d',
    timeEn: '2d ago',
    icon: 'warning-outline' as keyof typeof Ionicons.glyphMap,
    color: '#f87171',
  },
];

const STEPS: { icon: keyof typeof Ionicons.glyphMap; titleEs: string; titleEn: string; descEs: string; descEn: string }[] = [
  { icon: 'list-outline', titleEs: 'Elige el tipo', titleEn: 'Choose the type', descEs: 'Ruta, punto de interés, alerta o reporte', descEn: 'Route, point of interest, alert or report' },
  { icon: 'create-outline', titleEs: 'Añade detalles', titleEn: 'Add details', descEs: 'Nombre, descripción y ubicación', descEn: 'Name, description and location' },
  { icon: 'checkmark-done-outline', titleEs: 'Envía', titleEn: 'Submit', descEs: 'El equipo revisa en 24–48 horas', descEn: 'The team reviews within 24–48 hours' },
];

export default function ContribuirScreen() {
  const { isDark } = useTheme();
  const { isOffline } = useNetwork();
  const { pending } = useContribStore();
  const { t, lang } = useLangStore();
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
              <Text style={styles.heroBrandText}>{t('COMUNIDAD', 'COMMUNITY')}</Text>
            </View>
            <Text style={styles.heroTitle}>{t('Sé parte del\nmapa vivo', 'Be part of\nthe living map')}</Text>
            <Text style={styles.heroSub}>
              {t(
                'Tu conocimiento en la montaña tiene valor. Más de 1.800 senderistas ya contribuyeron a hacer este mapa mejor.',
                'Your mountain knowledge has value. Over 1,800 hikers have already contributed to making this map better.',
              )}
            </Text>
            <View style={styles.heroCtas}>
              <Button label={t('Añadir contribución', 'Add contribution')} leftIcon="add" onPress={() => openModal()} />
            </View>
          </View>
        </ImageBackground>

        {/* ── STATS ── */}
        <View style={[styles.statsRow, { marginHorizontal: sidePad }]}>
          {STATS.map((s) => (
            <View key={s.labelEs} style={[styles.statCard, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Ionicons name={s.icon} size={18} color="#22c55e" style={{ marginBottom: 6 }} />
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: c.muted }]}>{lang === 'en' ? s.labelEn : s.labelEs}</Text>
            </View>
          ))}
        </View>

        {/* ── CONTRIBUTION TYPES ── */}
        <View style={[styles.section, { paddingHorizontal: sidePad }]}>
          <Text style={[styles.sectionTitle, { color: c.muted }]}>{t('¿QUÉ PUEDES APORTAR?', 'WHAT CAN YOU CONTRIBUTE?')}</Text>
          <View style={[styles.typesGrid, isWide && styles.typesGridWide]}>
            {CONTRIB_TYPES.map((ct) => (
              <TouchableOpacity
                key={ct.id}
                onPress={() => openModal(ct.id)}
                activeOpacity={0.78}
                style={[
                  styles.typeCard,
                  isWide && styles.typeCardWide,
                  { backgroundColor: c.surface, borderColor: c.border },
                ]}
              >
                <View style={[styles.typeIconWrap, { backgroundColor: ct.bg }]}>
                  <Ionicons name={ct.icon} size={22} color={ct.color} />
                </View>
                <View style={styles.typeText}>
                  <Text style={[styles.typeLabel, { color: c.text }]}>{lang === 'en' ? ct.labelEn : ct.labelEs}</Text>
                  <Text style={[styles.typeDesc, { color: c.muted }]}>{lang === 'en' ? ct.descEn : ct.descEs}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={c.muted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── COMMUNITY ACTIVITY ── */}
        <View style={[styles.section, { paddingHorizontal: sidePad }]}>
          <Text style={[styles.sectionTitle, { color: c.muted }]}>{t('ACTIVIDAD RECIENTE', 'RECENT ACTIVITY')}</Text>
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
                    {' '}{lang === 'en' ? a.actionEn : a.actionEs}
                  </Text>
                  <Text style={[styles.activityTime, { color: c.muted }]}>{lang === 'en' ? a.timeEn : a.timeEs}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ── MY CONTRIBUTIONS ── */}
        {pending.length > 0 && (
          <View style={[styles.section, { paddingHorizontal: sidePad }]}>
            <Text style={[styles.sectionTitle, { color: c.muted }]}>{t('MIS CONTRIBUCIONES', 'MY CONTRIBUTIONS')}</Text>
            {pending.slice(0, 5).map((p) => (
              <View key={p.id} style={[styles.pendingRow, { backgroundColor: c.surface, borderColor: c.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.pendingTitle, { color: c.text }]} numberOfLines={1}>{p.title}</Text>
                  <Text style={[styles.pendingType, { color: c.muted }]}>{p.type.replace('_', ' ')}</Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: p.synced ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)' }]}>
                  <Text style={[styles.statusText, { color: p.synced ? '#22c55e' : '#fbbf24' }]}>
                    {p.synced ? t('Enviada', 'Submitted') : t('Pendiente', 'Pending')}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ── HOW IT WORKS ── */}
        <View style={[styles.section, { paddingHorizontal: sidePad }]}>
          <Text style={[styles.sectionTitle, { color: c.muted }]}>{t('¿CÓMO FUNCIONA?', 'HOW DOES IT WORK?')}</Text>
          <View style={[styles.stepsCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            {STEPS.map((s, i) => (
              <View
                key={s.titleEs}
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
                  <Text style={[styles.stepTitle, { color: c.text }]}>{lang === 'en' ? s.titleEn : s.titleEs}</Text>
                  <Text style={[styles.stepDesc, { color: c.muted }]}>{lang === 'en' ? s.descEn : s.descEs}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ── OPEN STREET MAP ── */}
        <View style={[styles.section, { paddingHorizontal: sidePad }]}>
          <Text style={[styles.sectionTitle, { color: c.muted }]}>{t('MEJORÁ EL MAPA ABIERTO', 'IMPROVE THE OPEN MAP')}</Text>
          <View style={[styles.osmCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <View style={styles.osmHead}>
              <View style={[styles.typeIconWrap, { backgroundColor: 'rgba(255,107,53,0.14)' }]}>
                <Ionicons name="git-network-outline" size={22} color="#FF6B35" />
              </View>
              <Text style={[styles.osmTitle, { color: c.text }]}>OpenStreetMap</Text>
            </View>
            <Text style={[styles.osmText, { color: c.muted }]}>
              {t(
                'Nuestros senderos vienen de OpenStreetMap, el mapa libre del mundo. Si encontrás un sendero mal trazado o faltante, corregilo ahí: tu aporte mejora el mapa para todos y vuelve a Sliabh automáticamente.',
                'Our trails come from OpenStreetMap, the world’s free map. If you find a wrong or missing trail, fix it there: your edit improves the map for everyone and flows back into Sliabh automatically.',
              )}
            </Text>
            <View style={styles.osmBtns}>
              <TouchableOpacity
                style={[styles.osmBtn, { backgroundColor: '#FF6B35' }]}
                activeOpacity={0.85}
                onPress={() => Linking.openURL('https://www.openstreetmap.org/note/new')}
              >
                <Ionicons name="flag-outline" size={15} color="#fff" />
                <Text style={styles.osmBtnTxt}>{t('Reportar en OSM', 'Report on OSM')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.osmBtn, { backgroundColor: c.elevated, borderWidth: 1, borderColor: c.border }]}
                activeOpacity={0.85}
                onPress={() => Linking.openURL('https://www.openstreetmap.org/edit')}
              >
                <Ionicons name="create-outline" size={15} color={c.text} />
                <Text style={[styles.osmBtnTxt, { color: c.text }]}>{t('Editar el mapa', 'Edit the map')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── CREDITS / ATTRIBUTIONS ── */}
        <View style={[styles.section, { paddingHorizontal: sidePad }]}>
          <Text style={[styles.sectionTitle, { color: c.muted }]}>{t('CRÉDITOS Y FUENTES', 'CREDITS & SOURCES')}</Text>
          <View style={[styles.stepsCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            {[
              { name: 'OpenStreetMap', lic: 'ODbL', desc: t('Geometría de senderos', 'Trail geometry'), url: 'https://www.openstreetmap.org/copyright' },
              { name: 'Wikimedia Commons', lic: 'CC', desc: t('Fotos de lugares', 'Place photos'), url: 'https://commons.wikimedia.org/' },
              { name: 'Esri World Imagery', lic: '©', desc: t('Imágenes satelitales 3D', '3D satellite imagery'), url: 'https://www.esri.com/' },
            ].map((src, i, arr) => (
              <TouchableOpacity
                key={src.name}
                onPress={() => Linking.openURL(src.url)}
                activeOpacity={0.8}
                style={[styles.stepRow, i < arr.length - 1 && styles.stepRowBorder, i < arr.length - 1 && { borderBottomColor: c.border }]}
              >
                <View style={[styles.stepIcon, { backgroundColor: c.elevated }]}>
                  <Ionicons name="library-outline" size={18} color="#22c55e" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.stepTitle, { color: c.text }]}>{src.name} <Text style={{ color: c.muted, fontWeight: '500', fontSize: 12 }}>· {src.lic}</Text></Text>
                  <Text style={[styles.stepDesc, { color: c.muted }]}>{src.desc}</Text>
                </View>
                <Ionicons name="open-outline" size={15} color={c.muted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── OFFLINE NOTE ── */}
        <View style={[styles.offlineNote, { marginHorizontal: sidePad }]}>
          <Ionicons name="flash-outline" size={16} color="#fbbf24" />
          <Text style={styles.offlineNoteText}>
            {isOffline && unsynced.length > 0
              ? t(`${unsynced.length} contribución(es) se enviarán al reconectar.`, `${unsynced.length} contribution(s) will be sent when reconnected.`)
              : t('Funciona sin conexión. Sincronización automática al reconectar.', 'Works offline. Automatic sync when reconnected.')}
          </Text>
        </View>

        {Platform.OS === 'web' && <WebFooter />}
      </ScrollView>

      <Modal visible={modalOpen} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: c.bg }}>
          <View style={[styles.modalHeader, { borderBottomColor: c.border }]}>
            <Text style={[styles.modalTitle, { color: c.text }]}>{t('Nueva contribución', 'New contribution')}</Text>
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

  osmCard: { borderRadius: 20, borderWidth: 1, padding: 18 },
  osmHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  osmTitle: { fontSize: 17, fontWeight: '800' },
  osmText: { fontSize: 13, lineHeight: 20, marginBottom: 16 },
  osmBtns: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  osmBtn: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 16, paddingVertical: 11, borderRadius: 12 },
  osmBtnTxt: { color: '#fff', fontSize: 13, fontWeight: '700' },

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
