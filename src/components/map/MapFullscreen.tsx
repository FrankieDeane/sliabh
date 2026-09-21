import React from 'react';
import { Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLangStore } from '../../store/langStore';

/**
 * Expanding a map to the whole viewport. The panel is plain CSS (fixed inset
 * 0) rather than the Fullscreen API, which iOS Safari refuses for anything
 * but <video>; the native API is requested on top where it exists, purely to
 * hide the browser chrome.
 */
export function useMapFullscreen() {
  const [expanded, setExpanded] = React.useState(false);

  const toggle = React.useCallback(() => {
    setExpanded((was) => {
      const next = !was;
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        try {
          if (next) document.documentElement.requestFullscreen?.().catch(() => {});
          else if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
        } catch {
          // CSS panel below covers us where the API is unavailable
        }
      }
      return next;
    });
  }, []);

  // Leaving fullscreen with the system gesture or Esc must collapse the panel
  // too, otherwise the map stays pinned over the page with no way back.
  React.useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const onChange = () => { if (!document.fullscreenElement) setExpanded(false); };
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const panelStyle = expanded
    ? ({
        position: Platform.OS === 'web' ? 'fixed' : 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        height: '100%',
        zIndex: 999,
        backgroundColor: '#070b14',
      } as any)
    : undefined;

  return { expanded, toggle, panelStyle };
}

export function FullscreenButton({
  expanded,
  onPress,
  style,
  compact = false,
}: {
  expanded: boolean;
  onPress: () => void;
  style?: any;
  /** Icon only — phones have no room for the label next to the map controls. */
  compact?: boolean;
}) {
  const { t } = useLangStore();
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={expanded ? t('Salir de pantalla completa', 'Exit fullscreen') : t('Pantalla completa', 'Fullscreen')}
      style={[s.btn, style]}
    >
      <Ionicons name={expanded ? 'contract-outline' : 'expand-outline'} size={16} color="#fff" />
      {!compact && (
        <Text style={s.txt}>
          {expanded ? t('Salir', 'Exit') : t('Pantalla completa', 'Fullscreen')}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15,23,42,0.88)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  txt: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
