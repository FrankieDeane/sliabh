import '../global.css';
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { OllamaProvider } from '../src/ai/OllamaProvider';
import { setAIProvider } from '../src/ai/AIService';
import { useSettingsStore } from '../src/store/settingsStore';
import { useThemeStore } from '../src/store/themeStore';
import { useNetworkStore } from '../src/store/networkStore';
import { Platform, View } from 'react-native';
import { WebHeader } from '../src/components/layout/WebHeader';
import { WebFooter } from '../src/components/layout/WebFooter';

function NetworkWatcher() {
  const setOnline = useNetworkStore((s) => s.setOnline);

  useEffect(() => {
    // Web: use navigator.onLine + events
    if (Platform.OS === 'web') {
      const handleOnline = () => setOnline(true);
      const handleOffline = () => setOnline(false);
      setOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }

    // Native: use @react-native-community/netinfo
    let unsubscribe: (() => void) | undefined;
    (async () => {
      try {
        const NetInfo = require('@react-native-community/netinfo');
        const state = await NetInfo.default.fetch();
        setOnline(state.isConnected ?? true);
        unsubscribe = NetInfo.default.addEventListener((s: { isConnected: boolean | null }) => {
          setOnline(s.isConnected ?? true);
        });
      } catch {
        // netinfo unavailable — assume online
        setOnline(true);
      }
    })();

    return () => unsubscribe?.();
  }, [setOnline]);

  return null;
}

export default function RootLayout() {
  const { ollamaUrl } = useSettingsStore();
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  useEffect(() => {
    setAIProvider(new OllamaProvider({ baseUrl: ollamaUrl }));
  }, [ollamaUrl]);

  if (Platform.OS === 'web') {
    return (
      <View style={{ flex: 1, flexDirection: 'column' }}>
        <NetworkWatcher />
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <WebHeader />
        <View style={{ flex: 1 }}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: isDark ? '#070b14' : '#f8fafc' },
            }}
          />
        </View>
        <WebFooter />
      </View>
    );
  }

  return (
    <>
      <NetworkWatcher />
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={isDark ? '#111827' : '#ffffff'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: isDark ? '#111827' : '#f9fafb' },
        }}
      />
    </>
  );
}
