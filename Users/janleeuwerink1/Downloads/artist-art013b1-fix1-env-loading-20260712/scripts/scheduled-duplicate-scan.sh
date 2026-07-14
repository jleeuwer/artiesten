#!/usr/bin/env bash
set -euo pipefail

# ART-015D-3B
# Wrapper for scheduled duplicate scans. Designed for cron and macOS launchd.
# It writes timestamped logs into the application logs/ directory and then
# delegates to the existing npm run scan:duplicates command.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="${ARTIST_SCHEDULER_LOG_DIR:-$ROOT_DIR/logs}"
STAMP="$(date +%Y%m%d-%H%M%S)"
LOG_FILE="$LOG_DIR/duplicate-scan-$STAMP.log"

mkdir -p "$LOG_DIR"
cd "$ROOT_DIR"

{
  echo "[ART-015D-3B] scheduled duplicate scan started at $(date -Iseconds)"
  echo "[ART-015D-3B] app_dir=$ROOT_DIR"
  echo "[ART-015D-3B] log_file=$LOG_FILE"
  echo "[ART-015D-3B] command=npm run scan:duplicates ${*:-}"
} | tee -a "$LOG_FILE"

npm run scan:duplicates -- "$@" 2>&1 | tee -a "$LOG_FILE"

status=${PIPESTATUS[0]}
if [[ "$status" -eq 0 ]]; then
  echo "[ART-015D-3B] scheduled duplicate scan completed at $(date -Iseconds)" | tee -a "$LOG_FILE"
else
  echo "[ART-015D-3B] scheduled duplicate scan failed with status=$status at $(date -Iseconds)" | tee -a "$LOG_FILE"
fi
exit "$status"
