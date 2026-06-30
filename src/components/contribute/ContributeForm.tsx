import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { Button } from '../ui/Button';
import { useContribStore, ContribType } from '../../store/contributionStore';
import { useNetwork } from '../../hooks/useNetwork';
import { submitContribution, isSupabaseConfigured } from '../../services/supabase';

const TIPOS: Array<{ id: ContribType; icon: string; label: string }> = [
  { id: 'nueva_ruta', icon: '🗺️', label: 'Nueva ruta' },
  { id: 'edicion_ruta', icon: '✏️', label: 'Editar ruta' },
  { id: 'punto_interes', icon: '📍', label: 'Punto de interés' },
  { id: 'alerta', icon: '⚠️', label: 'Alerta' },
  { id: 'nota', icon: '📝', label: 'Nota' },
];

export function ContributeForm({ onClose, onSubmit }: { onClose?: () => void; onSubmit?: () => void }) {
  const { isDark } = useTheme();
  const { isOffline } = useNetwork();
  const { add } = useContribStore();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [type, setType] = useState<ContribType | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const textClass = isDark ? 'text-stone-100' : 'text-stone-900';
  const mutedClass = isDark ? 'text-stone-400' : 'text-stone-500';
  const inputBg = isDark ? 'bg-stone-800 border-stone-600 text-stone-100' : 'bg-white border-stone-300 text-stone-900';

  const handleSubmit = async () => {
    if (!type || !title.trim()) return;
    setLoading(true);
    // Offline-first: always keep a local copy.
    add({ type, title: title.trim(), description: description.trim() });
    // Also send to the backend when Supabase is configured + the user is signed in.
    if (isSupabaseConfigured()) {
      try {
        await submitContribution({ type, title: title.trim(), description: description.trim() });
      } catch {
        // not authenticated / offline — stays local and can sync later
      }
    }
    setLoading(false);
    setStep(3);
  };

  if (step === 3) {
    return (
      <View className="flex-1 items-center justify-center p-8">
        <Text className="text-5xl mb-4">✅</Text>
        <Text className={`text-xl font-bold mb-2 ${textClass}`}>¡Contribución guardada!</Text>
        <Text className={`text-center text-sm mb-6 ${mutedClass}`}>
          {isOffline
            ? 'Sin conexión. Tu contribución se enviará automáticamente cuando vuelvas a tener señal.'
            : 'Tu contribución ha sido enviada para revisión. ¡Gracias por mejorar Sliabh!'}
        </Text>
        <Button label="Cerrar" onPress={onSubmit ?? onClose ?? (() => setStep(1))} />
      </View>
    );
  }

  if (step === 2) {
    return (
      <ScrollView className="flex-1 p-4">
        <Text className={`text-lg font-bold mb-1 ${textClass}`}>
          {TIPOS.find((t) => t.id === type)?.icon} {TIPOS.find((t) => t.id === type)?.label}
        </Text>
        <Text className={`text-sm mb-4 ${mutedClass}`}>Paso 2 de 2 — Detalles</Text>
        <Text className={`text-sm font-medium mb-1 ${textClass}`}>Título *</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Nombre del lugar o descripción breve"
          placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
          className={`border rounded-xl px-4 py-3 mb-4 ${inputBg}`}
        />
        <Text className={`text-sm font-medium mb-1 ${textClass}`}>Descripción</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Detalles adicionales, condiciones actuales..."
          placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
          multiline
          numberOfLines={4}
          className={`border rounded-xl px-4 py-3 mb-2 ${inputBg}`}
          style={{ textAlignVertical: 'top', minHeight: 100 }}
        />
        {isOffline && (
          <View className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mb-4">
            <Text className="text-amber-400 text-xs">⚡ Sin conexión — la contribución se guardará localmente y se enviará cuando tengas señal.</Text>
          </View>
        )}
        <View className="flex-row gap-3">
          <Button label="Atrás" onPress={() => setStep(1)} variant="secondary" />
          <Button label="Enviar contribución" onPress={handleSubmit} loading={loading} disabled={!title.trim()} />
        </View>
      </ScrollView>
    );
  }

  return (
    <View className="flex-1 p-4">
      <Text className={`text-lg font-bold mb-1 ${textClass}`}>Contribuir al mapa</Text>
      <Text className={`text-sm mb-6 ${mutedClass}`}>Paso 1 de 2 — ¿Qué quieres contribuir?</Text>
      {TIPOS.map((t) => (
        <TouchableOpacity
          key={t.id}
          onPress={() => { setType(t.id); setStep(2); }}
          className={`flex-row items-center gap-4 p-4 rounded-2xl border mb-3 ${
            isDark ? 'bg-stone-800 border-stone-700' : 'bg-white border-stone-200'
          }`}
        >
          <Text className="text-2xl">{t.icon}</Text>
          <Text className={`text-base font-medium ${textClass}`}>{t.label}</Text>
          <Text className={`ml-auto ${mutedClass}`}>›</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
