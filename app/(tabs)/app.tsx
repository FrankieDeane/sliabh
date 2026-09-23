import React from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, useWindowDimensions, Platform, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { useLangStore } from '../../src/store/langStore';
import { WebFooter } from '../../src/components/layout/WebFooter';
import { SeoHead } from '../../src/components/ui/SeoHead';

const MAX_CONTENT = 760;
const GREEN = '#22c55e';

// A fixed file name on the latest release, so one tap downloads the APK.
const APK_URL = 'https://github.com/FrankieDeane/sliabh/releases/latest/download/sliabh.apk';

type L = { es: string; en: string };
type Cell = { ok: boolean | 'partial'; text: L };

const COMPARE: Array<{ row: L; web: Cell; app: Cell }> = [
  {
    row: { es: 'Grabar con la pantalla bloqueada', en: 'Record with the screen locked' },
    web: { ok: false, text: { es: 'No: el navegador corta el GPS', en: 'No: the browser cuts GPS' } },
    app: { ok: true, text: { es: 'Sí, con el teléfono en el bolsillo', en: 'Yes, phone in your pocket' } },
  },
  {
    row: { es: 'Usar otra app mientras grabás', en: 'Use another app while recording' },
    web: { ok: false, text: { es: 'No: ese tramo no se graba', en: "No: that stretch isn't recorded" } },
    app: { ok: true, text: { es: 'Sí: WhatsApp, cámara, lo que sea', en: 'Yes: WhatsApp, camera, anything' } },
  },
  {
    row: { es: 'Música mientras grabás', en: 'Music while recording' },
    web: { ok: 'partial', text: { es: 'Sí, con la pantalla encendida', en: 'Yes, with the screen on' } },
    app: { ok: true, text: { es: 'Sí, con la pantalla apagada', en: 'Yes, with the screen off' } },
  },
  {
    row: { es: 'Batería', en: 'Battery' },
    web: { ok: 'partial', text: { es: 'Gasta más: pantalla siempre prendida', en: 'Uses more: screen always on' } },
    app: { ok: true, text: { es: 'Gasta menos: pantalla apagada', en: 'Uses less: screen off' } },
  },
  {
    row: { es: 'Rutas, mapas y guías', en: 'Trails, maps and guides' },
    web: { ok: true, text: { es: 'Sí', en: 'Yes' } },
    app: { ok: true, text: { es: 'Sí', en: 'Yes' } },
  },
  {
    row: { es: 'iPhone', en: 'iPhone' },
    web: { ok: true, text: { es: 'Sí', en: 'Yes' } },
    app: { ok: false, text: { es: 'Todavía no', en: 'Not yet' } },
  },
  {
    row: { es: 'Instalación', en: 'Install' },
    web: { ok: true, text: { es: 'Nada: entrás a sliabh.com.ar', en: 'None: open sliabh.com.ar' } },
    app: { ok: 'partial', text: { es: 'Un minuto, una sola vez', en: 'One minute, once' } },
  },
];

const INSTALL: L[] = [
  {
    es: 'Desde el celular, tocá **Descargar para Android** (el botón verde de arriba).',
    en: 'On your phone, tap **Download for Android** (the green button above).',
  },
  {
    es: 'Cuando termine la descarga, tocá **Abrir**. Si no aparece, abrí Chrome → menú ⋮ → **Descargas** → **sliabh.apk**.',
    en: 'When the download finishes, tap **Open**. If it does not show, open Chrome → ⋮ menu → **Downloads** → **sliabh.apk**.',
  },
  {
    es: 'Si Android dice *"no se permite instalar apps desconocidas"*: tocá **Configuración**, activá **Permitir de esta fuente** y volvé atrás.',
    en: 'If Android says *"installing unknown apps is not allowed"*: tap **Settings**, turn on **Allow from this source** and go back.',
  },
  {
    es: 'Tocá **Instalar**. Si aparece **Play Protect**, tocá **Instalar de todas formas**: avisa porque la app todavía no está en Play Store.',
    en: 'Tap **Install**. If **Play Protect** shows up, tap **Install anyway**: it warns because the app is not on the Play Store yet.',
  },
  {
    es: 'Listo: vas a tener el ícono **Sliabh** en tu celular. Puede convivir con la web.',
    en: 'Done: you will have the **Sliabh** icon on your phone. It can live alongside the website.',
  },
];

