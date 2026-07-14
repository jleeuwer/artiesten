#!/usr/bin/env bash
set -euo pipefail

# Installs/updates a managed crontab block for the artist duplicate scanner.
# Defaults to weekly on Sunday at 09:00.
# Override with CRON_SCHEDULE, e.g.:
#   CRON_SCHEDULE="30 7 * * *" bash scripts/install-cron-duplicate-scan.sh

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCHEDULE="${CRON_SCHEDULE:-0 9 * * 0}"
SCRIPT_PATH="$ROOT_DIR/scripts/scheduled-duplicate-scan.sh"
BEGIN_MARKER="# BEGIN ARTIST_DUPLICATE_SCAN"
END_MARKER="# END ARTIST_DUPLICATE_SCAN"
ENTRY="$SCHEDULE $SCRIPT_PATH"

if [[ ! -x "$SCRIPT_PATH" ]]; then
  chmod +x "$SCRIPT_PATH"
fi

tmp_current="$(mktemp)"
tmp_new="$(mktemp)"
trap 'rm -f "$tmp_current" "$tmp_new"' EXIT

crontab -l > "$tmp_current" 2>/dev/null || true

awk -v begin="$BEGIN_MARKER" -v end="$END_MARKER" '
  $0 == begin {skip=1; next}
  $0 == end {skip=0; next}
  skip != 1 {print}
' "$tmp_current" > "$tmp_new"

{
  cat "$tmp_new"
  echo "$BEGIN_MARKER"
  echo "$ENTRY"
  echo "$END_MARKER"
} | crontab -

echo "[ART-015D-3B] Installed cron schedule: $ENTRY"
echo "[ART-015D-3B] View with: crontab -l"
