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
  /** Selected catalog trail for the planning experience */
  selectedTrailId: string | null;
  /** Checked-off checklist item ids, keyed by trail id */
  checkedItems: Record<string, string[]>;
  addWaypoint: (wp: Waypoint) => void;
  removeWaypoint: (id: string) => void;
  reorderWaypoints: (from: number, to: number) => void;
  clearPlan: () => void;
  setPlanName: (name: string) => void;
  setSelectedTrail: (id: string | null) => void;
  toggleCheckedItem: (trailId: string, itemId: string) => void;
}

export const usePlannerStore = create<PlannerState>()(
  persist(
    (set) => ({
      waypoints: [],
      planName: 'Mi ruta',
      selectedTrailId: null,
      checkedItems: {},
      setSelectedTrail: (selectedTrailId) => set({ selectedTrailId }),
      toggleCheckedItem: (trailId, itemId) =>
        set((s) => {
          const current = s.checkedItems[trailId] ?? [];
          const next = current.includes(itemId)
            ? current.filter((i) => i !== itemId)
            : [...current, itemId];
          return { checkedItems: { ...s.checkedItems, [trailId]: next } };
        }),
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
