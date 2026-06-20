#!/usr/bin/env bash
set -euo pipefail

# Builds a small Hostinger upload zip: folder "xaviklinika/" at zip root (matches Hostinger root directory).
# Excludes node_modules, build output, git, and local env files.

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/hostinger-deploy.zip"
STAGE="$(mktemp -d)"

cleanup() {
  rm -rf "$STAGE"
}
trap cleanup EXIT

mkdir -p "$STAGE/xaviklinika"

rsync -a \
  --exclude node_modules \
  --exclude .next \
  --exclude out \
  --exclude build \
  --exclude coverage \
  --exclude .git \
  --exclude '.env*' \
  --exclude '*.log' \
  --exclude .DS_Store \
  --exclude hostinger-deploy.zip \
  --exclude .cursor \
  "$ROOT/" "$STAGE/xaviklinika/"

(
  cd "$STAGE"
  rm -f "$OUT"
  zip -r -q "$OUT" xaviklinika
)

echo "OK: $OUT"
ls -lh "$OUT"
