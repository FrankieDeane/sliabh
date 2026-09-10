import React from 'react';
import { ScrollView, Platform } from 'react-native';
import { useTheme } from '../../src/hooks/useTheme';
import { useLangStore } from '../../src/store/langStore';
import { WebFooter } from '../../src/components/layout/WebFooter';
import { SeoHead } from '../../src/components/ui/SeoHead';
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
        title={
          lang === 'en'
            ? 'Mountain Guides in Argentina | Sliabh'
            : 'Guías de montaña en Argentina | Sliabh'
        }
        description={
          lang === 'en'
            ? "Find a mountain guide for your next trek in Argentina's national parks — Bariloche, El Chaltén and beyond."
            : 'Encontrá un guía de montaña para tu próxima salida a los parques nacionales de Argentina — Bariloche, El Chaltén y más.'
        }
        path="/guias"
      />
      <GuidesDirectory />
      {Platform.OS === 'web' && <WebFooter />}
    </ScrollView>
  );
}
