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
            ? 'List Your Profile — Mountain Guides | Sliabh'
            : 'Publicá tu perfil — Guías de montaña | Sliabh'
        }
        description={
          lang === 'en'
            ? 'Mountain guides: list your profile on the specific trails you specialize in, right where thousands plan their trip.'
            : 'Guías de montaña: publicá tu perfil en los senderos donde sos experto, justo donde miles planifican su salida.'
        }
        path="/guias"
      />
      <GuidesDirectory />
      {Platform.OS === 'web' && <WebFooter />}
    </ScrollView>
  );
}
