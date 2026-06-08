import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import type { KnowledgePack } from './types';

// Module map for statically bundled packs — extend as new packs are added
const PACK_ASSETS: Record<string, Record<string, number>> = {
  'torres-del-paine': {
    meta:         require('../../assets/packs/torres-del-paine/meta.json'),
    routes:       require('../../assets/packs/torres-del-paine/routes.json'),
    refuges:      require('../../assets/packs/torres-del-paine/refuges.json'),
    campgrounds:  require('../../assets/packs/torres-del-paine/campgrounds.json'),
    waterPoints:  require('../../assets/packs/torres-del-paine/water-points.json'),
    alerts:       require('../../assets/packs/torres-del-paine/alerts.json'),
    gear:         require('../../assets/packs/torres-del-paine/gear.json'),
    faqs:         require('../../assets/packs/torres-del-paine/faqs.json'),
  },
};

async function loadJsonAsset(module: number): Promise<unknown> {
  const [asset] = await Asset.loadAsync(module);
  const content = await FileSystem.readAsStringAsync(asset.localUri!);
  return JSON.parse(content);
}

export async function loadPack(packId: string): Promise<KnowledgePack> {
  const assets = PACK_ASSETS[packId];
  if (!assets) throw new Error(`Unknown pack: ${packId}`);

  const [meta, routes, refuges, campgrounds, waterPoints, alerts, gear, faqs] =
    await Promise.all([
      loadJsonAsset(assets.meta),
      loadJsonAsset(assets.routes),
      loadJsonAsset(assets.refuges),
      loadJsonAsset(assets.campgrounds),
      loadJsonAsset(assets.waterPoints),
      loadJsonAsset(assets.alerts),
      loadJsonAsset(assets.gear),
      loadJsonAsset(assets.faqs),
    ]);

  return { meta, routes, refuges, campgrounds, waterPoints, alerts, gear, faqs } as KnowledgePack;
}

export function listAvailablePacks(): string[] {
  return Object.keys(PACK_ASSETS);
}
