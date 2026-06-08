import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ScreenHeader } from '../../src/components/layout/ScreenHeader';
import { WaypointList } from '../../src/components/planner/WaypointList';
import { RouteStats } from '../../src/components/planner/RouteStats';
import { Button } from '../../src/components/ui/Button';
import { ResponsiveLayout } from '../../src/components/layout/ResponsiveLayout';
import { MapLeaflet } from '../../src/components/map/MapLeaflet';
import { useTheme } from '../../src/hooks/useTheme';
import { usePlannerStore } from '../../src/store/plannerStore';
import { useResponsive } from '../../src/hooks/useResponsive';

type MobileTab = 'mapa' | 'puntos';

export default function PlanificarScreen() {
  const { isDark } = useTheme();
  const { isWide } = useResponsive();
  const { waypoints, planName, setPlanName, addWaypoint, clearPlan } = usePlannerStore();
  const [mobileTab, setMobileTab] = useState<MobileTab>('mapa');

  const bg = isDark ? 'bg-stone-950' : 'bg-stone-50';
  const textPrimary = isDark ? 'text-stone-50' : 'text-stone-900';
  const textMuted = isDark ? 'text-stone-400' : 'text-stone-500';
  const inputBg = isDark ? 'bg-stone-800 border-stone-700 text-stone-50' : 'bg-white border-stone-300 text-stone-900';
  const tabActiveBg = isDark ? 'bg-stone-700' : 'bg-white';
  const tabInactiveBg = isDark ? 'bg-stone-800' : 'bg-stone-100';
  const tabContainerBg = isDark ? 'bg-stone-800 border-stone-700' : 'bg-stone-100 border-stone-200';

  function handleMapPress(lat: number, lon: number) {
    addWaypoint({
      id: Date.now().toString(),
      lat,
      lon,
      name: `Punto ${waypoints.length + 1}`,
    });
  }

  function handleAnalyzeWithAI() {
    if (waypoints.length < 2) {
      Alert.alert(
        'Pocos puntos',
        'Añade al menos 2 puntos de ruta para analizar con IA.',
        [{ text: 'Entendido' }],
      );
      return;
    }
    Alert.alert(
      '🤖 Análisis IA',
      `Analizando "${planName}" con ${waypoints.length} puntos...\n\nEsta función usará el modelo local para evaluar dificultad, riesgos y recomendaciones de equipamiento.`,
      [{ text: 'Cerrar' }],
    );
  }

  function handleClearRoute() {
    Alert.alert(
      'Limpiar ruta',
      '¿Estás seguro de que quieres eliminar todos los puntos de ruta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Limpiar', style: 'destructive', onPress: clearPlan },
      ],
    );
  }

  const planNameInput = (
    <View className="px-3 pt-3 pb-2">
      <TextInput
        value={planName}
        onChangeText={setPlanName}
        placeholder="Nombre del plan..."
        placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
        className={`rounded-xl border px-4 py-3 text-sm font-medium ${inputBg}`}
      />
    </View>
  );

  const actionButtons = (
    <View className="px-3 pb-3 gap-2">
      <Button
        label="Analizar con IA"
        onPress={handleAnalyzeWithAI}
        variant="primary"
        icon="🤖"
        fullWidth
      />
      <Button
        label="Limpiar ruta"
        onPress={handleClearRoute}
        variant="danger"
        icon="🗑️"
        fullWidth
      />
    </View>
  );

  if (isWide) {
    // Desktop / tablet: sidebar left, map right
    return (
      <View className={`flex-1 ${bg}`}>
        <ScreenHeader title="Planificar ruta" subtitle={`${waypoints.length} puntos de ruta`} />
        <View className="flex-1 flex-row">
          {/* Sidebar */}
          <View className={`w-80 flex-col border-r ${isDark ? 'border-stone-700 bg-stone-900' : 'border-stone-200 bg-white'}`}>
            {planNameInput}
            <RouteStats />
            <View className="flex-1">
              <WaypointList />
            </View>
            {actionButtons}
          </View>
          {/* Map */}
          <View className="flex-1">
            <MapLeaflet
              onMapPress={handleMapPress}
              waypoints={waypoints}
              height="100%"
            />
          </View>
        </View>
      </View>
    );
  }

  // Mobile: tabs between Mapa and Puntos, RouteStats always at bottom
  return (
    <KeyboardAvoidingView
      className={`flex-1 ${bg}`}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader title="Planificar ruta" subtitle={`${waypoints.length} puntos de ruta`} />

      {planNameInput}

      {/* Tab switcher */}
      <View className={`flex-row mx-3 mb-2 rounded-xl border p-1 ${tabContainerBg}`}>
        <TouchableOpacity
          onPress={() => setMobileTab('mapa')}
          className={`flex-1 rounded-lg py-2 items-center ${mobileTab === 'mapa' ? tabActiveBg : tabInactiveBg}`}
        >
          <Text className={`text-sm font-semibold ${mobileTab === 'mapa' ? textPrimary : textMuted}`}>
            🗺️ Mapa
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setMobileTab('puntos')}
          className={`flex-1 rounded-lg py-2 items-center ${mobileTab === 'puntos' ? tabActiveBg : tabInactiveBg}`}
        >
          <Text className={`text-sm font-semibold ${mobileTab === 'puntos' ? textPrimary : textMuted}`}>
            📍 Puntos ({waypoints.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View className="flex-1">
        {mobileTab === 'mapa' ? (
          <MapLeaflet
            onMapPress={handleMapPress}
            waypoints={waypoints}
            height="100%"
          />
        ) : (
          <View className="flex-1">
            <WaypointList />
            {actionButtons}
          </View>
        )}
      </View>

      {/* RouteStats always visible at bottom */}
      <RouteStats />
    </KeyboardAvoidingView>
  );
}
