import React, { useEffect } from 'react';
import { useLangStore } from '../../src/store/langStore';
import Screen from '../(tabs)/rutas';

/** /en/rutas — the same screen in English (see app/en/index.tsx). */
export default function EnglishRutasScreen() {
  const { setLang } = useLangStore();
  useEffect(() => {
    setLang('en');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <Screen />;
}
