import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button } from '../../src/components/ui/Button';
import { useTheme } from '../../src/hooks/useTheme';
import { verifyRecoveryCode, updatePassword } from '../../src/services/supabase';

export default function CodigoScreen() {
  const { isDark } = useTheme();
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeVerified, setCodeVerified] = useState(false);
  const [done, setDone] = useState(false);

  const bg = isDark ? 'bg-gray-900' : 'bg-stone-50';
  const textPrimary = isDark ? 'text-stone-50' : 'text-stone-900';
  const textMuted = isDark ? 'text-stone-400' : 'text-stone-500';
  const inputClass = `border rounded-xl px-4 py-3 mb-4 ${isDark ? 'bg-stone-800 border-stone-600 text-stone-100' : 'bg-white border-stone-300 text-stone-900'}`;

  const handleVerifyCode = async () => {
    if (code.length !== 6) {
      Alert.alert('Error', 'El código debe tener 6 dígitos.');
      return;
    }
    setLoading(true);
    const { error } = await verifyRecoveryCode(email ?? '', code);
    setLoading(false);
    if (error) {
      Alert.alert('Código inválido', 'El código no es correcto o ha expirado. Solicita uno nuevo.');
    } else {
      setCodeVerified(true);
    }
  };

  const handleUpdatePassword = async () => {
    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Error', 'Las contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    const { error } = await updatePassword(password);
    setLoading(false);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setDone(true);
    }
  };

  if (done) {
    return (
      <View className={`flex-1 items-center justify-center px-6 ${bg}`}>
        <Text className="text-5xl mb-4">✅</Text>
        <Text className={`text-2xl font-bold mb-2 ${textPrimary}`}>¡Contraseña actualizada!</Text>
        <Text className={`text-center text-sm mb-8 ${textMuted}`}>
          Tu contraseña ha sido restablecida. Ya puedes iniciar sesión.
        </Text>
        <Button label="Iniciar sesión" onPress={() => router.replace('/(auth)/login' as any)} fullWidth />
      </View>
    );
  }

  return (
    <View className={`flex-1 px-6 pt-16 ${bg}`}>
      <TouchableOpacity onPress={() => router.back()} className="mb-8">
        <Text className={textMuted}>‹ Volver</Text>
      </TouchableOpacity>

      {!codeVerified ? (
        <>
          <Text className="text-4xl mb-3">📩</Text>
          <Text className={`text-2xl font-bold mb-2 ${textPrimary}`}>Revisa tu correo</Text>
          <Text className={`text-sm mb-8 leading-5 ${textMuted}`}>
            Hemos enviado un código de 6 dígitos a{'\n'}
            <Text className={`font-semibold ${textPrimary}`}>{email}</Text>
          </Text>
          <Text className={`text-sm font-medium mb-1 ${textPrimary}`}>Código de verificación</Text>
          <TextInput
            value={code}
            onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
            keyboardType="number-pad"
            maxLength={6}
            className={`${inputClass} text-center text-2xl tracking-widest`}
          />
          <Button label="Verificar código" onPress={handleVerifyCode} loading={loading} fullWidth />
        </>
      ) : (
        <>
          <Text className="text-4xl mb-3">🔐</Text>
          <Text className={`text-2xl font-bold mb-2 ${textPrimary}`}>Nueva contraseña</Text>
          <Text className={`text-sm mb-8 ${textMuted}`}>Elige una contraseña segura para tu cuenta.</Text>
          <Text className={`text-sm font-medium mb-1 ${textPrimary}`}>Nueva contraseña</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
            secureTextEntry
            className={inputClass}
          />
          <Text className={`text-sm font-medium mb-1 ${textPrimary}`}>Confirmar contraseña</Text>
          <TextInput
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Repite la contraseña"
            placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
            secureTextEntry
            className={inputClass}
          />
          <Button label="Actualizar contraseña" onPress={handleUpdatePassword} loading={loading} fullWidth />
        </>
      )}
    </View>
  );
}
