import '../global.css';
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useThemeStore } from '../src/store/themeStore';
import { useNetworkStore } from '../src/store/networkStore';
import { Platform, View, Text, TouchableOpacity } from 'react-native';
import { WebHeader } from '../src/components/layout/WebHeader';
import { CookieBanner } from '../src/components/ui/CookieBanner';
import { QuickPoll } from '../src/components/ui/QuickPoll';
import { SiteHead } from '../src/components/ui/SiteHead';
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

// Without a boundary, any uncaught render error unmounts the WHOLE React
// tree and the user sees a silent full-black page (the body background).
// This converts a crash into a visible, actionable screen that also shows
// the actual error message so it can be reported.
class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error('[Sliabh] render crash:', error, info);
  }

  render() {
    if (this.state.error) {
      const msg = String(this.state.error?.message || this.state.error);
      return (
        <View style={{ flex: 1, backgroundColor: '#070b14', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10 }}>
          <Text style={{ fontSize: 34 }}>⛰️</Text>
          <Text style={{ color: '#f0f9ff', fontWeight: '800', fontSize: 16, textAlign: 'center' }}>
            Algo salió mal / Something went wrong
          </Text>
          <Text style={{ color: '#94a3b8', fontSize: 12, textAlign: 'center', maxWidth: 300 }} numberOfLines={4}>
            {msg}
          </Text>
          <TouchableOpacity
            onPress={() => {
              this.setState({ error: null });
              if (Platform.OS === 'web' && typeof window !== 'undefined') window.location.reload();
            }}
            style={{ backgroundColor: '#16a34a', borderRadius: 999, paddingHorizontal: 22, paddingVertical: 10, marginTop: 8 }}
            activeOpacity={0.8}
          >
            <Text style={{ color: '#fff', fontWeight: '700' }}>Reintentar / Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
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
      <AppErrorBoundary>
        <View style={{ flex: 1, flexDirection: 'column' }}>
          <SiteHead />
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
          <QuickPoll />
        </View>
      </AppErrorBoundary>
    );
  }

  return (
    <AppErrorBoundary>
      <NetworkWatcher />
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={isDark ? '#111827' : '#ffffff'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: isDark ? '#111827' : '#f9fafb' },
        }}
      />
    </AppErrorBoundary>
  );
}
