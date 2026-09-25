import React, { useEffect } from 'react';
import { useLangStore } from '../../../src/store/langStore';
import RegionScreen from '../../(tabs)/region/[slug]';

/**
 * English entry point for a region hub — /en/region/<slug>. Same pattern as
 * app/en/ruta/[id].tsx: a real, crawlable, indexable URL distinct from
 * /region/<slug>, with reciprocal hreflang baked in by
 * scripts/prerender-hubs.mjs. Setting `lang` here is the same, real,
 * persisted preference change as clicking "EN" in the header.
 */
export default function EnglishRegionScreen() {
  const { setLang } = useLangStore();
  useEffect(() => {
    setLang('en');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return <RegionScreen />;
}