const FIRST_HIKE: L[] = [
  {
    es: 'Abrí la app **Sliabh** (el ícono, no Chrome) y tocá **Grabar recorrido**.',
    en: 'Open the **Sliabh** app (the icon, not Chrome) and tap **Record hike**.',
  },
  {
    es: 'Cuando pida ubicación, elegí **Permitir siempre**. Si solo ofrece "Mientras se usa la app", elegila y después cambiala a **Permitir siempre** cuando te lo pida. Sin esto no graba con la pantalla apagada.',
    en: 'When it asks for location, choose **Allow all the time**. If it only offers "While using the app", pick it and then switch to **Allow all the time** when asked. Without this it cannot record with the screen off.',
  },
  {
    es: 'Arriba, en las notificaciones, vas a ver **"Sliabh — grabando"**. Eso es lo que mantiene la grabación viva.',
    en: 'In your notifications you will see **"Sliabh — recording"**. That is what keeps the recording alive.',
  },
  {
    es: 'Bloqueá el teléfono, guardalo y caminá. Poné música si querés. Al volver, tocá **Detener**.',
    en: 'Lock the phone, pocket it and walk. Play music if you like. When you are back, tap **Stop**.',
  },
];

const TROUBLE: Array<{ q: L; a: L }> = [
  {
    q: { es: 'Se cortó la grabación con la pantalla apagada', en: 'Recording stopped with the screen off' },
    a: {
      es: 'Ajustes → Aplicaciones → Sliabh → Ubicación → **Permitir siempre**. Y en la misma pantalla: Batería → **Sin restricciones** (Samsung, Xiaomi y Motorola cierran apps para ahorrar batería).',
      en: 'Settings → Apps → Sliabh → Location → **Allow all the time**. On the same screen: Battery → **Unrestricted** (Samsung, Xiaomi and Motorola close apps to save battery).',
    },
  },
  {
    q: { es: 'No veo la notificación "grabando"', en: 'I do not see the "recording" notification' },
    a: {
      es: 'Ajustes → Aplicaciones → Sliabh → Notificaciones → activalas. Sin notificación, Android no deja grabar en segundo plano.',
      en: 'Settings → Apps → Sliabh → Notifications → turn them on. Without the notification, Android will not allow background recording.',
    },
  },
  {
    q: { es: '¿Pierdo mis recorridos de la web?', en: 'Do I lose my hikes from the website?' },
    a: {
      es: 'No. Si iniciás sesión con la misma cuenta, tus recorridos aparecen en los dos lados.',
      en: 'No. Sign in with the same account and your hikes show up in both.',
    },
  },
];

/** Renders `**bold**` and `*italic*` inline; the copy stays readable as plain data. */
function Rich({ text, color, strong }: { text: string; color: string; strong: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);
  return (
    <Text style={[s.body, { color }]}>
      {parts.map((p, i) =>
        p.startsWith('**') ? (
          <Text key={i} style={{ fontWeight: '700', color: strong }}>{p.slice(2, -2)}</Text>
        ) : p.startsWith('*') ? (
          <Text key={i} style={{ fontStyle: 'italic' }}>{p.slice(1, -1)}</Text>
        ) : (
          p
        ),
      )}
    </Text>
  );
}

function Mark({ ok }: { ok: Cell['ok'] }) {
  const name = ok === true ? 'checkmark-circle' : ok === 'partial' ? 'remove-circle' : 'close-circle';
  const color = ok === true ? GREEN : ok === 'partial' ? '#f59e0b' : '#ef4444';
  return <Ionicons name={name} size={16} color={color} />;
}

