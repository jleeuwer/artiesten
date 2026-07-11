#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$ROOT_DIR/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/artist-duplicate-scanner-wrapper-$(date +%Y%m%d-%H%M%S).log"

ENV_FILE="${ARTIST_ENV_FILE:-$ROOT_DIR/.env}"
MIN_SCORE="${ARTIST_DUPLICATE_MIN_SCORE:-82}"
MAX_CANDIDATES="${ARTIST_DUPLICATE_MAX_CANDIDATES:-500}"

cd "$ROOT_DIR"
echo "[ART-015D-1] env=$ENV_FILE min_score=$MIN_SCORE max_candidates=$MAX_CANDIDATES" | tee -a "$LOG_FILE"
python3 scripts/artist_duplicate_scanner.py \
  --env "$ENV_FILE" \
  --min-score "$MIN_SCORE" \
  --max-candidates "$MAX_CANDIDATES" \
  --log-dir "$LOG_DIR" \
  "$@" 2>&1 | tee -a "$LOG_FILE"
