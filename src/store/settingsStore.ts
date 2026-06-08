import { create } from 'zustand';

interface SettingsState {
  activePack: string;
  aiProvider: 'ollama' | 'mediapipe';
  ollamaUrl: string;
  setActivePack: (pack: string) => void;
  setAiProvider: (p: 'ollama' | 'mediapipe') => void;
  setOllamaUrl: (url: string) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  activePack: 'torres-del-paine',
  aiProvider: 'ollama',
  ollamaUrl: 'http://10.0.2.2:11434',

  setActivePack: (pack) => set({ activePack: pack }),
  setAiProvider: (p) => set({ aiProvider: p }),
  setOllamaUrl: (url) => set({ ollamaUrl: url }),
}));