export default function AppDownloadScreen() {
  const { isDark } = useTheme();
  const { lang, t } = useLangStore();
  const { width } = useWindowDimensions();
  const contentW = Math.min(width, MAX_CONTENT);
  const sidePad = Math.max(16, (width - contentW) / 2);
  const pick = (l: L) => (lang === 'en' ? l.en : l.es);

  const c = isDark
    ? { bg: '#070b14', surface: '#0f1724', border: '#1e2d42', text: '#f0f9ff', muted: '#94a3b8' }
    : { bg: '#f8fafc', surface: '#ffffff', border: '#e2e8f0', text: '#0f172a', muted: '#475569' };

  const download = () => { Linking.openURL(APK_URL).catch(() => {}); };

  const steps = (items: L[]) =>
    items.map((step, i) => (
      <View key={i} style={s.stepRow}>
        <View style={s.stepNum}><Text style={s.stepNumTxt}>{i + 1}</Text></View>
        <View style={{ flex: 1 }}>
          <Rich text={pick(step)} color={c.muted} strong={c.text} />
        </View>
      </View>
    ));

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bg }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: Platform.OS === 'web' && width < 720 ? 120 : 64 }}
    >
      <SeoHead
        title="Sliabh para Android — grabá con el teléfono en el bolsillo"
        description="Descargá la app de Sliabh para Android: graba tu recorrido con la pantalla bloqueada y con música. Paso a paso para instalarla."
        path="/app"
      />

      <View style={[s.hero, { backgroundColor: c.surface, borderBottomColor: c.border, paddingHorizontal: sidePad }]}>
        <Text style={s.eyebrow}>{t('APP PARA ANDROID', 'ANDROID APP')}</Text>
        <Text style={[s.title, { color: c.text }]}>
          {t('Grabá tu recorrido con el teléfono en el bolsillo', 'Record your hike with the phone in your pocket')}
        </Text>
        <Text style={[s.lead, { color: c.muted }]}>
          {t(
            'La web necesita la pantalla encendida y la app adelante: si bloqueás el teléfono, el navegador deja de recibir el GPS. La app de Android sigue grabando con la pantalla apagada, con música y aunque uses otras apps.',
            'The website needs the screen on and the app in front: lock the phone and the browser stops receiving GPS. The Android app keeps recording with the screen off, with music, and while you use other apps.',
          )}
        </Text>
        <TouchableOpacity onPress={download} activeOpacity={0.85} style={s.cta} accessibilityRole="link">
          <Ionicons name="logo-android" size={20} color="#04210f" />
          <Text style={s.ctaTxt}>{t('Descargar para Android', 'Download for Android')}</Text>
        </TouchableOpacity>
        <Text style={[s.small, { color: c.muted }]}>
          {t('Gratis · Android 8 o superior · ¿iPhone? Usá la web: sliabh.com.ar', 'Free · Android 8 or later · iPhone? Use the website: sliabh.com.ar')}
        </Text>
      </View>

      <View style={{ paddingHorizontal: sidePad, paddingTop: 28, gap: 28 }}>
        <View>
          <Text style={[s.h2, { color: c.text }]}>{t('Web o app: qué cambia', 'Website or app: what changes')}</Text>
          <View style={[s.table, { borderColor: c.border, backgroundColor: c.surface }]}>
            <View style={[s.tr, { borderBottomColor: c.border }]}>
              <Text style={[s.th, s.colRow, { color: c.muted }]} />
              <Text style={[s.th, s.col, { color: c.muted }]}>{t('WEB', 'WEBSITE')}</Text>
              <Text style={[s.th, s.col, { color: GREEN }]}>{t('APP', 'APP')}</Text>
            </View>
            {COMPARE.map((r, i) => (
              <View key={r.row.es} style={[s.tr, i < COMPARE.length - 1 && { borderBottomColor: c.border, borderBottomWidth: 1 }]}>
                <Text style={[s.td, s.colRow, { color: c.text, fontWeight: '600' }]}>{pick(r.row)}</Text>
                {[r.web, r.app].map((cell, j) => (
                  <View key={j} style={[s.col, s.cell]}>
                    <Mark ok={cell.ok} />
                    <Text style={[s.td, { color: c.muted, flex: 1 }]}>{pick(cell.text)}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </View>

        <View>
          <Text style={[s.h2, { color: c.text }]}>{t('Cómo instalarla', 'How to install it')}</Text>
          <View style={[s.card, { borderColor: c.border, backgroundColor: c.surface }]}>{steps(INSTALL)}</View>
        </View>

        <View>
          <Text style={[s.h2, { color: c.text }]}>{t('Tu primera caminata', 'Your first hike')}</Text>
          <View style={[s.card, { borderColor: c.border, backgroundColor: c.surface }]}>{steps(FIRST_HIKE)}</View>
        </View>

        <View>
          <Text style={[s.h2, { color: c.text }]}>{t('Si algo falla', 'If something goes wrong')}</Text>
          <View style={{ gap: 10 }}>
            {TROUBLE.map((item) => (
              <View key={item.q.es} style={[s.card, { borderColor: c.border, backgroundColor: c.surface, gap: 6 }]}>
                <Text style={[s.q, { color: c.text }]}>{pick(item.q)}</Text>
                <Rich text={pick(item.a)} color={c.muted} strong={c.text} />
              </View>
            ))}
          </View>
        </View>
      </View>

      {Platform.OS === 'web' && <WebFooter />}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  hero: { borderBottomWidth: 1, paddingTop: 36, paddingBottom: 28, gap: 12 },
  eyebrow: { color: GREEN, fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, lineHeight: 34 },
  lead: { fontSize: 15, lineHeight: 23 },
  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: GREEN, borderRadius: 999, paddingVertical: 15, paddingHorizontal: 24,
    alignSelf: 'flex-start', marginTop: 4,
  },
  ctaTxt: { color: '#04210f', fontSize: 16, fontWeight: '800' },
  small: { fontSize: 12, lineHeight: 18 },
  h2: { fontSize: 19, fontWeight: '800', letterSpacing: -0.3, marginBottom: 12 },
  table: { borderWidth: 1, borderRadius: 14, overflow: 'hidden' },
  tr: { flexDirection: 'row', alignItems: 'stretch', paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  th: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  td: { fontSize: 13, lineHeight: 18 },
  colRow: { flex: 1.1 },
  col: { flex: 1 },
  cell: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  card: { borderWidth: 1, borderRadius: 14, padding: 16, gap: 14 },
  stepRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  stepNum: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: '#14532d',
    alignItems: 'center', justifyContent: 'center', marginTop: 1,
  },
  stepNumTxt: { color: GREEN, fontSize: 13, fontWeight: '800' },
  body: { fontSize: 14.5, lineHeight: 22 },
  q: { fontSize: 15, fontWeight: '700' },
});
