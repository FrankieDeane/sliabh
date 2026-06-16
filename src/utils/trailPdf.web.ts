import { jsPDF } from 'jspdf';

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
  mapOverlayUrl?: string;
}

// CartoDB Voyager tiles — CORS-enabled, so the canvas stays untainted and
// toDataURL() works. (OSM tiles do not reliably send CORS headers.)
const TILE_URL = (z: number, x: number, y: number) =>
  `https://a.basemaps.cartocdn.com/rastertiles/voyager/${z}/${x}/${y}.png`;

const TILE = 256;
const IMG_W = 1000;
const IMG_H = 600;
const ZOOM = 13; // More detailed zoom for trails

function project(lat: number, lon: number, z: number) {
  const worldSize = TILE * Math.pow(2, z);
  const x = ((lon + 180) / 360) * worldSize;
  const sin = Math.sin((lat * Math.PI) / 180);
  const y = (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * worldSize;
  return { x, y };
}

function loadExternalMapImage(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        canvas.getContext('2d')!.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.88));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function loadTile(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function buildMapImage(lat: number, lon: number): Promise<string> {
  const center = project(lat, lon, ZOOM);
  const left = center.x - IMG_W / 2;
  const top = center.y - IMG_H / 2;

  const canvas = document.createElement('canvas');
  canvas.width = IMG_W;
  canvas.height = IMG_H;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#e8e4dc';
  ctx.fillRect(0, 0, IMG_W, IMG_H);

  const tileLeft = Math.floor(left / TILE);
  const tileTop = Math.floor(top / TILE);
  const tileRight = Math.floor((left + IMG_W) / TILE);
  const tileBottom = Math.floor((top + IMG_H) / TILE);
  const n = Math.pow(2, ZOOM);

  const jobs: Promise<void>[] = [];
  for (let tx = tileLeft; tx <= tileRight; tx++) {
    for (let ty = tileTop; ty <= tileBottom; ty++) {
      const wx = ((tx % n) + n) % n;
      const wy = ty;
      if (wy < 0 || wy >= n) continue;
      const dx = tx * TILE - left;
      const dy = ty * TILE - top;
      jobs.push(
        loadTile(TILE_URL(ZOOM, wx, wy)).then((img) => {
          if (img) ctx.drawImage(img, dx, dy, TILE, TILE);
        }),
      );
    }
  }
  await Promise.all(jobs);

  // Draw a marker pin at the trailhead coordinates (center of image)
  const cx = IMG_W / 2;
  const cy = IMG_H / 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 13, 0, Math.PI * 2);
  ctx.fillStyle = '#16a34a';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, 4, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  return canvas.toDataURL('image/jpeg', 0.92);
}

function difficultyColor(difficulty: string): [number, number, number] {
  const d = difficulty.toLowerCase();
  if (d === 'facil' || d === 'fácil' || d === 'easy') return [34, 197, 94];   // #22c55e
  if (d === 'moderado' || d === 'moderate') return [251, 191, 36];              // #fbbf24
  if (d === 'dificil' || d === 'difícil' || d === 'hard') return [249, 115, 22]; // #f97316
  return [239, 68, 68]; // #ef4444 — extremo / extreme
}

function formatDuration(dur: { min: number; max: number; unit: string }): string {
  if (dur.min === dur.max) return `${dur.min} ${dur.unit}`;
  return `${dur.min}–${dur.max} ${dur.unit}`;
}

const WAYPOINT_NUMS = ['①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩'];

/**
 * Generates a two-page A4 trail reference PDF and triggers a download.
 * Fully client-side — no server required.
 */
