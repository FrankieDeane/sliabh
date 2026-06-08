import React from 'react';
import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { useThemeStore } from '../../src/store/themeStore';

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View className="items-center pt-1">
      <Text className="text-xl">{emoji}</Text>
      <Text className={`text-xs mt-0.5 ${focused ? 'text-brand-500' : 'text-stone-500'}`}>
        {label}
      </Text>
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
          backgroundColor: isDark ? '#111827' : '#ffffff',
          borderTopColor: isDark ? '#1f2937' : '#e5e7eb',
          paddingBottom: 6,
          height: 64,
        },
        tabBarActiveTintColor: '#22c55e',
        tabBarInactiveTintColor: '#6b7280',
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="inicio"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🏔️" label="Inicio" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="planificar"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🗺️" label="Planificar" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="mapas"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📍" label="Mapas" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="contribuir"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="✏️" label="Contribuir" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
