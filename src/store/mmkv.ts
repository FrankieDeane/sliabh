import { MMKV } from 'react-native-mmkv';

export const storage = new MMKV({ id: 'sliabh' });

export const mmkvStorage = {
  getItem: (key: string) => storage.getString(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
};
