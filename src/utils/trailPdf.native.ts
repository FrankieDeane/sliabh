import { Share } from 'react-native';

export interface TrailPdfInput {
  id: string;
  name: string;
  province: string;
  area: string;
  difficulty: string;
  activity: string;
  distance_km: number;
  elevation_gain_m: number;
  max_altitude_m: number;
  duration: { min: number; max: number; unit: string };
  coords: { lat: number; lon: number };
  description: string;
  long_description?: string;
  trailhead: string;
  best_season: string;
  permits_required: boolean;
  tags: string[];
  namedWaypoints?: Array<{ lat: number; lon: number; name: string; description: string }>;
  parking?: string;
  access_notes?: string;
  water_sources?: string;
  refugio?: string;
}

/**
 * Native fallback — jsPDF requires a DOM/canvas environment.
 * Shares a plain-text trail summary so the user can save or forward it
 * from any native app (Notes, WhatsApp, email, etc.).
 */
export async function generateTrailPDF(trail: TrailPdfInput): Promise<void> {
  const durLabel =
    trail.duration.min === trail.duration.max
      ? `${trail.duration.min} ${trail.duration.unit}`
      : `${trail.duration.min}–${trail.duration.max} ${trail.duration.unit}`;

  const mapLink =
    `https://www.openstreetmap.org/?mlat=${trail.coords.lat}` +
    `&mlon=${trail.coords.lon}#map=13/${trail.coords.lat}/${trail.coords.lon}`;

  const waypointLines =
    trail.namedWaypoints && trail.namedWaypoints.length > 0
      ? '\nPuntos de referencia:\n' +
        trail.namedWaypoints
          .map(
            (wp, i) =>
              `  ${i + 1}. ${wp.name} — ${wp.description} (${wp.lat.toFixed(5)}, ${wp.lon.toFixed(5)})`,
          )
          .join('\n')
      : '';

  const logisticsLines = [
    `Punto de inicio: ${trail.trailhead}`,
    trail.access_notes ? `Acceso: ${trail.access_notes}` : null,
    trail.parking ? `Estacionamiento: ${trail.parking}` : null,
    trail.water_sources ? `Agua disponible: ${trail.water_sources}` : null,
    `Temporada: ${trail.best_season}`,
    trail.refugio ? `Refugio: ${trail.refugio}` : null,
    `Permisos: ${trail.permits_required ? 'Requeridos' : 'No requeridos'}`,
  ]
    .filter(Boolean)
    .join('\n');

  const message =
    `SLIABH — Guía de ruta\n` +
    `${'─'.repeat(32)}\n` +
    `${trail.name}\n` +
    `${trail.area} · ${trail.province}\n` +
    `Actividad: ${trail.activity}  |  Dificultad: ${trail.difficulty}\n\n` +
    `Distancia:  ${trail.distance_km} km\n` +
    `Desnivel:   +${trail.elevation_gain_m} m\n` +
    `Alt. máx.:  ${trail.max_altitude_m} m\n` +
    `Duración:   ${durLabel}\n\n` +
    `${trail.description}\n` +
    waypointLines +
    `\n\nLogística\n` +
    `${'─'.repeat(32)}\n` +
    logisticsLines +
    `\n\nCoordenadas: ${trail.coords.lat.toFixed(5)}, ${trail.coords.lon.toFixed(5)}\n` +
    `Mapa: ${mapLink}\n\n` +
    (trail.tags.length > 0 ? `Etiquetas: ${trail.tags.join(', ')}\n\n` : '') +
    `Emergencias — Guardaparques APN: 105  ·  911  ·  Bomberos: 100\n\n` +
    `Generado por Sliabh\n` +
    `No reemplaza cartografía oficial APN/IGN.`;

  await Share.share({
    title: `Sliabh — ${trail.name}`,
    message,
  });
}
