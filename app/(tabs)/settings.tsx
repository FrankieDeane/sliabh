import React from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSettingsStore } from '../../src/store/settingsStore';

export default function SettingsScreen() {
  const { ollamaUrl, setOllamaUrl } = useSettingsStore();

  return (
    <SafeAreaView className="flex-1 bg-stone-900 px-4">
      <Text className="text-white text-lg font-semibold mt-6 mb-4">Settings</Text>

      <Text className="text-stone-400 text-xs mb-1 uppercase tracking-widest">AI Provider</Text>
      <View className="bg-stone-800 rounded-xl px-4 py-3 mb-4">
        <Text className="text-white text-sm">Ollama (development)</Text>
        <Text className="text-stone-500 text-xs mt-0.5">
          On-device Gemma via MediaPipe — coming in M2
        </Text>
      </View>

      <Text className="text-stone-400 text-xs mb-1 uppercase tracking-widest">Ollama URL</Text>
      <TextInput
        className="bg-stone-800 text-white rounded-xl px-4 py-3 text-sm mb-4"
        value={ollamaUrl}
        onChangeText={setOllamaUrl}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <Text className="text-stone-400 text-xs mb-1 uppercase tracking-widest">Active Pack</Text>
      <View className="bg-stone-800 rounded-xl px-4 py-3">
        <Text className="text-white text-sm">Torres del Paine</Text>
        <Text className="text-stone-500 text-xs mt-0.5">More regions — coming in M2</Text>
      </View>
    </SafeAreaView>
  );
}
