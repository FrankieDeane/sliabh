import React from 'react';
import { Tabs } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../src/store/themeStore';

type IoniconName = keyof typeof Ionicons.glyphMap;

interface TabIconProps {
  icon: IoniconName;
  iconOutline: IoniconName;
  label: string;
  focused: boolean;
}

function TabIcon({ icon, iconOutline, label, focused }: TabIconProps) {
  const color = focused ? '#22c55e' : '#475569';
  return (
    <View style={styles.iconWrapper}>
      <Ionicons name={focused ? icon : iconOutline} size={22} color={color} />
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
}

export default function TabLayout() {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDark ? '#070b14' : '#ffffff',
          borderTopColor: isDark ? '#1e2d42' : '#e2e8f0',
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 0,
          paddingTop: 0,
        },
        tabBarActiveTintColor: '#22c55e',
        tabBarInactiveTintColor: '#475569',
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="inicio"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              icon="home"
              iconOutline="home-outline"
              label="Inicio"
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="rutas"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              icon="trail-sign"
              iconOutline="trail-sign-outline"
              label="Rutas"
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="planificar"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              icon="map"
              iconOutline="map-outline"
              label="Planificar"
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="mapas"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              icon="location"
              iconOutline="location-outline"
              label="Mapas"
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="contribuir"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              icon="pencil"
              iconOutline="pencil-outline"
              label="Contribuir"
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="asistente"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              icon="chatbubble"
              iconOutline="chatbubble-outline"
              label="IA"
              focused={focused}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
    gap: 3,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
