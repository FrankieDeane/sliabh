import '../global.css';
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useThemeStore } from '../src/store/themeStore';
import { useNetworkStore } from '../src/store/networkStore';
import { Platform, View, Text, TouchableOpacity } from 'react-native';
import { WebHeader } from '../src/components/layout/WebHeader';
import { PromoBanner } from '../src/components/ui/PromoBanner';
import { CookieBanner } from '../src/components/ui/CookieBanner';
import { QuickPoll } from '../src/components/ui/QuickPoll';
import { NewsletterPopup } from '../src/components/ui/NewsletterPopup';
import { SiteHead } from '../src/components/ui/SiteHead';
import { injectWebStyles } from '../src/utils/webStyles';
import { supabase } from '../src/services/supabase';
import { syncPendingTracks } from '../src/services/trackSync';
import { InstallPrompt } from '../src/components/offline/InstallPrompt';
import { HikeHost } from '../src/components/hike/HikeHost';
import { MobileWebNav } from '../src/components/layout/MobileWebNav';
/**
 * Side-effect import, and it must stay one.
 *
 * Android restarts this process with no UI to hand over a background GPS fix,
 * and `TaskManager` only accepts a fix for a task that was defined while the
 * bundle loaded. Reaching the definition through the component tree works
 * today only because nothing on that path is lazy — one `React.lazy` on the
 * hike screen and recording with the screen off would break silently, on a
 * mountain, with no error anywhere. Importing it here makes that impossible.
 * On web the file resolves to the no-op browser version.
 */
import '../src/services/backgroundTrack';
import { installErrorReporting, reportError } from '../src/services/errorLog';

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
    // The bundle often runs after `load` has already fired, and a listener
    // added then never runs: the worker was never registering, so nothing was
    // cached and the site did not open offline at all. Register straight away
    // when the document is already done.
    const registerSw = () => { navigator.serviceWorker.register('/sw.js').catch(() => {}); };
    if (document.readyState === 'complete') registerSw();
    else window.addEventListener('load', registerSw);
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
    // A console line reaches nobody: the app is live, the walker is on a
    // trail, and the browser console is on their phone. File it so the crash
    // is visible to us instead of only to them.
    const componentStack = (info as { componentStack?: string })?.componentStack;
    reportError(
      Object.assign(error, {
        stack: `${error.stack ?? ''}${componentStack ? `\n--- component stack ---${componentStack}` : ''}`,
      }),
      'render',
    );
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
          {/* The one thing a walker needs to know when a screen dies mid-walk.
              It is true: every accepted fix reached device storage as it
              arrived, so a crash costs nothing but the reload. */}
          <Text style={{ color: '#94a3b8', fontSize: 12.5, textAlign: 'center', maxWidth: 330, lineHeight: 18 }}>
            Tu recorrido está guardado en el teléfono — no se perdió nada de lo que grabaste.
            El error quedó registrado para que lo arreglemos.
          </Text>
          <Text style={{ color: '#475569', fontSize: 11, textAlign: 'center', maxWidth: 300 }} numberOfLines={3}>
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

/**
 * Flushes hikes recorded while signed out or offline into the account, so the
 * same history shows up on every device the user logs in on.
 */
function TrackSyncWatcher() {
  const online = useNetworkStore((s) => s.isOnline);

  useEffect(() => {
    if (!online) return;
    syncPendingTracks().catch(() => {});
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
        syncPendingTracks().catch(() => {});
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [online]);

  return null;
}

export default function RootLayout() {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  useEffect(() => {
    injectWebStyles();
  }, []);

  useEffect(() => {
    // Catches what no component sees: an exception that escaped the tree and a
    // promise nobody handled. Both are silent by default — the user gets a
    // blank screen and we get nothing at all. Also flushes anything a previous
    // session queued while offline.
    installErrorReporting();
  }, []);

  if (Platform.OS === 'web') {
    return (
      <AppErrorBoundary>
        <View style={{ flex: 1, flexDirection: 'column' }}>
          <SiteHead />
          <NetworkWatcher />
          <TrackSyncWatcher />
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <WebHeader />
          <PromoBanner />
          <View style={{ flex: 1 }}>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: isDark ? '#070b14' : '#f8fafc' },
              }}
            />
          </View>
          <MobileWebNav />
          <CookieBanner />
          <HikeHost />
          <InstallPrompt />
          <QuickPoll />
          <NewsletterPopup />
        </View>
      </AppErrorBoundary>
    );
  }

  return (
    <AppErrorBoundary>
      <NetworkWatcher />
      <TrackSyncWatcher />
      <HikeHost />
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
