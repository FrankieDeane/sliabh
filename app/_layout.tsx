import '../global.css';
import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { config } from '@gluestack-ui/themed/config';
import { OllamaProvider } from '../src/ai/OllamaProvider';
import { setAIProvider } from '../src/ai/AIService';
import { useSettingsStore } from '../src/store/settingsStore';

export default function RootLayout() {
  const { ollamaUrl } = useSettingsStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setAIProvider(new OllamaProvider({ baseUrl: ollamaUrl }));
    setReady(true);
  }, [ollamaUrl]);

  if (!ready) return null;

  return (
    <GluestackUIProvider config={config}>
      <StatusBar style="light" backgroundColor="#1c1917" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#1c1917' } }} />
    </GluestackUIProvider>
  );
}
