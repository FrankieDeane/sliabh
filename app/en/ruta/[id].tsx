import React, { useEffect } from 'react';
import { useLangStore } from '../../../src/store/langStore';
import TrailDetailScreen from '../../(tabs)/ruta/[id]';

/**
 * English entry point for a trail page — /en/ruta/<id>.
 *
 * Sliabh doesn't have a separate English UI: the whole app already renders
 * bilingually off a single global `lang` preference (see langStore.ts and
 * the ES/EN toggle in WebHeader). This route exists so /en/ruta/<id> is a
 * real, crawlable, indexable URL distinct from /ruta/<id> — the trail's own
 * page in each language, with reciprocal hreflang tags baked into the
 * static HTML by scripts/prerender-trails.mjs. That static HTML is what a
 * crawler or a shared link sees; this component is what a real visitor's
 * browser hydrates into once the JS bundle loads.
 *
 * Switching `lang` here is the same mechanism as clicking "EN" in the
 * header — it's a real, persisted preference change, not a one-off
 * override. That's deliberate: someone arriving via an English search
 * result or an English share link is choosing English, same as if they'd
 * clicked the toggle themselves.
 */
export default function EnglishTrailDetailScreen() {
  const { lang, setLang } = useLangStore();

  useEffect(() => {
    if (lang !== 'en') setLang('en');
  }, [lang, setLang]);

  return <TrailDetailScreen />;
}
