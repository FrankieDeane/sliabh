import { create } from 'zustand';

export type Lang = 'es' | 'en';

interface LangState {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (es: string, en: string) => string;
}

export const useLangStore = create<LangState>((set, get) => ({
  lang: 'es',
  setLang: (lang) => set({ lang }),
  t: (es, en) => (get().lang === 'es' ? es : en),
}));
