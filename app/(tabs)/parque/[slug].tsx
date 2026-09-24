import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { HubScreen } from '../../../src/components/seo/HubScreen';

export default function ParkScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  return <HubScreen kind="park" slug={String(slug ?? '')} />;
}
