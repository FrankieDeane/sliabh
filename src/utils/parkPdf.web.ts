import { jsPDF } from 'jspdf';

export interface ParkPdfInput {
  id: string;
  name: string;
  province: string;
  region: string;
  highlights: string;
  size?: string;
  coords: { lat: number; lon: number };
  mapOverlayUrl?: string; // Optional official map image to embed instead of tile map
}

// CartoDB Voyager tiles — CORS-enabled, so the canvas stays untainted and
// toDataURL() works. (OSM tiles do not reliably send CORS headers.)
const TILE_URL = (z: number, x: number, y: number) =>
  `https://a.basemaps.cartocdn.com/rastertiles/voyager/${z}/${x}/${y}.png`;

const TILE = 256;
const IMG_W = 1000;
const IMG_H = 720;
const ZOOM = 12;

function project(lat: number, lon: number, z: number) {
  const worldSize = TILE * Math.pow(2, z);
  const x = ((lon + 180) / 360) * worldSize;
  const sin = Math.sin((lat * Math.PI) / 180);
  const y = (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * worldSize;
  return { x, y };
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

  // Draw a marker pin at the exact center
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

/** Try to load an external image to a data-URL (requires CORS headers on origin). */
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

/**
 * Generates a one-page reference map PDF for a national park and triggers a
 * download to the user's device. Fully client-side.
 */
export async function generateParkPDF(park: ParkPdfInput): Promise<void> {
  // Use official map image when provided; fall back to tile-based map
  let mapData: string;
  let mapIsOfficial = false;
  if (park.mapOverlayUrl) {
    const external = await loadExternalMapImage(park.mapOverlayUrl);
    if (external) {
      mapData = external;
      mapIsOfficial = true;
    } else {
      mapData = await buildMapImage(park.coords.lat, park.coords.lon);
    }
  } else {
    mapData = await buildMapImage(park.coords.lat, park.coords.lon);
  }

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageW = 210;
  const margin = 15;
  const contentW = pageW - margin * 2;

  // Header band
  doc.setFillColor(6, 13, 27);
  doc.rect(0, 0, pageW, 26, 'F');
  doc.setTextColor(34, 197, 94);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('SLIABH', margin, 13);
  doc.setTextColor(240, 249, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Mapa de referencia · Parques Nacionales de Argentina', margin, 20);

  // Park title
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(park.name, margin, 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(100, 116, 139);
  doc.text(`${park.province} · ${park.region}`, margin, 47);

  // Map image — official overlay uses its natural 1024×622 ratio; tile map uses IMG_H/IMG_W
  const mapY = 52;
  const mapAspect = mapIsOfficial ? (622 / 1024) : (IMG_H / IMG_W);
  const mapH = mapAspect * contentW;
  doc.addImage(mapData, 'JPEG', margin, mapY, contentW, mapH);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.rect(margin, mapY, contentW, mapH);
  if (mapIsOfficial) {
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184);
    doc.text('Mapa oficial · turismoushuaia.com', margin, mapY + mapH + 3);
  }

  // Info block
  let y = mapY + mapH + (mapIsOfficial ? 14 : 10);
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Puntos destacados', margin, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(doc.splitTextToSize(park.highlights, contentW), margin, y);
  y += 10;

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Coordenadas', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(
    `${park.coords.lat.toFixed(5)}, ${park.coords.lon.toFixed(5)}`,
    margin + 32,
    y,
  );
  y += 8;

  // Emergency footer
  doc.setFillColor(248, 250, 252);
  doc.rect(margin, y, contentW, 18, 'F');
  doc.setTextColor(220, 38, 38);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Emergencias', margin + 4, y + 7);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.text('Guardaparques / APN: 105      Emergencias: 911', margin + 4, y + 13);

  // Disclaimer
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  const today = new Date().toLocaleDateString('es-AR');
  doc.text(
    `Generado por Sliabh el ${today}. Mapa de referencia — no reemplaza la cartografía oficial de APN/IGN.`,
    margin,
    285,
  );

  doc.save(`sliabh-mapa-${park.id}.pdf`);
}
