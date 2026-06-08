import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from './mmkv';

interface SettingsState {
  activePack: string;
  aiProvider: 'ollama' | 'mediapipe';
  ollamaUrl: string;
  packVersion: Record<string, string>;
  setActivePack: (pack: string) => void;
  setAiProvider: (p: 'ollama' | 'mediapipe') => void;
  setOllamaUrl: (url: string) => void;
  setPackVersion: (packId: string, version: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      activePack: 'torres-del-paine',
      aiProvider: 'ollama',
      ollamaUrl: 'http://10.0.2.2:11434',
      packVersion: {},

      setActivePack: (pack) => set({ activePack: pack }),
      setAiProvider: (p) => set({ aiProvider: p }),
      setOllamaUrl: (url) => set({ ollamaUrl: url }),
      setPackVersion: (packId, version) =>
        set((s) => ({ packVersion: { ...s.packVersion, [packId]: version } })),
    }),
    {
      name: 'settings-store',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
