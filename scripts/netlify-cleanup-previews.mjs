#!/usr/bin/env node
/**
 * Bulk-delete old Netlify deploy previews & branch deploys to stop bots from
 * hammering hundreds of throwaway `<hash>--sliabh.netlify.app` URLs.
 *
 * SAFE BY DEFAULT: runs as a dry-run (lists what it WOULD delete) unless you
 * pass --execute. It never touches:
 *   - the current live production deploy,
 *   - any deploy with context "production",
 *   - the most recent successful (state=ready) deploy of each real branch.
 *
 * Usage:
 *   NETLIFY_AUTH_TOKEN=xxxx node scripts/netlify-cleanup-previews.mjs            # dry-run
 *   NETLIFY_AUTH_TOKEN=xxxx node scripts/netlify-cleanup-previews.mjs --execute  # delete
 *
 * Env:
 *   NETLIFY_AUTH_TOKEN  (required)  Personal access token (User settings → Applications).
 *   NETLIFY_SITE_ID     (optional)  Skip name lookup; e.g. the site's API ID.
 *   SITE_NAME           (optional)  Defaults to "sliabh".
 *   AVG_DEPLOY_MB       (optional)  Avg deploy size for the storage estimate (default 8).
 *
 * Requires Node 18+ (uses global fetch).
 */

const API = 'https://api.netlify.com/api/v1';
const TOKEN = process.env.NETLIFY_AUTH_TOKEN;
const SITE_NAME = process.env.SITE_NAME || 'sliabh';
const AVG_DEPLOY_MB = Number(process.env.AVG_DEPLOY_MB || 8);
const EXECUTE = process.argv.includes('--execute');

if (!TOKEN) {
  console.error('✖ NETLIFY_AUTH_TOKEN is not set. Aborting.');
  process.exit(1);
}

const headers = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(path, init = {}) {
  const res = await fetch(`${API}${path}`, { ...init, headers });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${init.method || 'GET'} ${path} -> ${res.status} ${res.statusText} ${body}`);
  }
  return res.status === 204 ? null : res.json();
}

async function resolveSite() {
  if (process.env.NETLIFY_SITE_ID) {
    const site = await api(`/sites/${process.env.NETLIFY_SITE_ID}`);
    return site;
  }
  const sites = await api(`/sites?name=${encodeURIComponent(SITE_NAME)}`);
  const exact = sites.find((s) => s.name === SITE_NAME) || sites[0];
  if (!exact) throw new Error(`No site matching name "${SITE_NAME}"`);
  return exact;
}

async function fetchAllDeploys(siteId) {
  const all = [];
  for (let page = 1; ; page++) {
    const batch = await api(`/sites/${siteId}/deploys?per_page=100&page=${page}`);
    if (!Array.isArray(batch) || batch.length === 0) break;
    all.push(...batch);
    if (batch.length < 100) break;
  }
  return all;
}

function plan(deploys, publishedId) {
  // Keep the newest ready deploy per branch-deploy branch.
  const newestPerBranch = new Map();
  for (const d of deploys) {
    if (d.context !== 'branch-deploy' || d.state !== 'ready') continue;
    const cur = newestPerBranch.get(d.branch);
    if (!cur || new Date(d.created_at) > new Date(cur.created_at)) newestPerBranch.set(d.branch, d);
  }

  const toDelete = [];
  const kept = [];
  for (const d of deploys) {
    const isPreview = d.context === 'deploy-preview' || d.context === 'branch-deploy';
    const isLivePublished = d.id === publishedId;
    const isProduction = d.context === 'production';
    const isNewestForBranch =
      d.context === 'branch-deploy' && newestPerBranch.get(d.branch)?.id === d.id;

    if (isPreview && !isLivePublished && !isProduction && !isNewestForBranch) {
      toDelete.push(d);
    } else {
      kept.push(d);
    }
  }
  return { toDelete, kept };
}

function summarize(label, deploys) {
  const by = {};
  for (const d of deploys) by[d.context] = (by[d.context] || 0) + 1;
  const parts = Object.entries(by).map(([k, v]) => `${k}: ${v}`).join(', ') || '(none)';
  console.log(`  ${label}: ${deploys.length}  [${parts}]`);
}

(async () => {
  console.log(`\n${EXECUTE ? '⚠️  EXECUTE MODE — will DELETE' : '🔎 DRY RUN — no changes'} `);
  const site = await resolveSite();
  const publishedId = site.published_deploy?.id;
  console.log(`Site: ${site.name} (${site.id})  live deploy: ${publishedId || 'unknown'}\n`);

  const deploys = await fetchAllDeploys(site.id);
  console.log(`Fetched ${deploys.length} total deploys.`);
  summarize('All', deploys);

  const { toDelete, kept } = plan(deploys, publishedId);
  summarize('Keep', kept);
  summarize('Delete', toDelete);

  const freedMb = toDelete.length * AVG_DEPLOY_MB;
  console.log(
    `\nEstimated storage freed: ~${freedMb} MB (${toDelete.length} × ${AVG_DEPLOY_MB} MB est.).`,
  );
  console.log(
    'Note: this frees STORED deploys and removes the URLs bots crawl. Past bandwidth\n' +
      'is already spent — the win is FORWARD: deleted URLs return 404 instead of serving\n' +
      'the full bundle, so future bot traffic costs ~nothing.',
  );

  if (!EXECUTE) {
    console.log(`\nDry run only. Re-run with --execute to delete ${toDelete.length} deploys.\n`);
    return;
  }

  console.log(`\nDeleting ${toDelete.length} deploys...`);
  let ok = 0, fail = 0;
  for (const [i, d] of toDelete.entries()) {
    try {
      await api(`/sites/${site.id}/deploys/${d.id}`, { method: 'DELETE' });
      ok++;
    } catch (e) {
      fail++;
      console.error(`  ✖ ${d.id} (${d.context}): ${e.message}`);
    }
    if ((i + 1) % 25 === 0) console.log(`  ...${i + 1}/${toDelete.length}`);
    await sleep(120); // be gentle with the API rate limit
  }
  console.log(`\nDone. Deleted ${ok}, failed ${fail}.\n`);
})().catch((e) => {
  console.error(`\n✖ ${e.message}\n`);
  process.exit(1);
});
