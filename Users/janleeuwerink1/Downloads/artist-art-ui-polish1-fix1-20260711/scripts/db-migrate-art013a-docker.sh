#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="${PROJECT_DIR}/.env"
SQL_FILE="${PROJECT_DIR}/scripts/sql/20260609_art013a_artist_to_musician_sync.sql"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

DB_CONTAINER="${ARTIST_DB_CONTAINER:-my-postgresdb}"
DB_USER="${ARTIST_DB_USER:-postgres}"
DB_NAME="${ARTIST_DB_NAME:-musicdb}"

echo "[ART-013A] Applying artist -> musician sync trigger to ${DB_CONTAINER}/${DB_NAME} as ${DB_USER}"
docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" < "$SQL_FILE"
echo "[ART-013A] Migration completed"
