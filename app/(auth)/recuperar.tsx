import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../src/components/ui/Button';
import { useTheme } from '../../src/hooks/useTheme';
import { sendRecoveryCode } from '../../src/services/supabase';
import { showAlert, normalizeEmail, isValidEmail } from '../../src/utils/alert';

export default function RecuperarScreen() {
  const { isDark } = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const bg = isDark ? 'bg-gray-900' : 'bg-stone-50';
  const textPrimary = isDark ? 'text-stone-50' : 'text-stone-900';
  const textMuted = isDark ? 'text-stone-400' : 'text-stone-500';
  const inputClass = `border rounded-xl px-4 py-3 mb-6 ${isDark ? 'bg-stone-800 border-stone-600 text-stone-100' : 'bg-white border-stone-300 text-stone-900'}`;

  const handleSend = async () => {
    const cleanEmail = normalizeEmail(email);
    if (!cleanEmail) {
      showAlert('Error', 'Introduce tu correo electrónico.');
      return;
    }
    if (!isValidEmail(cleanEmail)) {
      showAlert('Correo inválido', 'El formato del correo electrónico no es válido.');
      return;
    }
    setLoading(true);
    const { error } = await sendRecoveryCode(cleanEmail);
    setLoading(false);
    // Only surface genuine connectivity failures. A "user not found" error is
    // deliberately swallowed: telling the user whether an email is registered
    // is an account-enumeration leak. We show the same "check your email"
    // confirmation either way, so the response is identical whether or not the
    // account exists.
    if (error && /network|fetch/i.test(error.message)) {
      showAlert('Error de conexión', 'Comprueba tu red e inténtalo de nuevo.');
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <View className={`flex-1 px-6 pt-16 ${bg}`}>
        <TouchableOpacity onPress={() => router.replace('/(auth)/login' as any)} className="mb-8">
          <Text className={textMuted}>‹ Volver</Text>
        </TouchableOpacity>
        <Text className="text-4xl mb-3">📩</Text>
        <Text className={`text-2xl font-bold mb-2 ${textPrimary}`}>Revisá tu correo</Text>
        <Text className={`text-sm leading-5 ${textMuted}`}>
          Si hay una cuenta asociada a{'\n'}
          <Text className={`font-semibold ${textPrimary}`}>{normalizeEmail(email)}</Text>
          {'\n\n'}te enviamos un enlace para restablecer tu contraseña. Abrilo desde este
          dispositivo y vas a poder elegir una nueva. El enlace vence en 1 hora.
        </Text>
      </View>
    );
  }

  return (
    <View className={`flex-1 px-6 pt-16 ${bg}`}>
      <TouchableOpacity onPress={() => router.back()} className="mb-8">
        <Text className={textMuted}>‹ Volver</Text>
      </TouchableOpacity>

      <Text className="text-4xl mb-3">🔑</Text>
      <Text className={`text-2xl font-bold mb-2 ${textPrimary}`}>¿Olvidaste tu contraseña?</Text>
      <Text className={`text-sm mb-8 leading-5 ${textMuted}`}>
        Introduce tu correo y te enviaremos un enlace para restablecer tu contraseña.
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
        autoComplete="email"
        textContentType="username"
        className={inputClass}
      />

      <Button label="Enviar enlace" onPress={handleSend} loading={loading} fullWidth />
    </View>
  );
}
