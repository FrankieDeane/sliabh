import React from 'react';
import { ScrollView, Platform } from 'react-native';
import { useTheme } from '../../src/hooks/useTheme';
import { useLangStore } from '../../src/store/langStore';
import { WebFooter } from '../../src/components/layout/WebFooter';
import { SeoHead } from '../../src/components/ui/SeoHead';
import { coreSeo } from '../../src/data/coreSeo';
import { GuidesDirectory } from '../../src/components/guides/GuidesDirectory';

export default function GuiasScreen() {
  const { isDark } = useTheme();
  const { lang } = useLangStore();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: isDark ? '#070b14' : '#f8fafc' }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 64 }}
    >
      <SeoHead
          {...coreSeo('guias', lang)}
      />
      <GuidesDirectory />
      {Platform.OS === 'web' && <WebFooter />}
    </ScrollView>
  );
}
