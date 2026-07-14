import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button } from '../../src/components/ui/Button';
import { useTheme } from '../../src/hooks/useTheme';
import { useLangStore } from '../../src/store/langStore';
import { useAuthStore } from '../../src/store/authStore';
import { verifySignupCode, resendSignupCode, upsertProfile, sendAccountEmail } from '../../src/services/supabase';
import { showAlert } from '../../src/utils/alert';

export default function VerificarScreen() {
  const { isDark } = useTheme();
  const router = useRouter();
  const { t } = useLangStore();
  const { setUser, setSession } = useAuthStore();
  const { email, name } = useLocalSearchParams<{ email: string; name?: string }>();

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const bg = isDark ? 'bg-gray-900' : 'bg-stone-50';
  const textPrimary = isDark ? 'text-stone-50' : 'text-stone-900';
  const textMuted = isDark ? 'text-stone-400' : 'text-stone-500';
  const linkColor = 'text-brand-500';
  const inputClass = `border rounded-xl px-4 py-3 mb-4 ${
    isDark ? 'bg-stone-800 border-stone-600 text-stone-100' : 'bg-white border-stone-300 text-stone-900'
  }`;

  async function handleVerify() {
    if (code.length !== 6) {
      showAlert(t('Código incompleto', 'Incomplete code'), t('El código debe tener 6 dígitos.', 'The code must be 6 digits.'));
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await verifySignupCode(email ?? '', code);
      if (error) {
        showAlert(
          t('Código inválido', 'Invalid code'),
          t('El código no es correcto o expiró. Pedí uno nuevo.', 'The code is wrong or expired. Request a new one.'),
        );
        return;
      }
      // Account confirmed — a session is now active. Persist the profile name
      // (also stashed in user_metadata by signUp) and hydrate the auth store.
      if (data.user) {
        const displayName =
          (typeof name === 'string' && name.trim()) ||
          (data.user.user_metadata?.display_name as string | undefined) ||
          '';
        if (displayName) {
          try { await upsertProfile(data.user.id, { display_name: displayName }); } catch { /* non-fatal */ }
        }
        setUser({
          id: data.user.id,
          email: data.user.email ?? '',
          display_name: displayName || undefined,
          avatar_url: data.user.user_metadata?.avatar_url,
        });
      }
      if (data.session) setSession(data.session.access_token);
      // Fire the welcome email (best-effort — never block navigation on it).
      sendAccountEmail('welcome').catch(() => {});
      router.replace('/(tabs)/inicio');
    } catch (e: any) {
      showAlert(t('Error', 'Error'), t('Ocurrió un error. Intentá de nuevo.', 'Something went wrong. Try again.'));
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    try {
      const { error } = await resendSignupCode(email ?? '');
      if (error) {
        showAlert(t('No se pudo reenviar', "Couldn't resend"), t('Esperá un momento e intentá otra vez.', 'Wait a moment and try again.'));
      } else {
        showAlert(t('Código reenviado', 'Code resent'), t('Revisá tu correo nuevamente.', 'Check your email again.'));
      }
    } finally {
      setResending(false);
    }
  }

  return (
    <View className={`flex-1 px-6 pt-16 ${bg}`}>
      <TouchableOpacity onPress={() => router.back()} className="mb-8">
        <Text className={textMuted}>‹ {t('Volver', 'Back')}</Text>
      </TouchableOpacity>

      <Text className="text-4xl mb-3">📩</Text>
      <Text className={`text-2xl font-bold mb-2 ${textPrimary}`}>{t('Verificá tu correo', 'Verify your email')}</Text>
      <Text className={`text-sm mb-8 leading-5 ${textMuted}`}>
        {t('Enviamos un código de 6 dígitos a', 'We sent a 6-digit code to')}{'\n'}
        <Text className={`font-semibold ${textPrimary}`}>{email}</Text>
      </Text>

      <Text className={`text-sm font-medium mb-1 ${textPrimary}`}>{t('Código de verificación', 'Verification code')}</Text>
      <TextInput
        value={code}
        onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
        placeholder="000000"
        placeholderTextColor={isDark ? '#6b7280' : '#9ca3af'}
        keyboardType="number-pad"
        maxLength={6}
        className={`${inputClass} text-center text-2xl tracking-widest`}
      />
      <Button label={t('Verificar y entrar', 'Verify & continue')} onPress={handleVerify} loading={loading} fullWidth />

      <TouchableOpacity className="items-center mt-6" onPress={handleResend} disabled={resending}>
        <Text className={`text-sm ${linkColor}`}>
          {resending ? t('Reenviando…', 'Resending…') : t('¿No te llegó? Reenviar código', "Didn't get it? Resend code")}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
