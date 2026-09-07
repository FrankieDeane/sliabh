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
        gap: 10,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(239,68,68,0.55)',
        backgroundColor: 'rgba(239,68,68,0.12)',
        padding: 16,
        marginBottom: 12,
      }}
    >
      <Ionicons name="flame-outline" size={20} color="#ef4444" />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13.5, lineHeight: 20, color: '#ef4444', fontWeight: '700' }}>
          {t(
            `Foco de calor detectado a ${distanceKm.toFixed(1)} km del sendero`,
            `Heat source detected ${distanceKm.toFixed(1)} km from the trail`,
          )}
        </Text>
        <Text style={{ fontSize: 12, lineHeight: 17, color: 'rgba(239,68,68,0.85)', marginTop: 3 }}>
          {t(
            `Detectado por satélite (NASA FIRMS) el ${hotspot.acqDate}. Verificá con la administración del parque antes de salir.`,
            `Detected by satellite (NASA FIRMS) on ${hotspot.acqDate}. Check with the park administration before heading out.`,
          )}
        </Text>
      </View>
    </View>
  );
}
