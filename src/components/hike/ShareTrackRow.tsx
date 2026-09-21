import React from 'react';
import { View, Text, TouchableOpacity, Platform, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { setTrackVisibility, type SavedTrack } from '../../services/supabase';
import { downloadGpx, buildGpx } from '../../utils/gpx';
import { useLangStore } from '../../store/langStore';

interface Colors { surface: string; elevated: string; border: string; text: string; muted: string; accent: string }

function shareUrlFor(token: string): string {
  const origin =
    Platform.OS === 'web' && typeof window !== 'undefined' && window.location
      ? window.location.origin
      : 'https://sliabh.app';
  return `${origin}/recorrido/${token}`;
}

/**
 * Turns one recorded hike into something the walker can hand to someone else.
 *
 * Private is the default and stays that way until they choose otherwise: a
 * track is a trace of where a person actually was, starting wherever they hit
 * record — often their own front door — so publishing is a deliberate act,
 * and the warning says exactly what becomes visible.
 */
export function ShareTrackRow({
  track,
  colors,
  label,
  onChanged,
}: {
  track: SavedTrack;
  colors: Colors;
  /** Trail name, used for the GPX file and the share text. */
  label: string;
  onChanged?: () => void;
}) {
  const { t } = useLangStore();
  const [visibility, setVisibility] = React.useState(track.visibility ?? 'private');
  const [busy, setBusy] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const token = track.share_token;
  const sharingReady = !!token && !!track.visibility;
  const url = token ? shareUrlFor(token) : '';

  const toggle = React.useCallback(async () => {
    if (!sharingReady) return;
    const next = visibility === 'public' ? 'private' : 'public';
    setBusy(true);
    setError(null);
    const { ok, error: err } = await setTrackVisibility(track.id, next);
    setBusy(false);
    if (!ok) {
      setError(err ?? 'error');
      return;
    }
    setVisibility(next);
    onChanged?.();
  }, [sharingReady, visibility, track.id, onChanged]);

  const copy = React.useCallback(async () => {
    if (!url) return;
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      } else {
        await Share.share({ message: url });
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('clipboard');
    }
  }, [url]);

  const shareOut = React.useCallback(async () => {
    if (!url) return;
    const text = t(
      `Mi recorrido en ${label} — Sliabh`,
      `My hike on ${label} — Sliabh`,
    );
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && (navigator as any).share) {
        await (navigator as any).share({ title: text, text, url });
      } else {
        await Share.share({ message: `${text}\n${url}`, url });
      }
    } catch {
      // the user dismissed the sheet — nothing to report
    }
  }, [url, label, t]);

  const exportGpx = React.useCallback(() => {
    const points = track.points.map((p) => ({ lat: p.lat, lon: p.lon }));
    const name = `${label} — ${new Date(track.started_at).toISOString().slice(0, 10)}`;
    if (Platform.OS === 'web') {
      downloadGpx(name, points);
    } else {
      Share.share({ message: buildGpx(name, points) }).catch(() => {});
    }
  }, [track, label]);

  if (!sharingReady) return null;

  const isPublic = visibility === 'public';

  return (
    <View style={{ gap: 8, paddingTop: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <TouchableOpacity
          onPress={toggle}
          disabled={busy}
          activeOpacity={0.85}
          accessibilityRole="switch"
          accessibilityState={{ checked: isPublic }}
          style={{
            flexDirection: 'row', alignItems: 'center', gap: 6,
            borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7,
            borderColor: isPublic ? colors.accent : colors.border,
            backgroundColor: isPublic ? 'rgba(34,197,94,0.12)' : 'transparent',
            opacity: busy ? 0.6 : 1,
          }}
        >
          <Ionicons
            name={isPublic ? 'earth' : 'lock-closed-outline'}
            size={14}
            color={isPublic ? colors.accent : colors.muted}
          />
          <Text style={{ color: isPublic ? colors.accent : colors.muted, fontSize: 12, fontWeight: '700' }}>
            {isPublic ? t('Público', 'Public') : t('Privado', 'Private')}
          </Text>
        </TouchableOpacity>

        {isPublic && (
          <>
            <TouchableOpacity
              onPress={copy}
              activeOpacity={0.85}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 }}
            >
              <Ionicons name={copied ? 'checkmark' : 'link-outline'} size={14} color={colors.text} />
              <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700' }}>
                {copied ? t('Copiado', 'Copied') : t('Copiar link', 'Copy link')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={shareOut}
              activeOpacity={0.85}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 }}
            >
              <Ionicons name="share-social-outline" size={14} color={colors.text} />
              <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700' }}>
                {t('Compartir', 'Share')}
              </Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          onPress={exportGpx}
          activeOpacity={0.85}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 }}
        >
          <Ionicons name="download-outline" size={14} color={colors.text} />
          <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700' }}>GPX</Text>
        </TouchableOpacity>
      </View>

      {isPublic && (
        <Text style={{ color: colors.muted, fontSize: 11, lineHeight: 15 }}>
          {t(
            'Cualquiera con el link ve el trazo completo, incluido dónde arrancaste. Volvé a Privado para cortar el acceso.',
            'Anyone with the link sees the whole track, including where you started. Switch back to Private to cut off access.',
          )}
        </Text>
      )}

      {error && (
        <Text style={{ color: '#f59e0b', fontSize: 11 }}>
          {t('No se pudo cambiar ahora. Probá de nuevo con señal.', 'Could not change it now. Try again with a connection.')}
        </Text>
      )}
    </View>
  );
}

export default ShareTrackRow;
