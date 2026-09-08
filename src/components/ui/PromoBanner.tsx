import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useLangStore } from '../../store/langStore';

// A slim, occasional announcement strip under the header — rotates through
// a small pool of messages (new trails, tips, FAQ, community invite) and
// picks one at random each time it's due to show, instead of nagging with
// the same message (or on every page load). Sits in normal document flow
// (mounted right after <WebHeader/> in app/_layout.tsx), so it pushes page
// content down rather than overlapping it — the simplest way to stay
// correctly responsive on phones without its own positioning/z-index logic.
const LAST_SHOWN_KEY = 'sliabh-promo-banner-last-shown';
const LAST_ID_KEY = 'sliabh-promo-banner-last-id';
const COOLDOWN_MS = 1000 * 60 * 60 * 8; // 8h between appearances

type Action = { path: string; labelEs: string; labelEn: string };

interface PromoMessage {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  es: string;
  en: string;
  action: Action;
}

const MESSAGES: PromoMessage[] = [
  {
    id: 'new-trails-bariloche',
    icon: 'trail-sign-outline',
    es: 'Sumamos nuevos senderos en Bariloche, con mapa 3D y GPX descargable.',
    en: 'New Bariloche trails just added, with 3D maps and downloadable GPX.',
    action: { path: '/rutas', labelEs: 'Ver rutas', labelEn: 'See trails' },
  },
  {
    id: 'tip-offline-gpx',
    icon: 'bulb-outline',
    es: '¿Sabías que podés descargar el track GPX de cada ruta para usarlo sin conexión?',
    en: 'Did you know you can download every trail’s GPX track for offline use?',
    action: { path: '/faq', labelEs: 'Ver FAQ', labelEn: 'See FAQ' },
  },
  {
    id: 'community-invite',
    icon: 'people-outline',
    es: 'Sumate a la comunidad: compartí una ruta o reportá el estado del sendero.',
    en: 'Join the community: share a trail or report current trail conditions.',
    action: { path: '/contribuir', labelEs: 'Participar', labelEn: 'Get involved' },
  },
  {
    id: 'survival-guides',
    icon: 'medkit-outline',
    es: 'Guías de supervivencia y seguridad en montaña para tu próxima salida.',
    en: 'Mountain safety & survival guides for your next trip.',
    action: { path: '/supervivencia', labelEs: 'Ver guías', labelEn: 'See guides' },
  },
  {
    id: 'plan-trip',
    icon: 'map-outline',
    es: 'Planificá tu próxima aventura: clima, permisos y checklist en un solo lugar.',
    en: 'Plan your next trip: weather, permits and a checklist in one place.',
    action: { path: '/planificar', labelEs: 'Planificar', labelEn: 'Start planning' },
  },
];

export function PromoBanner() {
  const { theme } = useThemeStore();
  const { t, lang } = useLangStore();
  const router = useRouter();
  const isDark = theme === 'dark';
  const { width } = useWindowDimensions();
  const isNarrow = width < 560;

  const [message, setMessage] = useState<PromoMessage | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    let lastShown = 0;
    let lastId: string | null = null;
    try {
      lastShown = Number(localStorage.getItem(LAST_SHOWN_KEY) ?? 0);
      lastId = localStorage.getItem(LAST_ID_KEY);
    } catch {
      // localStorage unavailable — fall through, show once this load
    }
    if (Date.now() - lastShown < COOLDOWN_MS) return;

    // Pick at random, skipping the message shown last time if there's more
    // than one to choose from — avoids an immediate repeat once the cooldown
    // has passed.
    const pool = MESSAGES.length > 1 ? MESSAGES.filter((m) => m.id !== lastId) : MESSAGES;
    const pick = pool[Math.floor(Math.random() * pool.length)];

    const timer = setTimeout(() => setMessage(pick), 2500);
    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(LAST_SHOWN_KEY, String(Date.now()));
      if (message) localStorage.setItem(LAST_ID_KEY, message.id);
    } catch {}
    setMessage(null);
  }

  function act() {
    if (!message) return;
    try {
      localStorage.setItem(LAST_SHOWN_KEY, String(Date.now()));
      localStorage.setItem(LAST_ID_KEY, message.id);
    } catch {}
    const path = message.action.path;
    setMessage(null);
    router.push(path as any);
  }

  if (!message) return null;

  const c = isDark
    ? { bg: '#0b1a12', border: 'rgba(34,197,94,0.35)', text: '#f0fdf4', muted: '#86efac' }
    : { bg: '#f0fdf4', border: 'rgba(22,163,74,0.35)', text: '#052e16', muted: '#16a34a' };

  return (
    <View style={[styles.bar, { backgroundColor: c.bg, borderBottomColor: c.border }]}>
      <View style={[styles.inner, isNarrow && styles.innerNarrow]}>
        <View style={styles.textWrap}>
          <Ionicons name={message.icon} size={16} color="#16a34a" style={{ flexShrink: 0 }} />
          <Text style={[styles.txt, { color: c.text }]} numberOfLines={isNarrow ? 3 : 2}>
            {t(message.es, message.en)}
          </Text>
        </View>
        <View style={[styles.btns, isNarrow && styles.btnsNarrow]}>
          <TouchableOpacity style={styles.ctaBtn} onPress={act} activeOpacity={0.85}>
            <Text style={styles.ctaTxt}>
              {lang === 'es' ? message.action.labelEs : message.action.labelEn}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.dismissBtn}
            onPress={dismiss}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="close" size={16} color={c.muted} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    width: '100%',
    borderBottomWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
    flexWrap: 'wrap' as any,
  },
  innerNarrow: { justifyContent: 'flex-start' },
  textWrap: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, flex: 1, minWidth: 200 },
  txt: { fontSize: 12.5, lineHeight: 17, flex: 1, fontWeight: '600' },
  btns: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 },
  btnsNarrow: { width: '100%', justifyContent: 'flex-end', marginTop: 2 },
  ctaBtn: {
    backgroundColor: '#16a34a', borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  ctaTxt: { color: '#fff', fontSize: 11.5, fontWeight: '700' },
  dismissBtn: {
    padding: 5, borderRadius: 999,
    borderWidth: 1, borderColor: 'rgba(148,163,184,0.4)',
  },
});
