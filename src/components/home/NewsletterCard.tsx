import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLangStore } from '../../store/langStore';
import { subscribeNewsletter } from '../../services/supabase';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Newsletter signup card for the native app (iOS/Android/Expo Go), where
 * there's no footer to hold it. Same backend and privacy shape as the web
 * version in WebFooter.tsx (see NewsletterSignup there) — insert-only into
 * newsletter_subscribers, no public select policy.
 */
export function NewsletterCard({ c }: { c: { surface: string; border: string; text: string; muted: string } }) {
  const { t, lang } = useLangStore();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  const submit = async () => {
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setStatus('error');
      return;
    }
    setStatus('sending');
    try {
      await subscribeNewsletter(trimmed, lang);
      setStatus('done');
      setEmail('');
    } catch {
      setStatus('error');
    }
  };

  return (
    <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
      <View style={styles.head}>
        <View style={styles.icon}>
          <Ionicons name="mail-outline" size={18} color="#22c55e" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: c.text }]}>
            {t('Recibí nuevos senderos por mail', 'Get new trails by email')}
          </Text>
          <Text style={[styles.sub, { color: c.muted }]}>
            {t('Un mail de vez en cuando, nada de spam.', 'An email now and then, no spam.')}
          </Text>
        </View>
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
          <View style={styles.row}>
            <TextInput
              value={email}
              onChangeText={(v) => { setEmail(v); if (status === 'error') setStatus('idle'); }}
              placeholder={t('tu@email.com', 'you@email.com')}
              placeholderTextColor={c.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              style={[styles.input, { borderColor: c.border, color: c.text }]}
            />
            <TouchableOpacity
              style={[styles.btn, status === 'sending' && { opacity: 0.6 }]}
              onPress={submit}
              disabled={status === 'sending'}
              activeOpacity={0.85}
            >
              <Ionicons name="arrow-forward" size={16} color="#04110a" />
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
  card: { borderRadius: 20, borderWidth: 1, padding: 18, marginTop: 16, gap: 14 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  icon: {
    width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(34,197,94,0.14)',
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 15, fontWeight: '800', letterSpacing: -0.3, marginBottom: 2 },
  sub: { fontSize: 12, lineHeight: 17 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: {
    flex: 1, height: 42, borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 12, fontSize: 14,
  },
  btn: {
    width: 42, height: 42, borderRadius: 10, backgroundColor: '#22c55e',
    alignItems: 'center', justifyContent: 'center',
  },
  errorTxt: { fontSize: 11.5, color: '#ef4444' },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  doneTxt: { fontSize: 12.5, fontWeight: '600' },
});
