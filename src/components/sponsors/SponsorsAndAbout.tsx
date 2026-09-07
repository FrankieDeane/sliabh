import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useLangStore } from '../../store/langStore';
import { isSupabaseConfigured, submitSponsorLead } from '../../services/supabase';
import { LOGO_URI } from '../../constants/logo';

// Frankie's LinkedIn profile photo. NOTE: this is a signed LinkedIn CDN URL
// with an expiry baked in (~2026-09-24, per the `e=` query param) — it WILL
// break after that date. Replace with a permanent hosted URL, or a local
// asset committed to the repo, before then.
const FOUNDER_PHOTO_URI: string | null =
  'https://media.licdn.com/dms/image/v2/D4D03AQEiBuZWJQDd5g/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1727996963047?e=1790208000&v=beta&t=LfJSvPicAACSN4IasRB24yy-RqAV6JyoW6lYPkJO2Xw';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * "Sobre nosotros" (mission/founder) + sponsor inquiry form, both bilingual.
 * Lives on the home screen; the header's "Nosotros"/"Contactanos" nav links
 * scroll to #about-us / #sponsors-form (web only, see WebHeader's scrollTo).
 */
export function SponsorsAndAbout() {
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
      <AboutUs c={c} t={t} isNarrow={isNarrow} />
      <SponsorForm c={c} t={t} isNarrow={isNarrow} />
    </View>
  );
}

