import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, useWindowDimensions, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useLangStore } from '../../store/langStore';
import { LOGO_URI } from '../../constants/logo';
import { MERCADOPAGO_URL } from '../../constants/links';
import { shareOnWhatsApp, currentPageUrl } from '../../utils/share';

const MAX_CONTENT = 1200;

const REGION_LINKS = [
  { labelEs: 'Patagonia Sur', labelEn: 'Patagonia Sur', region: 'Patagonia Sur' },
  { labelEs: 'Patagonia Norte', labelEn: 'Patagonia Norte', region: 'Patagonia Norte' },
  { labelEs: 'Cuyo & Aconcagua', labelEn: 'Cuyo & Aconcagua', region: 'Cuyo' },
  { labelEs: 'Norte (NOA)', labelEn: 'North (NOA)', region: 'Norte' },
  { labelEs: 'Sierras Centrales', labelEn: 'Central Ranges', region: 'Sierras Centrales' },
  { labelEs: 'Litoral', labelEn: 'Litoral', region: 'Litoral' },
];

export function WebFooter() {
  const router = useRouter();
  const { theme } = useThemeStore();
  const { t } = useLangStore();
  const isDark = theme === 'dark';
  const [legalOpen, setLegalOpen] = useState(false);
  const [cookieOpen, setCookieOpen] = useState(false);
  const { width } = useWindowDimensions();

  const c = isDark
    ? { bg: '#040810', surface: '#070b14', border: '#1e2d42', text: '#f0f9ff', muted: '#64748b' }
    : { bg: '#f1f5f9', surface: '#e2e8f0', border: '#cbd5e1', text: '#0f172a', muted: '#64748b' };

  const contentW = Math.min(width, MAX_CONTENT);
  const sidePad = Math.max(20, (width - contentW) / 2);
  const isWide = width >= 720;

  return (
    <View style={[styles.footer, { backgroundColor: c.bg, borderTopColor: c.border }]}>
      <View style={[styles.inner, { paddingHorizontal: sidePad }]}>
        <View style={[styles.top, isWide ? styles.topWide : styles.topNarrow, { flexWrap: isWide ? 'nowrap' : 'wrap' }]}>

          {/* Brand column */}
          <View style={styles.brandCol}>
            <TouchableOpacity style={styles.brand} onPress={() => router.push('/(tabs)/inicio')} activeOpacity={0.8}>
              <Image source={{ uri: LOGO_URI }} style={styles.logo} resizeMode="contain" />
            </TouchableOpacity>
            <Text style={[styles.tagline, { color: c.muted }]}>
              {t(
                'La plataforma de senderismo\npara explorar Argentina.\nFunciona con y sin señal.',
                'The hiking platform\nto explore Argentina.\nWorks online and offline.',
              )}
            </Text>
            <View style={[styles.emergencyBadge, { borderColor: c.border }]}>
              <Ionicons name="call-outline" size={12} color="#ef4444" />
              <Text style={[styles.emergencyTxt, { color: c.muted }]}>Emergencias APN: 105</Text>
            </View>
          </View>

          {/* Explorar column */}
          <View style={styles.navCol}>
            <Text style={[styles.navTitle, { color: c.muted }]}>{t('EXPLORAR', 'EXPLORE')}</Text>
            <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/rutas')} activeOpacity={0.7}>
              <Ionicons name="chevron-forward" size={11} color="#22c55e" />
              <Text style={[styles.navLabel, { color: c.muted }]}>{t('Todas las rutas', 'All trails')}</Text>
            </TouchableOpacity>
            {REGION_LINKS.map((r) => (
              <TouchableOpacity
                key={r.region}
                style={styles.navItem}
                onPress={() => router.push({ pathname: '/(tabs)/rutas', params: { region: r.region } } as any)}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-forward" size={11} color="#22c55e" />
                <Text style={[styles.navLabel, { color: c.muted }]}>{t(r.labelEs, r.labelEn)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Preparar / Prepare column */}
          <View style={styles.navCol}>
            <Text style={[styles.navTitle, { color: c.muted }]}>{t('PREPARAR', 'PREPARE')}</Text>
            {([
              { labelEs: 'Mapas offline', labelEn: 'Offline maps', href: '/(tabs)/mapas' as const },
              { labelEs: 'Planificar ruta', labelEn: 'Plan a route', href: '/(tabs)/planificar' as const },
              { labelEs: 'FAQ', labelEn: 'FAQ', href: '/(tabs)/faq' as const },
              { labelEs: 'Contribuir', labelEn: 'Contribute', href: '/(tabs)/contribuir' as const },
            ]).map((n) => (
              <TouchableOpacity key={n.labelEs} style={styles.navItem} onPress={() => router.push(n.href)} activeOpacity={0.7}>
                <Ionicons name="chevron-forward" size={11} color="#22c55e" />
                <Text style={[styles.navLabel, { color: c.muted }]}>{t(n.labelEs, n.labelEn)}</Text>
              </TouchableOpacity>
            ))}
            <View style={[styles.infoCard, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Text style={[styles.infoCardTxt, { color: c.muted }]}>
                <Text style={{ color: '#22c55e', fontStyle: 'italic' }}>Sliabh</Text>{' '}
                {t('es gaélico para', 'is Irish for')}{' '}
                <Text style={{ color: '#22c55e' }}>{t('"montaña"', '"mountain"')}</Text>.
              </Text>
            </View>
          </View>

        </View>

        <View style={[styles.divider, { backgroundColor: c.border }]} />

        <View style={[styles.bottom, isWide ? styles.bottomWide : null]}>
          <View style={{ gap: 4 }}>
            <Text style={[styles.copy, { color: c.muted }]}>
              © 2026 <Text style={{ color: '#22c55e', fontWeight: '700' }}>Sliabh Argaelic</Text> — Argentina
              {'  '}·{'  '}
              <Text style={{ fontStyle: 'italic' }}>{t('Una idea de', 'An idea by')} </Text>
              <Text style={{ color: c.text, fontWeight: '600' }}>Francisco Deane</Text>
            </Text>
          </View>
          <View style={styles.copyRight}>
            <TouchableOpacity
              style={[styles.cafecitoLink, { borderColor: c.border }]}
              onPress={() => Linking.openURL(MERCADOPAGO_URL)}
              activeOpacity={0.75}
            >
              <Ionicons name="cafe-outline" size={12} color="#fbbf24" />
              <Text style={[styles.copySmall, { color: c.muted }]}>{t('Invitame un cafecito', 'Buy me a coffee')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.cafecitoLink, { borderColor: c.border }]}
              onPress={() =>
                shareOnWhatsApp(
                  `${t(
                    'Descubrí Sliabh 🏔️ Rutas de senderismo, mapas offline y GPS para explorar los Parques Nacionales de Argentina.',
                    'Discover Sliabh 🏔️ Hiking trails, offline maps and GPS to explore the National Parks of Argentina.',
                  )}\n${currentPageUrl()}`,
                )
              }
              activeOpacity={0.75}
            >
              <Ionicons name="logo-whatsapp" size={12} color="#25D366" />
              <Text style={[styles.copySmall, { color: c.muted }]}>{t('Compartir', 'Share')}</Text>
            </TouchableOpacity>
            <Ionicons name="leaf-outline" size={12} color="#22c55e" />
            <Text style={[styles.copySmall, { color: c.muted }]}>{t('Hecho para exploradores de montaña', 'Made for mountain explorers')}</Text>
          </View>
        </View>

        {/* Legal disclosure accordion */}
        <TouchableOpacity
          style={[styles.legalToggle, { borderTopColor: c.border }]}
          onPress={() => setLegalOpen((o) => !o)}
          activeOpacity={0.7}
        >
          <Text style={[styles.legalToggleTxt, { color: c.muted }]}>
            {t('Aviso Legal', 'Legal Disclaimer')}
          </Text>
          <Ionicons name={legalOpen ? 'chevron-up' : 'chevron-down'} size={13} color={c.muted} />
        </TouchableOpacity>

        {legalOpen && (
          <View style={[styles.legalBox, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[styles.legalTxt, { color: c.muted }]}>
              {t(
                'Sliabh es una plataforma de información para actividades en la naturaleza. Los datos de senderos, mapas, distancias y tiempos estimados son orientativos y pueden no reflejar las condiciones actuales del terreno. Las actividades al aire libre conllevan riesgos inherentes. El usuario es responsable de su propia seguridad, preparación y decisiones en el campo.\n\nLa información proviene de fuentes de terceros (SIB/APN, OpenStreetMap, IGN Argentina; datos de senderos de Bariloche verificados con barilochetrekking.com, Club Andino Bariloche y nahuelhuapi.gov.ar) y puede contener errores u omisiones. Sliabh no garantiza la exactitud, completitud ni vigencia de los datos. Los mapas sin conexión son de referencia y no reemplazan el juicio del excursionista ni equipamiento de navegación profesional.\n\nSliabh no es un organismo oficial ni está afiliado a la Administración de Parques Nacionales de Argentina.\n\nContenido y datos de usuarios: parte de la información de la plataforma (rutas, comentarios, fotos, tracks u otro contenido) puede ser cargada o compartida por los propios usuarios. Sliabh no verifica ni se responsabiliza por la exactitud, legalidad o vigencia de ese contenido, ni por cualquier exposición, uso indebido o divulgación del mismo. Cada usuario es responsable del contenido que publica y de resguardar su propia información. Si detectás contenido inexacto, inapropiado o que viole derechos de terceros, contactanos para su revisión.',
                'Sliabh is an informational platform for outdoor activities. Trail data, maps, distances and estimated times are indicative and may not reflect current terrain conditions. Outdoor activities carry inherent risks. Users are solely responsible for their own safety, preparation and decisions in the field.\n\nInformation is sourced from third parties (SIB/APN, OpenStreetMap, IGN Argentina; Bariloche trail data verified against barilochetrekking.com, Club Andino Bariloche and nahuelhuapi.gov.ar) and may contain errors or omissions. Sliabh makes no warranty as to accuracy, completeness or currency of data. Offline maps are for reference only and do not replace hiker judgement or professional navigation equipment.\n\nSliabh is not an official body and is not affiliated with the Administración de Parques Nacionales de Argentina.\n\nUser-submitted content and data: some information on the platform (routes, comments, photos, tracks or other content) may be uploaded or shared by users themselves. Sliabh does not verify and is not responsible for the accuracy, legality or currency of that content, nor for any exposure, misuse or disclosure of it. Each user is responsible for the content they publish and for safeguarding their own information. If you find content that is inaccurate, inappropriate, or infringes third-party rights, please contact us for review.',
              )}
            </Text>
          </View>
        )}

        {/* Cookie policy accordion */}
        <TouchableOpacity
          style={[styles.legalToggle, { borderTopColor: c.border }]}
          onPress={() => setCookieOpen((o) => !o)}
          activeOpacity={0.7}
        >
          <Text style={[styles.legalToggleTxt, { color: c.muted }]}>
            {t('Política de Cookies', 'Cookie Policy')}
          </Text>
          <Ionicons name={cookieOpen ? 'chevron-up' : 'chevron-down'} size={13} color={c.muted} />
        </TouchableOpacity>

        {cookieOpen && (
          <View style={[styles.legalBox, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[styles.legalTxt, { color: c.muted }]}>
              {t(
                'Usamos almacenamiento local del navegador (localStorage y Cache Storage API) para:\n• Guardar tus preferencias de idioma y tema.\n• Mantener tu sesión iniciada.\n• Almacenar tiles de mapas para uso sin conexión (modo offline).\n\nEste almacenamiento reside únicamente en tu dispositivo y no se comparte con terceros.\n\nCookies de terceros: también utilizamos cookies de Google Analytics y Meta Pixel para entender cómo se usa la plataforma y mejorar tu experiencia de usuario. Estos proveedores pueden recibir información sobre tu visita conforme a sus propias políticas de privacidad (Google, Meta). Podés desactivar estas cookies en cualquier momento desde la configuración de tu navegador, sin afectar la funcionalidad esencial de la app.\n\nAl continuar usando Sliabh aceptás este uso de almacenamiento local y de cookies de terceros.',
                'We use browser local storage (localStorage and Cache Storage API) for:\n• Saving your language and theme preferences.\n• Keeping you signed in.\n• Storing map tiles for offline use.\n\nThis storage lives only on your device and is never shared with third parties.\n\nThird-party cookies: we also use Google Analytics and Meta Pixel cookies to understand how the platform is used and to improve your user experience. These providers may receive information about your visit under their own privacy policies (Google, Meta). You can disable these cookies at any time from your browser settings without affecting the app\'s core functionality.\n\nBy continuing to use Sliabh you accept this use of local storage and third-party cookies.',
              )}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: { width: '100%', borderTopWidth: 1 },
  inner: { paddingTop: 48, paddingBottom: 28 },
  top: { gap: 32, marginBottom: 32 },
  topWide: { flexDirection: 'row', alignItems: 'flex-start' },
  topNarrow: { flexDirection: 'column' },
  brandCol: { flex: 1.6, minWidth: 200, gap: 14 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logo: { width: 96, height: 96, borderRadius: 48, overflow: 'hidden' },
  brandName: { fontSize: 18, fontWeight: '800', letterSpacing: -0.4 },
  brandSub: { fontSize: 9, fontWeight: '600', letterSpacing: 2.5, textTransform: 'uppercase' },
  tagline: { fontSize: 13, lineHeight: 20 },
  emergencyBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  emergencyTxt: { fontSize: 11, fontWeight: '600' },
  navCol: { flex: 1, minWidth: 140, gap: 10 },
  navTitle: { fontSize: 9, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 },
  navItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  navLabel: { fontSize: 13, fontWeight: '500' },
  infoCard: {
    marginTop: 8, borderRadius: 10, borderWidth: 1,
    paddingHorizontal: 10, paddingVertical: 8,
  },
  infoCardTxt: { fontSize: 11, lineHeight: 17 },
  divider: { height: 1, marginBottom: 20 },
  bottom: { gap: 8 },
  bottomWide: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  copy: { fontSize: 12, lineHeight: 18 },
  copyRight: { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' as any },
  cafecitoLink: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4,
    marginRight: 10,
  },
  copySmall: { fontSize: 11 },
  legalToggle: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderTopWidth: 1, marginTop: 16, paddingTop: 12, paddingHorizontal: 2,
  },
  legalToggleTxt: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
  legalBox: {
    marginTop: 10, borderRadius: 10, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  legalTxt: { fontSize: 11, lineHeight: 18 },
});
