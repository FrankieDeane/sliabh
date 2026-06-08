import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNetwork } from '../../hooks/useNetwork';

export function OfflineBadge() {
  const { isOffline } = useNetwork();
  if (!isOffline) return null;

  return (
    <View style={styles.pill}>
      <Ionicons name="cloud-offline-outline" size={12} color="#fcd34d" style={styles.icon} />
      <Text style={styles.text}>Sin señal · IA activa</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.4)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  icon: {
    marginRight: 5,
  },
  text: {
    color: '#fcd34d',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
