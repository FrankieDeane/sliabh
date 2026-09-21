import { saveTrailTrack, isSupabaseConfigured, supabase, type TrackInput } from './supabase';
import { useTrackQueueStore } from '../store/trackQueueStore';

/** Saves a finished hike, keeping it locally when it can't reach the account yet. */
export async function recordTrack(track: TrackInput): Promise<{ saved: boolean }> {
  try {
    const { saved } = await saveTrailTrack(track);
    if (saved) return { saved: true };
  } catch {
    // fall through to the queue
  }
  useTrackQueueStore.getState().enqueue(track);
  return { saved: false };
}

let syncing = false;

/**
 * Pushes queued hikes to the signed-in account, oldest first. Runs on launch,
 * on sign-in and when connectivity returns, so a hike recorded offline on the
 * phone ends up on the desktop too.
 */
export async function syncPendingTracks(): Promise<number> {
  if (syncing || !isSupabaseConfigured()) return 0;
  const { pending } = useTrackQueueStore.getState();
  if (!pending.length) return 0;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  syncing = true;
  let synced = 0;
  try {
    for (const track of [...pending].sort((a, b) => a.startedAt.localeCompare(b.startedAt))) {
      const { saved } = await saveTrailTrack(track);
      if (!saved) break; // still offline — keep the rest queued for next time
      useTrackQueueStore.getState().remove(track.id);
      synced += 1;
    }
  } finally {
    syncing = false;
  }
  return synced;
}
