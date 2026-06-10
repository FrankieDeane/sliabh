/**
 * GPX 1.1 export — builds a valid .gpx document and triggers
 * a file download on web. Returns the GPX string on all platforms.
 */
import { Platform } from 'react-native';

export interface GpxPoint {
  lat: number;
  lon: number;
  name?: string;
  ele?: number;
}

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function buildGpx(name: string, points: GpxPoint[], description?: string): string {
  const wpts = points
    .map(
      (p) =>
        `  <wpt lat="${p.lat}" lon="${p.lon}">${p.ele != null ? `<ele>${p.ele}</ele>` : ''}${p.name ? `<name>${esc(p.name)}</name>` : ''}</wpt>`,
    )
    .join('\n');
  const trkpts = points
    .map((p) => `      <trkpt lat="${p.lat}" lon="${p.lon}"${''}>${p.ele != null ? `<ele>${p.ele}</ele>` : ''}</trkpt>`)
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Sliabh Argaelic — sliabh.app"
  xmlns="http://www.topografix.com/GPX/1/1"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>${esc(name)}</name>
    ${description ? `<desc>${esc(description)}</desc>` : ''}
    <time>${new Date().toISOString()}</time>
  </metadata>
${wpts}
  <trk>
    <name>${esc(name)}</name>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>
`;
}

/** Triggers a browser download of the GPX file. Web only; no-op elsewhere. */
export function downloadGpx(name: string, points: GpxPoint[], description?: string): boolean {
  const gpx = buildGpx(name, points, description);
  if (Platform.OS !== 'web' || typeof document === 'undefined') return false;
  const blob = new Blob([gpx], { type: 'application/gpx+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'ruta'}.gpx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return true;
}
