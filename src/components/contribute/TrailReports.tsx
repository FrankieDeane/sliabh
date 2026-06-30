import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, TextInput, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  fetchTrailReports,
  submitTrailReport,
  isSupabaseConfigured,
  supabase,
  type TrailReport,
  type TrailCondition,
} from '../../services/supabase';
import { useLangStore } from '../../store/langStore';

interface Colors { surface: string; elevated: string; border: string; text: string; muted: string; accent: string }

const CONDITIONS: Array<{ id: TrailCondition; es: string; en: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = [
  { id: 'ok', es: 'Buen estado', en: 'Good', icon: 'checkmark-circle-outline', color: '#22c55e' },
  { id: 'nieve', es: 'Nieve', en: 'Snow', icon: 'snow-outline', color: '#7dd3fc' },
  { id: 'rio_crecido', es: 'Río crecido', en: 'High river', icon: 'water-outline', color: '#38bdf8' },
  { id: 'barro', es: 'Barro', en: 'Mud', icon: 'rainy-outline', color: '#a16207' },
  { id: 'huella_perdida', es: 'Huella perdida', en: 'Faint track', icon: 'help-circle-outline', color: '#fbbf24' },
  { id: 'cerrado', es: 'Cerrado', en: 'Closed', icon: 'close-circle-outline', color: '#f87171' },
  { id: 'otro', es: 'Otro', en: 'Other', icon: 'ellipsis-horizontal', color: '#94a3b8' },
];

function condMeta(id: string) { return CONDITIONS.find((c) => c.id === id) || CONDITIONS[6]; }

function timeAgo(iso: string, lang: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000), h = Math.floor(diff / 3600000);
  if (d >= 1) return lang === 'en' ? `${d}d ago` : `hace ${d}d`;
  if (h >= 1) return lang === 'en' ? `${h}h ago` : `hace ${h}h`;
  return lang === 'en' ? 'just now' : 'recién';
}

export function TrailReports({ trailId, colors }: { trailId: string; colors: Colors }) {
  const { t, lang } = useLangStore();
  const router = useRouter();
  const [reports, setReports] = React.useState<TrailReport[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [authed, setAuthed] = React.useState(false);
  const [adding, setAdding] = React.useState(false);
  const [cond, setCond] = React.useState<TrailCondition>('ok');
  const [note, setNote] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const configured = isSupabaseConfigured();

  const load = React.useCallback(() => {
    fetchTrailReports(trailId).then((r) => { setReports(r); setLoading(false); });
  }, [trailId]);

  React.useEffect(() => {
    if (!configured) { setLoading(false); return; }
    load();
    supabase.auth.getUser().then(({ data }) => setAuthed(!!data.user));
  }, [configured, load]);

  // Don't render anything until Supabase is set up — keeps the app clean.
  if (!configured) return null;

  async function send() {
    setSaving(true);
    try {
      await submitTrailReport(trailId, cond, note.trim());
      setNote(''); setAdding(false); setLoading(true); load();
    } catch {
      // not authenticated or network — send the user to login
      router.push('/(auth)/login' as any);
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 18, padding: 16, marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1.5 }}>
          {t('ESTADO DEL SENDERO', 'TRAIL CONDITIONS')}
        </Text>
        <TouchableOpacity onPress={() => (authed ? setAdding((v) => !v) : router.push('/(auth)/login' as any))} activeOpacity={0.8}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.elevated, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 }}>
          <Ionicons name="add" size={14} color={colors.accent} />
          <Text style={{ color: colors.accent, fontSize: 12, fontWeight: '700' }}>{t('Reportar', 'Report')}</Text>
        </TouchableOpacity>
      </View>

      {adding && (
        <View style={{ marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 10 }}>
            {CONDITIONS.map((cc) => {
              const on = cond === cc.id;
              return (
                <TouchableOpacity key={cc.id} onPress={() => setCond(cc.id)} activeOpacity={0.8}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 999,
                    borderWidth: 1, borderColor: on ? cc.color : colors.border, backgroundColor: on ? cc.color + '22' : 'transparent' }}>
                  <Ionicons name={cc.icon} size={13} color={cc.color} />
                  <Text style={{ color: on ? colors.text : colors.muted, fontSize: 12, fontWeight: '600' }}>{lang === 'en' ? cc.en : cc.es}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TextInput
            value={note} onChangeText={setNote} multiline
            placeholder={t('Detalle (opcional): ej. "río vadeable a la mañana"', 'Detail (optional): e.g. "river fordable in the morning"')}
            placeholderTextColor={colors.muted}
            style={{ color: colors.text, backgroundColor: colors.elevated, borderRadius: 12, padding: 10, minHeight: 56, fontSize: 13,
              ...(Platform.OS === 'web' ? { outlineStyle: 'none' as any } : {}) }}
          />
          <TouchableOpacity onPress={send} disabled={saving} activeOpacity={0.85}
            style={{ marginTop: 10, backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 11, alignItems: 'center', opacity: saving ? 0.6 : 1 }}>
            <Text style={{ color: '#04110a', fontSize: 13, fontWeight: '800' }}>{saving ? t('Enviando…', 'Sending…') : t('Enviar reporte', 'Send report')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ paddingVertical: 12 }} />
      ) : reports.length === 0 ? (
        <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 19 }}>
          {t('Todavía no hay reportes. Sé el primero en informar cómo está el sendero.', 'No reports yet. Be the first to share trail conditions.')}
        </Text>
      ) : (
        reports.map((r, i) => {
          const m = condMeta(r.condition);
          return (
            <View key={r.id} style={{ flexDirection: 'row', gap: 10, paddingVertical: 10,
              borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.border }}>
              <Ionicons name={m.icon} size={18} color={m.color} style={{ marginTop: 1 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700' }}>
                  {lang === 'en' ? m.en : m.es}
                  <Text style={{ color: colors.muted, fontWeight: '500' }}>  ·  {timeAgo(r.created_at, lang)}</Text>
                </Text>
                {!!r.note && <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 2 }}>{r.note}</Text>}
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}
