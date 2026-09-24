import React, { useEffect } from 'react';
import { useLangStore } from '../../src/store/langStore';
import InicioScreen from '../(tabs)/inicio';

/**
 * English homepage — /en. scripts/prerender-home.mjs bakes its English
 * meta/hreflang into dist/en/index.html, but without a route here the SPA
 * hydrated /en into the "Page not found" screen: Google renders JS, so the
 * site's main entry point for Europe/US searchers read as a soft 404. Same
 * pattern as app/en/ruta/[id].tsx.
 */
export default function EnglishHomeScreen() {
  const { setLang } = useLangStore();
  useEffect(() => {
    setLang('en');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <InicioScreen />;
}
