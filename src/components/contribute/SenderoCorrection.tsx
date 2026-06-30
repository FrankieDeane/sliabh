import React from 'react';
import { View, Text, TouchableOpacity, TextInput, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { submitSenderoCorrection, isSupabaseConfigured, supabase } from '../../services/supabase';
import { useLangStore } from '../../store/langStore';

interface Colors {
  surface: string;
  elevated: string;
  border: string;
  text: string;
  muted: string;
  accent?: string;
}

/**
 * Lets a signed-in user report the *correct* location of a trail by capturing
 * their phone's GPS position (plus a note). Submitted as a moderated
 * contribution. Shown on each trail page and in the maps section.
 *
 * `trailId` / `trailName` are optional: when omitted (e.g. on the maps screen)
 * it records a general "this trail is wrong here" correction.
 */
export function SenderoCorrection({
  trailId,
  trailName,
  colors,
}: {
  trailId?: string;
  trailName?: string;
  colors: Colors;
}) {
  const { t } = useLangStore();
  const router = useRouter();
  const accent = colors.accent ?? '#22c55e';

  const [authed, setAuthed] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [pos, setPos] = React.useState<{ lat: number; lon: number; acc: number | null } | null>(null);
  const [locating, setLocating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [note, setNote] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [done, setDone] = React.useState(false);

  const configured = isSupabaseConfigured();

  React.useEffect(() => {
    if (!configured) return;
    supabase.auth.getUser().then(({ data }) => setAuthed(!!data.user));
  }, [configured]);

  // Hidden until Supabase is configured — keeps the app clean in local-only mode.
  if (!configured) return null;

  const cardStyle = {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  } as const;

  function toggle() {
    if (!authed) {
      router.push('/(auth)/login' as any);
      return;
    }
    setOpen((v) => !v);
  }

  function locate() {
    setError(null);
    const geo: any =
      typeof navigator !== 'undefined' ? (navigator as any).geolocation : undefined;
    if (!geo) {
      setError(
        t(
          'La ubicación GPS no está disponible en este dispositivo. Probá desde la versión web.',
          "GPS location isn't available on this device. Try the web version.",
        ),
      );
      return;
    }
    setLocating(true);
    geo.getCurrentPosition(
      (p: any) => {
        setPos({ lat: p.coords.latitude, lon: p.coords.longitude, acc: p.coords.accuracy ?? null });
        setLocating(false);
      },
      () => {
        setError(
          t(
            'No pudimos obtener tu ubicación. Activá los permisos de GPS y reintentá.',
            "Couldn't get your location. Enable GPS permission and try again.",
          ),
        );
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 3000 },
    );
  }

  async function submit() {
    if (!pos) return;
    setSaving(true);
    try {
      await submitSenderoCorrection({ trailId, trailName, lat: pos.lat, lon: pos.lon, note: note.trim() });
      setDone(true);
    } catch {
      // not authenticated / network — send the user to login
      router.push('/(auth)/login' as any);
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <View style={cardStyle}>
        <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
          <Ionicons name="checkmark-circle" size={20} color={accent} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700', marginBottom: 2 }}>
              {t('¡Gracias por la corrección!', 'Thanks for the correction!')}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 13, lineHeight: 19 }}>
              {t(
                'Tu ubicación quedó registrada y será revisada por el equipo.',
                'Your location was recorded and will be reviewed by the team.',
              )}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={cardStyle}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1.5 }}>
            {t('CORREGIR SENDERO', 'FIX THE TRAIL')}
          </Text>
          <Text style={{ color: colors.muted, fontSize: 12, marginTop: 3, lineHeight: 17 }}>
            {t(
              '¿El sendero está mal marcado? Marcá con tu GPS dónde está realmente.',
              'Trail drawn in the wrong place? Use your GPS to mark where it really is.',
            )}
          </Text>
        </View>
        <TouchableOpacity
          onPress={toggle}
          activeOpacity={0.8}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 5,
            backgroundColor: colors.elevated, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999,
          }}
        >
          <Ionicons name={open ? 'close' : 'locate-outline'} size={14} color={accent} />
          <Text style={{ color: accent, fontSize: 12, fontWeight: '700' }}>
            {open ? t('Cancelar', 'Cancel') : t('Corregir', 'Fix')}
          </Text>
        </TouchableOpacity>
      </View>

      {open && (
        <View style={{ marginTop: 12 }}>
          <TouchableOpacity
            onPress={locate}
            disabled={locating}
            activeOpacity={0.85}
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
              borderWidth: 1, borderColor: accent, borderRadius: 12, paddingVertical: 11,
              opacity: locating ? 0.6 : 1,
            }}
          >
            <Ionicons name="navigate" size={15} color={accent} />
            <Text style={{ color: accent, fontSize: 13, fontWeight: '700' }}>
              {locating
                ? t('Ubicando…', 'Locating…')
                : pos
                  ? t('Volver a ubicar', 'Re-locate')
                  : t('Usar mi ubicación GPS', 'Use my GPS location')}
            </Text>
          </TouchableOpacity>

          {pos && (
            <View style={{ marginTop: 10, backgroundColor: colors.elevated, borderRadius: 10, padding: 10 }}>
              <Text style={{ color: colors.text, fontSize: 12, fontWeight: '600' }}>
                📍 {pos.lat.toFixed(5)}, {pos.lon.toFixed(5)}
                {pos.acc != null ? (
                  <Text style={{ color: colors.muted, fontWeight: '400' }}>{`  ·  ±${Math.round(pos.acc)} m`}</Text>
                ) : null}
              </Text>
            </View>
          )}

          {error && (
            <Text style={{ color: '#f87171', fontSize: 12, marginTop: 8, lineHeight: 17 }}>{error}</Text>
          )}

          <TextInput
            value={note}
            onChangeText={setNote}
            multiline
            placeholder={t(
              '¿Qué está mal? Ej: "el sendero real pasa 50 m al norte"',
              'What\'s wrong? E.g. "the real trail is 50 m north"',
            )}
            placeholderTextColor={colors.muted}
            style={{
              color: colors.text, backgroundColor: colors.elevated, borderRadius: 12, padding: 10,
              minHeight: 56, fontSize: 13, marginTop: 10,
              ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
            }}
          />

          <TouchableOpacity
            onPress={submit}
            disabled={!pos || saving}
            activeOpacity={0.85}
            style={{
              marginTop: 10, backgroundColor: accent, borderRadius: 12, paddingVertical: 11,
              alignItems: 'center', opacity: !pos || saving ? 0.5 : 1,
            }}
          >
            <Text style={{ color: '#04110a', fontSize: 13, fontWeight: '800' }}>
              {saving ? t('Enviando…', 'Sending…') : t('Enviar corrección', 'Send correction')}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
