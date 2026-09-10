import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, useWindowDimensions, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useLangStore } from '../../store/langStore';
import { isSupabaseConfigured, fetchApprovedGuides, submitGuideApplication, Guide } from '../../services/supabase';
import { TRAIL_REGIONS, regionLabel, TrailRegion } from '../../data/argentinaTrails';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const APPLICABLE_REGIONS = TRAIL_REGIONS.filter((r) => r !== 'Todas') as Exclude<TrailRegion, 'Todas'>[];

/**
 * Public guide directory ("Guías") + application form, mirroring the shape
 * of SponsorsAndAbout.tsx: an intro section, a filterable list of approved
 * guides (featured ones first — that's the paid-placement product), and a
 * self-serve application form that lands as a pending row for manual review.
 *
 * Verification and featured placement are both operational (not automated)
 * for v1: an admin reviews applications and toggles `verified`/`featured`
 * from the Supabase dashboard after confirming credentials and, for
 * `featured`, coordinating payment directly with the guide.
 */
export function GuidesDirectory() {
  const { theme } = useThemeStore();
  const { t, lang } = useLangStore();
  const isDark = theme === 'dark';
  const { width } = useWindowDimensions();
  const isNarrow = width < 760;

  const c = isDark
    ? { bg: '#040810', surface: '#070b14', surface2: '#0c121f', border: '#1e2d42', text: '#f0f9ff', muted: '#8ea0b8', accent: '#22c55e', accentInk: '#052e16', gold: '#f59e0b' }
    : { bg: '#f1f5f9', surface: '#ffffff', surface2: '#e2e8f0', border: '#cbd5e1', text: '#0f172a', muted: '#475569', accent: '#16a34a', accentInk: '#ffffff', gold: '#b45309' };

  return (
    <View style={{ backgroundColor: c.bg }}>
      <Intro c={c} t={t} />
      <GuideList c={c} t={t} lang={lang} isNarrow={isNarrow} />
      <ApplyForm c={c} t={t} isNarrow={isNarrow} />
    </View>
  );
}

function Intro({ c, t }: { c: any; t: (es: string, en: string) => string }) {
  return (
    <View style={[styles.section, { borderColor: c.border, borderBottomWidth: 1, paddingBottom: 40 }]}>
      <Text style={[styles.eyebrow, { color: c.accent }]}>{t('GUÍAS DE MONTAÑA', 'MOUNTAIN GUIDES')}</Text>
      <Text style={[styles.title, { color: c.text }]}>{t('Encontrá un guía para tu próxima salida', 'Find a guide for your next trip')}</Text>
      <Text style={[styles.intro, { color: c.muted }]}>
        {t(
          'Un directorio de guías de montaña que ya conocen el terreno. Sliabh no organiza ni cobra las excursiones — te ponemos en contacto directo con el guía, vos coordinás todo con él.',
          "A directory of mountain guides who already know the terrain. Sliabh doesn't run or charge for the trips — we connect you directly with the guide, you coordinate everything with them.",
        )}
      </Text>
      <View style={[styles.disclaimer, { borderColor: c.border, backgroundColor: c.surface }]}>
        <Ionicons name="information-circle-outline" size={16} color={c.muted} />
        <Text style={[styles.disclaimerTxt, { color: c.muted }]}>
          {t(
            '"Verificado" significa que confirmamos manualmente la certificación declarada por el guía. Sliabh no es responsable por los servicios que cada guía preste — revisá sus credenciales antes de contratar.',
            '"Verified" means we manually confirmed the certification the guide declared. Sliabh is not responsible for the services each guide provides — check their credentials before hiring.',
          )}
        </Text>
      </View>
    </View>
  );
}

