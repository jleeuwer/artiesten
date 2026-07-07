#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="${PROJECT_DIR}/.env"
SQL_FILE="${PROJECT_DIR}/scripts/sql/20260608_art012e4_enrichment_proposals_apply.sql"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

DB_CONTAINER="${ARTIST_DB_CONTAINER:-my-postgresdb}"
DB_USER="${ARTIST_DB_USER:-postgres}"
DB_NAME="${ARTIST_DB_NAME:-musicdb}"

echo "[ART-012E-4] Applying Discogs enrichment proposal apply migration using container=${DB_CONTAINER} db=${DB_NAME} user=${DB_USER}"
docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$DB_NAME" < "$SQL_FILE"
echo "[ART-012E-4] Migration completed"
