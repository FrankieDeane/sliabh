import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ScreenHeader } from '../../src/components/layout/ScreenHeader';
import { useTheme } from '../../src/hooks/useTheme';
import { useNetwork } from '../../src/hooks/useNetwork';
import { useChatStore } from '../../src/store/chatStore';
import { generate, isAIAvailable } from '../../src/ai/AIService';
import { buildMessages } from '../../src/ai/promptBuilder';
import { loadPack } from '../../src/knowledge/KnowledgeLoader';
import { useSettingsStore } from '../../src/store/settingsStore';
import type { KnowledgePack } from '../../src/knowledge/types';

const SUGGESTIONS = [
  '¿Qué necesito para el Circuito W?',
  '¿Cómo evito la hipotermia en Patagonia?',
  '¿Dónde puedo conseguir agua potable?',
  '¿Cuál es la mejor época para visitar?',
];

export default function AsistenteScreen() {
  const { isDark, colors } = useTheme();
  const { isOffline } = useNetwork();
  const { activePack } = useSettingsStore();
  const { messages, isLoading, addMessage, updateMessage, setLoading, clearMessages } =
    useChatStore();

  const [input, setInput] = useState('');
  const [pack, setPack] = useState<KnowledgePack | null>(null);
  const [aiReachable, setAiReachable] = useState<boolean | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const c = isDark
    ? { bg: '#070b14', surface: '#0f1724', elevated: '#162035', border: '#1e2d42', text: '#f0f9ff', muted: '#64748b' }
    : { bg: '#f8fafc', surface: '#ffffff', elevated: '#f1f5f9', border: '#e2e8f0', text: '#0f172a', muted: '#64748b' };

  useEffect(() => {
    loadPack(activePack).then(setPack).catch(() => setPack(null));
    isAIAvailable().then(setAiReachable);
  }, [activePack]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const query = (text ?? input).trim();
    if (!query || isLoading) return;

    setInput('');
    addMessage({ role: 'user', content: query });
    const assistantId = addMessage({ role: 'assistant', content: '', streaming: true });
    setLoading(true);

    try {
      const history = messages
        .filter((m) => m.role !== 'system')
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));
      const aiMessages = buildMessages(query, history, pack);

      await generate(aiMessages, (chunk, done) => {
        updateMessage(assistantId, chunk, done);
      });
      setAiReachable(true);
    } catch (e) {
      updateMessage(
        assistantId,
        'No pude conectar con el modelo local. Verifica que Ollama esté ejecutándose y que el modelo Gemma esté descargado.\n\nEn desarrollo: `ollama run gemma3:4b`',
        true,
      );
      setAiReachable(false);
    } finally {
      setLoading(false);
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={['top']}>
      <ScreenHeader
        title="Asistente IA"
        subtitle="Gemma · Modelo local"
        right={
          hasMessages ? (
            <TouchableOpacity onPress={clearMessages} style={styles.headerBtn}>
              <Ionicons name="trash-outline" size={18} color={c.muted} />
            </TouchableOpacity>
          ) : undefined
        }
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {!hasMessages ? (
            <View style={styles.empty}>
              <View style={[styles.sparkleCircle, { backgroundColor: '#16a34a' }]}>
                <Ionicons name="sparkles" size={28} color="#fff" />
              </View>
              <Text style={[styles.emptyTitle, { color: c.text }]}>
                Tu guía de montaña, sin conexión
              </Text>
              <Text style={[styles.emptySub, { color: c.muted }]}>
                Pregunta sobre rutas, seguridad, equipamiento o clima. El modelo
                funciona localmente — incluso sin señal.
              </Text>

              {isOffline && (
                <View style={styles.offlinePill}>
                  <Ionicons name="cloud-offline-outline" size={13} color="#fbbf24" />
                  <Text style={styles.offlinePillText}>Sin señal · IA activa</Text>
                </View>
              )}

              <View style={styles.suggestions}>
                {SUGGESTIONS.map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => handleSend(s)}
                    style={[styles.suggestion, { backgroundColor: c.surface, borderColor: c.border }]}
                  >
                    <Text style={[styles.suggestionText, { color: c.text }]}>{s}</Text>
                    <Ionicons name="arrow-forward" size={15} color="#16a34a" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            messages.map((m) =>
              m.role === 'user' ? (
                <View key={m.id} style={styles.userRow}>
                  <View style={[styles.userBubble, { backgroundColor: '#16a34a' }]}>
                    <Text style={styles.userText}>{m.content}</Text>
                  </View>
                </View>
              ) : (
                <View key={m.id} style={styles.aiRow}>
                  <View style={[styles.aiAvatar, { backgroundColor: c.elevated }]}>
                    <Ionicons name="sparkles" size={14} color="#22c55e" />
                  </View>
                  <View style={[styles.aiBubble, { backgroundColor: c.surface, borderColor: c.border }]}>
                    {m.content === '' && m.streaming ? (
                      <ActivityIndicator size="small" color="#22c55e" />
                    ) : (
                      <Text style={[styles.aiText, { color: c.text }]}>{m.content}</Text>
                    )}
                  </View>
                </View>
              ),
            )
          )}
        </ScrollView>

        {/* Input bar */}
        <View style={[styles.inputBar, { backgroundColor: c.bg, borderTopColor: c.border }]}>
          <View style={[styles.inputWrap, { backgroundColor: c.surface, borderColor: c.border }]}>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Pregunta sobre la montaña…"
              placeholderTextColor={c.muted}
              style={[styles.input, { color: c.text }]}
              multiline
              onSubmitEditing={() => handleSend()}
            />
            <TouchableOpacity
              onPress={() => handleSend()}
              disabled={!input.trim() || isLoading}
              style={[
                styles.sendBtn,
                { backgroundColor: input.trim() && !isLoading ? '#16a34a' : c.elevated },
              ]}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="arrow-up" size={20} color={input.trim() ? '#fff' : c.muted} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  headerBtn: { padding: 6 },
  scrollContent: { padding: 16, paddingBottom: 24 },
  empty: { flex: 1, alignItems: 'center', paddingTop: 32 },
  sparkleCircle: {
    width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  emptyTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center', letterSpacing: -0.3, marginBottom: 8 },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 21, maxWidth: 320, marginBottom: 16 },
  offlinePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(245,158,11,0.15)', borderColor: 'rgba(245,158,11,0.4)', borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, marginBottom: 24,
  },
  offlinePillText: { color: '#fbbf24', fontSize: 12, fontWeight: '600' },
  suggestions: { width: '100%', gap: 10, marginTop: 8 },
  suggestion: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14,
  },
  suggestionText: { fontSize: 14, fontWeight: '500', flex: 1, marginRight: 8 },
  userRow: { alignItems: 'flex-end', marginBottom: 14 },
  userBubble: { maxWidth: '85%', paddingHorizontal: 16, paddingVertical: 11, borderRadius: 20, borderBottomRightRadius: 6 },
  userText: { color: '#fff', fontSize: 15, lineHeight: 21 },
  aiRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 14 },
  aiAvatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  aiBubble: { flex: 1, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20, borderTopLeftRadius: 6 },
  aiText: { fontSize: 15, lineHeight: 22 },
  inputBar: { borderTopWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'flex-end', borderWidth: 1, borderRadius: 24,
    paddingLeft: 16, paddingRight: 6, paddingVertical: 6,
  },
  input: { flex: 1, fontSize: 15, maxHeight: 120, paddingVertical: 8, paddingRight: 8 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
