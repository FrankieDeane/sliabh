import { create } from 'zustand';
import type { LiveSession } from '../services/liveTrack';

export interface HikeTrailRef {
  id: string;
  name: string;
  coordinates?: { lat: number; lon: number };
  gpxTrack?: Array<{ lat: number; lon: number }>;
}

interface HikeState {
  open: boolean;
  trail: HikeTrailRef | null;
  /** Set when the screen is re-opening a recording the app never finished. */
  resume: LiveSession | null;
  start: (trail?: HikeTrailRef) => void;
  resumeRecording: (session: LiveSession, trail?: HikeTrailRef) => void;
  close: () => void;
}

/**
 * One recording at a time, owned by the app rather than by whichever screen
 * happened to start it. That is what lets the hike screen come back by itself
 * after the browser is killed: the walk does not belong to a page that no
 * longer exists.
 */
export const useHikeStore = create<HikeState>((set) => ({
  open: false,
  trail: null,
  resume: null,
  start: (trail) => set({ open: true, trail: trail ?? null, resume: null }),
  resumeRecording: (session, trail) => set({ open: true, resume: session, trail: trail ?? null }),
  close: () => set({ open: false, resume: null }),
}));
