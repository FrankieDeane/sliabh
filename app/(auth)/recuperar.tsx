import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../src/components/ui/Button';
import { useTheme } from '../../src/hooks/useTheme';
import { sendRecoveryCode } from '../../src/services/supabase';

export default function RecuperarScreen() {
  const { isDark } = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const bg = isDark ? 'bg-gray-900' : 'bg-stone-50';
  const textPrimary = isDark ? 'text-stone-50' : 'text-stone-900';
  const textMuted = isDark ? 'text-stone-400' : 'text-stone-500';
  const inputClass = `border rounded-xl px-4 py-3 mb-6 ${isDark ? 'bg-stone-800 border-stone-600 text-stone-100' : 'bg-white border-stone-300 text-stone-900'}`;

  const handleSend = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Introduce tu correo electrónico.');
      return;
    }
    setLoading(true);
    const { error } = await sendRecoveryCode(email.trim());
    setLoading(false);
    if (error) {
      Alert.alert('Error', error.message.includes('not found')
        ? 'No encontramos una cuenta con ese correo.'
        : error.message);
    } else {
      router.push({ pathname: '/(auth)/codigo', params: { email: email.trim() } } as any);
    }
  };

  return (
    <View className={`flex-1 px-6 pt-16 ${bg}`}>
      <TouchableOpacity onPress={() => router.back()} className="mb-8">
        <Text className={textMuted}>‹ Volver</Text>
      </TouchableOpacity>

      <Text className="text-4xl mb-3">🔑</Text>
      <Text className={`text-2xl font-bold mb-2 ${textPrimary}`}>¿Olvidaste tu contraseña?</Text>
      <Text className={`text-sm mb-8 leading-5 ${textMuted}`}>
        Introduce tu correo y te enviaremos un código de 6 dígitos para restablecer tu contraseña.
      </Text>

      <Text className={`text-sm font-medium mb-1 ${textPrimary}`}>Correo electrónico</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="tu@correo.com"
        placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        className={inputClass}
      />

      <Button label="Enviar código" onPress={handleSend} loading={loading} fullWidth />
    </View>
  );
}
