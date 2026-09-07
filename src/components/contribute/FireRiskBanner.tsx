import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchFireEvents, bboxAround, nearestFire, type NearestFire } from '../../services/fireData';
import { useLangStore } from '../../store/langStore';

/**
 * Warns when a trail sits near an active wildfire NASA EONET is currently
 * tracking. Public data, no API key needed. Best-effort supplementary
 * data, not a safety guarantee: it renders nothing when the fetch fails
 * or when no event is close enough to matter.
 */
export function FireRiskBanner({ lat, lon }: { lat: number; lon: number }) {
  const { t } = useLangStore();
  const [nearest, setNearest] = React.useState<NearestFire | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    fetchFireEvents(bboxAround(lat, lon)).then((events) => {
      if (!cancelled) setNearest(nearestFire(lat, lon, events));
    });
    return () => { cancelled = true; };
  }, [lat, lon]);

  if (!nearest) return null;

  const { distanceKm, event } = nearest;
  const dateLabel = event.date ? new Date(event.date).toLocaleDateString() : '';

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
            `Incendio activo a ${distanceKm.toFixed(0)} km del sendero`,
            `Active wildfire ${distanceKm.toFixed(0)} km from the trail`,
          )}
        </Text>
        <Text style={{ fontSize: 14.5, lineHeight: 21, color: 'rgba(239,68,68,0.9)', marginTop: 5 }}>
          {t(
            `${event.title}. Rastreado por NASA EONET${dateLabel ? ` — última posición registrada el ${dateLabel}` : ''}. Verificá con la administración del parque antes de salir.`,
            `${event.title}. Tracked by NASA EONET${dateLabel ? ` — last recorded position on ${dateLabel}` : ''}. Check with the park administration before heading out.`,
          )}
        </Text>
      </View>
    </View>
  );
}
