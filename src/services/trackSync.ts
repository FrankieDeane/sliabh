import { saveTrailTrack, isSupabaseConfigured, currentUserId, type TrackInput } from './supabase';
import { useTrackQueueStore } from '../store/trackQueueStore';

/**
 * Files a finished hike: on the device first, then to the account.
 *
 * The order matters. Uploading first and queueing only on failure leaves a
 * window — the seconds the request is in flight — where the hike exists
 * nowhere but memory, and a phone that dies in that window loses it. Writing
 * the queue first means the worst case is an upload that happens later;
 * saveTrailTrack ignores a hike already filed under the same start instant, so
 * a retry can never duplicate one.
 */
export async function recordTrack(track: TrackInput): Promise<{ saved: boolean }> {
  const entry = useTrackQueueStore.getState().enqueue(track);
  let saved = false;
  try {
    ({ saved } = await saveTrailTrack(track));
  } catch {
    saved = false;
  }
  if (saved) useTrackQueueStore.getState().remove(entry.id);
  return { saved };
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

  // Read the stored session rather than calling the auth endpoint: offline
  // that request only fails slowly, and the queue is meant to drain fast.
  const userId = await currentUserId();
  if (!userId) return 0;

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
