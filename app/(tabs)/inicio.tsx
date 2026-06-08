import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  SafeAreaView,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { ScreenHeader } from '../../src/components/layout/ScreenHeader';
import { OfflineAICard } from '../../src/components/ui/OfflineAICard';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { useTheme } from '../../src/hooks/useTheme';
import { useNetwork } from '../../src/hooks/useNetwork';
import { useAuthStore } from '../../src/store/authStore';

const QUICK_ACTIONS = [
  { emoji: '🗺️', label: 'Planificar ruta', href: '/(tabs)/planificar' as const },
  { emoji: '📍', label: 'Explorar mapas', href: '/(tabs)/mapas' as const },
  { emoji: '✏️', label: 'Contribuir', href: '/(tabs)/contribuir' as const },
];

export default function InicioScreen() {
  const { isDark } = useTheme();
  const { isOffline } = useNetwork();
  const { user } = useAuthStore();
  const router = useRouter();
  const [aiModalVisible, setAiModalVisible] = useState(false);

  const bg = isDark ? 'bg-stone-950' : 'bg-stone-50';
  const textPrimary = isDark ? 'text-stone-50' : 'text-stone-900';
  const textMuted = isDark ? 'text-stone-400' : 'text-stone-500';
  const heroBg = isDark ? 'bg-stone-900' : 'bg-white';
  const heroBorder = isDark ? 'border-stone-800' : 'border-stone-200';
  const actionBg = isDark ? 'bg-stone-800 border-stone-700' : 'bg-white border-stone-200';
  const activeBg = isDark ? 'bg-brand-950 border-brand-800' : 'bg-brand-50 border-brand-200';
  const bannerBg = isDark ? 'bg-stone-800 border-stone-700' : 'bg-amber-50 border-amber-200';
  const modalBg = isDark ? 'bg-stone-900' : 'bg-white';

  return (
    <View className={`flex-1 ${bg}`}>
      <ScreenHeader title="Sliabh" subtitle="Patagonia y más allá" />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Hero section */}
        <View className={`mx-4 mt-4 rounded-3xl border p-6 items-center ${heroBg} ${heroBorder}`}>
          <Text className="text-6xl mb-3">🏔️</Text>
          <Text className={`text-2xl font-bold text-center mb-2 ${textPrimary}`}>
            Explora sin límites
          </Text>
          <Text className={`text-sm text-center leading-5 ${textMuted}`}>
            Planifica rutas de montaña, explora senderos y obtén ayuda de la IA — incluso sin señal en la cima.
          </Text>
        </View>

        {/* Offline AI card */}
        <View className="mx-4 mt-4">
          <OfflineAICard />
        </View>

        {/* Quick actions 2x2 grid */}
        <View className="mx-4 mt-4">
          <Text className={`text-xs font-semibold mb-3 tracking-widest ${textMuted}`}>ACCIONES RÁPIDAS</Text>
          <View className="flex-row flex-wrap gap-3">
            {QUICK_ACTIONS.map((action) => (
              <Link key={action.label} href={action.href} asChild>
                <TouchableOpacity
                  className={`flex-1 min-w-[140px] rounded-2xl border p-4 items-center justify-center ${actionBg}`}
                  style={{ minHeight: 90 }}
                >
                  <Text className="text-3xl mb-1">{action.emoji}</Text>
                  <Text className={`text-xs font-semibold text-center ${textPrimary}`}>{action.label}</Text>
                </TouchableOpacity>
              </Link>
            ))}

            {/* AI Asistente tile */}
            <TouchableOpacity
              onPress={() => setAiModalVisible(true)}
              className={`flex-1 min-w-[140px] rounded-2xl border p-4 items-center justify-center ${actionBg}`}
              style={{ minHeight: 90 }}
            >
              <Text className="text-3xl mb-1">🤖</Text>
              <Text className={`text-xs font-semibold text-center ${textPrimary}`}>AI Asistente</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Active pack card */}
        <View className="mx-4 mt-4">
          <Text className={`text-xs font-semibold mb-3 tracking-widest ${textMuted}`}>EXPEDICIÓN ACTIVA</Text>
          <Card>
            <View className="flex-row items-center gap-3">
              <Text className="text-3xl">⛺</Text>
              <View className="flex-1">
                <Text className={`font-bold text-base ${textPrimary}`}>Torres del Paine</Text>
                <Text className={`text-xs ${textMuted}`}>Patagonia, Chile</Text>
              </View>
              <View className={`px-2 py-1 rounded-full ${isDark ? 'bg-brand-900' : 'bg-brand-100'}`}>
                <Text className="text-brand-500 text-xs font-semibold">ACTIVA</Text>
              </View>
            </View>
            <View className={`flex-row mt-4 gap-4 pt-3 border-t ${isDark ? 'border-stone-700' : 'border-stone-200'}`}>
              <View className="flex-1 items-center">
                <Text className={`text-lg font-bold ${textPrimary}`}>80</Text>
                <Text className={`text-xs ${textMuted}`}>km</Text>
              </View>
              <View className={`w-px ${isDark ? 'bg-stone-700' : 'bg-stone-200'}`} />
              <View className="flex-1 items-center">
                <Text className={`text-lg font-bold ${textPrimary}`}>5</Text>
                <Text className={`text-xs ${textMuted}`}>días</Text>
              </View>
              <View className={`w-px ${isDark ? 'bg-stone-700' : 'bg-stone-200'}`} />
              <View className="flex-1 items-center">
                <Text className={`text-lg font-bold ${textPrimary}`}>+2400</Text>
                <Text className={`text-xs ${textMuted}`}>m desnivel</Text>
              </View>
              <View className={`w-px ${isDark ? 'bg-stone-700' : 'bg-stone-200'}`} />
              <View className="flex-1 items-center">
                <Text className={`text-lg font-bold ${textPrimary}`}>8</Text>
                <Text className={`text-xs ${textMuted}`}>puntos</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Login banner if not logged in */}
        {!user && (
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity className={`mx-4 mt-4 rounded-2xl border p-4 flex-row items-center gap-3 ${bannerBg}`}>
              <Text className="text-2xl">🔐</Text>
              <View className="flex-1">
                <Text className={`font-semibold text-sm ${textPrimary}`}>Inicia sesión para guardar tus rutas</Text>
                <Text className={`text-xs ${textMuted}`}>Sincroniza tus datos entre dispositivos</Text>
              </View>
              <Text className={`text-lg ${textMuted}`}>›</Text>
            </TouchableOpacity>
          </Link>
        )}

        {/* Offline status note */}
        {isOffline && (
          <View className="mx-4 mt-4 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 flex-row items-center gap-3">
            <Text className="text-xl">⚡</Text>
            <Text className="text-amber-400 text-sm font-medium flex-1">
              Modo sin conexión · Datos en caché disponibles
            </Text>
          </View>
        )}
      </ScrollView>

      {/* AI Assistant Modal */}
      <Modal visible={aiModalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <SafeAreaView className={`rounded-t-3xl border-t border-l border-r ${modalBg} ${isDark ? 'border-stone-700' : 'border-stone-200'}`}>
            <View className="p-6" style={{ minHeight: 320 }}>
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center gap-3">
                  <Text className="text-3xl">🤖</Text>
                  <View>
                    <Text className={`font-bold text-lg ${textPrimary}`}>AI Asistente</Text>
                    <Text className={`text-xs ${textMuted}`}>Disponible sin conexión</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setAiModalVisible(false)} className="p-2">
                  <Text className={`text-lg ${textMuted}`}>✕</Text>
                </TouchableOpacity>
              </View>

              <View className={`rounded-2xl p-4 mb-4 ${isDark ? 'bg-stone-800' : 'bg-stone-100'}`}>
                <Text className={`text-sm leading-5 ${textMuted}`}>
                  Hola, soy tu asistente de montaña. Puedo ayudarte con:
                </Text>
                <View className="mt-3 gap-2">
                  {[
                    '🗺️  Planificación de rutas y senderos',
                    '🌤️  Condiciones meteorológicas',
                    '🎒  Equipamiento y preparación',
                    '🆘  Protocolos de emergencia',
                  ].map((item) => (
                    <Text key={item} className={`text-sm ${textPrimary}`}>{item}</Text>
                  ))}
                </View>
              </View>

              <Button
                label="Ir al asistente completo"
                onPress={() => {
                  setAiModalVisible(false);
                }}
                fullWidth
              />
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}
