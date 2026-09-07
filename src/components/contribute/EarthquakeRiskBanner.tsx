import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchNearbyEarthquakes, nearestEarthquake, type NearestQuake } from '../../services/earthquakeData';
import { useLangStore } from '../../store/langStore';

/**
 * Warns when a trail sits near a recent, significant earthquake (USGS data,
 * no API key needed) — a signal for aftershocks and rockfall/landslide risk
 * on mountain trails. Best-effort supplementary data, not a safety guarantee:
 * renders nothing when the fetch fails or no quake is close/recent enough.
 */
export function EarthquakeRiskBanner({ lat, lon }: { lat: number; lon: number }) {
  const { t } = useLangStore();
  const [nearest, setNearest] = React.useState<NearestQuake | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    fetchNearbyEarthquakes(lat, lon, { radiusKm: 100, days: 7, minMag: 3.5 }).then((quakes) => {
      if (!cancelled) setNearest(nearestEarthquake(lat, lon, quakes));
    });
    return () => { cancelled = true; };
  }, [lat, lon]);

  if (!nearest) return null;

  const { distanceKm, quake } = nearest;
  const date = quake.time ? new Date(quake.time).toLocaleDateString() : '';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 14,
        borderRadius: 18,
        borderWidth: 2,
        borderColor: 'rgba(217,119,6,0.65)',
        backgroundColor: 'rgba(217,119,6,0.14)',
        padding: 20,
        marginBottom: 16,
      }}
    >
      <Ionicons name="pulse" size={30} color="#d97706" />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 17, lineHeight: 24, color: '#d97706', fontWeight: '800' }}>
          {t(
            `Sismo de magnitud ${quake.mag.toFixed(1)} a ${distanceKm.toFixed(0)} km del sendero`,
            `Magnitude ${quake.mag.toFixed(1)} earthquake ${distanceKm.toFixed(0)} km from the trail`,
          )}
        </Text>
        <Text style={{ fontSize: 14.5, lineHeight: 21, color: 'rgba(217,119,6,0.9)', marginTop: 5 }}>
          {t(
            `${quake.place || 'Zona cercana'}, ${date}. Posible riesgo de desprendimientos o réplicas — extremá precauciones en laderas y senderos angostos.`,
            `${quake.place || 'Nearby area'}, ${date}. Possible rockfall or aftershock risk — take extra care on slopes and narrow trails.`,
          )}
        </Text>
      </View>
    </View>
  );
}
