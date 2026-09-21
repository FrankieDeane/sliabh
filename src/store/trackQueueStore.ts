import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from './mmkv';
import type { TrackInput } from '../services/supabase';

export interface PendingTrack extends TrackInput {
  /** Local id; also the dedupe key while the hike waits for a session. */
  id: string;
  queuedAt: string;
}

interface TrackQueueState {
  pending: PendingTrack[];
  enqueue: (track: TrackInput) => void;
  remove: (id: string) => void;
}

/**
 * Hikes recorded with no session (or with no connection) wait here until the
 * user signs in, then trackSync pushes them to the account so every device
 * sees them.
 */
export const useTrackQueueStore = create<TrackQueueState>()(
  persist(
    (set) => ({
      pending: [],
      enqueue: (track) =>
        set((s) => ({
          pending: [
            ...s.pending,
            { ...track, id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, queuedAt: new Date().toISOString() },
          ],
        })),
      remove: (id) => set((s) => ({ pending: s.pending.filter((p) => p.id !== id) })),
    }),
    { name: 'track-queue', storage: createJSONStorage(() => mmkvStorage) },
  ),
);
