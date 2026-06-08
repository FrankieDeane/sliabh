import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { ScreenHeader } from '../../src/components/layout/ScreenHeader';
import { MapLeaflet } from '../../src/components/map/MapLeaflet';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { ContributeForm } from '../../src/components/contribute/ContributeForm';
import { useTheme } from '../../src/hooks/useTheme';
import { useNetwork } from '../../src/hooks/useNetwork';

type MapLayer = 'osm' | 'topo';

const LAYERS: { id: MapLayer; label: string; emoji: string; desc: string }[] = [
  { id: 'osm', label: 'OpenStreetMap', emoji: '🗺️', desc: 'Mapa estándar con senderos' },
  { id: 'topo', label: 'Topográfico', emoji: '⛰️', desc: 'Curvas de nivel y relieve' },
];

const POI_LEGEND = [
  { emoji: '⛺', label: 'Campamento' },
  { emoji: '🏠', label: 'Refugio' },
  { emoji: '💧', label: 'Fuente de agua' },
  { emoji: '⚠️', label: 'Zona de riesgo' },
  { emoji: '📍', label: 'Punto de interés' },
];

export default function MapasScreen() {
  const { isDark } = useTheme();
  const { isOffline } = useNetwork();
  const [layer, setLayer] = useState<MapLayer>('osm');
  const [panelOpen, setPanelOpen] = useState(false);
  const [contributeOpen, setContributeOpen] = useState(false);

  const bg = isDark ? 'bg-stone-950' : 'bg-stone-50';
  const textPrimary = isDark ? 'text-stone-50' : 'text-stone-900';
  const textMuted = isDark ? 'text-stone-400' : 'text-stone-500';
  const sheetBg = isDark ? 'bg-stone-900 border-stone-700' : 'bg-white border-stone-200';
  const layerActiveBg = isDark ? 'bg-brand-900 border-brand-600' : 'bg-brand-50 border-brand-400';
  const layerInactiveBg = isDark ? 'bg-stone-800 border-stone-700' : 'bg-stone-100 border-stone-200';
  const modalBg = isDark ? 'bg-stone-900' : 'bg-white';

  return (
    <View className={`flex-1 ${bg}`}>
      <ScreenHeader title="Mapas" subtitle={isOffline ? 'Mapa en caché · Sin conexión' : 'Explorar senderos'} />

      {/* Offline banner */}
      {isOffline && (
        <View className="mx-4 mt-2 mb-1 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2 flex-row items-center gap-2">
          <Text className="text-amber-400 text-lg">⚡</Text>
          <Text className="text-amber-400 text-xs font-semibold flex-1">
            Mapa en caché · Datos disponibles sin conexión
          </Text>
        </View>
      )}

      {/* Map - takes up most of the screen */}
      <View className="flex-1 relative">
        <MapLeaflet
          layer={layer}
          height="100%"
        />

        {/* Floating panel toggle button */}
        <TouchableOpacity
          onPress={() => setPanelOpen(true)}
          className={`absolute bottom-24 left-4 rounded-2xl border px-4 py-3 flex-row items-center gap-2 ${sheetBg}`}
          style={{ elevation: 4, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8 }}
        >
          <Text className="text-base">🗂️</Text>
          <Text className={`text-sm font-semibold ${textPrimary}`}>Capas y leyenda</Text>
        </TouchableOpacity>

        {/* Floating "+" contribute button */}
        <TouchableOpacity
          onPress={() => setContributeOpen(true)}
          className="absolute bottom-24 right-4 w-14 h-14 rounded-full bg-brand-600 items-center justify-center"
          style={{ elevation: 6, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8 }}
        >
          <Text className="text-white text-2xl font-bold">+</Text>
        </TouchableOpacity>
      </View>

      {/* Layers & Legend bottom sheet */}
      <Modal visible={panelOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <SafeAreaView className={`rounded-t-3xl border-t border-l border-r ${sheetBg}`}>
            <View className="p-5" style={{ maxHeight: 480 }}>
              {/* Handle */}
              <View className={`w-10 h-1 rounded-full mx-auto mb-4 ${isDark ? 'bg-stone-600' : 'bg-stone-300'}`} />

              <View className="flex-row items-center justify-between mb-4">
                <Text className={`text-lg font-bold ${textPrimary}`}>Capas del mapa</Text>
                <TouchableOpacity onPress={() => setPanelOpen(false)}>
                  <Text className={`text-base ${textMuted}`}>✕ Cerrar</Text>
                </TouchableOpacity>
              </View>

              {/* Layer switcher */}
              <View className="gap-3 mb-5">
                {LAYERS.map((l) => (
                  <TouchableOpacity
                    key={l.id}
                    onPress={() => { setLayer(l.id); }}
                    className={`flex-row items-center gap-3 rounded-2xl border p-3 ${layer === l.id ? layerActiveBg : layerInactiveBg}`}
                  >
                    <Text className="text-2xl">{l.emoji}</Text>
                    <View className="flex-1">
                      <Text className={`font-semibold text-sm ${textPrimary}`}>{l.label}</Text>
                      <Text className={`text-xs ${textMuted}`}>{l.desc}</Text>
                    </View>
                    {layer === l.id && (
                      <View className="w-5 h-5 rounded-full bg-brand-600 items-center justify-center">
                        <Text className="text-white text-xs">✓</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* POI Legend */}
              <Text className={`text-xs font-semibold tracking-widest mb-3 ${textMuted}`}>LEYENDA DE PUNTOS DE INTERÉS</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-3 pb-2">
                  {POI_LEGEND.map((poi) => (
                    <View key={poi.label} className={`items-center rounded-xl px-3 py-2 border ${isDark ? 'bg-stone-800 border-stone-700' : 'bg-stone-100 border-stone-200'}`} style={{ minWidth: 70 }}>
                      <Text className="text-xl mb-1">{poi.emoji}</Text>
                      <Text className={`text-xs text-center ${textMuted}`}>{poi.label}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Contribute modal */}
      <Modal visible={contributeOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <SafeAreaView className={`rounded-t-3xl border-t border-l border-r ${isDark ? 'bg-stone-900 border-stone-700' : 'bg-white border-stone-200'}`}>
            <View className="px-5 pt-4 pb-2 flex-row items-center justify-between">
              {/* Handle */}
              <View />
              <View className={`w-10 h-1 rounded-full mx-auto ${isDark ? 'bg-stone-600' : 'bg-stone-300'}`} />
              <TouchableOpacity onPress={() => setContributeOpen(false)}>
                <Text className={`text-base ${textMuted}`}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView className="px-5 pb-8" style={{ maxHeight: 560 }}>
              <Text className={`text-lg font-bold mb-4 ${textPrimary}`}>Nueva contribución</Text>
              <ContributeForm onSubmit={() => setContributeOpen(false)} />
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}
