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
import { signUp, upsertProfile } from '../../src/services/supabase';
import { showAlert, normalizeEmail, isValidEmail } from '../../src/utils/alert';

function translateError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('user already registered') || lower.includes('already been registered')) {
    return 'Ya existe una cuenta con ese correo. Prueba a iniciar sesión.';
  }
  if (lower.includes('password should be')) {
    return 'La contraseña debe tener al menos 6 caracteres.';
  }
  if (lower.includes('invalid email')) {
    return 'El formato del correo electrónico no es válido.';
  }
  if (lower.includes('network') || lower.includes('fetch')) {
    return 'Error de conexión. Comprueba tu red e inténtalo de nuevo.';
  }
  return 'Ocurrió un error al crear la cuenta. Inténtalo de nuevo.';
}

export default function RegistroScreen() {
  const { isDark } = useTheme();
  const router = useRouter();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const bg = isDark ? 'bg-stone-950' : 'bg-stone-50';
  const textPrimary = isDark ? 'text-stone-50' : 'text-stone-900';
  const textMuted = isDark ? 'text-stone-400' : 'text-stone-500';
  const inputBg = isDark
    ? 'bg-stone-800 border-stone-700 text-stone-50'
    : 'bg-white border-stone-300 text-stone-900';
  const cardBg = isDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200';
  const linkColor = 'text-brand-500';
  const successBg = isDark ? 'bg-brand-950 border-brand-800' : 'bg-brand-50 border-brand-200';

  async function handleRegister() {
    const cleanEmail = normalizeEmail(email);
    if (!cleanEmail || !password.trim() || !displayName.trim()) {
      showAlert('Campos vacíos', 'Por favor completa todos los campos.');
      return;
    }
    if (!isValidEmail(cleanEmail)) {
      showAlert('Correo inválido', 'El formato del correo electrónico no es válido.');
      return;
    }
    if (password !== confirmPassword) {
      showAlert('Contraseñas distintas', 'Las contraseñas no coinciden. Vuelve a escribirlas.');
      return;
    }
    if (password.length < 6) {
      showAlert('Contraseña corta', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await signUp(cleanEmail, password);
      if (error) {
        showAlert('Error al crear cuenta', translateError(error.message));
        return;
      }
      // Supabase hides "email already registered" for security: when an account
      // with this email already exists, it returns a user with an empty
      // `identities` array (and no error) instead of creating one. Detect that
      // and tell the user to sign in rather than faking a success screen.
      if (data.user && (data.user.identities?.length ?? 0) === 0) {
        showAlert(
          'Cuenta existente',
          'Ya existe una cuenta con ese correo. Iniciá sesión con tu contraseña o recuperala si la olvidaste.',
        );
        return;
      }
      if (data.user) {
        await upsertProfile(data.user.id, { display_name: displayName.trim() });
      }
      setSuccess(true);
    } catch (e: any) {
      showAlert('Error', translateError(e?.message ?? 'Error desconocido'));
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <SafeAreaView className={`flex-1 ${bg}`}>
        <View className="flex-1 items-center justify-center p-6">
          <View className={`rounded-3xl border p-8 items-center ${successBg}`}>
            <Text className="text-5xl mb-4">✉️</Text>
            <Text className={`text-xl font-bold text-center mb-3 ${textPrimary}`}>
              ¡Cuenta creada!
            </Text>
            <Text className={`text-sm text-center leading-6 mb-6 ${textMuted}`}>
              Hemos enviado un correo de verificación a{'\n'}
              <Text className="font-semibold text-brand-500">{email.trim()}</Text>
              {'\n\n'}
              Por favor revisa tu bandeja de entrada y haz clic en el enlace para activar tu cuenta.
            </Text>
            <Button
              label="Ir a iniciar sesión"
              onPress={() => router.replace('/(auth)/login')}
              fullWidth
            />
          </View>
        </View>
      </SafeAreaView>
    );
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
            <Text className={`text-sm mt-1 ${textMuted}`}>Únete a la comunidad</Text>
          </View>

          {/* Form card */}
          <View className={`rounded-3xl border p-6 ${cardBg}`}>
            <Text className={`text-xl font-bold mb-6 ${textPrimary}`}>Crear cuenta</Text>

            {/* Display name */}
            <View className="mb-4">
              <Text className={`text-xs font-semibold mb-1.5 tracking-wide ${textMuted}`}>NOMBRE DE USUARIO</Text>
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="¿Cómo te llamas?"
                placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                autoCapitalize="words"
                className={`rounded-xl border px-4 py-3 text-sm ${inputBg}`}
              />
            </View>

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
            <View className="mb-4">
              <Text className={`text-xs font-semibold mb-1.5 tracking-wide ${textMuted}`}>CONTRASEÑA</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="newPassword"
                className={`rounded-xl border px-4 py-3 text-sm ${inputBg}`}
              />
            </View>

            {/* Confirm password */}
            <View className="mb-6">
              <Text className={`text-xs font-semibold mb-1.5 tracking-wide ${textMuted}`}>CONFIRMAR CONTRASEÑA</Text>
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Repite la contraseña"
                placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
                secureTextEntry
                className={`rounded-xl border px-4 py-3 text-sm ${inputBg}`}
              />
              {confirmPassword.length > 0 && password !== confirmPassword && (
                <Text className="text-red-400 text-xs mt-1">Las contraseñas no coinciden</Text>
              )}
            </View>

            <Button
              label="Crear cuenta"
              onPress={handleRegister}
              loading={loading}
              fullWidth
            />
          </View>

          {/* Login link */}
          <View className="flex-row justify-center items-center gap-1 mt-6">
            <Text className={`text-sm ${textMuted}`}>¿Ya tienes cuenta?</Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text className={`text-sm font-semibold ${linkColor}`}>Iniciar sesión</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
