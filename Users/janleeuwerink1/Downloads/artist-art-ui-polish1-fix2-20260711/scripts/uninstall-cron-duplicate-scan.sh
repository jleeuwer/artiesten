#!/usr/bin/env bash
set -euo pipefail

BEGIN_MARKER="# BEGIN ARTIST_DUPLICATE_SCAN"
END_MARKER="# END ARTIST_DUPLICATE_SCAN"

tmp_current="$(mktemp)"
tmp_new="$(mktemp)"
trap 'rm -f "$tmp_current" "$tmp_new"' EXIT

crontab -l > "$tmp_current" 2>/dev/null || true
awk -v begin="$BEGIN_MARKER" -v end="$END_MARKER" '
  $0 == begin {skip=1; next}
  $0 == end {skip=0; next}
  skip != 1 {print}
' "$tmp_current" > "$tmp_new"
crontab "$tmp_new"

echo "[ART-015D-3B] Removed managed cron block if it existed."
