#!/usr/bin/env bash
set -euo pipefail

# Deploy `dist/` to the `gh-pages` branch (root) using a git worktree.
# Expects `origin` remote to be set and authenticated (PAT recommended).

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  echo "error: not a git repo: $ROOT_DIR" >&2
  exit 1
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  echo "error: remote 'origin' is not configured" >&2
  exit 1
fi

echo "[deploy] install/test/build"
bun install
bun test
bun run build

if [ ! -d "dist" ]; then
  echo "error: dist/ not found after build" >&2
  exit 1
fi

DEPLOY_DIR=".gh-pages-worktree"
BRANCH="gh-pages"

echo "[deploy] preparing worktree ($BRANCH)"
rm -rf "$DEPLOY_DIR"

# If branch exists remotely, base on it; otherwise create new.
if git ls-remote --exit-code --heads origin "$BRANCH" >/dev/null 2>&1; then
  git fetch origin "$BRANCH":"refs/remotes/origin/$BRANCH" >/dev/null
  git worktree add -B "$BRANCH" "$DEPLOY_DIR" "origin/$BRANCH"
else
  git worktree add -B "$BRANCH" "$DEPLOY_DIR"
fi

echo "[deploy] syncing dist/ -> $BRANCH"
cd "$DEPLOY_DIR"
rm -rf ./*
cp -R ../dist/* ./
touch .nojekyll

git add -A
if git diff --cached --quiet; then
  echo "[deploy] no changes to publish"
  cd "$ROOT_DIR"
  git worktree remove "$DEPLOY_DIR" --force
  exit 0
fi

STAMP="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
git commit -m "Deploy ${STAMP}"
git push origin "$BRANCH"

cd "$ROOT_DIR"
git worktree remove "$DEPLOY_DIR" --force
echo "[deploy] done"

