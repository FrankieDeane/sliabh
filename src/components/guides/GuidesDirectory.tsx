import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, useWindowDimensions, Image, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useLangStore } from '../../store/langStore';
import { isSupabaseConfigured, uploadGuidePhoto, createGuideCheckout } from '../../services/supabase';
import { ARGENTINA_TRAILS } from '../../data/argentinaTrails';
import { BARILOCHE_TRAILS } from '../../data/barilocheTreks';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PRICE_ARS = 10000; // kept in sync with the server default in create-guide-checkout/index.ts
const MAX_TRAILS = 20;

// Same hero image as the homepage (app/(tabs)/inicio.tsx HERO_URI) — reused
// rather than a new asset so the page reads as part of the same site.
const HERO_URI = 'https://images.unsplash.com/photo-1469521669194-babb45599def?w=1920&q=90&fit=crop&auto=format';

// One flat {id, name} list to search/pick from — every trail in the app,
// Argentina-wide + the Bariloche set, same combined source rutas.tsx uses.
const ALL_TRAILS_LIST: { id: string; name: string }[] = [...ARGENTINA_TRAILS, ...BARILOCHE_TRAILS]
  .map((t) => ({ id: t.id, name: t.name }));

/**
 * "Guías" page: explains the per-trail paid-listing model and hosts the
 * application form. Discovery itself happens on each trail's own page
 * (see TrailGuidesSection in ruta/[id].tsx) — this page is the signup
 * funnel, not a browsable directory.
 */
export function GuidesDirectory() {
  const { theme } = useThemeStore();
  const { t } = useLangStore();
  const isDark = theme === 'dark';
  const { width } = useWindowDimensions();
  const isNarrow = width < 760;

  const c = isDark
    ? { bg: '#040810', surface: '#070b14', surface2: '#0c121f', border: '#1e2d42', text: '#f0f9ff', muted: '#8ea0b8', accent: '#22c55e', accentInk: '#052e16' }
    : { bg: '#f1f5f9', surface: '#ffffff', surface2: '#e2e8f0', border: '#cbd5e1', text: '#0f172a', muted: '#475569', accent: '#16a34a', accentInk: '#ffffff' };

  return (
    <View style={{ backgroundColor: c.bg }}>
      <Hero t={t} />
      <Intro c={c} t={t} />
      <ApplyForm c={c} t={t} isNarrow={isNarrow} />
    </View>
  );
}

function Hero({ t }: { t: (es: string, en: string) => string }) {
  return (
    <ImageBackground source={{ uri: HERO_URI }} style={styles.hero} resizeMode="cover">
      <View style={styles.heroOverlay} />
      <View style={styles.heroContent}>
        <Text style={styles.heroEyebrow}>{t('GUÍAS DE MONTAÑA', 'MOUNTAIN GUIDES')}</Text>
        <Text style={styles.heroTitle}>{t('Publicá tu perfil en cada sendero', 'List your profile on every trail')}</Text>
      </View>
    </ImageBackground>
  );
}

function Intro({ c, t }: { c: any; t: (es: string, en: string) => string }) {
  return (
    <View style={[styles.section, { borderColor: c.border, borderBottomWidth: 1, paddingBottom: 40 }]}>
      <Text style={[styles.intro, { color: c.muted }]}>
        {t(
          `Elegí los senderos donde sos experto y aparecé directo en esa página, donde miles de personas planifican su salida. $${PRICE_ARS.toLocaleString('es-AR')} ARS por sendero, por año — mismo precio para todos, publicación automática en cuanto se acredita el pago.`,
          `Pick the trails you're an expert on and appear right on that page, where thousands of people plan their trip. $${PRICE_ARS.toLocaleString('en-US')} ARS per trail, per year — same price for everyone, published automatically the moment payment clears.`,
        )}
      </Text>
      <View style={[styles.disclaimer, { borderColor: c.border, backgroundColor: c.surface }]}>
        <Ionicons name="information-circle-outline" size={16} color={c.muted} />
        <Text style={[styles.disclaimerTxt, { color: c.muted }]}>
          {t(
            'Sliabh no organiza ni cobra las excursiones — te ponemos en contacto, vos coordinás todo directamente. Revisá tus propias credenciales antes de guiar.',
            "Sliabh doesn't run or charge for the trips — we connect you, you coordinate everything directly. Make sure your own credentials are in order before guiding.",
          )}
        </Text>
      </View>
    </View>
  );
}

