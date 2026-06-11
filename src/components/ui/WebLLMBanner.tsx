import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { WebLLMStatus } from '../../ai/useWebLLM';

interface Props {
  status: WebLLMStatus;
  progress: number;
  progressText: string;
  onLoad: () => void;
  isDark: boolean;
}

export function WebLLMBanner({ status, progress, progressText, onLoad, isDark }: Props) {
  if (Platform.OS !== 'web' || status === 'unsupported') return null;

  const border = isDark ? '#1e2d42' : '#e2e8f0';
  const bg = isDark ? '#0f1724' : '#f8fafc';
  const text = isDark ? '#f0f9ff' : '#0f172a';
  const muted = '#64748b';

  if (status === 'ready') {
    return (
      <View style={[s.banner, { backgroundColor: 'rgba(34,197,94,0.08)', borderColor: 'rgba(34,197,94,0.3)' }]}>
        <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
        <Text style={[s.txt, { color: '#22c55e' }]}>IA offline activa — Llama 3.2 (1B) en tu dispositivo</Text>
      </View>
    );
  }

  if (status === 'loading') {
    return (
      <View style={[s.banner, { backgroundColor: bg, borderColor: border }]}>
        <Ionicons name="cloud-download-outline" size={16} color="#22c55e" />
        <View style={{ flex: 1 }}>
          <Text style={[s.txt, { color: text }]}>Descargando modelo… {progress}%</Text>
          {progressText ? <Text style={[s.sub, { color: muted }]} numberOfLines={1}>{progressText}</Text> : null}
          <View style={[s.bar, { borderColor: border }]}>
            <View style={[s.fill, { width: `${progress}%` as any }]} />
          </View>
        </View>
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View style={[s.banner, { backgroundColor: bg, borderColor: '#ef4444' }]}>
        <Ionicons name="alert-circle-outline" size={16} color="#ef4444" />
        <Text style={[s.txt, { color: '#ef4444' }]}>Error al cargar el modelo. Reintentá.</Text>
        <TouchableOpacity onPress={onLoad} style={s.btn}>
          <Text style={s.btnTxt}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // idle — offer to load
  return (
    <View style={[s.banner, { backgroundColor: bg, borderColor: border }]}>
      <Ionicons name="hardware-chip-outline" size={16} color="#22c55e" />
      <View style={{ flex: 1 }}>
        <Text style={[s.txt, { color: text }]}>IA offline disponible en tu navegador</Text>
        <Text style={[s.sub, { color: muted }]}>Descarga única ~700 MB · Llama 3.2 1B · Sin conexión</Text>
      </View>
      <TouchableOpacity onPress={onLoad} style={s.btn}>
        <Text style={s.btnTxt}>Activar</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  txt: { fontSize: 13, fontWeight: '600' },
  sub: { fontSize: 11, marginTop: 2 },
  bar: {
    height: 4,
    borderRadius: 2,
    borderWidth: 1,
    marginTop: 6,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 2,
  },
  btn: {
    backgroundColor: '#22c55e',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  btnTxt: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
