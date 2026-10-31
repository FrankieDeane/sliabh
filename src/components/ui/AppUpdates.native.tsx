/**
 * La app se actualiza sola y le cuenta al usuario qué cambió.
 *
 * Cómo llega una mejora (expo-updates, igual en Android y iPhone):
 *   1. Al abrir la app, busca en segundo plano si hay código nuevo. Nunca
 *      demora la apertura: sin señal abre al instante con lo que ya tiene.
 *   2. Si hay, lo baja. Queda listo para la próxima vez que se abra la app,
 *      o antes si el usuario toca "Actualizar ahora" en el aviso de abajo.
 *   3. Con el código nuevo, aparece el cartel "Última actualización" con las
 *      novedades de src/constants/changelog.ts, una sola vez.
 *
 * Nunca reinicia la app por su cuenta, y nada de esto aparece durante una
 * caminata: reiniciar a mitad de una grabación sería lo peor que podría pasar.
 *
 * Límite: solo viaja así el código JavaScript. Un cambio nativo (permisos,
 * librerías nativas, versión de Expo) sigue necesitando un APK nuevo; la app
 * instalada ignora esas actualizaciones hasta tenerlo (ver app.config.js).
 */
import React, { useEffect, useRef, useState } from 'react';
import { AppState, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Updates from 'expo-updates';
import { CHANGELOG, type ChangelogEntry } from '../../constants/changelog';
import { storage } from '../../store/mmkv';
import { useHikeStore } from '../../store/hikeStore';
import { useLangStore } from '../../store/langStore';
import { useNetworkStore } from '../../store/networkStore';

const SEEN_KEY = 'whatsNew.seen';
const LAST_CHECK_KEY = 'updates.lastCheck';
// Al volver a la app (que en Android puede quedar días abierta en segundo
// plano), volver a buscar como mucho cada 4 horas.
const CHECK_EVERY_MS = 4 * 60 * 60 * 1000;

const C = {
  backdrop: 'rgba(2,6,15,0.72)',
  surface: '#0f1724',
  border: '#1e2d42',
  text: '#f0f9ff',
  muted: '#94a3b8',
  accent: '#22c55e',
};

/** Las novedades que este usuario todavía no vio, la más nueva primero. */
export function unseenEntries(seen: string | undefined, log: ChangelogEntry[] = CHANGELOG): ChangelogEntry[] {
  if (!log.length || seen === log[0].id) return [];
  const idx = seen ? log.findIndex((e) => e.id === seen) : -1;
  // Primera vez (o una entrada que ya no existe): solo la última, no el historial entero.
  return idx > 0 ? log.slice(0, idx) : log.slice(0, 1);
}

function formatDate(iso: string, lang: 'es' | 'en'): string {
  const [y, m, d] = iso.split('-').map(Number);
  const es = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const en = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  if (!y || !m || !d) return iso;
  return lang === 'es' ? `${d} de ${es[m - 1]} de ${y}` : `${en[m - 1]} ${d}, ${y}`;
}

function WhatsNew() {
  const { t, lang } = useLangStore();
  const hiking = useHikeStore((s) => s.open);
  const [entries, setEntries] = useState<ChangelogEntry[]>(() => unseenEntries(storage.getString(SEEN_KEY)));

  if (!entries.length || hiking) return null;

  const close = () => {
    storage.set(SEEN_KEY, CHANGELOG[0].id);
    setEntries([]);
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={close}>
      <View style={{ flex: 1, backgroundColor: C.backdrop, justifyContent: 'center', padding: 20 }}>
        <View style={{ backgroundColor: C.surface, borderColor: C.border, borderWidth: 1, borderRadius: 18, padding: 20, maxHeight: '80%' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Ionicons name="sparkles-outline" size={18} color={C.accent} />
            <Text style={{ color: C.accent, fontSize: 12, fontWeight: '800', letterSpacing: 0.8 }}>
              {t('ÚLTIMA ACTUALIZACIÓN', 'LATEST UPDATE')}
            </Text>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            {entries.map((e) => (
              <View key={e.id} style={{ marginTop: 10 }}>
                <Text style={{ color: C.muted, fontSize: 12.5 }}>{formatDate(e.date, lang)}</Text>
                <Text style={{ color: C.text, fontSize: 18, fontWeight: '800', marginTop: 2, marginBottom: 8 }}>
                  {t(e.title.es, e.title.en)}
                </Text>
                {e.items.filter((it) => !it.onlyIfAutoUpdate || Updates.isEnabled).map((it, i) => (
                  <View key={i} style={{ flexDirection: 'row', gap: 8, marginBottom: 7 }}>
                    <Ionicons name="checkmark-circle" size={16} color={C.accent} style={{ marginTop: 1 }} />
                    <Text style={{ color: C.text, fontSize: 14, lineHeight: 20, flex: 1 }}>{t(it.es, it.en)}</Text>
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity
            onPress={close}
            activeOpacity={0.85}
            style={{ backgroundColor: '#16a34a', borderRadius: 999, paddingVertical: 12, alignItems: 'center', marginTop: 14 }}
          >
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 15 }}>{t('Entendido', 'Got it')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

/** Aviso chico abajo cuando una mejora ya se bajó y espera a aplicarse. */
function UpdateReady() {
  const { t } = useLangStore();
  const hiking = useHikeStore((s) => s.open);
  const { isUpdatePending } = Updates.useUpdates();
  const [dismissed, setDismissed] = useState(false);

  if (!isUpdatePending || dismissed || hiking) return null;

  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', left: 12, right: 12, bottom: 90, alignItems: 'center' }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: C.surface, borderColor: C.accent, borderWidth: 1, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12, maxWidth: 480, width: '100%' }}>
        <Ionicons name="arrow-down-circle-outline" size={22} color={C.accent} />
        <Text style={{ color: C.text, fontSize: 13, lineHeight: 18, flex: 1 }}>
          {t('Hay una mejora lista. Se aplica sola la próxima vez que abras la app.', 'An improvement is ready. It applies next time you open the app.')}
        </Text>
        <TouchableOpacity
          onPress={() => { Updates.reloadAsync().catch(() => setDismissed(true)); }}
          style={{ backgroundColor: '#16a34a', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 }}
        >
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12.5 }}>{t('Actualizar ahora', 'Update now')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setDismissed(true)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="close" size={18} color={C.muted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

/** Al volver a primer plano con señal, buscar mejoras (al abrir ya lo hace expo-updates). */
function useForegroundCheck() {
  const online = useNetworkStore((s) => s.isOnline);
  const onlineRef = useRef(online);
  onlineRef.current = online;

  useEffect(() => {
    if (!Updates.isEnabled) return;
    storage.set(LAST_CHECK_KEY, String(Date.now()));
    const sub = AppState.addEventListener('change', async (state) => {
      if (state !== 'active' || !onlineRef.current) return;
      const last = Number(storage.getString(LAST_CHECK_KEY) ?? 0);
      if (Date.now() - last < CHECK_EVERY_MS) return;
      storage.set(LAST_CHECK_KEY, String(Date.now()));
      try {
        const res = await Updates.checkForUpdateAsync();
        if (res.isAvailable) await Updates.fetchUpdateAsync();
      } catch {
        // sin señal real o servidor caído: se vuelve a intentar más tarde
      }
    });
    return () => sub.remove();
  }, []);
}

export function AppUpdates() {
  useForegroundCheck();
  return (
    <>
      <WhatsNew />
      {Updates.isEnabled ? <UpdateReady /> : null}
    </>
  );
}

export default AppUpdates;
