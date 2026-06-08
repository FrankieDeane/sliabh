import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettingsStore } from '../../src/store/settingsStore';
import { loadPack } from '../../src/knowledge/KnowledgeLoader';
import { RouteCard } from '../../src/components/RouteCard';
import { RefugeCard } from '../../src/components/RefugeCard';
import { CampgroundCard } from '../../src/components/CampgroundCard';
import type { KnowledgePack } from '../../src/knowledge/types';

type Tab = 'routes' | 'refuges' | 'camps';

const TABS: { key: Tab; label: string }[] = [
  { key: 'routes', label: 'Routes' },
  { key: 'refuges', label: 'Refuges' },
  { key: 'camps', label: 'Camps' },
];

export default function ExploreScreen() {
  const { activePack } = useSettingsStore();
  const [pack, setPack] = useState<KnowledgePack | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('routes');

  useEffect(() => {
    loadPack(activePack).then(setPack).catch(console.error);
  }, [activePack]);

  if (!pack) {
    return (
      <SafeAreaView className="flex-1 bg-stone-900 items-center justify-center">
        <Text className="text-stone-500 text-sm">Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-stone-900">
      <View className="px-4 py-3 border-b border-stone-800">
        <Text className="text-white font-semibold text-base">{pack.meta.name}</Text>
        <Text className="text-stone-400 text-xs">{pack.meta.country} · {pack.meta.region}</Text>
      </View>

      {/* Tab bar */}
      <View className="flex-row px-4 py-2 gap-2">
        {TABS.map((t) => (
          <Pressable
            key={t.key}
            onPress={() => setActiveTab(t.key)}
            className={`px-4 py-1.5 rounded-full ${
              activeTab === t.key ? 'bg-brand-700' : 'bg-stone-800'
            }`}
          >
            <Text
              className={`text-sm ${activeTab === t.key ? 'text-white font-medium' : 'text-stone-400'}`}
            >
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingTop: 8, paddingBottom: 24 }}>
        {activeTab === 'routes' &&
          pack.routes.map((r) => <RouteCard key={r.id} route={r} />)}
        {activeTab === 'refuges' &&
          pack.refuges.map((r) => <RefugeCard key={r.id} refuge={r} />)}
        {activeTab === 'camps' &&
          pack.campgrounds.map((c) => <CampgroundCard key={c.id} camp={c} />)}
      </ScrollView>
    </SafeAreaView>
  );
}
