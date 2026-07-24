import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useWindowDimensions,
  Modal,
  ScrollView,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useLangStore } from '../../store/langStore';
import { LOGO_URI } from '../../constants/logo';
import { deleteAccount, signOut as supabaseSignOut } from '../../services/supabase';
import { showAlert, showConfirm } from '../../utils/alert';

const MAX_CONTENT = 1200;

function useScrolled() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);
  return scrolled;
}

export function WebHeader() {
  if (Platform.OS !== 'web') return null;

  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useAuthStore();
  const { theme, toggle: toggleTheme } = useThemeStore();
  const { lang, setLang, t } = useLangStore();
  const isDark = theme === 'dark';
  const { width } = useWindowDimensions();
  const scrolled = useScrolled();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Terminates the real Supabase session (not just the local UI state) —
  // signOut() alone only cleared the Zustand store, leaving the actual
  // auth session alive so any Supabase call could still succeed as that user.
  async function handleSignOut() {
    try {
      await supabaseSignOut();
    } catch {
      // best-effort — still clear local state below even if this fails
    }
    signOut();
  }

  function handleDeleteAccount() {
    showConfirm({
      title: t('Eliminar cuenta', 'Delete account'),
      message: t(
        'Se eliminará tu cuenta y todos tus datos (perfil, aportes, reportes y caminatas) de forma permanente. Esta acción no se puede deshacer.',
        'Your account and all your data (profile, contributions, reports and hikes) will be permanently deleted. This action cannot be undone.',
      ),
      confirmLabel: t('Eliminar', 'Delete'),
      cancelLabel: t('Cancelar', 'Cancel'),
      destructive: true,
      onConfirm: async () => {
        setDeletingAccount(true);
        try {
          const { error } = await deleteAccount();
          if (error) {
            showAlert(
              t('Error', 'Error'),
              t('No se pudo eliminar la cuenta. Intentá de nuevo.', "Couldn't delete the account. Try again."),
            );
            return;
          }
          setDrawerOpen(false);
          await handleSignOut();
          router.replace('/(tabs)/inicio');
        } finally {
          setDeletingAccount(false);
        }
      },
    });
  }

  const NAV = [
    { labelEs: 'Inicio', labelEn: 'Home', href: '/(tabs)/inicio' as const, icon: 'home-outline' as const, scrollTo: null as string | null },
    { labelEs: 'Rutas', labelEn: 'Trails', href: '/(tabs)/rutas' as const, icon: 'trail-sign-outline' as const, scrollTo: null as string | null },
    { labelEs: 'Mapas', labelEn: 'Maps', href: '/(tabs)/mapas' as const, icon: 'map-outline' as const, scrollTo: null as string | null },
    { labelEs: 'Planificar', labelEn: 'Plan', href: '/(tabs)/planificar' as const, icon: 'map-outline' as const, scrollTo: null as string | null },
    { labelEs: 'FAQ', labelEn: 'FAQ', href: '/(tabs)/faq' as const, icon: 'chatbubble-outline' as const, scrollTo: null as string | null },
    { labelEs: 'Supervivencia', labelEn: 'Survival', href: '/(tabs)/supervivencia' as const, icon: 'shield-checkmark-outline' as const, scrollTo: null as string | null },
  ];

  const c = isDark
    ? {
        bg: scrolled ? 'rgba(7,11,20,0.92)' : '#070b14',
        border: scrolled ? 'rgba(30,45,66,0.6)' : '#1e2d42',
        text: '#f0f9ff',
        muted: '#64748b',
        surface: '#0f1724',
        drawerBg: '#0a1220',
      }
    : {
        bg: scrolled ? 'rgba(255,255,255,0.92)' : '#ffffff',
        border: scrolled ? 'rgba(226,232,240,0.6)' : '#e2e8f0',
        text: '#0f172a',
        muted: '#64748b',
        surface: '#f8fafc',
        drawerBg: '#ffffff',
      };

  const contentW = Math.min(width, MAX_CONTENT);
  const sidePad = Math.max(16, (width - contentW) / 2);
  const isCompact = width < 720;

  function navigate(href: string, scrollTo?: string | null) {
    setDrawerOpen(false);
    if (scrollTo && typeof window !== 'undefined') {
      if (pathname.includes('/inicio')) {
        const el = document.getElementById(scrollTo);
        if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); return; }
      }
      router.push(href as any);
      setTimeout(() => {
        const el = document.getElementById(scrollTo);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 400);
      return;
    }
    router.push(href as any);
  }

  return (
    <>
      <View
        style={[styles.bar, { backgroundColor: c.bg, borderBottomColor: c.border }]}
        {...(scrolled ? ({ 'data-header-glass': true } as any) : {})}
      >
        <View style={[styles.inner, { paddingHorizontal: sidePad }]}>
          {/* Logo + wordmark */}
          <TouchableOpacity
            style={styles.brand}
            onPress={() => navigate('/(tabs)/inicio')}
            activeOpacity={0.8}
          >
            <Image source={{ uri: LOGO_URI }} style={styles.logo} resizeMode="contain" />
            {!isCompact && (
              <View>
                <Text style={[styles.brandName, { color: c.text }]}>Sliabh</Text>
                <Text style={[styles.brandSub, { color: c.muted }]}>Argaelic</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Desktop nav links */}
          {!isCompact && (
            <View style={styles.nav}>
              {NAV.map((n) => {
                const active = !n.scrollTo && pathname.includes(n.href.replace('/(tabs)', ''));
                return (
                  <TouchableOpacity
                    key={n.labelEs}
                    onPress={() => navigate(n.href, n.scrollTo)}
                    style={styles.navItem}
                    activeOpacity={0.7}
                    {...({ 'data-nav-link': true } as any)}
                  >
                    <Text style={[styles.navLabel, { color: active ? '#22c55e' : c.muted }, active && styles.navLabelActive]}>
                      {t(n.labelEs, n.labelEn)}
                    </Text>
                    {active && <View style={styles.navDot} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* Right controls */}
          <View style={styles.right}>
            {/* Language selector */}
            <View style={[styles.langRow, { borderColor: c.border }]}>
              <TouchableOpacity onPress={() => setLang('es')} style={[styles.langBtn, lang === 'es' && styles.langBtnActive]} activeOpacity={0.8}>
                <Text style={[styles.langBtnTxt, { color: lang === 'es' ? '#fff' : c.muted }]}>ES</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setLang('en')} style={[styles.langBtn, lang === 'en' && styles.langBtnActive]} activeOpacity={0.8}>
                <Text style={[styles.langBtnTxt, { color: lang === 'en' ? '#fff' : c.muted }]}>EN</Text>
              </TouchableOpacity>
            </View>

            {/* Theme toggle */}
            <TouchableOpacity onPress={toggleTheme} style={[styles.iconBtn, { borderColor: c.border }]} activeOpacity={0.8}>
              <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={16} color={c.muted} />
            </TouchableOpacity>

            {/* Mobile hamburger */}
            {isCompact && (
              <TouchableOpacity
                onPress={() => setDrawerOpen(true)}
                style={[styles.iconBtn, { borderColor: c.border }]}
                activeOpacity={0.8}
                accessibilityLabel="Open menu"
              >
                <Ionicons name="menu" size={20} color={c.text} />
              </TouchableOpacity>
            )}

            {/* Desktop: user / login */}
            {!isCompact && (
              user ? (
                <View style={styles.userRow}>
                  <TouchableOpacity onPress={handleSignOut} style={[styles.loginBtn, { borderColor: c.border }]} activeOpacity={0.8}>
                    <Ionicons name="log-out-outline" size={15} color={c.muted} />
                    <Text style={[styles.loginBtnTxt, { color: c.muted }]}>{t('Salir', 'Sign out')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleDeleteAccount}
                    disabled={deletingAccount}
                    style={[styles.deleteAccountBtn, { opacity: deletingAccount ? 0.6 : 1 }]}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.deleteAccountTxt}>
                      {deletingAccount ? t('Eliminando…', 'Deleting…') : t('Eliminar cuenta', 'Delete account')}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/(auth)/login')} activeOpacity={0.85}>
                  <Ionicons name="person-outline" size={15} color="#22c55e" />
                  <Text style={styles.loginBtnTxt}>{t('Iniciar sesión', 'Sign in')}</Text>
                </TouchableOpacity>
              )
            )}
          </View>
        </View>
      </View>

      {/* Mobile drawer */}
      {isCompact && (
        <Modal
          visible={drawerOpen}
          animationType="fade"
          transparent
          onRequestClose={() => setDrawerOpen(false)}
        >
          <TouchableOpacity
            style={styles.drawerBackdrop}
            activeOpacity={1}
            onPress={() => setDrawerOpen(false)}
          >
            <View
              style={[styles.drawer, { backgroundColor: c.drawerBg, borderRightColor: c.border }]}
              {...({ onClick: (e: any) => e.stopPropagation() } as any)}
            >
              {/* Drawer header */}
              <View style={[styles.drawerHeader, { borderBottomColor: c.border }]}>
                <Image source={{ uri: LOGO_URI }} style={styles.drawerLogo} resizeMode="contain" />
                <Text style={[styles.drawerBrand, { color: c.text }]}>Sliabh</Text>
                <TouchableOpacity onPress={() => setDrawerOpen(false)} style={styles.drawerClose} activeOpacity={0.7}>
                  <Ionicons name="close" size={22} color={c.muted} />
                </TouchableOpacity>
              </View>

              {/* Nav items */}
              <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.drawerNav}>
                {NAV.map((n) => {
                  const active = !n.scrollTo && pathname.includes(n.href.replace('/(tabs)', ''));
                  return (
                    <TouchableOpacity
                      key={n.labelEs}
                      style={[styles.drawerItem, active && { backgroundColor: isDark ? 'rgba(34,197,94,0.08)' : 'rgba(22,163,74,0.07)' }]}
                      onPress={() => navigate(n.href, n.scrollTo)}
                      activeOpacity={0.75}
                    >
                      <View style={[styles.drawerItemIcon, { backgroundColor: active ? 'rgba(34,197,94,0.15)' : isDark ? '#162035' : '#f1f5f9' }]}>
                        <Ionicons name={n.icon} size={18} color={active ? '#22c55e' : c.muted} />
                      </View>
                      <Text style={[styles.drawerItemLabel, { color: active ? '#22c55e' : c.text }]}>
                        {t(n.labelEs, n.labelEn)}
                      </Text>
                      {active && <Ionicons name="chevron-forward" size={14} color="#22c55e" style={{ marginLeft: 'auto' }} />}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Drawer footer */}
              <View style={[styles.drawerFooter, { borderTopColor: c.border }]}>
                {user ? (
                  <>
                    <TouchableOpacity onPress={() => { setDrawerOpen(false); handleSignOut(); }} style={styles.drawerFooterBtn}>
                      <Ionicons name="log-out-outline" size={16} color={c.muted} />
                      <Text style={[styles.drawerFooterTxt, { color: c.muted }]}>{t('Cerrar sesión', 'Sign out')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleDeleteAccount}
                      disabled={deletingAccount}
                      style={[styles.drawerFooterBtn, { opacity: deletingAccount ? 0.6 : 1 }]}
                    >
                      <Ionicons name="trash-outline" size={16} color="#ef4444" />
                      <Text style={[styles.drawerFooterTxt, { color: '#ef4444' }]}>
                        {deletingAccount ? t('Eliminando…', 'Deleting…') : t('Eliminar cuenta', 'Delete account')}
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity onPress={() => navigate('/(auth)/login')} style={styles.drawerFooterBtn}>
                    <Ionicons name="person-outline" size={16} color="#22c55e" />
                    <Text style={[styles.drawerFooterTxt, { color: '#22c55e' }]}>{t('Iniciar sesión', 'Sign in')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    width: '100%',
    borderBottomWidth: 1,
    zIndex: 100,
    transition: 'background-color 0.3s ease, border-color 0.3s ease' as any,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 58,
    gap: 12,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  brandName: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
    lineHeight: 18,
  },
  brandSub: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  nav: {
    flexDirection: 'row',
    flex: 1,
    gap: 4,
    justifyContent: 'center',
  },
  navItem: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 3,
  },
  navLabel: {
    fontSize: 13,
    fontWeight: '600',
    transition: 'color 0.18s ease' as any,
  },
  navLabelActive: {
    color: '#22c55e',
  },
  navDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#22c55e',
  },
  right: {
    flexShrink: 0,
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  langRow: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 999,
    overflow: 'hidden',
  },
  langBtn: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    transition: 'background-color 0.18s ease' as any,
  },
  langBtnActive: {
    backgroundColor: '#16a34a',
  },
  langBtnTxt: {
    fontSize: 11,
    fontWeight: '700',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'border-color 0.18s ease' as any,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.5)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    transition: 'background-color 0.18s ease' as any,
  },
  loginBtnTxt: {
    fontSize: 13,
    fontWeight: '700',
    color: '#22c55e',
  },
  deleteAccountBtn: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  deleteAccountTxt: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ef4444',
  },
  // Drawer
  drawerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    flexDirection: 'row',
  },
  drawer: {
    width: 280,
    height: '100%',
    borderRightWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  drawerLogo: {
    width: 36,
    height: 36,
  },
  drawerBrand: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
    flex: 1,
  },
  drawerClose: {
    padding: 4,
  },
  drawerNav: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 4,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 13,
    borderRadius: 12,
  },
  drawerItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerItemLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  drawerFooter: {
    borderTopWidth: 1,
    padding: 16,
  },
  drawerFooterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  drawerFooterTxt: {
    fontSize: 14,
    fontWeight: '600',
  },
});
