import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  SafeAreaView,
} from 'react-native';
import { ScreenHeader } from '../../src/components/layout/ScreenHeader';
import { ContributeForm } from '../../src/components/contribute/ContributeForm';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { OfflineBadge } from '../../src/components/ui/OfflineBadge';
import { useTheme } from '../../src/hooks/useTheme';
import { useContribStore } from '../../src/store/contributionStore';
import { useNetwork } from '../../src/hooks/useNetwork';

const CONTRIB_TYPE_LABELS: Record<string, string> = {
  nueva_ruta: 'Nueva ruta',
  edicion_ruta: 'Edición de ruta',
  punto_interes: 'Punto de interés',
  alerta: 'Alerta',
  nota: 'Nota',
};

const HOW_IT_WORKS = [
  {
    step: '1',
    emoji: '✏️',
    title: 'Añade información',
    desc: 'Reporta rutas, refugios, fuentes de agua o cualquier punto de interés que encuentres.',
  },
  {
    step: '2',
    emoji: '🔄',
    title: 'Sincronización automática',
    desc: 'Tus contribuciones se guardan localmente y se sincronizan cuando recuperes la señal.',
  },
  {
    step: '3',
    emoji: '✅',
    title: 'Revisión comunitaria',
    desc: 'La comunidad verifica y aprueba las contribuciones para mantener la calidad de los datos.',
  },
];

export default function ContribuirScreen() {
  const { isDark } = useTheme();
  const { isOffline } = useNetwork();
  const { pending, remove } = useContribStore();
  const [formModalOpen, setFormModalOpen] = useState(false);

  const bg = isDark ? 'bg-stone-950' : 'bg-stone-50';
  const textPrimary = isDark ? 'text-stone-50' : 'text-stone-900';
  const textMuted = isDark ? 'text-stone-400' : 'text-stone-500';
  const divider = isDark ? 'border-stone-800' : 'border-stone-200';
  const pendingBg = isDark ? 'bg-stone-800 border-stone-700' : 'bg-white border-stone-200';
  const syncedBadge = isDark ? 'bg-brand-900' : 'bg-brand-100';
  const pendingBadge = isDark ? 'bg-amber-900/60' : 'bg-amber-100';
  const modalBg = isDark ? 'bg-stone-900 border-stone-700' : 'bg-white border-stone-200';

  const unsynced = pending.filter((p) => !p.synced);

  return (
    <View className={`flex-1 ${bg}`}>
      <ScreenHeader title="Contribuir" subtitle="Comparte tu experiencia" />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Offline badge */}
        {isOffline && (
          <View className="mx-4 mt-3">
            <OfflineBadge />
          </View>
        )}

        {/* Community stats */}
        <View className="mx-4 mt-4">
          <Text className={`text-xs font-semibold mb-3 tracking-widest ${textMuted}`}>ESTADÍSTICAS COMUNITARIAS</Text>
          <View className="flex-row gap-3">
            <Card className="flex-1 items-center">
              <Text className="text-3xl mb-1">🗺️</Text>
              <Text className={`text-2xl font-bold ${textPrimary}`}>247</Text>
              <Text className={`text-xs text-center ${textMuted}`}>rutas verificadas</Text>
            </Card>
            <Card className="flex-1 items-center">
              <Text className="text-3xl mb-1">👥</Text>
              <Text className={`text-2xl font-bold ${textPrimary}`}>1,840</Text>
              <Text className={`text-xs text-center ${textMuted}`}>contribuidores</Text>
            </Card>
          </View>
        </View>

        {/* Nueva contribución button */}
        <View className="mx-4 mt-4">
          <Button
            label="Nueva contribución"
            onPress={() => setFormModalOpen(true)}
            variant="primary"
            icon="✏️"
            fullWidth
          />
        </View>

        {/* Pending contributions */}
        {unsynced.length > 0 && (
          <View className="mx-4 mt-5">
            <Text className={`text-xs font-semibold mb-3 tracking-widest ${textMuted}`}>
              PENDIENTES DE SINCRONIZACIÓN ({unsynced.length})
            </Text>
            <View className="gap-3">
              {unsynced.map((item) => (
                <View key={item.id} className={`rounded-2xl border p-4 ${pendingBg}`}>
                  <View className="flex-row items-start justify-between gap-2">
                    <View className="flex-1">
                      <View className="flex-row items-center gap-2 mb-1">
                        <View className={`px-2 py-0.5 rounded-full ${pendingBadge}`}>
                          <Text className="text-amber-500 text-xs font-semibold">
                            {CONTRIB_TYPE_LABELS[item.type] ?? item.type}
                          </Text>
                        </View>
                      </View>
                      <Text className={`font-semibold text-sm ${textPrimary}`}>{item.title}</Text>
                      {item.description.length > 0 && (
                        <Text className={`text-xs mt-1 ${textMuted}`} numberOfLines={2}>{item.description}</Text>
                      )}
                      <Text className={`text-xs mt-1 ${textMuted}`}>
                        {new Date(item.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => remove(item.id)} className="p-1">
                      <Text className="text-red-400 text-base">🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Synced contributions */}
        {pending.filter((p) => p.synced).length > 0 && (
          <View className="mx-4 mt-4">
            <Text className={`text-xs font-semibold mb-3 tracking-widest ${textMuted}`}>ENVIADAS RECIENTEMENTE</Text>
            <View className="gap-2">
              {pending.filter((p) => p.synced).map((item) => (
                <View key={item.id} className={`rounded-2xl border p-3 ${pendingBg} opacity-70`}>
                  <View className="flex-row items-center gap-2">
                    <View className={`px-2 py-0.5 rounded-full ${syncedBadge}`}>
                      <Text className="text-brand-500 text-xs font-semibold">✓ Sincronizada</Text>
                    </View>
                    <Text className={`text-sm flex-1 ${textMuted}`}>{item.title}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* How it works */}
        <View className="mx-4 mt-6">
          <Text className={`text-xs font-semibold mb-4 tracking-widest ${textMuted}`}>¿CÓMO FUNCIONA?</Text>
          <View className="gap-4">
            {HOW_IT_WORKS.map((step) => (
              <View key={step.step} className="flex-row items-start gap-3">
                <View className="w-9 h-9 rounded-full bg-brand-600 items-center justify-center flex-shrink-0">
                  <Text className="text-white text-sm font-bold">{step.step}</Text>
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center gap-2 mb-1">
                    <Text className="text-base">{step.emoji}</Text>
                    <Text className={`font-semibold text-sm ${textPrimary}`}>{step.title}</Text>
                  </View>
                  <Text className={`text-xs leading-5 ${textMuted}`}>{step.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Contribute form modal */}
      <Modal visible={formModalOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <SafeAreaView className={`rounded-t-3xl border-t border-l border-r ${modalBg}`}>
            <View className="px-5 pt-4 pb-2 flex-row items-center justify-between">
              <Text className={`text-lg font-bold ${textPrimary}`}>Nueva contribución</Text>
              <TouchableOpacity onPress={() => setFormModalOpen(false)}>
                <Text className={`text-base ${textMuted}`}>✕ Cerrar</Text>
              </TouchableOpacity>
            </View>
            <ScrollView className="px-5 pb-6" style={{ maxHeight: 560 }}>
              <ContributeForm onSubmit={() => setFormModalOpen(false)} />
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}
