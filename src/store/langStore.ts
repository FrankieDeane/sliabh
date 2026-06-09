import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from './mmkv';

export type Lang = 'es' | 'en';

interface LangState {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (es: string, en: string) => string;
}

export const useLangStore = create<LangState>()(
  persist(
    (set, get) => ({
      lang: 'es',
      setLang: (lang) => set({ lang }),
      t: (es, en) => (get().lang === 'es' ? es : en),
    }),
    {
      name: 'sliabh-lang',
      storage: createJSONStorage(() => mmkvStorage),
    },
  ),
);
