import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useLangStore } from '../../store/langStore';
import { isSupabaseConfigured, submitPollVote, submitPollLead, fetchPollResults } from '../../services/supabase';

// Bump the id (v2, v3, …) to retire this question and start a fresh poll —
// old votes stay in the table, untouched, under the old poll_id.
const POLL_ID = 'quick-poll-next-feature-v1';
const DISMISSED_KEY = `sliabh-poll-dismissed-${POLL_ID}`;
const VOTED_KEY = `sliabh-poll-voted-${POLL_ID}`;
const LEAD_KEY = `sliabh-poll-lead-${POLL_ID}`;
const VOTER_KEY = 'sliabh-poll-voter';
const CONSENT_KEY = 'sliabh-cookie-consent'; // shown after the cookie banner is handled

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const OPTIONS = [
  { id: 'mas-rutas', es: 'Más rutas y regiones', en: 'More trails & regions', icon: 'trail-sign-outline' as const },
  { id: 'clima', es: 'Clima en la ruta', en: 'On-trail weather', icon: 'partly-sunny-outline' as const },
  { id: 'comunidad', es: 'Reportes en vivo', en: 'Live community reports', icon: 'people-outline' as const },
  { id: 'app-nativa', es: 'App nativa iOS/Android', en: 'Native iOS/Android app', icon: 'phone-portrait-outline' as const },
];

