import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useWindowDimensions,
  Animated,
  PanResponder,
  type LayoutChangeEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { type HikeColors, type HikeTrail } from './HikeMode';
import { useHikeStore } from '../../store/hikeStore';
import { useLangStore } from '../../store/langStore';
import { storage } from '../../store/mmkv';
import {
  floatBounds,
  parseSpot,
  pointToSpot,
  spotToPoint,
  type FloatBounds,
  type FloatSpot,
} from './floatPosition';

const SPOT_KEY = 'record-button-spot';
/** Finger travel before a touch counts as a drag instead of a tap. */
const DRAG_SLOP = 8;

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

  if (Platform.OS === 'web' && width >= 720) return null;

  const label = t('Grabar recorrido', 'Record hike');
  const sub = trail
    ? t('GPS en vivo · tiempo · distancia', 'Live GPS · time · distance')
    : t('Sin sendero — grabá donde estés', 'No trail — record wherever you are');

  return (
    <>
      {variant === 'floating' ? (
        <FloatingRecordButton label={label} color={colors.accent} onPress={openHike} />
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

/**
 * The floating pill, which the hiker can drag out of the way of whatever they
 * are looking at. On release it settles on the nearest side (or back in the
 * centre) at the height it was dropped, and remembers that spot.
 */
function FloatingRecordButton({
  label,
  color,
  onPress,
}: {
  label: string;
  color: string;
  onPress: () => void;
}) {
  const { t } = useLangStore();
  const insets = useSafeAreaInsets();
  const [area, setArea] = React.useState<{ width: number; height: number } | null>(null);
  const [btn, setBtn] = React.useState<{ width: number; height: number } | null>(null);
  const [spot, setSpot] = React.useState<FloatSpot>(() => {
    try {
      return parseSpot(storage.getString(SPOT_KEY));
    } catch {
      return parseSpot(null);
    }
  });
  const [dragging, setDragging] = React.useState(false);

  const bounds = React.useMemo<FloatBounds | null>(() => {
    if (!area || !btn) return null;
    return floatBounds(
      area,
      btn,
      // Web: the page has no notch, and the site's bottom bar is the margin.
      Platform.OS === 'web' ? { top: 0, bottom: 0, left: 0, right: 0 } : insets,
      { side: 12, top: 12, bottom: Platform.OS === 'web' ? 78 : 22 },
    );
  }, [area, btn, insets]);

  const native = Platform.OS !== 'web';
  const pos = React.useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const point = React.useRef({ x: 0, y: 0 });
  const boundsRef = React.useRef(bounds);
  boundsRef.current = bounds;

  // Re-place the button whenever the screen changes size or shape (rotation,
  // split screen, a browser window being resized) so it is never left off it.
  React.useEffect(() => {
    if (!bounds || dragging) return;
    point.current = spotToPoint(spot, bounds);
    pos.setValue(point.current);
  }, [bounds, spot, dragging, pos]);

  const [pressed, setPressed] = React.useState(false);
  const onPressRef = React.useRef(onPress);
  onPressRef.current = onPress;
  const moved = React.useRef(false);

  // One responder handles both the tap and the drag. A child Touchable would
  // keep the touch to itself in the browser, so the button could never move
  // there; this way phone app and website behave the same.
  const responder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          moved.current = false;
          setPressed(true);
        },
        onPanResponderMove: (_, g) => {
          if (!moved.current && Math.abs(g.dx) + Math.abs(g.dy) <= DRAG_SLOP) return;
          const b = boundsRef.current;
          if (!b) return;
          if (!moved.current) {
            moved.current = true;
            setDragging(true);
          }
          pos.setValue({
            x: Math.min(b.maxX, Math.max(b.minX, point.current.x + g.dx)),
            y: Math.min(b.maxY, Math.max(b.minY, point.current.y + g.dy)),
          });
        },
        onPanResponderRelease: (_, g) => {
          setPressed(false);
          if (moved.current) settle(g.dx, g.dy);
          else onPressRef.current();
        },
        onPanResponderTerminate: (_, g) => {
          setPressed(false);
          if (moved.current) settle(g.dx, g.dy);
        },
      }),
    [],
  );

  function settle(dx: number, dy: number) {
    const b = boundsRef.current;
    if (!b) {
      setDragging(false);
      return;
    }
    const next = pointToSpot(point.current.x + dx, point.current.y + dy, b);
    const target = spotToPoint(next, b);
    point.current = target;
    Animated.spring(pos, {
      toValue: target,
      useNativeDriver: native,
      friction: 7,
      tension: 60,
    }).start(() => setDragging(false));
    setSpot(next);
    try {
      storage.set(SPOT_KEY, JSON.stringify(next));
    } catch {
      // Not remembering the spot is fine; it still works this session.
    }
  }

  const onArea = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setArea((a) => (a && a.width === width && a.height === height ? a : { width, height }));
  };
  const onBtn = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setBtn((p) => (p && p.width === width && p.height === height ? p : { width, height }));
  };

  return (
    <View style={s.floatArea} pointerEvents="box-none" onLayout={onArea}>
      <Animated.View
        {...responder.panHandlers}
        onLayout={onBtn}
        accessible
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={t('Mantené y arrastrá para moverlo', 'Hold and drag to move it')}
        onAccessibilityTap={onPress}
        style={[
          s.floatHandle,
          s.floatBtn,
          { backgroundColor: color },
          dragging && s.floatBtnDragging,
          {
            // Hidden until measured so it does not flash in the corner first.
            opacity: !bounds ? 0 : pressed && !dragging ? 0.85 : 1,
            transform: [...pos.getTranslateTransform(), { scale: dragging ? 1.06 : 1 }],
          },
          Platform.OS === 'web' && ({ cursor: dragging ? 'grabbing' : 'pointer', userSelect: 'none', touchAction: 'none' } as any),
        ]}
      >
        <Ionicons name="radio-button-on" size={18} color="#04210f" />
        <Text style={s.floatText} selectable={false}>
          {label}
        </Text>
      </Animated.View>
    </View>
  );
}

const s = StyleSheet.create({
  floatArea: {
    position: Platform.OS === 'web' ? ('fixed' as any) : 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
  },
  floatHandle: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  floatBtnDragging: {
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 10,
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
