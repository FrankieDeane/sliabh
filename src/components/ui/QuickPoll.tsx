import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useLangStore } from '../../store/langStore';
import { isSupabaseConfigured, submitPollVote, fetchPollResults } from '../../services/supabase';

// Bump the id (v2, v3, …) to retire this question and start a fresh poll —
// old votes stay in the table, untouched, under the old poll_id.
const POLL_ID = 'quick-poll-next-feature-v1';
const DISMISSED_KEY = `sliabh-poll-dismissed-${POLL_ID}`;
const VOTED_KEY = `sliabh-poll-voted-${POLL_ID}`;
const VOTER_KEY = 'sliabh-poll-voter';
const CONSENT_KEY = 'sliabh-cookie-consent'; // shown after the cookie banner is handled

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
  const [pending, setPending] = useState(false);
  const [results, setResults] = useState<{ counts: Record<string, number>; total: number } | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || !isSupabaseConfigured()) return;

    let dismissed = false;
    let alreadyVoted: string | null = null;
    try {
      dismissed = localStorage.getItem(DISMISSED_KEY) === '1';
      alreadyVoted = localStorage.getItem(VOTED_KEY);
    } catch {
      // localStorage unavailable — treat as not dismissed / not voted
    }
    if (dismissed) return;
    if (alreadyVoted) setVoted(alreadyVoted);

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
    // Only the "already voted on a previous visit" case belongs here — a
    // fresh vote fetches its own results after the insert resolves (below),
    // so this must not re-run just because `voted` changes.
    if (!visible || !voted || results) return;
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
      setResults(await fetchPollResults(POLL_ID));
    } catch {
      // Best-effort — the local "voted" state already reflects the choice.
    } finally {
      setPending(false);
    }
  }

  if (!visible) return null;

  const c = isDark
    ? { bg: '#0f1724', border: '#1e2d42', text: '#f0f9ff', muted: '#94a3b8', track: '#1e2d42' }
    : { bg: '#ffffff', border: '#e2e8f0', text: '#0f172a', muted: '#64748b', track: '#f1f5f9' };

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

      <Text style={[styles.question, { color: c.text }]}>
        {t('¿Qué te gustaría ver primero en Sliabh?', 'What would you like to see next on Sliabh?')}
      </Text>

      {!voted ? (
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
      ) : (
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
  results: { gap: 10 },
  resultRow: { gap: 5 },
  resultLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  resultTxt: { fontSize: 12, fontWeight: '600', flex: 1 },
  resultPct: { fontSize: 12, fontWeight: '700' },
  barTrack: { height: 6, borderRadius: 999, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 999 },
  thanks: { fontSize: 11, textAlign: 'center', marginTop: 2 },
});
