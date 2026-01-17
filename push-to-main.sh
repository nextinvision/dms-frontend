#!/bin/bash
set -e

echo "🚀 Pushing production frontend to GitHub main"
echo "Started at $(date)"

cd /home/fortytwoev/dms-frontend

CURRENT_BRANCH=$(git branch --show-current 2>/dev/null || true)
if [ -z "$CURRENT_BRANCH" ]; then
    echo "❌ Not on a branch (detached HEAD). Please checkout main."
    exit 1
fi

if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "📝 Switching to main branch..."
    git checkout main
fi

echo "📦 Staging all changes..."
git add -A

if git diff --staged --quiet; then
    echo "ℹ️  No changes to commit. Everything is up to date."
    exit 0
fi

echo "💾 Committing changes..."
git commit -m "chore: production update - $(date +%Y-%m-%d\ %H:%M:%S)"

echo "🔄 Fetching latest main..."
git fetch origin main

echo "🧩 Rebasing main onto origin/main..."
git rebase origin/main

echo "📤 Pushing to GitHub main..."
git push origin main

echo "✅ Successfully pushed production to GitHub main"
echo "🔁 Updating dev frontend from main..."
DEV_DIR="/home/fortytwoev/dms-dev/frontend"
if [ -n "$(git -C "$DEV_DIR" status --porcelain)" ]; then
    echo "⚠️  Dev frontend has uncommitted changes. Skipping pull."
else
    git -C "$DEV_DIR" fetch origin main
    git -C "$DEV_DIR" pull --rebase origin main
    echo "✅ Dev frontend updated from main"
fi
echo "Completed at $(date)"
