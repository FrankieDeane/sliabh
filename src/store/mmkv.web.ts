// Web fallback for react-native-mmkv, which relies on native JSI bindings that
// do not exist in the browser. Metro resolves this file (`.web.ts`) for the web
// platform automatically. Backed by localStorage, with an in-memory fallback for
// SSR / environments where localStorage is unavailable.
const memory = new Map<string, string>();

const ls: Storage | null =
  typeof globalThis !== 'undefined' && 'localStorage' in globalThis
    ? (globalThis as { localStorage: Storage }).localStorage
    : null;

export const storage = {
  getString: (key: string): string | undefined =>
    (ls ? ls.getItem(key) : memory.get(key)) ?? undefined,
  set: (key: string, value: string | number | boolean): void => {
    const v = String(value);
    ls ? ls.setItem(key, v) : memory.set(key, v);
  },
  delete: (key: string): void => {
    ls ? ls.removeItem(key) : memory.delete(key);
  },
};

export const mmkvStorage = {
  getItem: (key: string) => storage.getString(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
};
