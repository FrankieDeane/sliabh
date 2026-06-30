#!/usr/bin/env bash
#
# Netlify "ignore" command — decides whether a build should run.
#   exit 0  => SKIP the build (no build minutes spent, no deploy created)
#   exit 1  => RUN the build
#
# Goals:
#   1. Stop spending build minutes on deploy previews / branch deploys that
#      nobody is actively reviewing. Previews become OPT-IN: add the
#      "deploy-preview" label to the PR to get one.
#   2. On production, only rebuild when files that actually affect the web
#      export changed (a docs-only or README push won't trigger a build).
#
# Netlify provides these env vars at ignore-time:
#   CONTEXT            production | deploy-preview | branch-deploy
#   COMMIT_REF         current commit SHA
#   CACHED_COMMIT_REF  SHA of the last successfully built commit
#   REVIEW_ID          PR number (deploy-preview only)
#   REPOSITORY_URL     e.g. https://github.com/FrankieDeane/sliabh
#
# Optional: set GITHUB_TOKEN (repo:read) in the Netlify build environment to
# enable the per-PR label opt-in. Without it, previews are simply skipped.

set -uo pipefail

# Paths whose changes should trigger a production rebuild.
RELEVANT="app src public package.json package-lock.json netlify.toml netlify app.json metro.config.js babel.config.js tailwind.config.js global.css tsconfig.json"

PREVIEW_LABEL="deploy-preview"

log() { echo "[ignore-build] $*"; }

# ── 1. Deploy previews & branch deploys: skip unless explicitly opted in ──
if [ "${CONTEXT:-}" = "deploy-preview" ] || [ "${CONTEXT:-}" = "branch-deploy" ]; then
  if [ -n "${GITHUB_TOKEN:-}" ] && [ -n "${REVIEW_ID:-}" ] && [ -n "${REPOSITORY_URL:-}" ]; then
    repo="${REPOSITORY_URL##*github.com/}"; repo="${repo%.git}"
    labels="$(curl -sf \
      -H "Authorization: Bearer ${GITHUB_TOKEN}" \
      -H "Accept: application/vnd.github+json" \
      "https://api.github.com/repos/${repo}/issues/${REVIEW_ID}/labels" 2>/dev/null || true)"
    if printf '%s' "$labels" | grep -q "\"name\"[[:space:]]*:[[:space:]]*\"${PREVIEW_LABEL}\""; then
      log "PR #${REVIEW_ID} has '${PREVIEW_LABEL}' label -> BUILD preview."
      exit 1
    fi
    log "PR #${REVIEW_ID} has no '${PREVIEW_LABEL}' label -> SKIP preview."
    exit 0
  fi
  log "${CONTEXT} without GITHUB_TOKEN/label opt-in -> SKIP to save build minutes."
  exit 0
fi

# ── 2. Production (and anything else): build only on relevant changes ──
if [ -n "${CACHED_COMMIT_REF:-}" ] && [ -n "${COMMIT_REF:-}" ]; then
  if git diff --quiet "${CACHED_COMMIT_REF}" "${COMMIT_REF}" -- $RELEVANT; then
    log "No changes in build-relevant paths since last deploy -> SKIP build."
    exit 0
  fi
  log "Relevant changes detected -> BUILD."
  exit 1
fi

# No cached ref to compare against (e.g. first build) -> build to be safe.
log "No cached commit to diff against -> BUILD."
exit 1
