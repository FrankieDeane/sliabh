import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchFireHotspots, isFirmsConfigured, bboxAround, nearestFire, type NearestFire } from '../../services/fireData';
import { useLangStore } from '../../store/langStore';

/**
 * Warns when a trail sits near an active fire hotspot detected by NASA FIRMS
 * satellite data (VIIRS, refreshed every few hours). This is best-effort
 * supplementary data, not a safety guarantee: it renders nothing when no FIRMS
 * key is configured (see src/services/fireData.ts), when the fetch fails, or
 * when no hotspot is close enough to matter.
 */
export function FireRiskBanner({ lat, lon }: { lat: number; lon: number }) {
  const { t } = useLangStore();
  const [nearest, setNearest] = React.useState<NearestFire | null>(null);

  React.useEffect(() => {
    if (!isFirmsConfigured()) return;
    let cancelled = false;
    fetchFireHotspots(bboxAround(lat, lon)).then((hotspots) => {
      if (!cancelled) setNearest(nearestFire(lat, lon, hotspots));
    });
    return () => { cancelled = true; };
  }, [lat, lon]);

  if (!nearest) return null;

  const { distanceKm, hotspot } = nearest;
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 14,
        borderRadius: 18,
        borderWidth: 2,
        borderColor: 'rgba(239,68,68,0.65)',
        backgroundColor: 'rgba(239,68,68,0.14)',
        padding: 20,
        marginBottom: 16,
      }}
    >
      <Ionicons name="flame" size={30} color="#ef4444" />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 17, lineHeight: 24, color: '#ef4444', fontWeight: '800' }}>
          {t(
            `Foco de calor detectado a ${distanceKm.toFixed(1)} km del sendero`,
            `Heat source detected ${distanceKm.toFixed(1)} km from the trail`,
          )}
        </Text>
        <Text style={{ fontSize: 14.5, lineHeight: 21, color: 'rgba(239,68,68,0.9)', marginTop: 5 }}>
          {t(
            `Detectado por satélite (NASA FIRMS) el ${hotspot.acqDate}. Verificá con la administración del parque antes de salir.`,
            `Detected by satellite (NASA FIRMS) on ${hotspot.acqDate}. Check with the park administration before heading out.`,
          )}
        </Text>
      </View>
    </View>
  );
}
