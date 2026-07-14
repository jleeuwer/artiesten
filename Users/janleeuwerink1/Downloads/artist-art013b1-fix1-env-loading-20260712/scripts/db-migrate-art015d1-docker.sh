#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SQL_FILE="$ROOT_DIR/scripts/sql/20260526_art015d1_duplicate_scanner_staging.sql"
LOG_DIR="$ROOT_DIR/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/art015d1-migration-$(date +%Y%m%d-%H%M%S).log"

CONTAINER="${ARTIST_DB_CONTAINER:-my-postgresdb}"
DB_USER="${ARTIST_DB_USER:-postgres}"
DB_NAME="${ARTIST_DB_NAME:-musicdb}"

echo "[ART-015D-1] container=$CONTAINER db_user=$DB_USER db_name=$DB_NAME sql_file=$SQL_FILE" | tee -a "$LOG_FILE"
if [[ ! -f "$SQL_FILE" ]]; then
  echo "[ART-015D-1] SQL file not found: $SQL_FILE" | tee -a "$LOG_FILE"
  exit 1
fi

docker exec -i "$CONTAINER" psql -v ON_ERROR_STOP=1 -U "$DB_USER" -d "$DB_NAME" < "$SQL_FILE" 2>&1 | tee -a "$LOG_FILE"
echo "[ART-015D-1] migration complete log_file=$LOG_FILE" | tee -a "$LOG_FILE"