function GuideList({ c, t, lang, isNarrow }: { c: any; t: (es: string, en: string) => string; lang: 'es' | 'en'; isNarrow: boolean }) {
  const [guides, setGuides] = useState<Guide[] | null>(null);
  const [region, setRegion] = useState<TrailRegion>('Todas');

  useEffect(() => {
    fetchApprovedGuides().then(setGuides);
  }, []);

  const filtered = useMemo(() => {
    if (!guides) return [];
    if (region === 'Todas') return guides;
    return guides.filter((g) => g.regions.includes(region));
  }, [guides, region]);

  return (
    <View style={[styles.section, { borderColor: c.border, borderBottomWidth: 1 }]}>
      <View style={[styles.chipsRow]}>
        {(['Todas', ...APPLICABLE_REGIONS] as TrailRegion[]).map((r) => {
          const active = region === r;
          return (
            <TouchableOpacity
              key={r}
              onPress={() => setRegion(r)}
              style={[styles.chip, { borderColor: active ? c.accent : c.border, backgroundColor: active ? c.accent : c.surface }]}
            >
              <Text style={[styles.chipTxt, { color: active ? c.accentInk : c.muted }]}>{regionLabel(r, lang)}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {guides === null ? (
        <Text style={[styles.emptyTxt, { color: c.muted }]}>{t('Cargando guías…', 'Loading guides…')}</Text>
      ) : filtered.length === 0 ? (
        <Text style={[styles.emptyTxt, { color: c.muted }]}>
          {t('Todavía no hay guías publicados en esta región. ¡Sé el primero en sumarte!', "No guides published in this region yet. Be the first to join!")}
        </Text>
      ) : (
        <View style={[styles.guideGrid, isNarrow && styles.guideGridNarrow]}>
          {filtered.map((g) => <GuideCard key={g.id} guide={g} c={c} t={t} />)}
        </View>
      )}
    </View>
  );
}

function GuideCard({ guide, c, t }: { guide: Guide; c: any; t: (es: string, en: string) => string }) {
  const link = guide.website || (guide.instagram ? `https://instagram.com/${guide.instagram.replace(/^@/, '')}` : null);
  return (
    <View style={[styles.guideCard, { borderColor: guide.featured ? c.gold : c.border, backgroundColor: c.surface }]}>
      {guide.featured && (
        <View style={[styles.featuredBadge, { backgroundColor: c.gold }]}>
          <Ionicons name="star" size={11} color="#1c1206" />
          <Text style={styles.featuredBadgeTxt}>{t('Destacado', 'Featured')}</Text>
        </View>
      )}
      <Text style={[styles.guideName, { color: c.text }]}>{guide.full_name}</Text>
      {guide.verified && (
        <View style={styles.verifiedRow}>
          <Ionicons name="checkmark-circle" size={13} color={c.accent} />
          <Text style={[styles.verifiedTxt, { color: c.accent }]}>{t('Verificado por Sliabh', 'Verified by Sliabh')}</Text>
        </View>
      )}
      <View style={styles.regionRow}>
        {guide.regions.map((r) => (
          <View key={r} style={[styles.regionTag, { backgroundColor: c.surface2 }]}>
            <Text style={[styles.regionTagTxt, { color: c.muted }]}>{r}</Text>
          </View>
        ))}
      </View>
      {guide.certification && <Text style={[styles.guideCert, { color: c.muted }]}>{guide.certification}</Text>}
      {guide.specialties && <Text style={[styles.guideSpec, { color: c.text }]}>{guide.specialties}</Text>}
      {guide.bio && <Text style={[styles.guideBio, { color: c.muted }]} numberOfLines={3}>{guide.bio}</Text>}
      {link && (
        <TouchableOpacity onPress={() => Linking.openURL(link)} style={styles.guideLinkRow}>
          <Ionicons name="link-outline" size={13} color={c.accent} />
          <Text style={[styles.guideLinkTxt, { color: c.accent }]}>{t('Ver contacto', 'View contact')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function ApplyForm({ c, t, isNarrow }: { c: any; t: (es: string, en: string) => string; isNarrow: boolean }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [regions, setRegions] = useState<TrailRegion[]>([]);
  const [specialties, setSpecialties] = useState('');
  const [certification, setCertification] = useState('');
  const [bio, setBio] = useState('');
  const [instagram, setInstagram] = useState('');
  const [website, setWebsite] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  function toggleRegion(r: TrailRegion) {
    setRegions((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));
  }

  async function submit() {
    if (pending) return;
    if (!fullName.trim()) {
      setError(t('Completá tu nombre.', 'Enter your name.'));
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      setError(t('Ingresá un email válido.', 'Enter a valid email.'));
      return;
    }
    if (regions.length === 0) {
      setError(t('Elegí al menos una región donde guiás.', 'Pick at least one region where you guide.'));
      return;
    }
    if (!isSupabaseConfigured()) {
      setError(t('No disponible en este momento.', 'Not available right now.'));
      return;
    }
    setError(null);
    setPending(true);
    try {
      await submitGuideApplication({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        regions,
        specialties: specialties.trim(),
        certification: certification.trim(),
        bio: bio.trim(),
        instagram: instagram.trim(),
        website: website.trim(),
      });
      setDone(true);
    } catch {
      setError(t('No se pudo enviar. Probá de nuevo.', "Couldn't submit. Please try again."));
    } finally {
      setPending(false);
    }
  }

  return (
    <View {...({ id: 'guides-form' } as any)} style={[styles.section]}>
      <Text style={[styles.eyebrow, { color: c.accent }]}>{t('¿SOS GUÍA DE MONTAÑA?', 'ARE YOU A MOUNTAIN GUIDE?')}</Text>
      <Text style={[styles.formSectionTitle, { color: c.text }]}>{t('Sumate al directorio', 'Join the directory')}</Text>
      <Text style={[styles.intro, { color: c.muted, marginBottom: 28 }]}>
        {t(
          'Publicar tu perfil es gratis. Si querés aparecer destacado arriba de tu región, contanos en el mensaje y coordinamos el pago.',
          "Publishing your profile is free. If you want to appear featured at the top of your region, mention it in the message and we'll coordinate payment.",
        )}
      </Text>

      <View style={[styles.formCard, { borderColor: c.border, backgroundColor: c.surface }]}>
        {done ? (
          <View style={styles.doneBox}>
            <Ionicons name="checkmark-circle" size={40} color={c.accent} />
            <Text style={[styles.doneTitle, { color: c.text }]}>{t('¡Gracias! Recibimos tu postulación.', 'Thanks! We received your application.')}</Text>
            <Text style={[styles.doneSub, { color: c.muted }]}>
              {t('La revisamos y te contactamos por email antes de publicarla.', "We'll review it and reach out by email before publishing it.")}
            </Text>
          </View>
        ) : (
          <>
            <View style={[styles.formGrid, isNarrow && styles.formGridNarrow]}>
              <Field c={c} isNarrow={isNarrow} label={t('Nombre completo', 'Full name')} value={fullName} onChangeText={setFullName} placeholder="Juan Pérez" editable={!pending} />
              <Field c={c} isNarrow={isNarrow} label={t('Email', 'Email')} value={email} onChangeText={setEmail} placeholder="juan@email.com" keyboardType="email-address" autoCapitalize="none" editable={!pending} />
              <Field c={c} isNarrow={isNarrow} label={t('WhatsApp', 'WhatsApp')} value={phone} onChangeText={setPhone} placeholder="+54 9 294 000-0000" keyboardType="phone-pad" editable={!pending} />
              <Field c={c} isNarrow={isNarrow} label={t('Certificación', 'Certification')} value={certification} onChangeText={setCertification} placeholder={t('Ej: AAGM — Guía de Media Montaña', 'e.g. AAGM — Mid-mountain Guide')} editable={!pending} />
              <Field c={c} isNarrow={isNarrow} label={t('Especialidades', 'Specialties')} value={specialties} onChangeText={setSpecialties} placeholder={t('Trekking, alta montaña, escalada…', 'Trekking, high mountain, climbing…')} full editable={!pending} />
              <Field c={c} isNarrow={isNarrow} label="Instagram" value={instagram} onChangeText={setInstagram} placeholder="@tuguia" autoCapitalize="none" editable={!pending} />
              <Field c={c} isNarrow={isNarrow} label={t('Sitio web', 'Website')} value={website} onChangeText={setWebsite} placeholder="https://" autoCapitalize="none" editable={!pending} />
              <Field c={c} isNarrow={isNarrow} label={t('Sobre vos / mensaje', 'About you / message')} value={bio} onChangeText={setBio} placeholder={t('Contanos tu experiencia y si te interesa destacarte…', "Tell us your experience, and mention if you're interested in being featured…")} multiline full editable={!pending} />
            </View>

            <View style={styles.regionPickWrap}>
              <Text style={[styles.fieldLabel, { color: c.muted, marginBottom: 8 }]}>{t('Regiones donde guiás', 'Regions where you guide')}</Text>
              <View style={styles.chipsRow}>
                {APPLICABLE_REGIONS.map((r) => {
                  const active = regions.includes(r);
                  return (
                    <TouchableOpacity
                      key={r}
                      onPress={() => toggleRegion(r)}
                      disabled={pending}
                      style={[styles.chip, { borderColor: active ? c.accent : c.border, backgroundColor: active ? c.accent : c.surface2 }]}
                    >
                      <Text style={[styles.chipTxt, { color: active ? c.accentInk : c.muted }]}>{r}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {error && <Text style={styles.errorTxt}>{error}</Text>}
            <View style={[styles.submitRow, isNarrow && styles.submitRowNarrow]}>
              <Text style={[styles.fineprint, { color: c.muted }]}>
                {t('Al enviar aceptás que guardemos estos datos para revisar tu postulación.', "By submitting, you agree we'll store this info to review your application.")}
              </Text>
              <TouchableOpacity onPress={submit} disabled={pending} style={[styles.submitBtn, { backgroundColor: c.accent, opacity: pending ? 0.6 : 1 }]} activeOpacity={0.85}>
                <Text style={[styles.submitBtnTxt, { color: c.accentInk }]}>{pending ? t('Enviando…', 'Sending…') : t('Enviar postulación', 'Send application')}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

function Field({
  c, label, value, onChangeText, placeholder, full, multiline, keyboardType, autoCapitalize, editable, isNarrow,
}: {
  c: any; label: string; value: string; onChangeText: (v: string) => void; placeholder: string;
  full?: boolean; multiline?: boolean; keyboardType?: any; autoCapitalize?: any; editable?: boolean; isNarrow?: boolean;
}) {
  return (
    <View style={[fieldStyles.field, (full || isNarrow) && fieldStyles.fieldFull]}>
      <Text style={[styles.fieldLabel, { color: c.muted }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.muted}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        editable={editable}
        multiline={multiline}
        style={[
          fieldStyles.input,
          multiline && fieldStyles.inputMultiline,
          { borderColor: c.border, backgroundColor: c.surface2, color: c.text },
        ]}
      />
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  field: { width: '47%', gap: 6 },
  fieldFull: { width: '100%' },
  input: { borderWidth: 1, borderRadius: 10, paddingVertical: 11, paddingHorizontal: 13, fontSize: 14 },
  inputMultiline: { minHeight: 96, textAlignVertical: 'top' },
});

const styles = StyleSheet.create({
  section: { maxWidth: 1080, width: '100%', alignSelf: 'center', paddingHorizontal: 24, paddingVertical: 48 },
  eyebrow: { fontSize: 11.5, fontWeight: '700', letterSpacing: 1.2, marginBottom: 10 },
  title: { fontSize: 32, fontWeight: '800', marginBottom: 14 },
  intro: { fontSize: 15.5, lineHeight: 24, maxWidth: 680 },
  disclaimer: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', borderWidth: 1, borderRadius: 12, padding: 14, marginTop: 20, maxWidth: 680 },
  disclaimerTxt: { flex: 1, fontSize: 12.5, lineHeight: 18 },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  chip: { borderWidth: 1, borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14 },
  chipTxt: { fontSize: 12.5, fontWeight: '700' },
  emptyTxt: { fontSize: 14, lineHeight: 22, paddingVertical: 20 },

  guideGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  guideGridNarrow: { flexDirection: 'column' },
  guideCard: { width: 320, maxWidth: '100%', borderWidth: 1, borderRadius: 16, padding: 18, gap: 6 },
  featuredBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', borderRadius: 999, paddingVertical: 3, paddingHorizontal: 9, marginBottom: 6 },
  featuredBadgeTxt: { fontSize: 10.5, fontWeight: '800', color: '#1c1206' },
  guideName: { fontSize: 17, fontWeight: '800' },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  verifiedTxt: { fontSize: 11.5, fontWeight: '700' },
  regionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 4 },
  regionTag: { borderRadius: 999, paddingVertical: 3, paddingHorizontal: 9 },
  regionTagTxt: { fontSize: 11, fontWeight: '600' },
  guideCert: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  guideSpec: { fontSize: 13.5, lineHeight: 19, marginTop: 4 },
  guideBio: { fontSize: 12.5, lineHeight: 18, marginTop: 4 },
  guideLinkRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  guideLinkTxt: { fontSize: 12.5, fontWeight: '700' },

  formSectionTitle: { fontSize: 28, fontWeight: '800', marginBottom: 12 },
  formCard: { borderWidth: 1, borderRadius: 20, padding: Platform.OS === 'web' ? 36 : 20 },
  formGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, rowGap: 18 },
  formGridNarrow: { flexDirection: 'column' },
  fieldLabel: { fontSize: 12.5, fontWeight: '700' },
  regionPickWrap: { marginTop: 22 },
  errorTxt: { color: '#ef4444', fontSize: 12.5, fontWeight: '600', marginTop: 14 },
  submitRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginTop: 22 },
  submitRowNarrow: { flexDirection: 'column', alignItems: 'flex-start' },
  fineprint: { fontSize: 11.5, flex: 1, maxWidth: 420 },
  submitBtn: { borderRadius: 10, paddingVertical: 13, paddingHorizontal: 28 },
  submitBtnTxt: { fontSize: 14.5, fontWeight: '800' },
  doneBox: { alignItems: 'center', gap: 10, paddingVertical: 24 },
  doneTitle: { fontSize: 17, fontWeight: '800' },
  doneSub: { fontSize: 13.5 },
});
