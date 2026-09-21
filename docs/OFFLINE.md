# Offline guarantees — what holds, and how we know

The app is used where there is no signal. That makes offline behaviour a
correctness problem rather than a nicety, and a dangerous one: it fails
silently. A service worker that never registers throws no error, and a track
kept only in memory looks perfect right up until the phone dies. Both of those
actually happened here.

So each promise below is checked by `npm run test:offline`, which runs the real
exported bundle in a real browser with the network cut — not mocks — and runs
on every pull request via `.github/workflows/tests.yml`.

## What is promised

| Promise | How it holds |
| --- | --- |
| The app opens with no signal, after the browser was closed | Service worker precaches the shell **and** the content-hashed bundle it references |
| The trail, its data and its sun times load offline | Trail data and the solar engine are bundled, not fetched |
| The map draws offline | Tiles for the area, downloaded on demand from the trail page |
| GPS recording works offline | `watchPosition` reads the GPS chip; no request is involved |
| A recorded hike is never lost | Every accepted fix is written to device storage as it happens |
| A hike interrupted by a crash is recoverable | The unfinished session is offered back on next launch |
| A hike recorded offline reaches the account | Queued on the device first, uploaded when a session and signal exist |
| Uploading twice cannot duplicate a hike | A hike already filed under the same start instant is treated as the same hike |

## The failure modes this is built against

**The worker that never registered.** Registration sat inside a `load`
listener added after the bundle runs, by which time `load` had fired. Nothing
cached, no error. Now it registers immediately when the document is already
complete, and the test asserts the worker both registers *and* controls the
page.

**The shell without its bundle.** Precaching `/` alone served `index.html`
offline and rendered an empty page, because the app bundle is content-hashed
and cannot be listed by name. The worker now reads the shell it just cached and
pulls the `/_expo` script and stylesheet URLs out of it. The test asserts a
hashed `.js` entry is in the cache.

**The walk that lived in memory.** The track was React state until the walker
pressed Stop. A reclaimed tab, a flat battery or a stray swipe took the whole
hike. Now `src/services/liveTrack.ts` appends each fix to storage as it
arrives, and `UnfinishedHikeBanner` offers back a session that stopped being
updated. The test records offline, reloads mid-hike, and asserts the points
survived and can be filed.

**The upload window.** Saving used to try the network first and queue only on
failure, leaving seconds where the hike existed nowhere but memory. It is now
queued first and dequeued on success.

**The auth call that blocks offline.** `supabase.auth.getUser()` always makes a
`GET /auth/v1/user` request; offline that means waiting for a fetch to fail
before anything is written. The write path reads the stored session instead
(`currentUserId()`), and every request carries a timeout so a connection that
accepts but never answers cannot hang the UI.

**The GPS that was "denied".** A cold fix under tree cover routinely takes
longer than the geolocation timeout, and the old code reported any error as a
denied permission. Only `PERMISSION_DENIED` says that now; the rest says it is
still looking, and the watch stays alive. A screen wake lock is requested while
recording, because a sleeping screen freezes the page and stops the track.

## Known limits

* **Background recording.** The track only advances while the app is in the
  foreground. Locking the phone or switching apps pauses it — the wake lock
  helps, but real background recording needs a foreground service
  (`expo-location`), which is a separate change.
* **Remote images** are not precached, so a trail photo may be missing offline
  while everything functional is present.
* **iOS Safari** evicts site data after weeks of not visiting; installing to
  the home screen is the durable option, which is what the install prompt
  offers.

## Running the checks

```bash
npm run build:web      # or: npx expo export -p web
npm run test:offline   # service worker, offline revisit, recording, recovery
npm run validate:solar # the sun almanac against SunCalc
npm test               # both
```
