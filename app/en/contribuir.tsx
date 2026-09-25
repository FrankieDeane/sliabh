import React, { useEffect } from 'react';
import { useLangStore } from '../../src/store/langStore';
import Screen from '../(tabs)/contribuir';

/** /en/contribuir — the same screen in English (see app/en/index.tsx). */
export default function EnglishContribuirScreen() {
  const { setLang } = useLangStore();
  useEffect(() => {
    setLang('en');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <Screen />;
}
