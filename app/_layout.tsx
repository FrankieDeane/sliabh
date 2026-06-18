import '../global.css';
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useThemeStore } from '../src/store/themeStore';
import { useNetworkStore } from '../src/store/networkStore';
import { Platform, View } from 'react-native';
import { WebHeader } from '../src/components/layout/WebHeader';
import { CookieBanner } from '../src/components/ui/CookieBanner';
import { injectWebStyles } from '../src/utils/webStyles';

// Web bootstrap: PWA head tags + service worker. web.output "single" ignores
// app/+html.tsx, so these must be injected at runtime.
if (Platform.OS === 'web' && typeof document !== 'undefined') {
  if (!document.querySelector('link[rel="manifest"]')) {
    const manifest = document.createElement('link');
    manifest.rel = 'manifest';
    manifest.href = '/manifest.json';
    document.head.appendChild(manifest);
  }
  if (!document.querySelector('link[rel="icon"]')) {
    const icon = document.createElement('link');
    icon.rel = 'icon';
    icon.type = 'image/png';
    icon.href = '/favicon.png';
    document.head.appendChild(icon);
  }
  document.title = 'Sliabh — Explora la montaña';
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
  }
}

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
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  useEffect(() => {
    injectWebStyles();
  }, []);

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
        <CookieBanner />
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
