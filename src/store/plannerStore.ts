import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from './mmkv';

export interface Waypoint {
  id: string;
  lat: number;
  lon: number;
  name: string;
  elevation_m?: number;
  notes?: string;
}

interface PlannerState {
  waypoints: Waypoint[];
  planName: string;
  addWaypoint: (wp: Waypoint) => void;
  removeWaypoint: (id: string) => void;
  reorderWaypoints: (from: number, to: number) => void;
  clearPlan: () => void;
  setPlanName: (name: string) => void;
}

export const usePlannerStore = create<PlannerState>()(
  persist(
    (set) => ({
      waypoints: [],
      planName: 'Mi ruta',
      addWaypoint: (wp) => set((s) => ({ waypoints: [...s.waypoints, wp] })),
      removeWaypoint: (id) => set((s) => ({ waypoints: s.waypoints.filter((w) => w.id !== id) })),
      reorderWaypoints: (from, to) =>
        set((s) => {
          const wps = [...s.waypoints];
          const [item] = wps.splice(from, 1);
          wps.splice(to, 0, item);
          return { waypoints: wps };
        }),
      clearPlan: () => set({ waypoints: [], planName: 'Mi ruta' }),
      setPlanName: (planName) => set({ planName }),
    }),
    { name: 'planner', storage: createJSONStorage(() => mmkvStorage) },
  ),
);
