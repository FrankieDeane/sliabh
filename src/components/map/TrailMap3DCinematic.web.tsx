import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { gpxTrackToGeoJSON } from '../../utils/geojson';

interface GpxPoint {
  lat: number;
  lon: number;
  ele?: number;
  name?: string;
}

interface TrailMap3DCinematicProps {
  track: GpxPoint[];
  trailName: string;
  height?: number | string;
  exaggeration?: number;
  mapTilerKey?: string;
  /** Called when the user skips or the flythrough finishes */
  onReady?: () => void;
}

const MAPLIBRE_CSS = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css';
const MAPLIBRE_JS  = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js';

/** Esri World Imagery — free, no API key required */
const SATELLITE_TILES = [
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
];

/** Bearing (degrees) from point A → B */
function bearing(a: GpxPoint, b: GpxPoint): number {
  const dLon = (b.lon - a.lon) * (Math.PI / 180);
  const lat1 = a.lat * (Math.PI / 180);
  const lat2 = b.lat * (Math.PI / 180);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/** Pick N evenly-spaced indices from an array */
function sampleIndices(len: number, n: number): number[] {
  if (len <= n) return Array.from({ length: len }, (_, i) => i);
  const step = (len - 1) / (n - 1);
  return Array.from({ length: n }, (_, i) => Math.round(i * step));
}

export default function TrailMap3DCinematic({
  track,
  trailName,
  height = 420,
  exaggeration = 2.2,
  mapTilerKey,
  onReady,
}: TrailMap3DCinematicProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const animRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [phase, setPhase] = useState<'loading' | 'flying' | 'interactive'>('loading');
  const phaseRef = useRef<'loading' | 'flying' | 'interactive'>('loading');
  const [is3D, setIs3D] = useState(true);
  const [rotateMode, setRotateMode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rotateModeRef = useRef(false);
  const dragStartXRef = useRef<number | null>(null);
  const dragStartBearingRef = useRef<number>(0);

  if (Platform.OS !== 'web') return null;
  if (track.length < 2) return null;

  // ── Derive keyframes from the track ────────────────────────────────────────
  // We pick 5 sample points + the last point as finale
  const keyframeIndices = sampleIndices(track.length, 5);
  const keyframes = keyframeIndices.map((idx, i) => {
    const pt = track[idx];
    const nextPt = track[Math.min(idx + 1, track.length - 1)];
    const br = bearing(pt, nextPt);
    const isLast = i === keyframeIndices.length - 1;
    return {
      center: [pt.lon, pt.lat] as [number, number],
      zoom: isLast ? 13.5 : 11 + i * 0.3,
      pitch: isLast ? 72 : 58 + i * 2,
      bearing: br,
      duration: isLast ? 5000 : 6000,
      name: pt.name,
    };
  });

  // Overview frame: wide shot of the whole trail
  const lons = track.map((p) => p.lon);
  const lats = track.map((p) => p.lat);
  const centerLon = (Math.min(...lons) + Math.max(...lons)) / 2;
  const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
  const overviewFrame = {
    center: [centerLon, centerLat] as [number, number],
    zoom: 9.5,
    pitch: 50,
    bearing: bearing(track[0], track[track.length - 1]),
    duration: 4000,
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    function injectCss() {
      if (document.getElementById('maplibre-css')) return;
      const link = document.createElement('link');
      link.id = 'maplibre-css';
      link.rel = 'stylesheet';
      link.href = MAPLIBRE_CSS;
      document.head.appendChild(link);
    }

    function loadScript(): Promise<void> {
      return new Promise((resolve, reject) => {
        if ((window as any).maplibregl) { resolve(); return; }
        if (document.getElementById('maplibre-js')) {
          const iv = setInterval(() => {
            if ((window as any).maplibregl) { clearInterval(iv); resolve(); }
          }, 50);
          return;
        }
        const script = document.createElement('script');
        script.id = 'maplibre-js';
        script.src = MAPLIBRE_JS;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load MapLibre GL JS'));
        document.head.appendChild(script);
      });
    }

    injectCss();

    loadScript()
      .then(() => {
        if (!containerRef.current || mapRef.current) return;
        const ml = (window as any).maplibregl;

        // ── Satellite base style ──────────────────────────────────────────
        const satelliteStyle: any = {
          version: 8,
          sources: {
            satellite: {
              type: 'raster',
              tiles: mapTilerKey
                ? [`https://api.maptiler.com/tiles/satellite-v2/{z}/{x}/{y}.jpg?key=${mapTilerKey}`]
                : SATELLITE_TILES,
              tileSize: 256,
              attribution: mapTilerKey ? '© MapTiler' : '© Esri',
              maxzoom: 18,
            },
          },
          layers: [
            { id: 'satellite-bg', type: 'raster', source: 'satellite', paint: { 'raster-brightness-max': 0.9 } },
          ],
        };

        const map = new ml.Map({
          container: containerRef.current,
          style: satelliteStyle,
          center: overviewFrame.center,
          zoom: 8,
          pitch: 30,
          bearing: overviewFrame.bearing,
          antialias: true,
          maxTileCacheSize: 50,
          dragRotate: true,
          touchZoomRotate: true,
          touchPitch: true,
        });

        mapRef.current = map;

        // Compass + zoom controls — appears after intro
        const navControl = new ml.NavigationControl({ showCompass: true, showZoom: true, visualizePitch: true });
        (map as any).__navControl = navControl;

        map.on('load', () => {
          // ── Terrain ─────────────────────────────────────────────────────
          const terrainSrc = mapTilerKey
            ? { type: 'raster-dem', url: `https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${mapTilerKey}`, tileSize: 512 }
            : { type: 'raster-dem', tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'], tileSize: 256, encoding: 'terrarium', maxzoom: 15 };

          map.addSource('terrain-dem', terrainSrc as any);
          map.setTerrain({ source: 'terrain-dem', exaggeration });

          // ── Trail layers ─────────────────────────────────────────────────
          const geoJSON = gpxTrackToGeoJSON(track);
          map.addSource('trail', { type: 'geojson', data: geoJSON });

          map.addLayer({
            id: 'trail-glow',
            type: 'line',
            source: 'trail',
            paint: { 'line-color': '#22c55e', 'line-width': 12, 'line-opacity': 0.2, 'line-blur': 6 },
          });
          map.addLayer({
            id: 'trail-line',
            type: 'line',
            source: 'trail',
            paint: { 'line-color': '#4ade80', 'line-width': 3, 'line-opacity': 0.95 },
          });

          // ── Trail point markers ──────────────────────────────────────────
          const namedPoints = track.filter((p) => p.name);
          if (namedPoints.length) {
            map.addSource('trail-points', {
              type: 'geojson',
              data: {
                type: 'FeatureCollection',
                features: namedPoints.map((p) => ({
                  type: 'Feature',
                  geometry: { type: 'Point', coordinates: [p.lon, p.lat] },
                  properties: { name: p.name },
                })),
              },
            });
            map.addLayer({
              id: 'trail-points-halo',
              type: 'circle',
              source: 'trail-points',
              paint: { 'circle-radius': 10, 'circle-color': '#22c55e', 'circle-opacity': 0.2 },
            });
            map.addLayer({
              id: 'trail-points-dot',
              type: 'circle',
              source: 'trail-points',
              paint: { 'circle-radius': 4, 'circle-color': '#4ade80', 'circle-stroke-width': 1.5, 'circle-stroke-color': '#fff' },
            });
          }

          // ── Start / end markers ──────────────────────────────────────────
          const mk = (color: string) => {
            const el = document.createElement('div');
            el.style.cssText = `width:14px;height:14px;border-radius:50%;background:${color};border:2.5px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.6)`;
            return el;
          };
          new ml.Marker({ element: mk('#22c55e') })
            .setLngLat([track[0].lon, track[0].lat])
            .setPopup(new ml.Popup({ offset: 14 }).setText(track[0].name ?? 'Inicio'))
            .addTo(map);
          new ml.Marker({ element: mk('#f97316') })
            .setLngLat([track[track.length - 1].lon, track[track.length - 1].lat])
            .setPopup(new ml.Popup({ offset: 14 }).setText(track[track.length - 1].name ?? 'Laguna'))
            .addTo(map);

          // ── Start cinematic flythrough ────────────────────────────────────
          startFlythrough(map, ml);
        });

        map.on('error', (e: any) => {
          console.warn('MapLibre error:', e);
          setError('No se pudo cargar el mapa 3D.');
        });

        // ── Rotate-mode drag handlers ────────────────────────────────────
        const canvas = map.getCanvas();

        function onMouseDown(e: MouseEvent) {
          if (e.button !== 0) return; // left button only
          if (!rotateModeRef.current) {
            // Skip intro on any left-click during flythrough
            // (phase check via ref isn't available here; skipToInteractive handles no-op safely)
            return;
          }
          e.preventDefault();
          dragStartXRef.current = e.clientX;
          dragStartBearingRef.current = map.getBearing();
          map.dragPan.disable();
        }

        function onMouseMove(e: MouseEvent) {
          if (!rotateModeRef.current || dragStartXRef.current === null) return;
          const delta = e.clientX - dragStartXRef.current;
          map.setBearing(dragStartBearingRef.current - delta * 0.4);
        }

        function onMouseUp() {
          if (!rotateModeRef.current) return;
          dragStartXRef.current = null;
        }

        function onTouchStart(e: TouchEvent) {
          if (!rotateModeRef.current || e.touches.length !== 1) return;
          dragStartXRef.current = e.touches[0].clientX;
          dragStartBearingRef.current = map.getBearing();
          map.dragPan.disable();
        }

        function onTouchMove(e: TouchEvent) {
          if (!rotateModeRef.current || dragStartXRef.current === null || e.touches.length !== 1) return;
          e.preventDefault();
          const delta = e.touches[0].clientX - dragStartXRef.current;
          map.setBearing(dragStartBearingRef.current - delta * 0.4);
        }

        function onTouchEnd() {
          dragStartXRef.current = null;
        }

        canvas.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        canvas.addEventListener('touchstart', onTouchStart, { passive: true });
        canvas.addEventListener('touchmove', onTouchMove, { passive: false });
        canvas.addEventListener('touchend', onTouchEnd);

        (map as any).__cleanupRotate = () => {
          canvas.removeEventListener('mousedown', onMouseDown);
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);
          canvas.removeEventListener('touchstart', onTouchStart);
          canvas.removeEventListener('touchmove', onTouchMove);
          canvas.removeEventListener('touchend', onTouchEnd);
        };

        // Skip intro on any interaction during flythrough
        map.on('mousedown', () => { if (phaseRef.current === 'flying') skipToInteractive(map); });
        map.on('touchstart', () => { if (phaseRef.current === 'flying') skipToInteractive(map); });
      })
      .catch((e) => setError(e.message));

    return () => {
      if (animRef.current) clearTimeout(animRef.current);
      mapRef.current?.__cleanupRotate?.();
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startFlythrough(map: any, _ml: any) {
    setPhase('flying');

    const sequence = [overviewFrame, ...keyframes];
    let step = 0;

    function flyStep() {
      if (!mapRef.current || step >= sequence.length) {
        finishFlythrough(map);
        return;
      }
      const frame = sequence[step];
      step++;
      map.flyTo({
        center: frame.center,
        zoom: frame.zoom,
        pitch: frame.pitch,
        bearing: frame.bearing,
        duration: frame.duration,
        easing: (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
        essential: true,
      });
      animRef.current = setTimeout(flyStep, frame.duration + 200);
    }

    // Brief pause on load before starting
    animRef.current = setTimeout(flyStep, 800);
  }

  function finishFlythrough(map: any) {
    phaseRef.current = 'interactive';
    setPhase('interactive');
    onReady?.();
    // Add compass + zoom control so user can rotate 360°
    if (map.__navControl && !map.__navAdded) {
      map.addControl(map.__navControl, 'top-right');
      map.__navAdded = true;
    }
    // Settle into a nice final view of the whole trail
    const lons = track.map((p) => p.lon);
    const lats = track.map((p) => p.lat);
    map.fitBounds(
      [[Math.min(...lons) - 0.02, Math.min(...lats) - 0.02], [Math.max(...lons) + 0.02, Math.max(...lats) + 0.02]],
      { padding: 40, pitch: 58, duration: 2000 },
    );
  }

  function skipToInteractive(map?: any) {
    if (animRef.current) { clearTimeout(animRef.current); animRef.current = null; }
    const m = map ?? mapRef.current;
    if (m) finishFlythrough(m);
  }

  function toggleRotate() {
    const map = mapRef.current;
    if (!map) return;
    const next = !rotateMode;
    rotateModeRef.current = next;
    setRotateMode(next);
    if (next) {
      map.dragPan.disable();
    } else {
      map.dragPan.enable();
      dragStartXRef.current = null;
    }
  }

  function toggle3D() {
    const map = mapRef.current;
    if (!map) return;
    const next = !is3D;
    setIs3D(next);
    map.easeTo({ pitch: next ? 58 : 0, bearing: 0, duration: 600 });
    map.setTerrain(next ? { source: 'terrain-dem', exaggeration } : null);
  }

  const containerH = typeof height === 'number' ? height : 420;

  return (
    <View style={{ borderRadius: 16, overflow: 'hidden', position: 'relative' }}>
      {/* @ts-ignore */}
      <div ref={containerRef} style={{ width: '100%', height: containerH, display: 'block' }} />

      {/* Loading overlay */}
      {phase === 'loading' && !error && (
        <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(7,11,20,0.85)' }}>
          <Text style={{ color: '#64748b', fontSize: 13 }}>Cargando vista satelital…</Text>
        </View>
      )}

      {/* Error */}
      {error && (
        <View style={{ position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(7,11,20,0.85)' }}>
          <Text style={{ color: '#ef4444', fontSize: 13 }}>{error}</Text>
        </View>
      )}

      {/* Flythrough overlay — trail name + skip button */}
      {phase === 'flying' && (
        <View style={{ position: 'absolute', bottom: 16, left: 0, right: 0, alignItems: 'center', pointerEvents: 'box-none' } as any}>
          <View style={{ backgroundColor: 'rgba(7,11,20,0.72)', borderRadius: 12, paddingHorizontal: 18, paddingVertical: 10, borderWidth: 1, borderColor: 'rgba(34,197,94,0.25)', alignItems: 'center', gap: 8 }}>
            <Text style={{ color: '#f0f9ff', fontSize: 13, fontWeight: '700', letterSpacing: 0.5 }}>{trailName}</Text>
            <TouchableOpacity onPress={() => skipToInteractive()} activeOpacity={0.7}
              style={{ backgroundColor: 'rgba(34,197,94,0.15)', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(34,197,94,0.4)' }}>
              <Text style={{ color: '#22c55e', fontSize: 11, fontWeight: '700', letterSpacing: 0.8 }}>SALTAR INTRO</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Interactive controls row — bottom-right */}
      {phase === 'interactive' && (
        <View style={{ position: 'absolute', bottom: 12, right: 12, flexDirection: 'row', gap: 8 } as any}>
          {/* Rotate 360° toggle */}
          <TouchableOpacity onPress={toggleRotate} activeOpacity={0.8}
            style={{
              backgroundColor: rotateMode ? 'rgba(34,197,94,0.25)' : 'rgba(15,23,36,0.85)',
              borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6,
              borderWidth: 1, borderColor: rotateMode ? '#22c55e' : 'rgba(34,197,94,0.4)',
              flexDirection: 'row', alignItems: 'center', gap: 5,
            }}>
            <Text style={{ color: '#22c55e', fontSize: 13 }}>↻</Text>
            <Text style={{ color: '#22c55e', fontSize: 11, fontWeight: '700', letterSpacing: 0.6 }}>
              {rotateMode ? 'GIRANDO' : 'GIRAR'}
            </Text>
          </TouchableOpacity>
          {/* 2D / 3D toggle */}
          <TouchableOpacity onPress={toggle3D} activeOpacity={0.8}
            style={{ backgroundColor: 'rgba(15,23,36,0.85)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: 'rgba(34,197,94,0.4)' }}>
            <Text style={{ color: '#22c55e', fontSize: 11, fontWeight: '700', letterSpacing: 0.8 }}>{is3D ? '2D' : '3D'}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* SAT badge */}
      {phase !== 'loading' && (
        <View style={{ position: 'absolute', top: 12, left: 12, backgroundColor: 'rgba(7,11,20,0.72)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
          <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 9, fontWeight: '700', letterSpacing: 1 }}>SAT · 3D</Text>
        </View>
      )}
    </View>
  );
}
