import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase, isSupabaseConfigured } from '../../services/supabase';
import { useLangStore } from '../../store/langStore';
import { storage } from '../../store/mmkv';

const SEEN_KEY = 'install-prompt-seen';

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return (
      (window.matchMedia?.('(display-mode: standalone)')?.matches ?? false) ||
      (window.navigator as any).standalone === true
    );
  } catch {
    return false;
  }
}

function isIosSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
}

/**
 * Invites a signed-in user, once, to keep the app on their home screen —
 * which is what makes the trail, its sun times and the downloaded map open
 * again after the browser is closed, with no signal.
 *
 * Chrome fires `beforeinstallprompt` and hands over a real install dialog;
 * iOS Safari has no such API, so it gets the Share → Add to Home Screen
 * wording instead. Either way it is shown once and remembered.
 */
export function InstallPrompt({ accent = '#22c55e' }: { accent?: string }) {
  const { t } = useLangStore();
  const [visible, setVisible] = React.useState(false);
  const deferred = React.useRef<any>(null);

  const dismiss = React.useCallback((remember: boolean) => {
    setVisible(false);
    if (remember) {
      try { storage.set(SEEN_KEY, '1'); } catch { /* private mode — ask again next time */ }
    }
  }, []);

  React.useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    if (isStandalone()) return;
    try {
      if (storage.getString(SEEN_KEY)) return;
    } catch {
      // storage unavailable; showing it once per session is acceptable
    }

    const onBeforeInstall = (e: any) => {
      e.preventDefault();
      deferred.current = e;
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);

    let unsubscribe: (() => void) | undefined;
    if (isSupabaseConfigured()) {
      // Signing in is the moment the offer makes sense: there is now an
      // account whose hikes are worth having on hand at the trailhead.
      supabase.auth.getUser().then(({ data }) => {
        if (data.user) setVisible(true);
      });
      const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session?.user) setVisible(true);
      });
      unsubscribe = () => sub.subscription.unsubscribe();
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      unsubscribe?.();
    };
  }, []);

  const install = React.useCallback(async () => {
    const evt = deferred.current;
    if (!evt) return;
    deferred.current = null;
    try {
      evt.prompt();
      await evt.userChoice;
    } catch {
      // the browser dismissed it; the instructions below still stand
    }
    dismiss(true);
  }, [dismiss]);

  if (!visible) return null;

  const canPrompt = !!deferred.current;
  const ios = isIosSafari();

  return (
    <View style={s.wrap} pointerEvents="box-none">
      <View style={s.card}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="phone-portrait-outline" size={18} color={accent} />
          <Text style={s.title}>
            {t('Guardá Sliabh en tu celular', 'Keep Sliabh on your phone')}
          </Text>
          <TouchableOpacity onPress={() => dismiss(true)} accessibilityLabel={t('Cerrar', 'Dismiss')}>
            <Ionicons name="close" size={18} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        <Text style={s.body}>
          {ios
            ? t(
                'Tocá Compartir y elegí "Agregar a inicio". Así la ruta, sus horarios de sol y el mapa descargado se abren sin señal, aunque cierres Safari.',
                'Tap Share and choose “Add to Home Screen”. The trail, its sun times and the downloaded map then open with no signal, even after you close Safari.',
              )
            : t(
                'Instalala en tu pantalla de inicio: la ruta, sus horarios de sol y el mapa descargado se abren sin señal, aunque cierres el navegador.',
                'Install it on your home screen: the trail, its sun times and the downloaded map open with no signal, even after you close the browser.',
              )}
        </Text>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          {canPrompt && (
            <TouchableOpacity onPress={install} activeOpacity={0.85} style={[s.primary, { backgroundColor: accent }]}>
              <Text style={s.primaryTxt}>{t('Instalar', 'Install')}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => dismiss(true)} activeOpacity={0.85} style={s.secondary}>
            <Text style={s.secondaryTxt}>
              {canPrompt ? t('Ahora no', 'Not now') : t('Entendido', 'Got it')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    position: Platform.OS === 'web' ? ('fixed' as any) : 'absolute',
    left: 12, right: 12, bottom: 84, zIndex: 60, alignItems: 'center',
  },
  card: {
    width: '100%', maxWidth: 460, gap: 10,
    backgroundColor: 'rgba(15,23,36,0.97)',
    borderWidth: 1, borderColor: 'rgba(34,197,94,0.35)',
    borderRadius: 16, padding: 14,
  },
  title: { color: '#f0f9ff', fontWeight: '800', fontSize: 14, flex: 1 },
  body: { color: '#94a3b8', fontSize: 12, lineHeight: 17 },
  primary: { borderRadius: 999, paddingHorizontal: 18, paddingVertical: 9 },
  primaryTxt: { color: '#04210f', fontWeight: '800', fontSize: 13 },
  secondary: {
    borderRadius: 999, paddingHorizontal: 16, paddingVertical: 9,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
  },
  secondaryTxt: { color: '#e2e8f0', fontWeight: '700', fontSize: 13 },
});

export default InstallPrompt;
