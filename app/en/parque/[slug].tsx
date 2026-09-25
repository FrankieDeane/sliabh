import React, { useEffect } from 'react';
import { useLangStore } from '../../../src/store/langStore';
import ParkScreen from '../../(tabs)/parque/[slug]';

/**
 * English entry point for a park hub — /en/parque/<slug>. Same pattern as
 * app/en/ruta/[id].tsx: a real, crawlable, indexable URL distinct from
 * /parque/<slug>, with reciprocal hreflang baked in by
 * scripts/prerender-hubs.mjs. Setting `lang` here is the same, real,
 * persisted preference change as clicking "EN" in the header.
 */
export default function EnglishParkScreen() {
  const { setLang } = useLangStore();
  useEffect(() => {
    setLang('en');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <ParkScreen />;
}
