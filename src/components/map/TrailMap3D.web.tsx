import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { gpxTrackToGeoJSON } from '../../utils/geojson';

interface GpxPoint {
  lat: number;
  lon: number;
  ele?: number;
  name?: string;
}

interface TrailMap3DProps {
  track: GpxPoint[];
  trailName: string;
  height?: number | string;
  /** Vertical exaggeration for terrain; default 1.5 */
  exaggeration?: number;
  /** MapTiler API key — optional; falls back to terrain-less 2D style */
  mapTilerKey?: string;
}

/**
 * Renders a MapLibre GL JS map with terrain draping for a hiking route.
 *
 * On web it injects MapLibre via CDN and mounts into a div. On native the
 * parent should use TrailMap3D.native.tsx (WebView wrapper) instead.
 */
export default function TrailMap3D({
  track,
  trailName,
  height = 340,
  exaggeration = 1.5,
  mapTilerKey,
}: TrailMap3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [is3D, setIs3D] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (Platform.OS !== 'web') return null;
  if (track.length < 2) return null;

  // Derive a bounding center from the track
  const midIdx = Math.floor(track.length / 2);
  const center: [number, number] = [track[midIdx].lon, track[midIdx].lat];

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const MAPLIBRE_CSS = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css';
    const MAPLIBRE_JS  = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js';

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
          // Script already injected — wait for it
          const interval = setInterval(() => {
            if ((window as any).maplibregl) { clearInterval(interval); resolve(); }
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

        // Use MapTiler if key provided, else OpenFreeMap (no key required).
        const styleUrl = mapTilerKey
          ? `https://api.maptiler.com/maps/outdoor-v2/style.json?key=${mapTilerKey}`
          : 'https://tiles.openfreemap.org/styles/liberty';

        const map = new ml.Map({
          container: containerRef.current,
          style: styleUrl,
          center,
          zoom: 9,
          pitch: 55,
          bearing: 0,
          antialias: true,
          maxTileCacheSize: 30,
        });

        mapRef.current = map;

        map.on('load', () => {
          // ── Terrain ────────────────────────────────────────────────────
          const terrainSourceId = 'terrain-dem';

          if (mapTilerKey) {
            map.addSource(terrainSourceId, {
              type: 'raster-dem',
              url: `https://api.maptiler.com/tiles/terrain-rgb-v2/tiles.json?key=${mapTilerKey}`,
              tileSize: 512,
            });
          } else {
            // AWS Open Data SRTM — free, no key, Mapbox Terrain-RGB encoding
            map.addSource(terrainSourceId, {
              type: 'raster-dem',
              tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
              tileSize: 256,
              encoding: 'terrarium',
              maxzoom: 15,
            });
          }

          map.setTerrain({ source: terrainSourceId, exaggeration });

          // ── Trail line ─────────────────────────────────────────────────
          const geoJSON = gpxTrackToGeoJSON(track);
          map.addSource('trail', { type: 'geojson', data: geoJSON });

          // Glow / halo underneath
          map.addLayer({
            id: 'trail-glow',
            type: 'line',
            source: 'trail',
            paint: {
              'line-color': '#22c55e',
              'line-width': 8,
              'line-opacity': 0.25,
              'line-blur': 4,
            },
          });

          // Main draped line
          map.addLayer({
            id: 'trail-line',
            type: 'line',
            source: 'trail',
            paint: {
              'line-color': '#22c55e',
              'line-width': 3,
              'line-opacity': 0.95,
            },
          });

          // ── Start / end markers ────────────────────────────────────────
          const startEl = document.createElement('div');
          startEl.style.cssText =
            'width:12px;height:12px;border-radius:50%;background:#22c55e;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.5)';
          new ml.Marker({ element: startEl })
            .setLngLat([track[0].lon, track[0].lat])
            .setPopup(new ml.Popup({ offset: 12 }).setText(track[0].name ?? 'Inicio'))
            .addTo(map);

          const endEl = document.createElement('div');
          endEl.style.cssText =
            'width:12px;height:12px;border-radius:50%;background:#f97316;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.5)';
          new ml.Marker({ element: endEl })
            .setLngLat([track[track.length - 1].lon, track[track.length - 1].lat])
            .setPopup(new ml.Popup({ offset: 12 }).setText(track[track.length - 1].name ?? 'Fin'))
            .addTo(map);

          // ── Fit bounds to track ────────────────────────────────────────
          const lons = track.map((p) => p.lon);
          const lats = track.map((p) => p.lat);
          map.fitBounds(
            [
              [Math.min(...lons) - 0.05, Math.min(...lats) - 0.05],
              [Math.max(...lons) + 0.05, Math.max(...lats) + 0.05],
            ],
            { padding: 40, pitch: 55, duration: 1200 },
          );

          setLoaded(true);
        });

        map.on('error', (e: any) => {
          console.warn('MapLibre error:', e);
          setError('No se pudo cargar el mapa 3D.');
        });
      })
      .catch((e) => setError(e.message));

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toggle pitch between 3D and flat 2D without remounting the map
  function toggle3D() {
    const map = mapRef.current;
    if (!map) return;
    const next = !is3D;
    setIs3D(next);
    map.easeTo({ pitch: next ? 55 : 0, bearing: 0, duration: 600 });
    if (map.getTerrain()) {
      map.setTerrain(next ? { source: 'terrain-dem', exaggeration } : null);
    }
  }

  const containerH = typeof height === 'number' ? height : 340;

  return (
    <View style={{ borderRadius: 16, overflow: 'hidden', position: 'relative' }}>
      {/* Map container */}
      {/* @ts-ignore — div on web */}
      <div
        ref={containerRef}
        style={{ width: '100%', height: containerH, display: 'block' }}
      />

      {/* Loading overlay */}
      {!loaded && !error && (
        <View
          style={{
            position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(7,11,20,0.7)',
          }}
        >
          <Text style={{ color: '#64748b', fontSize: 13 }}>Cargando mapa 3D…</Text>
        </View>
      )}

      {/* Error state */}
      {error && (
        <View
          style={{
            position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(7,11,20,0.85)',
          }}
        >
          <Text style={{ color: '#ef4444', fontSize: 13 }}>{error}</Text>
        </View>
      )}

      {/* 2D / 3D toggle */}
      {loaded && (
        <TouchableOpacity
          onPress={toggle3D}
          activeOpacity={0.8}
          style={{
            position: 'absolute', top: 12, right: 12,
            backgroundColor: 'rgba(15,23,36,0.85)',
            borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6,
            borderWidth: 1, borderColor: 'rgba(34,197,94,0.4)',
          }}
        >
          <Text style={{ color: '#22c55e', fontSize: 11, fontWeight: '700', letterSpacing: 0.8 }}>
            {is3D ? '2D' : '3D'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
