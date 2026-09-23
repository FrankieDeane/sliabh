/**
 * Netlify Scheduled Function — second, independent Supabase keep-alive.
 *
 * The Free-tier project pauses after 7 days without activity. The GitHub
 * workflow (.github/workflows/supabase-keepalive.yml) pings it twice a day,
 * but GitHub switches scheduled workflows off in a public repo after 60 days
 * with no commits. This one runs on Netlify's scheduler instead, so the
 * project stays awake even if the repo goes quiet.
 *
 * Only runs on the published production deploy. Logs: Netlify → Logs →
 * Functions → supabase-keepalive. "Run now" in that panel triggers it by hand.
 *
 * The anon key is the same public one in netlify.toml (embedded in the client
 * bundle, gated by Row Level Security). It is repeated here because build
 * environment variables from netlify.toml are not visible to functions at
 * runtime.
 */
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://pfwazngwcvirdeyamvsd.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmd2F6bmd3Y3ZpcmRleWFtdnNkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MzM3OTIsImV4cCI6MjA5NjUwOTc5Mn0.BYVJDsEESyEbZLwA-6W1-GDgYx4Q5ODmHrOeNwzJFD0';

async function ping(path) {
  const res = await fetch(SUPABASE_URL + path, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + SUPABASE_ANON_KEY },
    signal: AbortSignal.timeout(15000),
  });
  return res.status;
}

export default async () => {
  const results = {};
  for (const [name, path] of [
    ['database', '/rest/v1/trail_reports?select=id&limit=1'],
    ['auth', '/auth/v1/health'],
  ]) {
    try {
      results[name] = await ping(path);
    } catch (err) {
      results[name] = String(err && err.message ? err.message : err);
    }
  }
  const ok = Object.values(results).every((s) => typeof s === 'number' && s >= 200 && s < 300);
  console[ok ? 'log' : 'error']('[supabase-keepalive]', ok ? 'ok' : 'FAILED', JSON.stringify(results));
  return new Response(JSON.stringify({ ok, results }), {
    status: ok ? 200 : 502,
    headers: { 'Content-Type': 'application/json' },
  });
};

// Midnight UTC (21:00 Argentina): between the two GitHub pings.
export const config = { schedule: '0 0 * * *' };
