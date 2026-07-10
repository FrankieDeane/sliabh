import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Button } from '../../src/components/ui/Button';
import { useTheme } from '../../src/hooks/useTheme';
import { useAuthStore } from '../../src/store/authStore';
import { signIn } from '../../src/services/supabase';
import { showAlert, normalizeEmail, isValidEmail } from '../../src/utils/alert';

function translateError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('invalid login credentials') || lower.includes('invalid email or password')) {
    return 'Correo o contraseña incorrectos.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Debes confirmar tu correo electrónico antes de iniciar sesión.';
  }
  if (lower.includes('too many requests')) {
    return 'Demasiados intentos. Espera unos minutos antes de intentarlo de nuevo.';
  }
  // NOTE: we deliberately do NOT surface a distinct "no account with that email"
  // message. Distinguishing "wrong password" from "unknown email" is a user
  // enumeration vector (an attacker can probe which emails are registered), so
  // both collapse into the generic "credenciales incorrectas" case below.
  if (lower.includes('network') || lower.includes('fetch')) {
    return 'Error de conexión. Comprueba tu red e inténtalo de nuevo.';
  }
  return 'Ocurrió un error. Inténtalo de nuevo.';
}

export default function LoginScreen() {
  const { isDark } = useTheme();
  const { setUser, setSession } = useAuthStore();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const bg = isDark ? 'bg-stone-950' : 'bg-stone-50';
  const textPrimary = isDark ? 'text-stone-50' : 'text-stone-900';
  const textMuted = isDark ? 'text-stone-400' : 'text-stone-500';
  const inputBg = isDark
    ? 'bg-stone-800 border-stone-700 text-stone-50'
    : 'bg-white border-stone-300 text-stone-900';
  const cardBg = isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200';
  const linkColor = 'text-brand-500';

  async function handleLogin() {
    const cleanEmail = normalizeEmail(email);
    if (!cleanEmail || !password) {
      showAlert('Campos vacíos', 'Por favor ingresa tu correo y contraseña.');
      return;
    }
    if (!isValidEmail(cleanEmail)) {
      showAlert('Correo inválido', 'El formato del correo electrónico no es válido.');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await signIn(cleanEmail, password);
      if (error) {
        showAlert('Error al iniciar sesión', translateError(error.message));
        return;
      }
      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email ?? '',
          display_name: data.user.user_metadata?.display_name,
          avatar_url: data.user.user_metadata?.avatar_url,
        });
      }
      if (data.session) {
        setSession(data.session.access_token);
      }
      router.replace('/(tabs)/inicio');
    } catch (e: any) {
      showAlert('Error', translateError(e?.message ?? 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className={`flex-1 ${bg}`}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back button */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="flex-row items-center gap-1 mb-8 self-start"
          >
            <Text className={`text-base ${linkColor}`}>‹ Volver</Text>
          </TouchableOpacity>

          {/* Logo */}
          <View className="items-center mb-8">
            <Text className="text-6xl mb-3">🏔️</Text>
            <Text className={`text-3xl font-bold ${textPrimary}`}>Sliabh</Text>
            <Text className={`text-sm mt-1 ${textMuted}`}>Explora sin límites</Text>
          </View>

          {/* Form card */}
          <View className={`rounded-3xl border p-6 ${cardBg}`}>
            <Text className={`text-xl font-bold mb-6 ${textPrimary}`}>Iniciar sesión</Text>

            {/* Email */}
            <View className="mb-4">
              <Text className={`text-xs font-semibold mb-1.5 tracking-wide ${textMuted}`}>CORREO ELECTRÓNICO</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="tucorreo@ejemplo.com"
                placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="username"
                className={`rounded-xl border px-4 py-3 text-sm ${inputBg}`}
              />
            </View>

            {/* Password */}
            <View className="mb-6">
              <Text className={`text-xs font-semibold mb-1.5 tracking-wide ${textMuted}`}>CONTRASEÑA</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Tu contraseña"
                placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password"
                textContentType="password"
                className={`rounded-xl border px-4 py-3 text-sm ${inputBg}`}
              />
            </View>

            {/* Login button */}
            <Button
              label="Iniciar sesión"
              onPress={handleLogin}
              loading={loading}
              fullWidth
            />

            {/* Forgot password */}
            <Link href="/(auth)/recuperar" asChild>
              <TouchableOpacity className="items-center mt-4">
                <Text className={`text-sm ${linkColor}`}>¿Olvidaste tu contraseña?</Text>
              </TouchableOpacity>
            </Link>
          </View>

          {/* Register link */}
          <View className="flex-row justify-center items-center gap-1 mt-6">
            <Text className={`text-sm ${textMuted}`}>¿No tienes cuenta?</Text>
            <Link href="/(auth)/registro" asChild>
              <TouchableOpacity>
                <Text className={`text-sm font-semibold ${linkColor}`}>Crear cuenta</Text>
              </TouchableOpacity>
            </Link>
          </View>

          {/* Continue without account */}
          <TouchableOpacity
            onPress={() => router.replace('/(tabs)/inicio')}
            className="items-center mt-4"
          >
            <Text className={`text-sm ${textMuted}`}>Continuar sin cuenta</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