function ApplyForm({ c, t, isNarrow }: { c: any; t: (es: string, en: string) => string; isNarrow: boolean }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [specialties, setSpecialties] = useState('');
  const [certification, setCertification] = useState('');
  const [bio, setBio] = useState('');
  const [instagram, setInstagram] = useState('');
  const [website, setWebsite] = useState('');
  const [newsletterOptIn, setNewsletterOptIn] = useState(true);

  const [trailQuery, setTrailQuery] = useState('');
  const [selectedTrails, setSelectedTrails] = useState<{ id: string; name: string }[]>([]);

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const matches = useMemo(() => {
    const q = trailQuery.trim().toLowerCase();
    if (!q) return [];
    const selectedIds = new Set(selectedTrails.map((x) => x.id));
    return ALL_TRAILS_LIST.filter((tr) => !selectedIds.has(tr.id) && tr.name.toLowerCase().includes(q)).slice(0, 8);
  }, [trailQuery, selectedTrails]);

  function addTrail(trail: { id: string; name: string }) {
    if (selectedTrails.length >= MAX_TRAILS) return;
    setSelectedTrails((prev) => [...prev, trail]);
    setTrailQuery('');
  }

  function removeTrail(id: string) {
    setSelectedTrails((prev) => prev.filter((x) => x.id !== id));
  }

  async function handlePickPhoto(e: any) {
    const file: File | undefined = e.target?.files?.[0];
    if (!file) return;
    if (!isSupabaseConfigured()) {
      setError(t('No disponible en este momento.', 'Not available right now.'));
      return;
    }
    setPhotoUploading(true);
    setError(null);
    try {
      const url = await uploadGuidePhoto(file);
      setPhotoUrl(url);
    } catch {
      setError(t('No se pudo subir la foto. Probá con otra imagen.', "Couldn't upload the photo. Try a different image."));
    } finally {
      setPhotoUploading(false);
    }
  }

  const totalPrice = PRICE_ARS * selectedTrails.length;

  async function submit() {
    if (pending) return;
    if (!fullName.trim()) return setError(t('Completá tu nombre.', 'Enter your name.'));
    if (!EMAIL_RE.test(email.trim())) return setError(t('Ingresá un email válido.', 'Enter a valid email.'));
    if (selectedTrails.length === 0) return setError(t('Elegí al menos un sendero.', 'Pick at least one trail.'));
    if (!isSupabaseConfigured()) return setError(t('No disponible en este momento.', 'Not available right now.'));

    setError(null);
    setPending(true);
    try {
      const { checkoutUrl } = await createGuideCheckout({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        photoUrl: photoUrl || '',
        trailIds: selectedTrails.map((x) => x.id),
        specialties: specialties.trim(),
        certification: certification.trim(),
        bio: bio.trim(),
        instagram: instagram.trim(),
        website: website.trim(),
        newsletterOptIn,
      });
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.location.href = checkoutUrl;
      }
    } catch {
      setError(t('No se pudo iniciar el pago. Probá de nuevo.', "Couldn't start the payment. Please try again."));
      setPending(false);
    }
  }

  return (
    <View {...({ id: 'guides-form' } as any)} style={[styles.section]}>
      <Text style={[styles.eyebrow, { color: c.accent }]}>{t('¿SOS GUÍA DE MONTAÑA?', 'ARE YOU A MOUNTAIN GUIDE?')}</Text>
      <Text style={[styles.formSectionTitle, { color: c.text }]}>{t('Postulá tu perfil', 'Apply now')}</Text>

      <View style={[styles.formCard, { borderColor: c.border, backgroundColor: c.surface }]}>
        {/* Photo (web only for v1) */}
        {Platform.OS === 'web' && (
          <View style={styles.photoRow}>
            <View style={[styles.photoPreview, { borderColor: c.border, backgroundColor: c.surface2 }]}>
              {photoUrl ? (
                <Image source={{ uri: photoUrl }} style={{ width: '100%', height: '100%', borderRadius: 40 }} />
              ) : (
                <Ionicons name="person-outline" size={28} color={c.muted} />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldLabel, { color: c.muted, marginBottom: 8 }]}>{t('Foto de perfil', 'Profile photo')}</Text>
              {/* @ts-ignore — plain web file input */}
              <input type="file" accept="image/*" onChange={handlePickPhoto} disabled={photoUploading} />
              {photoUploading && <Text style={{ color: c.muted, fontSize: 12, marginTop: 4 }}>{t('Subiendo…', 'Uploading…')}</Text>}
            </View>
          </View>
        )}

        <View style={[styles.formGrid, isNarrow && styles.formGridNarrow]}>
          <Field c={c} isNarrow={isNarrow} label={t('Nombre completo', 'Full name')} value={fullName} onChangeText={setFullName} placeholder="Juan Pérez" editable={!pending} />
          <Field c={c} isNarrow={isNarrow} label={t('Email', 'Email')} value={email} onChangeText={setEmail} placeholder="juan@email.com" keyboardType="email-address" autoCapitalize="none" editable={!pending} />
          <Field c={c} isNarrow={isNarrow} label={t('WhatsApp (link o número)', 'WhatsApp (link or number)')} value={phone} onChangeText={setPhone} placeholder="+54 9 294 000-0000" editable={!pending} />
          <Field c={c} isNarrow={isNarrow} label={t('Certificación', 'Certification')} value={certification} onChangeText={setCertification} placeholder={t('Ej: AAGM — Guía de Media Montaña', 'e.g. AAGM — Mid-mountain Guide')} editable={!pending} />
          <Field c={c} isNarrow={isNarrow} label="Instagram" value={instagram} onChangeText={setInstagram} placeholder="@tuguia" autoCapitalize="none" editable={!pending} />
          <Field c={c} isNarrow={isNarrow} label={t('Sitio web', 'Website')} value={website} onChangeText={setWebsite} placeholder="https://" autoCapitalize="none" editable={!pending} />
          <Field c={c} isNarrow={isNarrow} label={t('Especialidades', 'Specialties')} value={specialties} onChangeText={setSpecialties} placeholder={t('Trekking, alta montaña, escalada…', 'Trekking, high mountain, climbing…')} full editable={!pending} />
          <Field c={c} isNarrow={isNarrow} label={t('Por qué te especializás en estos senderos', 'Why you specialize in these trails')} value={bio} onChangeText={setBio} placeholder={t('Contanos tu experiencia en estos senderos…', 'Tell us your experience on these trails…')} multiline full editable={!pending} />
        </View>

        {/* Trail picker */}
        <View style={styles.trailPickWrap}>
          <Text style={[styles.fieldLabel, { color: c.muted, marginBottom: 8 }]}>
            {t('Senderos donde sos experto', 'Trails you specialize in')}
          </Text>
          <TextInput
            value={trailQuery}
            onChangeText={setTrailQuery}
            placeholder={t('Buscar sendero por nombre…', 'Search trail by name…')}
            placeholderTextColor={c.muted}
            editable={!pending}
            style={[fieldStyles.input, { borderColor: c.border, backgroundColor: c.surface2, color: c.text }]}
          />
          {matches.length > 0 && (
            <View style={[styles.trailResults, { borderColor: c.border, backgroundColor: c.surface2 }]}>
              {matches.map((tr) => (
                <TouchableOpacity key={tr.id} onPress={() => addTrail(tr)} style={styles.trailResultRow}>
                  <Text style={{ color: c.text, fontSize: 13.5 }}>{tr.name}</Text>
                  <Ionicons name="add-circle-outline" size={18} color={c.accent} />
                </TouchableOpacity>
              ))}
            </View>
          )}
          {selectedTrails.length > 0 && (
            <View style={styles.chipsRow}>
              {selectedTrails.map((tr) => (
                <View key={tr.id} style={[styles.trailChip, { borderColor: c.accent, backgroundColor: c.surface2 }]}>
                  <Text style={{ color: c.text, fontSize: 12.5, fontWeight: '700' }}>{tr.name}</Text>
                  <TouchableOpacity onPress={() => removeTrail(tr.id)}>
                    <Ionicons name="close-circle" size={16} color={c.muted} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Newsletter opt-in */}
        <TouchableOpacity onPress={() => setNewsletterOptIn((v) => !v)} style={styles.checkboxRow} disabled={pending}>
          <Ionicons name={newsletterOptIn ? 'checkbox' : 'square-outline'} size={20} color={c.accent} />
          <Text style={{ color: c.muted, fontSize: 12.5, flex: 1 }}>
            {t('Quiero recibir novedades y ofertas de Sliabh por email.', 'I want to receive Sliabh news and offers by email.')}
          </Text>
        </TouchableOpacity>

        {/* Price summary */}
        <View style={[styles.priceBox, { borderColor: c.accent, backgroundColor: c.surface2 }]}>
          <Text style={{ color: c.muted, fontSize: 13 }}>
            {selectedTrails.length} {selectedTrails.length === 1 ? t('sendero', 'trail') : t('senderos', 'trails')} × ${PRICE_ARS.toLocaleString('es-AR')} ARS
          </Text>
          <Text style={{ color: c.text, fontSize: 22, fontWeight: '800' }}>
            ${totalPrice.toLocaleString('es-AR')} ARS <Text style={{ fontSize: 13, fontWeight: '600', color: c.muted }}>{t('/ año', '/ year')}</Text>
          </Text>
        </View>

        {error && <Text style={styles.errorTxt}>{error}</Text>}
        <View style={[styles.submitRow, isNarrow && styles.submitRowNarrow]}>
          <Text style={[styles.fineprint, { color: c.muted }]}>
            {t('Al continuar vas a pagar en Mercado Pago. Tu perfil se publica automáticamente al confirmarse el pago.', "You'll continue to Mercado Pago to pay. Your profile publishes automatically once payment is confirmed.")}
          </Text>
          <TouchableOpacity onPress={submit} disabled={pending || selectedTrails.length === 0} style={[styles.submitBtn, { backgroundColor: c.accent, opacity: pending || selectedTrails.length === 0 ? 0.6 : 1 }]} activeOpacity={0.85}>
            <Text style={[styles.submitBtnTxt, { color: c.accentInk }]}>
              {pending ? t('Redirigiendo…', 'Redirecting…') : t('Ir a pagar', 'Go to payment')}
            </Text>
          </TouchableOpacity>
        </View>
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
  hero: { width: '100%', height: Platform.OS === 'web' ? 320 : 220, justifyContent: 'flex-end' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(4,8,16,0.55)' },
  heroContent: { maxWidth: 1080, width: '100%', alignSelf: 'center', paddingHorizontal: 24, paddingBottom: 28 },
  heroEyebrow: { color: '#86efac', fontSize: 12, fontWeight: '800', letterSpacing: 1.2, marginBottom: 8 },
  heroTitle: { color: '#f0f9ff', fontSize: 34, fontWeight: '800', maxWidth: 620 },

  section: { maxWidth: 1080, width: '100%', alignSelf: 'center', paddingHorizontal: 24, paddingVertical: 48 },
  eyebrow: { fontSize: 11.5, fontWeight: '700', letterSpacing: 1.2, marginBottom: 10 },
  intro: { fontSize: 15.5, lineHeight: 24, maxWidth: 680, marginTop: 28 },
  disclaimer: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', borderWidth: 1, borderRadius: 12, padding: 14, marginTop: 20, maxWidth: 680 },
  disclaimerTxt: { flex: 1, fontSize: 12.5, lineHeight: 18 },

  formSectionTitle: { fontSize: 28, fontWeight: '800', marginBottom: 20 },
  formCard: { borderWidth: 1, borderRadius: 20, padding: Platform.OS === 'web' ? 36 : 20 },

  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24 },
  photoPreview: { width: 80, height: 80, borderRadius: 40, borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },

  formGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, rowGap: 18 },
  formGridNarrow: { flexDirection: 'column' },
  fieldLabel: { fontSize: 12.5, fontWeight: '700' },

  trailPickWrap: { marginTop: 22 },
  trailResults: { borderWidth: 1, borderRadius: 10, marginTop: 6, overflow: 'hidden' },
  trailResultRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, paddingHorizontal: 12 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  trailChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 },

  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 20 },

  priceBox: { borderWidth: 1.5, borderRadius: 14, padding: 16, marginTop: 22, gap: 4 },

  errorTxt: { color: '#ef4444', fontSize: 12.5, fontWeight: '600', marginTop: 14 },
  submitRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginTop: 22 },
  submitRowNarrow: { flexDirection: 'column', alignItems: 'flex-start' },
  fineprint: { fontSize: 11.5, flex: 1, maxWidth: 420 },
  submitBtn: { borderRadius: 10, paddingVertical: 13, paddingHorizontal: 28 },
  submitBtnTxt: { fontSize: 14.5, fontWeight: '800' },
});
