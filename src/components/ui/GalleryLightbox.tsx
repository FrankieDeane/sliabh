import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Platform,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface GalleryItem {
  uri: string;
  labelEs: string;
  labelEn: string;
}

interface Props {
  items: GalleryItem[];
  index: number | null;
  onClose: () => void;
  lang: 'es' | 'en';
}

export function GalleryLightbox({ items, index, onClose, lang }: Props) {
  const { width, height } = useWindowDimensions();
  const visible = index !== null;
  const item = index !== null ? items[index] : null;

  if (!visible || !item) return null;

  const label = lang === 'es' ? item.labelEs : item.labelEn;
  const pos = index !== null ? `${index + 1} / ${items.length}` : '';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        {/* Background image */}
        <ImageBackground
          source={{ uri: item.uri }}
          style={[styles.image, { width, height }]}
          resizeMode="contain"
        />

        {/* Top bar */}
        <View style={styles.topBar}>
          <Text style={styles.counter}>{pos}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.8}>
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Bottom label */}
        <View style={styles.bottomBar}>
          <Text style={styles.label}>{label}</Text>
        </View>

        {/* Tap outside to close */}
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          activeOpacity={1}
          onPress={onClose}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    position: 'absolute',
  },
  topBar: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  counter: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 1,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 52,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.65)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
});