function AboutUs({ c, t, isNarrow }: { c: any; t: (es: string, en: string) => string; isNarrow: boolean }) {
  return (
    <View {...({ id: 'about-us' } as any)} style={[styles.section, { borderColor: c.border }]}>
      <View style={[styles.about, isNarrow && styles.aboutNarrow]}>
        <View style={[styles.avatarCol, isNarrow && styles.avatarColNarrow]}>
          <View style={[styles.avatarFrame, { borderColor: c.border, backgroundColor: c.surface2 }]}>
            {FOUNDER_PHOTO_URI ? (
              <Image source={{ uri: FOUNDER_PHOTO_URI }} style={styles.avatarImg} resizeMode="cover" />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person-outline" size={40} color={c.muted} />
                <Text style={[styles.avatarPlaceholderTxt, { color: c.muted }]}>
                  {t('Tu foto va acá', 'Your photo goes here')}
                </Text>
              </View>
            )}
          </View>
          <Image source={{ uri: LOGO_URI }} style={styles.logoBelow} resizeMode="contain" alt="Sliabh" />
        </View>

        <View style={styles.aboutBody}>
          <Text style={[styles.eyebrow, { color: c.accent }]}>{t('SOBRE NOSOTROS', 'ABOUT US')}</Text>
          <Text style={[styles.aboutTitle, { color: c.text }]}>{t('Somos Sliabh', 'We are Sliabh')}</Text>
          <Text style={[styles.aboutRole, { color: c.muted }]}>
            {t('Frankie Deane — Fundador & Digital Specialist', 'Frankie Deane — Founder & Digital Specialist')}
          </Text>

          <Text style={[styles.aboutP, { color: c.text }]}>
            {t(
              'Soy Frankie, especialista en marketing digital y datos, y arranqué Sliabh porque no encontraba una forma honesta de planificar un trekking en Argentina: información dispersa, desactualizada, o pensada para vender un tour antes que para llevarte a la montaña con seguridad.',
              "I'm Frankie, a digital marketing and data specialist, and I started Sliabh because I couldn't find an honest way to plan a trek in Argentina: scattered, outdated information, or content built to sell a tour rather than get you safely onto the mountain.",
            )}
          </Text>
          <Text style={[styles.aboutP, { color: c.text }]}>
            {t(
              'Sliabh —"montaña" en gaélico— es mi forma de unir dos cosas que me importan: la tecnología bien usada, y la naturaleza como algo que hay que conocer para querer cuidar.',
              'Sliabh — "mountain" in Gaelic — is my way of bringing together two things I care about: technology used well, and nature as something you have to know before you want to protect it.',
            )}
          </Text>

          <View style={[styles.missionBox, { borderColor: c.accent }]}>
            <Text style={[styles.missionLabel, { color: c.accent }]}>{t('NUESTRA MISIÓN', 'OUR MISSION')}</Text>
            <Text style={[styles.missionTxt, { color: c.text }]}>
              {t(
                'Cuidar la tierra empieza por conocerla. Creemos que cuanta más gente descubra la naturaleza de pie, en el sendero, más gente va a querer protegerla — y trabajamos para que esa puerta de entrada sea clara, honesta y accesible para todos.',
                'Caring for the earth starts with knowing it. We believe that the more people discover nature on foot, on the trail, the more people will want to protect it — and we work to make that door in clear, honest, and open to everyone.',
              )}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function SponsorForm({ c, t, isNarrow }: { c: any; t: (es: string, en: string) => string; isNarrow: boolean }) {
  const [fullName, setFullName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [additionalLink, setAdditionalLink] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit() {
    if (pending) return;
    if (!fullName.trim() || !companyWebsite.trim()) {
      setError(t('Completá nombre y sitio web.', 'Enter your name and company website.'));
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      setError(t('Ingresá un email válido.', 'Enter a valid email.'));
      return;
    }
    if (!isSupabaseConfigured()) {
      setError(t('No disponible en este momento.', 'Not available right now.'));
      return;
    }
    setError(null);
    setPending(true);
    try {
      await submitSponsorLead({
        fullName: fullName.trim(),
        companyWebsite: companyWebsite.trim(),
        additionalLink: additionalLink.trim(),
        email: email.trim(),
        phone: phone.trim(),
        message: message.trim(),
      });
      setDone(true);
    } catch {
      setError(t('No se pudo enviar. Probá de nuevo.', "Couldn't submit. Please try again."));
    } finally {
      setPending(false);
    }
  }

  return (
    <View {...({ id: 'sponsors-form' } as any)} style={[styles.section, { borderColor: c.border, borderTopWidth: 1 }]}>
      <View style={styles.sponsorsHead}>
        <Text style={[styles.eyebrow, { color: c.accent }]}>{t('SPONSORS', 'SPONSORS')}</Text>
        <Text style={[styles.sponsorsTitle, { color: c.text }]}>
          {t('Sumate como sponsor de Sliabh', 'Become a Sliabh sponsor')}
        </Text>
        <Text style={[styles.sponsorsBody, { color: c.muted }]}>
          {t(
            'Los sponsors de Sliabh tienen un lugar privilegiado en las secciones de Rutas y Mapas — donde miles de personas planifican su próxima salida a la montaña. Contanos sobre tu marca y te contactamos.',
            "Sliabh sponsors get a privileged spot in the Trails and Maps sections — where thousands of people plan their next trip to the mountains. Tell us about your brand and we'll get in touch.",
          )}
        </Text>
      </View>

      <View style={[styles.benefits, isNarrow && styles.benefitsNarrow]}>
        <Benefit
          c={c}
          icon="ribbon-outline"
          title={t('Ubicación destacada', 'Prime placement')}
          body={t(
            'Presencia visible en las secciones de Rutas y Mapas, donde la comunidad busca información antes de salir.',
            'Visible presence in the Trails and Maps sections, where the community looks for information before heading out.',
          )}
        />
        <Benefit
          c={c}
          icon="globe-outline"
          title={t('Alcance real', 'Real reach')}
          body={t(
            'Llegá a una comunidad activa de trekking en Argentina, más el tráfico internacional que ya estamos sumando.',
            "Reach an active trekking community in Argentina, plus the international traffic we're already building.",
          )}
        />
        <Benefit
          c={c}
          icon="leaf-outline"
          title={t('Marca alineada a valores', 'Values-aligned brand')}
          body={t(
            'Asociá tu marca con el cuidado de la naturaleza y una comunidad que sale a la montaña, no solo la mira en pantalla.',
            'Associate your brand with caring for nature and a community that gets out on the mountain, not just watches it on a screen.',
          )}
        />
      </View>

      <View style={[styles.formCard, { borderColor: c.border, backgroundColor: c.surface }]}>
        {done ? (
          <View style={styles.doneBox}>
            <Ionicons name="checkmark-circle" size={40} color={c.accent} />
            <Text style={[styles.doneTitle, { color: c.text }]}>
              {t('¡Gracias! Recibimos tu propuesta.', 'Thanks! We received your proposal.')}
            </Text>
            <Text style={[styles.doneSub, { color: c.muted }]}>
              {t('Te respondemos por email en los próximos días.', "We'll get back to you by email within a few days.")}
            </Text>
          </View>
        ) : (
          <>
            <Text style={[styles.formTitle, { color: c.text }]}>{t('Contanos sobre tu marca', 'Tell us about your brand')}</Text>
            <View style={[styles.formGrid, isNarrow && styles.formGridNarrow]}>
              <Field c={c} label={t('Nombre completo', 'Full name')} value={fullName} onChangeText={setFullName} placeholder="Juan Pérez" editable={!pending} />
              <Field c={c} label={t('Sitio web de la empresa', 'Company website')} value={companyWebsite} onChangeText={setCompanyWebsite} placeholder="https://tuempresa.com" editable={!pending} />
              <Field c={c} label={t('Email', 'Email')} value={email} onChangeText={setEmail} placeholder="juan@tuempresa.com" keyboardType="email-address" autoCapitalize="none" editable={!pending} />
              <Field c={c} label={t('Teléfono', 'Phone')} value={phone} onChangeText={setPhone} placeholder="+54 9 11 1234-5678" keyboardType="phone-pad" editable={!pending} />
              <Field c={c} label={t('Link adicional (redes, catálogo, etc.)', 'Additional link (social, catalog, etc.)')} value={additionalLink} onChangeText={setAdditionalLink} placeholder="https://instagram.com/tuempresa" full editable={!pending} />
              <Field c={c} label={t('Mensaje', 'Message')} value={message} onChangeText={setMessage} placeholder={t('Contanos qué tenés en mente...', "Tell us what you have in mind...")} multiline full editable={!pending} />
            </View>
            {error && <Text style={[styles.errorTxt]}>{error}</Text>}
            <View style={[styles.submitRow, isNarrow && styles.submitRowNarrow]}>
              <Text style={[styles.fineprint, { color: c.muted }]}>
                {t('Al enviar aceptás que guardemos estos datos para contactarte sobre esta propuesta.', "By submitting, you agree we'll store this info to contact you about this proposal.")}
              </Text>
              <TouchableOpacity
                onPress={submit}
                disabled={pending}
                style={[styles.submitBtn, { backgroundColor: c.accent, opacity: pending ? 0.6 : 1 }]}
                activeOpacity={0.85}
              >
                <Text style={[styles.submitBtnTxt, { color: c.accentInk }]}>
                  {pending ? t('Enviando…', 'Sending…') : t('Enviar propuesta', 'Send proposal')}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

function Benefit({ c, icon, title, body }: { c: any; icon: keyof typeof Ionicons.glyphMap; title: string; body: string }) {
  return (
    <View style={[styles.benefit, { borderColor: c.border, backgroundColor: c.surface }]}>
      <View style={[styles.benefitIcon, { backgroundColor: 'rgba(34,197,94,0.14)' }]}>
        <Ionicons name={icon} size={18} color={c.accent} />
      </View>
      <Text style={[styles.benefitTitle, { color: c.text }]}>{title}</Text>
      <Text style={[styles.benefitBody, { color: c.muted }]}>{body}</Text>
    </View>
  );
}

function Field({
  c, label, value, onChangeText, placeholder, full, multiline, keyboardType, autoCapitalize, editable,
}: {
  c: any; label: string; value: string; onChangeText: (v: string) => void; placeholder: string;
  full?: boolean; multiline?: boolean; keyboardType?: any; autoCapitalize?: any; editable?: boolean;
}) {
  return (
    <View style={[styles.field, full && styles.fieldFull]}>
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
          styles.input,
          multiline && styles.inputMultiline,
          { borderColor: c.border, backgroundColor: c.surface2, color: c.text },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { maxWidth: 1080, width: '100%', alignSelf: 'center', paddingHorizontal: 24, paddingVertical: 56 },
  eyebrow: { fontSize: 11.5, fontWeight: '700', letterSpacing: 1.2, marginBottom: 10 },

  // About
  about: { flexDirection: 'row', gap: 48, alignItems: 'flex-start' },
  aboutNarrow: { flexDirection: 'column' },
  avatarCol: { width: 260, alignItems: 'center', gap: 16 },
  avatarColNarrow: { width: '100%', maxWidth: 260 },
  avatarFrame: {
    width: '100%', aspectRatio: 4 / 5, borderRadius: 18, borderWidth: 1, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarPlaceholder: { alignItems: 'center', gap: 10, padding: 24 },
  avatarPlaceholderTxt: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  logoBelow: { width: 56, height: 56, borderRadius: 12 },
  aboutBody: { flex: 1, minWidth: 0 },
  aboutTitle: { fontSize: 32, fontWeight: '800', marginBottom: 4 },
  aboutRole: { fontSize: 14.5, marginBottom: 20 },
  aboutP: { fontSize: 15.5, lineHeight: 25, marginBottom: 14, maxWidth: 600 },
  missionBox: { marginTop: 18, borderLeftWidth: 3, paddingLeft: 18, paddingVertical: 4 },
  missionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 6 },
  missionTxt: { fontSize: 17, lineHeight: 26, fontStyle: 'italic', maxWidth: 560 },

  // Sponsors
  sponsorsHead: { maxWidth: 680, marginBottom: 32 },
  sponsorsTitle: { fontSize: 28, fontWeight: '800', marginBottom: 12 },
  sponsorsBody: { fontSize: 15.5, lineHeight: 24 },
  benefits: { flexDirection: 'row', gap: 16, marginBottom: 40 },
  benefitsNarrow: { flexDirection: 'column' },
  benefit: { flex: 1, borderWidth: 1, borderRadius: 14, padding: 20 },
  benefitIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  benefitTitle: { fontSize: 15, fontWeight: '700', marginBottom: 6 },
  benefitBody: { fontSize: 13.5, lineHeight: 20 },

  formCard: { borderWidth: 1, borderRadius: 20, padding: Platform.OS === 'web' ? 36 : 20 },
  formTitle: { fontSize: 19, fontWeight: '800', marginBottom: 20 },
  formGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, rowGap: 18 },
  formGridNarrow: { flexDirection: 'column' },
  field: { width: '47%', gap: 6 },
  fieldFull: { width: '100%' },
  fieldLabel: { fontSize: 12.5, fontWeight: '700' },
  input: { borderWidth: 1, borderRadius: 10, paddingVertical: 11, paddingHorizontal: 13, fontSize: 14 },
  inputMultiline: { minHeight: 96, textAlignVertical: 'top' },
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
