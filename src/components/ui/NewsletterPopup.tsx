import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useLangStore } from '../../store/langStore';
import { subscribeNewsletter } from '../../services/supabase';

// A floating card that surfaces the newsletter signup every so often —
// not on every visit, and never again once the visitor has subscribed
// (from here, the footer, or the native app's card; they all set the same
// SUBSCRIBED_KEY). Mirrors QuickPoll.tsx's timing/positioning conventions:
// bottom-left (QuickPoll sits bottom-right) so the two never overlap, same
// reveal delay/footer-intersection trick on narrow screens, gated behind
// cookie consent.
const DISMISSED_AT_KEY = 'sliabh-newsletter-popup-dismissed-at';
export const SUBSCRIBED_KEY = 'sliabh-newsletter-subscribed';
const CONSENT_KEY = 'sliabh-cookie-consent';
const COOLDOWN_MS = 1000 * 60 * 60 * 24 * 7; // 7 days between appearances

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function NewsletterPopup() {
  const { theme } = useThemeStore();
  const { t, lang } = useLangStore();
  const isDark = theme === 'dark';
  const { width } = useWindowDimensions();
  const isNarrow = width < 480;

  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    let subscribed = false;
    let dismissedAt = 0;
    try {
      subscribed = localStorage.getItem(SUBSCRIBED_KEY) === '1';
      dismissedAt = Number(localStorage.getItem(DISMISSED_AT_KEY) ?? 0);
    } catch {
      // localStorage unavailable — treat as never shown before
    }
    if (subscribed) return;
    if (Date.now() - dismissedAt < COOLDOWN_MS) return;

    function reveal() {
      let consentGiven = true;
      try { consentGiven = !!localStorage.getItem(CONSENT_KEY); } catch {}
      if (consentGiven) setVisible(true);
    }

    // Same narrow-screen trick as QuickPoll: wait for the footer instead of
    // dropping a floating card over content on small screens.
    if (isNarrow) {
      const footer = typeof document !== 'undefined' ? document.getElementById('site-footer') : null;
      if (footer && typeof IntersectionObserver !== 'undefined') {
        const observer = new IntersectionObserver(
          (entries) => {
            if (entries.some((e) => e.isIntersecting)) {
              reveal();
              observer.disconnect();
            }
          },
          { rootMargin: '0px 0px -10% 0px' },
        );
        observer.observe(footer);
        return () => observer.disconnect();
      }
    }

    // Later than QuickPoll's 4s so the two don't both pop in at once.
    const timer = setTimeout(reveal, 9000);
    return () => clearTimeout(timer);
  }, [isNarrow]);

  function dismiss() {
    try { localStorage.setItem(DISMISSED_AT_KEY, String(Date.now())); } catch {}
    setVisible(false);
  }

  async function submit() {
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setStatus('error');
      return;
    }
    setStatus('sending');
    try {
      await subscribeNewsletter(trimmed, lang);
      try { localStorage.setItem(SUBSCRIBED_KEY, '1'); } catch {}
      setStatus('done');
      setEmail('');
    } catch {
      setStatus('error');
    }
  }

  if (!visible) return null;

  const c = isDark
    ? { bg: '#0f1724', border: '#1e2d42', text: '#f0f9ff', muted: '#94a3b8', inputBg: '#0a121f' }
    : { bg: '#ffffff', border: '#e2e8f0', text: '#0f172a', muted: '#64748b', inputBg: '#f8fafc' };

  return (
    <View
      style={[
        styles.card,
        isNarrow ? styles.cardNarrow : styles.cardWide,
        { backgroundColor: c.bg, borderColor: c.border },
      ]}
      {...({ 'data-newsletter-popup': true } as any)}
    >
      <View style={styles.header}>
        <View style={styles.headIcon}>
          <Ionicons name="mail-outline" size={15} color="#22c55e" />
        </View>
        <Text style={[styles.eyebrow, { color: '#22c55e' }]}>NEWSLETTER</Text>
        <TouchableOpacity
          onPress={dismiss}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{ marginLeft: 'auto' }}
        >
          <Ionicons name="close" size={16} color={c.muted} />
        </TouchableOpacity>
      </View>

      {status === 'done' ? (
        <View style={styles.doneRow}>
          <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
          <Text style={[styles.doneTxt, { color: c.muted }]}>
            {t('¡Listo! Ya estás suscripto.', "You're subscribed!")}
          </Text>
        </View>
      ) : (
        <>
          <Text style={[styles.question, { color: c.text }]}>
            {t('Recibí nuevos senderos por mail', 'Get new trails by email')}
          </Text>
          <Text style={[styles.sub, { color: c.muted }]}>
            {t('Un mail de vez en cuando, nada de spam.', 'An email now and then, no spam.')}
          </Text>
          <View style={styles.row}>
            <TextInput
              value={email}
              onChangeText={(v) => { setEmail(v); if (status === 'error') setStatus('idle'); }}
              placeholder={t('tu@email.com', 'you@email.com')}
              placeholderTextColor={c.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              style={[styles.input, { borderColor: c.border, backgroundColor: c.inputBg, color: c.text }]}
              editable={status !== 'sending'}
            />
            <TouchableOpacity
              style={[styles.submitBtn, status === 'sending' && { opacity: 0.6 }]}
              onPress={submit}
              activeOpacity={0.85}
              disabled={status === 'sending'}
            >
              <Ionicons name="arrow-forward" size={15} color="#052e16" />
            </TouchableOpacity>
          </View>
          {status === 'error' && (
            <Text style={styles.errorTxt}>
              {t('Revisá el email e intentá de nuevo.', 'Check the email and try again.')}
            </Text>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'fixed' as any,
    bottom: 20,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    zIndex: 9997,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
  },
  cardWide: { left: 20, width: 300 },
  cardNarrow: { left: 12, right: 12, padding: 12 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  headIcon: {
    width: 24, height: 24, borderRadius: 8, backgroundColor: 'rgba(34,197,94,0.14)',
    alignItems: 'center', justifyContent: 'center',
  },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  question: { fontSize: 14, fontWeight: '700', lineHeight: 19, marginBottom: 3 },
  sub: { fontSize: 11.5, lineHeight: 16, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: {
    flex: 1, height: 38, borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 12, fontSize: 13,
  },
  submitBtn: {
    width: 38, height: 38, borderRadius: 10, backgroundColor: '#22c55e',
    alignItems: 'center', justifyContent: 'center',
  },
  errorTxt: { fontSize: 11, color: '#ef4444', fontWeight: '600', marginTop: 6 },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  doneTxt: { fontSize: 12.5, fontWeight: '600' },
});
