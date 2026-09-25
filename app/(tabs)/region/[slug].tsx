import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { HubScreen } from '../../../src/components/seo/HubScreen';

export default function RegionScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  return <HubScreen kind="region" slug={String(slug ?? '')} />;
}
