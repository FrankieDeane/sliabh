import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../src/components/ui/Button';
import { useTheme } from '../../src/hooks/useTheme';
import { supabase, updatePassword } from '../../src/services/supabase';
import { showAlert } from '../../src/utils/alert';

/**
 * Landing screen for the password-reset link. `resetPasswordForEmail` in
 * sendRecoveryCode() points its `redirectTo` here; on web, the Supabase client
 * (detectSessionInUrl: true) exchanges the token in the URL for a short-lived
 * recovery session as the page loads. We wait for that session, then let the
 * user set a new password via updateUser().
 */
export default function NuevaClaveScreen() {
  const { isDark } = useTheme();
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const bg = isDark ? 'bg-gray-900' : 'bg-stone-50';
  const textPrimary = isDark ? 'text-stone-50' : 'text-stone-900';
  const textMuted = isDark ? 'text-stone-400' : 'text-stone-500';
  const inputClass = `border rounded-xl px-4 py-3 mb-4 ${isDark ? 'bg-stone-800 border-stone-600 text-stone-100' : 'bg-white border-stone-300 text-stone-900'}`;

  useEffect(() => {
    let settled = false;

    // The recovery session may already be present (client parsed the URL before
    // this screen mounted) or arrive momentarily via the auth event.
    supabase.auth.getSession().then(({ data }) => {
      if (!settled && data.session) {
        settled = true;
        setReady(true);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (settled) return;
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        settled = true;
        setReady(true);
      }
    });

    // If no recovery session shows up, the link was invalid/expired or opened
    // on a different device than the one that requested it.
    const timer = setTimeout(() => {
      if (!settled) setInvalid(true);
    }, 6000);

    return () => {
      sub.subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const handleUpdate = async () => {
    if (password.length < 6) {
      showAlert('Error', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      showAlert('Error', 'Las contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    const { error } = await updatePassword(password);
    setLoading(false);
    if (error) {
      showAlert('Error', error.message);
    } else {
      // Drop the temporary recovery session so the user logs in fresh.
      await supabase.auth.signOut();
      setDone(true);
    }
  };

  if (done) {
    return (
      <View className={`flex-1 items-center justify-center px-6 ${bg}`}>
        <Text className="text-5xl mb-4">✅</Text>
        <Text className={`text-2xl font-bold mb-2 ${textPrimary}`}>¡Contraseña actualizada!</Text>
        <Text className={`text-center text-sm mb-8 ${textMuted}`}>
          Tu contraseña fue restablecida. Ya podés iniciar sesión.
        </Text>
        <Button label="Iniciar sesión" onPress={() => router.replace('/(auth)/login' as any)} fullWidth />
      </View>
    );
  }

  if (invalid) {
    return (
      <View className={`flex-1 items-center justify-center px-6 ${bg}`}>
        <Text className="text-5xl mb-4">⚠️</Text>
        <Text className={`text-2xl font-bold mb-2 ${textPrimary}`}>Enlace inválido o vencido</Text>
        <Text className={`text-center text-sm mb-8 ${textMuted}`}>
          El enlace expiró o se abrió en un dispositivo distinto al que lo pidió.
          Solicitá uno nuevo desde "¿Olvidaste tu contraseña?".
        </Text>
        <Button label="Pedir un nuevo enlace" onPress={() => router.replace('/(auth)/recuperar' as any)} fullWidth />
      </View>
    );
  }

  if (!ready) {
    return (
      <View className={`flex-1 items-center justify-center px-6 ${bg}`}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text className={`text-sm mt-4 ${textMuted}`}>Validando el enlace…</Text>
      </View>
    );
  }

  return (
    <View className={`flex-1 px-6 pt-16 ${bg}`}>
      <TouchableOpacity onPress={() => router.replace('/(auth)/login' as any)} className="mb-8">
        <Text className={textMuted}>‹ Volver</Text>
      </TouchableOpacity>

      <Text className="text-4xl mb-3">🔐</Text>
      <Text className={`text-2xl font-bold mb-2 ${textPrimary}`}>Nueva contraseña</Text>
      <Text className={`text-sm mb-8 ${textMuted}`}>Elegí una contraseña segura para tu cuenta.</Text>

      <Text className={`text-sm font-medium mb-1 ${textPrimary}`}>Nueva contraseña</Text>
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Mínimo 6 caracteres"
        placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
        secureTextEntry
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        className={inputClass}
      />
      <Text className={`text-sm font-medium mb-1 ${textPrimary}`}>Confirmar contraseña</Text>
      <TextInput
        value={confirm}
        onChangeText={setConfirm}
        placeholder="Repite la contraseña"
        placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
        secureTextEntry
        autoCapitalize="none"
        className={inputClass}
      />
      <Button label="Actualizar contraseña" onPress={handleUpdate} loading={loading} fullWidth />
    </View>
  );
}
