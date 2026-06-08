import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from './mmkv';

export type ContribType = 'nueva_ruta' | 'edicion_ruta' | 'punto_interes' | 'alerta' | 'nota';

export interface PendingContribution {
  id: string;
  type: ContribType;
  title: string;
  description: string;
  lat?: number;
  lon?: number;
  createdAt: string;
  synced: boolean;
}

interface ContribState {
  pending: PendingContribution[];
  add: (c: Omit<PendingContribution, 'id' | 'createdAt' | 'synced'>) => void;
  markSynced: (id: string) => void;
  remove: (id: string) => void;
}

export const useContribStore = create<ContribState>()(
  persist(
    (set) => ({
      pending: [],
      add: (c) =>
        set((s) => ({
          pending: [
            ...s.pending,
            { ...c, id: Date.now().toString(), createdAt: new Date().toISOString(), synced: false },
          ],
        })),
      markSynced: (id) =>
        set((s) => ({
          pending: s.pending.map((p) => (p.id === id ? { ...p, synced: true } : p)),
        })),
      remove: (id) => set((s) => ({ pending: s.pending.filter((p) => p.id !== id) })),
    }),
    { name: 'contributions', storage: createJSONStorage(() => mmkvStorage) },
  ),
);
