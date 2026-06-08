import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  warning?: string;
}

interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  setLoading: (v: boolean) => void;
  setError: (e: string | null) => void;
  clearMessages: () => void;
}

let _id = 0;
const uid = () => String(++_id);

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isLoading: false,
  error: null,

  addMessage: (msg) =>
    set((s) => ({
      messages: [...s.messages, { ...msg, id: uid(), timestamp: Date.now() }],
    })),

  setLoading: (v) => set({ isLoading: v }),
  setError: (e) => set({ error: e }),
  clearMessages: () => set({ messages: [] }),
}));
