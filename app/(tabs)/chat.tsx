import React, { useEffect, useRef, useState } from 'react';
import { View, FlatList, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useChatStore } from '../../src/store/chatStore';
import { useSettingsStore } from '../../src/store/settingsStore';
import { ChatBubble } from '../../src/components/ChatBubble';
import { ChatInput } from '../../src/components/ChatInput';
import { SafetyDisclaimer } from '../../src/components/SafetyDisclaimer';
import { checkInput, checkOutput } from '../../src/safety/SafetyGuard';
import { buildMessages } from '../../src/ai/promptBuilder';
import { generate } from '../../src/ai/AIService';
import { loadPack } from '../../src/knowledge/KnowledgeLoader';
import type { KnowledgePack } from '../../src/knowledge/types';
import type { ChatMessage } from '../../src/store/chatStore';

export default function ChatScreen() {
  const { messages, isLoading, error, addMessage, updateMessage, setLoading, setError } =
    useChatStore();
  const { activePack, packVersion, setPackVersion } = useSettingsStore();
  const [pack, setPack] = useState<KnowledgePack | null>(null);
  const [packBanner, setPackBanner] = useState<string | null>(null);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    loadPack(activePack)
      .then((loaded) => {
        setPack(loaded);
        const stored = packVersion[activePack];
        if (stored && stored !== loaded.meta.version) {
          setPackBanner(`Pack updated: ${loaded.meta.name} v${loaded.meta.version}`);
        }
        setPackVersion(activePack, loaded.meta.version);
      })
      .catch((e) => setError(`Failed to load pack: ${String(e)}`));
  }, [activePack]);

  useEffect(() => {
    if (messages.length > 0) {
      listRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages.length]);

  const handleSend = async (text: string) => {
    const safety = checkInput(text);
    addMessage({ role: 'user', content: text });

    if (safety.verdict === 'block') {
      addMessage({
        role: 'assistant',
        content: safety.warningText ?? 'I cannot help with that query.',
      });
      return;
    }

    const warning = safety.verdict === 'warn' ? safety.warningText : undefined;
    setLoading(true);
    setError(null);

    // Add placeholder for streaming
    const assistantId = addMessage({
      role: 'assistant',
      content: '',
      warning,
      streaming: true,
    });

    try {
      const history = messages
        .filter((m) => m.role !== 'system' && !m.streaming)
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

      const aiMessages = buildMessages(text, history, pack);

      await generate(aiMessages, (chunk, done) => {
        updateMessage(assistantId, checkOutput(chunk), done);
      });
    } catch {
      updateMessage(assistantId, 'Connection error. Ensure Ollama is running: `ollama serve`', true);
      setError('Failed to reach Ollama. Check your connection and Ollama URL in Settings.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-stone-900">
      <View className="px-4 py-3 border-b border-stone-800">
        <Text className="text-white font-semibold text-base">Sliabh</Text>
        <Text className="text-stone-400 text-xs">
          {pack ? `${pack.meta.name} · offline` : 'Loading pack...'}
        </Text>
      </View>

      {packBanner && (
        <View className="bg-brand-900 px-4 py-2 flex-row items-center justify-between">
          <Text className="text-brand-500 text-xs">{packBanner}</Text>
          <Text
            className="text-stone-400 text-xs"
            onPress={() => setPackBanner(null)}
          >
            ✕
          </Text>
        </View>
      )}

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        className="flex-1"
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 8 }}
        ListHeaderComponent={<SafetyDisclaimer />}
        ListEmptyComponent={
          <View className="items-center mt-12 px-8">
            <Text className="text-stone-500 text-sm text-center leading-6">
              Ask about routes, refuges, gear, permits, or trail conditions in Patagonia.
            </Text>
            <Text className="text-stone-600 text-xs text-center mt-3 leading-5">
              Try: "What gear do I need for the W Circuit?" or "Are permits required?"
            </Text>
          </View>
        }
        renderItem={({ item }: { item: ChatMessage }) => <ChatBubble message={item} />}
        ItemSeparatorComponent={() => <View className="h-1" />}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
      />

      {isLoading && !messages.some((m) => m.streaming) && (
        <View className="items-start px-4 pb-2">
          <View className="bg-stone-800 rounded-2xl rounded-tl-sm px-4 py-3 flex-row items-center gap-2">
            <ActivityIndicator size="small" color="#22c55e" />
            <Text className="text-stone-400 text-sm">Thinking...</Text>
          </View>
        </View>
      )}

      {error && (
        <View className="mx-4 mb-2 bg-red-900/40 rounded-xl px-3 py-2">
          <Text className="text-red-400 text-xs">{error}</Text>
        </View>
      )}

      <ChatInput onSend={handleSend} disabled={isLoading} />
    </SafeAreaView>
  );
}
