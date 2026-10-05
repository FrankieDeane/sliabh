/**
 * Where the floating "Grabar recorrido" button sits, kept apart from the
 * component so the arithmetic can be checked without a phone.
 *
 * The spot is stored as a side plus a fraction of the free height, not as
 * pixels: a position saved in portrait on a small phone still lands somewhere
 * sensible after rotating, on a tablet, or in split screen.
 */

export type FloatSide = 'left' | 'center' | 'right';

export interface FloatSpot {
  side: FloatSide;
  /** 0 = as high as allowed, 1 = as low as allowed. */
  y: number;
}

/** Bottom centre: where the button always was, so nobody loses it. */
export const DEFAULT_SPOT: FloatSpot = { side: 'center', y: 1 };

/** The rectangle the button's top-left corner may move within. */
export interface FloatBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface Insets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/**
 * Keeps the whole button on screen and clear of the notch, the gesture bar
 * and whatever the page already has at its bottom edge.
 */
export function floatBounds(
  area: { width: number; height: number },
  button: { width: number; height: number },
  insets: Insets,
  margin: { side: number; top: number; bottom: number },
): FloatBounds {
  const minX = insets.left + margin.side;
  const minY = insets.top + margin.top;
  // On a screen too small for the button the bounds collapse to one point
  // instead of inverting, so the button stays put rather than flying off.
  const maxX = Math.max(minX, area.width - insets.right - margin.side - button.width);
  const maxY = Math.max(minY, area.height - insets.bottom - margin.bottom - button.height);
  return { minX, maxX, minY, maxY };
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Pixel position of the button's top-left corner for a saved spot. */
export function spotToPoint(spot: FloatSpot, b: FloatBounds): { x: number; y: number } {
  const x =
    spot.side === 'left' ? b.minX : spot.side === 'right' ? b.maxX : (b.minX + b.maxX) / 2;
  return { x, y: b.minY + clamp(spot.y, 0, 1) * (b.maxY - b.minY) };
}

/**
 * Where a button let go at (x, y) settles: the nearest side, or the centre
 * when released in the middle third, at the height it was dropped.
 */
export function pointToSpot(x: number, y: number, b: FloatBounds): FloatSpot {
  const spanX = b.maxX - b.minX;
  const fx = spanX > 0 ? clamp((x - b.minX) / spanX, 0, 1) : 0.5;
  const side: FloatSide = fx < 1 / 3 ? 'left' : fx > 2 / 3 ? 'right' : 'center';
  const spanY = b.maxY - b.minY;
  return { side, y: spanY > 0 ? clamp((y - b.minY) / spanY, 0, 1) : 1 };
}

/** Reads a stored spot, falling back to the default on anything malformed. */
export function parseSpot(raw: string | null | undefined): FloatSpot {
  if (!raw) return DEFAULT_SPOT;
  try {
    const v = JSON.parse(raw) as Partial<FloatSpot>;
    if (
      (v.side === 'left' || v.side === 'center' || v.side === 'right') &&
      typeof v.y === 'number' &&
      Number.isFinite(v.y)
    ) {
      return { side: v.side, y: clamp(v.y, 0, 1) };
    }
  } catch {
    // fall through
  }
  return DEFAULT_SPOT;
}