export async function generateTrailPDF(trail: TrailPdfInput): Promise<void> {
  let mapData: string;
  let mapIsOfficial = false;
  if (trail.mapOverlayUrl) {
    const external = await loadExternalMapImage(trail.mapOverlayUrl);
    if (external) {
      mapData = external;
      mapIsOfficial = true;
    } else {
      mapData = await buildMapImage(trail.coords.lat, trail.coords.lon);
    }
  } else {
    mapData = await buildMapImage(trail.coords.lat, trail.coords.lon);
  }

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = 210;
  const pageH = 297;
  const margin = 15;
  const contentW = pageW - margin * 2;

  const [dr, dg, db] = difficultyColor(trail.difficulty);

  // ─── PAGE 1: Overview ────────────────────────────────────────────────────

  // 1. Header band
  doc.setFillColor(6, 13, 27);
  doc.rect(0, 0, pageW, 26, 'F');

  // "SLIABH" logo
  doc.setTextColor(34, 197, 94);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('SLIABH', margin, 13);

  // Subtitle
  doc.setTextColor(240, 249, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Guía de ruta · barilochetrekking.com', margin, 20);

  // Difficulty badge (top-right)
  const badgeLabel = trail.difficulty.toUpperCase();
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  const badgeTextW = doc.getTextWidth(badgeLabel);
  const badgePadX = 4;
  const badgeW = badgeTextW + badgePadX * 2;
  const badgeX = pageW - margin - badgeW;
  const badgeY = 8;
  const badgeH = 9;
  doc.setFillColor(dr, dg, db);
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.text(badgeLabel, badgeX + badgePadX, badgeY + 6.2);

  // 2. Trail title block
  let y = 38;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(trail.name, margin, y);

  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(100, 116, 139);
  doc.text(`${trail.area} · ${trail.province}`, margin, y);

  // Activity badge (small green pill)
  const actLabel = trail.activity;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  const actTextW = doc.getTextWidth(actLabel);
  const actPadX = 3;
  const actW = actTextW + actPadX * 2;
  const actX = pageW - margin - actW;
  const actY = y - 5.5;
  doc.setFillColor(34, 197, 94);
  doc.roundedRect(actX, actY, actW, 7, 1.5, 1.5, 'F');
  doc.setTextColor(255, 255, 255);
  doc.text(actLabel, actX + actPadX, actY + 5.2);

  // 3. Stats row (4 columns)
  y += 8;
  const statsY = y;
  const colW = contentW / 4;

  interface StatItem { icon: string; value: string; label: string }
  const stats: StatItem[] = [
    { icon: '~', value: `${trail.distance_km} km`, label: 'Distancia' },
    { icon: '+', value: `${trail.elevation_gain_m} m`, label: 'Desnivel' },
    { icon: '^', value: `${trail.max_altitude_m} m`, label: 'Alt. máx.' },
    { icon: 'O', value: formatDuration(trail.duration), label: 'Duración' },
  ];

  // Stats background
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, statsY - 1, contentW, 22, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.rect(margin, statsY - 1, contentW, 22);

  stats.forEach((stat, i) => {
    const sx = margin + i * colW + colW / 2;

    // Icon (using text symbol as placeholder)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(34, 197, 94);
    doc.text(stat.icon, sx, statsY + 5, { align: 'center' });

    // Value
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(stat.value, sx, statsY + 12, { align: 'center' });

    // Label
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(stat.label, sx, statsY + 17, { align: 'center' });

    // Vertical divider between columns
    if (i < 3) {
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(margin + (i + 1) * colW, statsY, margin + (i + 1) * colW, statsY + 21);
    }
  });

  // 4. Map image
  y = statsY + 24;
  const mapAspect = mapIsOfficial ? (622 / 1024) : (IMG_H / IMG_W);
  const mapH = mapAspect * contentW;
  doc.addImage(mapData, 'JPEG', margin, y, contentW, mapH);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.rect(margin, y, contentW, mapH);
  if (mapIsOfficial) {
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('Mapa oficial · turismoushuaia.com', margin, y + mapH + 3);
  }
  y += mapH + (mapIsOfficial ? 8 : 5);

  // 5. Tags row
  if (trail.tags.length > 0) {
    const tagLabel = trail.tags.join('  ·  ');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    // Small tag boxes
    let tx = margin;
    for (const tag of trail.tags) {
      const tw = doc.getTextWidth(tag) + 6;
      if (tx + tw > pageW - margin) break; // stop if no room
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.rect(tx, y - 3.5, tw, 6, 'S');
      doc.setTextColor(100, 116, 139);
      doc.text(tag, tx + 3, y + 1);
      tx += tw + 3;
    }
    // Suppress unused variable warning
    void tagLabel;
    y += 8;
  }

  // 6. Named waypoints list
  if (trail.namedWaypoints && trail.namedWaypoints.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('Puntos de referencia', margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    for (let i = 0; i < trail.namedWaypoints.length && i < 10; i++) {
      const wp = trail.namedWaypoints[i];
      const num = WAYPOINT_NUMS[i] ?? `${i + 1}.`;
      const line = `${num} ${wp.name} — ${wp.description} (${wp.lat.toFixed(5)}, ${wp.lon.toFixed(5)})`;
      const lines = doc.splitTextToSize(line, contentW - 4);
      if (y + lines.length * 4 > pageH - 30) break; // leave room for footer
      doc.setTextColor(71, 85, 105);
      doc.text(lines, margin + 2, y);
      y += lines.length * 4 + 1;
    }
    y += 3;
  }

  // 7. Emergency footer bar
  const footerY = pageH - 20;
  doc.setFillColor(248, 250, 252);
  doc.rect(0, footerY, pageW, 20, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(0, footerY, pageW, footerY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(220, 38, 38);
  doc.text('Emergencias:', margin, footerY + 8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(
    'Guardaparques APN 105  ·  911  ·  Bomberos 100',
    margin + 28,
    footerY + 8,
  );
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text('Página 1 de 2', pageW - margin, footerY + 14, { align: 'right' });

  // ─── PAGE 2: Descripción completa ────────────────────────────────────────

  doc.addPage();

  // 1. Thinner header band (20mm)
  doc.setFillColor(6, 13, 27);
  doc.rect(0, 0, pageW, 20, 'F');
  doc.setTextColor(34, 197, 94);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('SLIABH', margin, 11);
  doc.setTextColor(240, 249, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Guía de ruta · barilochetrekking.com', margin, 17);

  // Trail name in header right
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(240, 249, 255);
  doc.text(trail.name, pageW - margin, 14, { align: 'right' });

  // 2. "Descripción completa" eyebrow label
  y = 28;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(34, 197, 94);
  doc.text('DESCRIPCIÓN COMPLETA', margin, y);

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);

  // 3. Long description text
  const descText = trail.long_description ?? trail.description;
  const descLines = doc.splitTextToSize(descText, contentW);
  const maxDescY = 150; // leave room for logistics and footer sections
  let linesPrinted = 0;
  for (const line of descLines) {
    if (y > maxDescY) break;
    doc.text(line, margin, y);
    y += 5;
    linesPrinted++;
  }
  void linesPrinted;

  // 4. Divider line
  y += 3;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageW - margin, y);
  y += 6;

  // 5. Logistics section (2-column layout)
  const colLeft = margin;
  const colRight = margin + contentW / 2 + 3;
  const colInnerW = contentW / 2 - 6;

  interface LogisticItem { label: string; value: string }
  const leftItems: LogisticItem[] = [
    { label: 'Punto de inicio', value: trail.trailhead },
    { label: 'Acceso', value: trail.access_notes ?? '—' },
    { label: 'Estacionamiento', value: trail.parking ?? '—' },
    { label: 'Agua disponible', value: trail.water_sources ?? '—' },
  ];
  const rightItems: LogisticItem[] = [
    { label: 'Temporada', value: trail.best_season },
    { label: 'Refugio', value: trail.refugio ?? '—' },
    { label: 'Permisos', value: trail.permits_required ? 'Requeridos' : 'No requeridos' },
    {
      label: 'Coordenadas',
      value: `${trail.coords.lat.toFixed(5)}, ${trail.coords.lon.toFixed(5)}`,
    },
  ];

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('Logística', colLeft, y);
  y += 5;

  const logStartY = y;
  let leftY = logStartY;
  let rightY = logStartY;

  for (const item of leftItems) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(item.label.toUpperCase(), colLeft, leftY);
    leftY += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    const wrapped = doc.splitTextToSize(item.value, colInnerW);
    doc.text(wrapped, colLeft, leftY);
    leftY += wrapped.length * 4.5 + 3;
  }

  for (const item of rightItems) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(item.label.toUpperCase(), colRight, rightY);
    rightY += 4;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    const wrapped = doc.splitTextToSize(item.value, colInnerW);
    doc.text(wrapped, colRight, rightY);
    rightY += wrapped.length * 4.5 + 3;
  }

  y = Math.max(leftY, rightY) + 4;

  // 6. Safety notice box
  const isExtreme =
    trail.difficulty.toLowerCase() === 'extremo' ||
    trail.difficulty.toLowerCase() === 'extreme';
  const isDifficult =
    trail.difficulty.toLowerCase() === 'dificil' ||
    trail.difficulty.toLowerCase() === 'difícil' ||
    trail.difficulty.toLowerCase() === 'hard' ||
    isExtreme;

  const noticeH = 22;
  if (y + noticeH < pageH - 35) {
    const [nr, ng, nb] = isExtreme ? [239, 68, 68] : isDifficult ? [249, 115, 22] : [249, 115, 22];
    doc.setFillColor(255, 251, 235);
    doc.setDrawColor(nr, ng, nb);
    doc.setLineWidth(0.6);
    doc.roundedRect(margin, y, contentW, noticeH, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(nr, ng, nb);
    doc.text('AVISO DE SEGURIDAD', margin + 4, y + 7);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text('Registrate en el Guardaparque antes de partir.', margin + 4, y + 13);
    doc.text('Emergencias APN: 105', margin + 4, y + 18.5);
    y += noticeH + 5;
  }

  // 7. Disclaimer footer
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  const today = new Date().toLocaleDateString('es-AR');
  doc.text(
    `Generado por Sliabh el ${today} — barilochetrekking.com · No reemplaza cartografía oficial APN/IGN`,
    margin,
    pageH - 8,
  );
  doc.setFontSize(7);
  doc.text('Página 2 de 2', pageW - margin, pageH - 8, { align: 'right' });

  doc.save(`sliabh-ruta-${trail.id}.pdf`);
}
