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
  useWindowDimensions,
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
import { WebFooter } from '../../src/components/layout/WebFooter';

const MAX_CONTENT = 800;

const SUGGESTIONS = [
  '¿Qué necesito para el Circuito W?',
  '¿Cómo evito la hipotermia en Patagonia?',
  '¿Dónde consigo agua potable en el trekking?',
  '¿Cuál es la mejor época para visitar Torres del Paine?',
  '¿Qué equipo llevar para alta montaña en Argentina?',
  '¿Cuántos días necesito para el Fitz Roy?',
];

export default function AsistenteScreen() {
  const { isDark } = useTheme();
  const { isOffline } = useNetwork();
  const { activePack } = useSettingsStore();
  const { messages, isLoading, addMessage, updateMessage, setLoading, clearMessages } =
    useChatStore();

  const [input, setInput] = useState('');
  const [pack, setPack] = useState<KnowledgePack | null>(null);
  const [aiReachable, setAiReachable] = useState<boolean | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const { width } = useWindowDimensions();

  const contentW = Math.min(width, MAX_CONTENT);
  const sidePad = Math.max(16, (width - contentW) / 2);

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
    } catch (e: any) {
      const isWeb = Platform.OS === 'web';
      const errMsg = isWeb
        ? 'No pude conectar con el asistente IA en la nube. Revisando base de conocimiento local…'
        : 'Ollama no disponible. Usando base de conocimiento integrada — prueba preguntar sobre rutas, equipo o seguridad.';
      updateMessage(assistantId, errMsg, true);
      setAiReachable(false);
    } finally {
      setLoading(false);
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={['top']}>
      {Platform.OS !== 'web' && (
        <ScreenHeader
          title="Asistente IA"
          subtitle={Platform.OS === 'web' ? 'Claude · Nube' : 'Ollama / Offline · Siempre disponible'}
          right={
            hasMessages ? (
              <TouchableOpacity onPress={clearMessages} style={styles.headerBtn}>
                <Ionicons name="trash-outline" size={18} color={c.muted} />
              </TouchableOpacity>
            ) : undefined
          }
        />
      )}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={[styles.scrollContent, { paddingHorizontal: sidePad }]}
          showsVerticalScrollIndicator={false}
        >
          {!hasMessages ? (
            <View style={styles.empty}>
              <View style={[styles.sparkleCircle, { backgroundColor: '#16a34a' }]}>
                <Ionicons name="sparkles" size={28} color="#fff" />
              </View>
              <Text style={[styles.emptyTitle, { color: c.text }]}>
                Tu guía de montaña
              </Text>
              <Text style={[styles.emptySub, { color: c.muted }]}>
                Pregunta sobre rutas, seguridad, equipamiento o clima.{' '}
                {Platform.OS === 'web'
                  ? 'Powered by Claude IA.'
                  : 'El modelo funciona localmente — incluso sin señal.'}
              </Text>

              {isOffline && (
                <View style={styles.offlinePill}>
                  <Ionicons name="cloud-offline-outline" size={13} color="#fbbf24" />
                  <Text style={styles.offlinePillText}>Sin señal · IA activa</Text>
                </View>
              )}

              {aiReachable === false && (
                <View style={[styles.warnPill, { borderColor: c.border, backgroundColor: c.surface }]}>
                  <Ionicons name="warning-outline" size={13} color="#f97316" />
                  <Text style={[styles.warnText, { color: c.muted }]}>
                    {Platform.OS === 'web'
                      ? 'IA no disponible — configura ANTHROPIC_API_KEY en Netlify'
                      : 'Ollama no detectado — inicia el servidor local'}
                  </Text>
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
            <>
              {/* Clear button on web (no ScreenHeader) */}
              {Platform.OS === 'web' && hasMessages && (
                <View style={styles.webClearRow}>
                  <TouchableOpacity
                    onPress={clearMessages}
                    style={[styles.webClearBtn, { borderColor: c.border }]}
                  >
                    <Ionicons name="trash-outline" size={14} color={c.muted} />
                    <Text style={[styles.webClearTxt, { color: c.muted }]}>Limpiar chat</Text>
                  </TouchableOpacity>
                </View>
              )}
              {messages.map((m) =>
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
              )}
            </>
          )}
          {Platform.OS === 'web' && !hasMessages && <WebFooter />}
        </ScrollView>

        {/* Input bar */}
        <View style={[styles.inputBar, { backgroundColor: c.bg, borderTopColor: c.border, paddingHorizontal: sidePad }]}>
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
  scrollContent: { paddingTop: 16, paddingBottom: 24 },
  empty: { flex: 1, alignItems: 'center', paddingTop: 32 },
  sparkleCircle: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  emptyTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center', letterSpacing: -0.3, marginBottom: 8 },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 21, maxWidth: 360, marginBottom: 16 },
  offlinePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(245,158,11,0.15)', borderColor: 'rgba(245,158,11,0.4)', borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, marginBottom: 16,
  },
  offlinePillText: { color: '#fbbf24', fontSize: 12, fontWeight: '600' },
  warnPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10,
    marginBottom: 20, maxWidth: 400,
  },
  warnText: { fontSize: 12, flex: 1, lineHeight: 17 },
  suggestions: { width: '100%', gap: 10, marginTop: 8 },
  suggestion: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14,
  },
  suggestionText: { fontSize: 14, fontWeight: '500', flex: 1, marginRight: 8 },

  webClearRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 12 },
  webClearBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5,
  },
  webClearTxt: { fontSize: 12, fontWeight: '500' },

  userRow: { alignItems: 'flex-end', marginBottom: 14 },
  userBubble: { maxWidth: '75%', paddingHorizontal: 16, paddingVertical: 11, borderRadius: 20, borderBottomRightRadius: 6 },
  userText: { color: '#fff', fontSize: 15, lineHeight: 21 },
  aiRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 14 },
  aiAvatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 2, flexShrink: 0 },
  aiBubble: { flex: 1, maxWidth: '85%', borderWidth: 1, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20, borderTopLeftRadius: 6 },
  aiText: { fontSize: 15, lineHeight: 22 },

  inputBar: { borderTopWidth: 1, paddingVertical: 10 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'flex-end', borderWidth: 1, borderRadius: 24,
    paddingLeft: 16, paddingRight: 6, paddingVertical: 6,
  },
  input: { flex: 1, fontSize: 15, maxHeight: 120, paddingVertical: 8, paddingRight: 8 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});
