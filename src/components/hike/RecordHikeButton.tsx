import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { type HikeColors, type HikeTrail } from './HikeMode';
import { useHikeStore } from '../../store/hikeStore';
import { useLangStore } from '../../store/langStore';

interface Props {
  colors: HikeColors;
  /** Omit to record a free track that is not tied to any trail. */
  trail?: HikeTrail;
  /** `floating` pins the button over the screen; `block` flows inline. */
  variant?: 'floating' | 'block';
}

/**
 * The one entry point to GPS recording. Floating by default because a hiker
 * about to set off should never have to scroll to find it.
 */
export function RecordHikeButton({ colors, trail, variant = 'floating' }: Props) {
  const { t } = useLangStore();
  const { width } = useWindowDimensions();
  // The recording belongs to the app, not to this button: that is what lets
  // the screen come back on its own after the browser is killed.
  const start = useHikeStore((s) => s.start);
  const openHike = React.useCallback(
    () => start(trail ? { ...trail, id: trail.id, name: trail.name } : undefined),
    [start, trail],
  );

  const label = t('Grabar recorrido', 'Record hike');
  const sub = trail
    ? t('GPS en vivo · tiempo · distancia', 'Live GPS · time · distance')
    : t('Sin sendero — grabá donde estés', 'No trail — record wherever you are');

  return (
    <>
      {variant === 'floating' ? (
        <View
          style={[s.floatWrap, Platform.OS === 'web' && width < 720 && { bottom: 78 }]}
          pointerEvents="box-none"
        >
          <TouchableOpacity
            onPress={openHike}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={label}
            style={[s.floatBtn, { backgroundColor: colors.accent }]}
          >
            <Ionicons name="radio-button-on" size={18} color="#04210f" />
            <Text style={s.floatText}>{label}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          onPress={openHike}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel={label}
          style={[s.blockBtn, { backgroundColor: '#14532d', borderColor: colors.accent }]}
        >
          <Ionicons name="radio-button-on" size={20} color={colors.accent} />
          <View style={{ flex: 1 }}>
            <Text style={[s.blockLabel, { color: colors.accent }]}>{label}</Text>
            <Text style={[s.blockSub, { color: 'rgba(134,239,172,0.7)' }]}>{sub}</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.accent} />
        </TouchableOpacity>
      )}

    </>
  );
}

const s = StyleSheet.create({
  floatWrap: {
    position: Platform.OS === 'web' ? ('fixed' as any) : 'absolute',
    left: 0,
    right: 0,
    bottom: 22,
    alignItems: 'center',
    zIndex: 50,
  },
  floatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 22,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  floatText: { color: '#04210f', fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },
  blockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  blockLabel: { fontSize: 15, fontWeight: '800', letterSpacing: -0.3 },
  blockSub: { fontSize: 12, marginTop: 1 },
});

export default RecordHikeButton;
