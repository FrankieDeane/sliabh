// Persistent bottom nav strip shown only on mobile web (viewport < 720 px).
// The tab bar is hidden on web (tabBarStyle: display:none in _layout), so
// this replaces it with a focused 5-link row that matches the native experience.
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useLangStore } from '../../store/langStore';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const LINKS: Array<{ labelEs: string; labelEn: string; href: string; icon: IoniconName; iconActive: IoniconName }> = [
  { labelEs: 'Inicio',      labelEn: 'Home',    href: '/(tabs)/inicio',          icon: 'home-outline',              iconActive: 'home'              },
  { labelEs: 'Rutas',       labelEn: 'Trails',  href: '/(tabs)/rutas',           icon: 'trail-sign-outline',        iconActive: 'trail-sign'        },
  { labelEs: 'Recorridos',  labelEn: 'Hikes',   href: '/(tabs)/mis-recorridos',  icon: 'footsteps-outline',         iconActive: 'footsteps'         },
  { labelEs: 'Mapas',       labelEn: 'Maps',    href: '/(tabs)/mapas',           icon: 'map-outline',               iconActive: 'map'               },
  { labelEs: 'Seguridad',   labelEn: 'Safety',  href: '/(tabs)/supervivencia',   icon: 'shield-checkmark-outline',  iconActive: 'shield-checkmark'  },
];

export function MobileWebNav() {
  const { width } = useWindowDimensions();
  const pathname = usePathname();
  const router = useRouter();
  const { theme } = useThemeStore();
  const { t } = useLangStore();
  const isDark = theme === 'dark';

  // Only render on narrow web viewports
  if (Platform.OS !== 'web' || width >= 720) return null;

  const bg = isDark ? '#070b14' : '#ffffff';
  const border = isDark ? '#1e2d42' : '#e2e8f0';

  return (
    <View style={[styles.bar, { backgroundColor: bg, borderTopColor: border }]}>
      {LINKS.map((link) => {
        const href = link.href.replace('/(tabs)', '');
        const active = pathname === href || pathname.startsWith(href + '/');
        const color = active ? '#22c55e' : isDark ? '#475569' : '#64748b';
        return (
          <TouchableOpacity
            key={link.href}
            style={styles.item}
            onPress={() => router.push(link.href as any)}
            activeOpacity={0.7}
          >
            <Ionicons name={active ? link.iconActive : link.icon} size={22} color={color} />
            <Text style={[styles.label, { color }]} numberOfLines={1}>
              {t(link.labelEs, link.labelEn)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingBottom: 0,
    zIndex: 20,
    // env() for safe-area insets — only set on web where it's CSS
    ...({ paddingBottom: 'env(safe-area-inset-bottom, 0px)' } as object),
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    gap: 3,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
});
