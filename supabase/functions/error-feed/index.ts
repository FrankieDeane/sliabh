// Supabase Edge Function — the error alerts as a private RSS feed.
// Deployed name: `error-feed`.
//
// Zapier has no Supabase trigger, but "RSS by Zapier → New Item in Feed" is
// free, so the rows in `error_alerts` are published here and a two-step Zap
// (RSS → Gmail) turns each new item into an email. See docs/TELEMETRY.md.
//
// Security: no JWT (Zapier cannot send one). The URL carries a long random
// token that `error_alerts_feed()` checks against `private.settings`; a wrong
// or missing token gets a 403 and nothing else.

import { createClient } from 'jsr:@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

const TABLE_URL = 'https://supabase.com/dashboard/project/pfwazngwcvirdeyamvsd/editor';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** HTML for the email body: kept inside CDATA, so only "]]>" needs breaking. */
const cdata = (s: string) => `<![CDATA[${s.replace(/]]>/g, ']]]]><![CDATA[>')}]]>`;

interface AlertRow {
  id: number;
  created_at: string;
  subject: string;
  body: string;
}

Deno.serve(async (req) => {
  const token = new URL(req.url).searchParams.get('token') ?? '';
  const { data, error } = await supabase.rpc('error_alerts_feed', { p_token: token });
  if (error) {
    const forbidden = error.message?.includes('forbidden');
    return new Response(forbidden ? 'forbidden' : 'error', { status: forbidden ? 403 : 500 });
  }

  const items = (data as AlertRow[]).map((r) => {
    const html = `<pre style="font-family:ui-monospace,Menlo,Consolas,monospace;font-size:13px;white-space:pre-wrap">${esc(r.body)}</pre>`
      + `<p><a href="${TABLE_URL}">Open app_errors in Supabase</a></p>`;
    return `<item>
  <guid isPermaLink="false">sliabh-error-alert-${r.id}</guid>
  <title>${esc(r.subject)}</title>
  <link>${TABLE_URL}</link>
  <pubDate>${new Date(r.created_at).toUTCString()}</pubDate>
  <description>${cdata(html)}</description>
</item>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>Sliabh error alerts</title>
  <link>${TABLE_URL}</link>
  <description>Errors from real users and the weekly summary.</description>
${items.join('\n')}
</channel>
</rss>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8', 'Cache-Control': 'no-store' },
  });
});
