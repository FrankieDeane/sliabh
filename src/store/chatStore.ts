import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from './mmkv';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  warning?: string;
  streaming?: boolean;
}

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => string;
  updateMessage: (id: string, content: string, done?: boolean) => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
  clearMessages: () => void;
}

let _id = 0;
const uid = () => String(Date.now()) + String(++_id);

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: [],
      isLoading: false,
      error: null,

      addMessage: (msg) => {
        const id = uid();
        set((s) => ({
          messages: [...s.messages, { ...msg, id, timestamp: Date.now() }],
        }));
        return id;
      },

      updateMessage: (id, content, done = false) =>
        set((s) => ({
          messages: s.messages.map((m) =>
            m.id === id ? { ...m, content, streaming: !done } : m,
          ),
        })),

      setLoading: (v) => set({ isLoading: v }),
      setError: (e) => set({ error: e }),
      clearMessages: () => set({ messages: [] }),
    }),
    {
      name: 'chat-store',
      storage: createJSONStorage(() => mmkvStorage),
      // Only persist the last 40 messages to cap MMKV size
      partialize: (s) => ({ messages: s.messages.slice(-40) }),
    },
  ),
);
