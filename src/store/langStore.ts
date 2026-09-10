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

/**
 * Default language for a brand-new visitor (nothing persisted yet), from
 * the country the Netlify Edge Function (geo-lang.ts) detected and stamped
 * onto `window.__SLIABH_GEO_LANG__` before this module ever runs. Falls
 * back to 'es' when unavailable (native apps, local dev without the edge
 * function, SSR). This only ever supplies the INITIAL value: persist's
 * rehydration below overwrites it with a returning visitor's own saved
 * choice whenever one exists — geo-detection never fights a real choice,
 * it only fills in a first impression.
 */
function detectInitialLang(): Lang {
  if (typeof window !== 'undefined') {
    const geo = (window as any).__SLIABH_GEO_LANG__;
    if (geo === 'es' || geo === 'en') return geo;
  }
  return 'es';
}

export const useLangStore = create<LangState>()(
  persist(
    (set) => {
      const initial = detectInitialLang();
      return {
        lang: initial,
        setLang: (lang) => set({ lang, t: makeT(lang) }),
        t: makeT(initial),
      };
    },
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
