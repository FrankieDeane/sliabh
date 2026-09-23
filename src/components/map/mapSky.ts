/**
 * The sky and aerial haze behind a tilted 3D map.
 *
 * Without a sky, MapLibre paints the space above the horizon black: at the
 * pitch the cinematic maps use (55°–72°) a third of the frame was a void. The
 * fog also lightens distant ridges, which is what gives mountains depth.
 * Tuned for Esri satellite imagery; fades out at high zoom, where the horizon
 * leaves the frame anyway.
 */
export const MAP_SKY = {
  'sky-color': '#5b8fc7',
  'sky-horizon-blend': 0.6,
  'horizon-color': '#d6e4f0',
  'horizon-fog-blend': 0.5,
  'fog-color': '#c9d8e6',
  'fog-ground-blend': 0.6,
  'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 1, 10, 1, 13, 0],
} as const;

/** The same object as a JS literal, for maps built inside an HTML string. */
export const MAP_SKY_JS = JSON.stringify(MAP_SKY);
