import { Share } from 'react-native';

export interface ParkPdfInput {
  id: string;
  name: string;
  province: string;
  region: string;
  highlights: string;
  size?: string;
  coords: { lat: number; lon: number };
}

/**
 * Native fallback — jsPDF needs a DOM/canvas. We share the park reference
 * (name, coordinates and a maps link) so the user can save it on the device.
 */
export async function generateParkPDF(park: ParkPdfInput): Promise<void> {
  const link = `https://www.openstreetmap.org/?mlat=${park.coords.lat}&mlon=${park.coords.lon}#map=12/${park.coords.lat}/${park.coords.lon}`;
  await Share.share({
    title: `Sliabh — ${park.name}`,
    message:
      `${park.name}\n${park.province} · ${park.region}\n` +
      `${park.highlights}\n` +
      `Coordenadas: ${park.coords.lat.toFixed(5)}, ${park.coords.lon.toFixed(5)}\n` +
      `Mapa: ${link}\n\nEmergencias — APN: 105 · 911`,
  });
}
