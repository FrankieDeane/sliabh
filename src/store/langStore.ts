import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from './mmkv';

export type Lang = 'es' | 'en';

interface LangState {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (es: string, en: string) => string;
}

const makeT = (lang: Lang) => (es: string, en: string) => lang === 'es' ? es : en;

export const useLangStore = create<LangState>()(
  persist(
    (set) => ({
      lang: 'es',
      setLang: (lang) => set({ lang, t: makeT(lang) }),
      t: makeT('es'),
    }),
    {
      name: 'sliabh-lang',
      storage: createJSONStorage(() => mmkvStorage),
      // Restore t after rehydration so it matches persisted lang
      onRehydrateStorage: () => (state) => {
        if (state) state.t = makeT(state.lang);
      },
    },
  ),
);
