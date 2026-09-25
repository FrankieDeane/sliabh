import React from 'react';
import { Stack } from 'expo-router';
import { NoIndex } from '../../src/components/ui/SeoHead';

export default function AuthLayout() {
  return (
    <>
      <NoIndex />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