function getVoterKey(): string {
  try {
    let key = localStorage.getItem(VOTER_KEY);
    if (!key) {
      key = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `v${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(VOTER_KEY, key);
    }
    return key;
  } catch {
    return `v${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

export function QuickPoll() {
  const { theme } = useThemeStore();
  const { t } = useLangStore();
  const isDark = theme === 'dark';
  const { width } = useWindowDimensions();
  const isNarrow = width < 480;

  const [visible, setVisible] = useState(false);
  const [voted, setVoted] = useState<string | null>(null);
  const [leadDone, setLeadDone] = useState(false);
  const [pending, setPending] = useState(false);
  const [results, setResults] = useState<{ counts: Record<string, number>; total: number } | null>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [leadError, setLeadError] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || !isSupabaseConfigured()) return;

    let dismissed = false;
    let alreadyVoted: string | null = null;
    let leadAlreadyDone = false;
    try {
      dismissed = localStorage.getItem(DISMISSED_KEY) === '1';
      alreadyVoted = localStorage.getItem(VOTED_KEY);
      leadAlreadyDone = localStorage.getItem(LEAD_KEY) === '1';
    } catch {
      // localStorage unavailable — treat as not dismissed / not voted
    }
    if (dismissed) return;
    if (alreadyVoted) setVoted(alreadyVoted);
    if (leadAlreadyDone) setLeadDone(true);

    function reveal() {
      let consentGiven = true;
      try { consentGiven = !!localStorage.getItem(CONSENT_KEY); } catch {}
      if (consentGiven) setVisible(true);
    }

    // On narrow screens the floating card competes with the page for space,
    // so instead of dropping it on top of the content after a fixed delay,
    // wait until the visitor has scrolled down to the footer. Fall back to
    // the timer if the footer can't be found or IntersectionObserver isn't
    // available, so the poll still shows up eventually.
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

    // Wait for the cookie banner to be resolved (or absent) before adding a
    // second floating widget, and give visitors a moment to land first.
    const timer = setTimeout(reveal, 4000);
    return () => clearTimeout(timer);
  }, [isNarrow]);

  useEffect(() => {
    // Only the "already finished on a previous visit" case belongs here — a
    // fresh submission fetches its own results after the insert resolves
    // (below), so this must not re-run just because state changes.
    if (!visible || !voted || !leadDone || results) return;
    fetchPollResults(POLL_ID).then(setResults);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  function dismiss() {
    try { localStorage.setItem(DISMISSED_KEY, '1'); } catch {}
    setVisible(false);
  }

  async function vote(optionId: string) {
    if (pending || voted) return;
    setPending(true);
    setVoted(optionId);
    try { localStorage.setItem(VOTED_KEY, optionId); } catch {}
    try {
      await submitPollVote(POLL_ID, optionId, getVoterKey());
    } catch {
      // Best-effort — the local "voted" state already reflects the choice,
      // and the lead form (which matters more here) still gets its own shot.
    } finally {
      setPending(false);
    }
  }

  async function submitLead() {
    if (pending || !voted) return;
    const fn = firstName.trim();
    const ln = lastName.trim();
    const em = email.trim();
    if (!fn || !ln) {
      setLeadError(t('Completá nombre y apellido.', 'Enter your first and last name.'));
      return;
    }
    if (!EMAIL_RE.test(em)) {
      setLeadError(t('Ingresá un email válido.', 'Enter a valid email.'));
      return;
    }
    setLeadError(null);
    setPending(true);
    try {
      await submitPollLead(POLL_ID, voted, getVoterKey(), { firstName: fn, lastName: ln, email: em });
      try { localStorage.setItem(LEAD_KEY, '1'); } catch {}
      setLeadDone(true);
      setResults(await fetchPollResults(POLL_ID));
    } catch {
      setLeadError(t('No se pudo enviar. Probá de nuevo.', "Couldn't submit. Please try again."));
    } finally {
      setPending(false);
    }
  }

  if (!visible) return null;

  const c = isDark
    ? { bg: '#0f1724', border: '#1e2d42', text: '#f0f9ff', muted: '#94a3b8', track: '#1e2d42', inputBg: '#0a121f' }
    : { bg: '#ffffff', border: '#e2e8f0', text: '#0f172a', muted: '#64748b', track: '#f1f5f9', inputBg: '#f8fafc' };

  const step: 'question' | 'lead' | 'results' = !voted ? 'question' : !leadDone ? 'lead' : 'results';

  return (
    <View
      style={[
        styles.card,
        isNarrow ? styles.cardNarrow : styles.cardWide,
        { backgroundColor: c.bg, borderColor: c.border },
      ]}
      {...({ 'data-quick-poll': true } as any)}
    >
      <View style={styles.header}>
        <Text style={[styles.eyebrow, { color: '#22c55e' }]}>
          {t('ENCUESTA RÁPIDA', 'QUICK POLL')}
        </Text>
        <TouchableOpacity onPress={dismiss} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={16} color={c.muted} />
        </TouchableOpacity>
      </View>

      {step === 'question' && (
        <>
          <Text style={[styles.question, { color: c.text }]}>
            {t('¿Qué te gustaría ver primero en Sliabh?', 'What would you like to see next on Sliabh?')}
          </Text>
          <View style={[styles.options, isNarrow && styles.optionsNarrow]}>
            {OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.id}
                style={[styles.optionBtn, isNarrow && styles.optionBtnNarrow, { borderColor: c.border }]}
                onPress={() => vote(opt.id)}
                activeOpacity={0.75}
                disabled={pending}
              >
                <Ionicons name={opt.icon} size={15} color="#22c55e" />
                <Text style={[styles.optionTxt, { color: c.text }]} numberOfLines={2}>{t(opt.es, opt.en)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {step === 'lead' && (
        <>
          <Text style={[styles.question, { color: c.text }]}>
            {t('¡Gracias! Dejanos tus datos', 'Thanks! Leave us your details')}
          </Text>
          <Text style={[styles.leadSub, { color: c.muted }]}>
            {t(
              'Para avisarte cuando salga esta novedad. Nunca compartimos tu info.',
              "So we can let you know when it ships. We never share your info.",
            )}
          </Text>
          <View style={styles.leadForm}>
            <TextInput
              value={firstName}
              onChangeText={setFirstName}
              placeholder={t('Nombre', 'First name')}
              placeholderTextColor={c.muted}
              style={[styles.input, { borderColor: c.border, backgroundColor: c.inputBg, color: c.text }]}
              editable={!pending}
            />
            <TextInput
              value={lastName}
              onChangeText={setLastName}
              placeholder={t('Apellido', 'Last name')}
              placeholderTextColor={c.muted}
              style={[styles.input, { borderColor: c.border, backgroundColor: c.inputBg, color: c.text }]}
              editable={!pending}
            />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor={c.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              style={[styles.input, { borderColor: c.border, backgroundColor: c.inputBg, color: c.text }]}
              editable={!pending}
            />
            {leadError && <Text style={styles.leadError}>{leadError}</Text>}
            <TouchableOpacity
              style={[styles.submitBtn, pending && { opacity: 0.6 }]}
              onPress={submitLead}
              activeOpacity={0.85}
              disabled={pending}
            >
              <Text style={styles.submitBtnTxt}>{t('Enviar', 'Submit')}</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {step === 'results' && (
        <>
          <Text style={[styles.question, { color: c.text }]}>
            {t('¿Qué te gustaría ver primero en Sliabh?', 'What would you like to see next on Sliabh?')}
          </Text>
          <View style={styles.results}>
            {OPTIONS.map((opt) => {
              const count = results?.counts[opt.id] ?? (opt.id === voted ? 1 : 0);
              const total = Math.max(results?.total ?? 1, 1);
              const pct = Math.round((count / total) * 100);
              const mine = opt.id === voted;
              return (
                <View key={opt.id} style={styles.resultRow}>
                  <View style={styles.resultLabelRow}>
                    <Text style={[styles.resultTxt, { color: mine ? '#22c55e' : c.text }]} numberOfLines={1}>
                      {mine ? '✓ ' : ''}{t(opt.es, opt.en)}
                    </Text>
                    <Text style={[styles.resultPct, { color: c.muted }]}>{pct}%</Text>
                  </View>
                  <View style={[styles.barTrack, { backgroundColor: c.track }]}>
                    <View style={[styles.barFill, { width: `${pct}%` as any, backgroundColor: mine ? '#22c55e' : c.muted }]} />
                  </View>
                </View>
              );
            })}
            <Text style={[styles.thanks, { color: c.muted }]}>
              {t('¡Gracias por tu voto!', 'Thanks for voting!')}
            </Text>
          </View>
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
    zIndex: 9998,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 30,
  },
  cardWide: { right: 20, width: 300 },
  cardNarrow: { left: 12, right: 12, padding: 12, maxHeight: '70%' as any, overflow: 'scroll' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  question: { fontSize: 14, fontWeight: '700', lineHeight: 19, marginBottom: 12 },
  options: { gap: 8 },
  // Two columns on narrow screens instead of a stacked list — same options,
  // roughly half the vertical footprint so the card doesn't eat the screen.
  optionsNarrow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 9,
    borderWidth: 1, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 12,
  },
  optionBtnNarrow: { flexBasis: '48%', paddingVertical: 8, paddingHorizontal: 8 },
  optionTxt: { fontSize: 13, fontWeight: '600', flexShrink: 1 },
  leadSub: { fontSize: 11, lineHeight: 16, marginTop: -6, marginBottom: 12 },
  leadForm: { gap: 8 },
  input: {
    borderWidth: 1, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 12,
    fontSize: 13,
  },
  leadError: { fontSize: 11, color: '#ef4444', fontWeight: '600' },
  submitBtn: {
    backgroundColor: '#22c55e', borderRadius: 10, paddingVertical: 10,
    alignItems: 'center', marginTop: 2,
  },
  submitBtnTxt: { color: '#052e16', fontSize: 13, fontWeight: '700' },
  results: { gap: 10 },
  resultRow: { gap: 5 },
  resultLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  resultTxt: { fontSize: 12, fontWeight: '600', flex: 1 },
  resultPct: { fontSize: 12, fontWeight: '700' },
  barTrack: { height: 6, borderRadius: 999, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 999 },
  thanks: { fontSize: 11, textAlign: 'center', marginTop: 2 },
});
