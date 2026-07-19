#!/usr/bin/env bash
set -euo pipefail

# UI-only sprint database preflight.
# Confirms that the configured PostgreSQL Docker container is reachable and
# that the existing artist schema can be queried. No schema changes are made.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

if [[ -f .ENV ]]; then
  set -a
  # shellcheck disable=SC1091
  source .ENV
  set +a
elif [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

DB_CONTAINER="${DB_CONTAINER:-${POSTGRES_CONTAINER:-postgres}}"
DB_NAME="${DB_NAME:-${POSTGRES_DB:-musicdb}}"
DB_USER="${DB_USER:-${POSTGRES_USER:-postgres}}"

if ! command -v docker >/dev/null 2>&1; then
  echo "[ART-UI-DETAIL-SCROLL][ERROR] docker is niet beschikbaar." >&2
  exit 1
fi

if ! docker inspect "$DB_CONTAINER" >/dev/null 2>&1; then
  echo "[ART-UI-DETAIL-SCROLL][ERROR] PostgreSQL-container '$DB_CONTAINER' bestaat niet of is niet bereikbaar." >&2
  echo "Stel DB_CONTAINER of POSTGRES_CONTAINER in via .ENV/.env." >&2
  exit 1
fi

if [[ "$(docker inspect -f '{{.State.Running}}' "$DB_CONTAINER")" != "true" ]]; then
  echo "[ART-UI-DETAIL-SCROLL][ERROR] PostgreSQL-container '$DB_CONTAINER' draait niet." >&2
  exit 1
fi

echo "[ART-UI-DETAIL-SCROLL] Controle PostgreSQL-container: $DB_CONTAINER"
docker exec -i "$DB_CONTAINER" psql -v ON_ERROR_STOP=1 -U "$DB_USER" -d "$DB_NAME" <<'SQL'
SELECT current_database() AS database_name, current_user AS database_user;
SELECT to_regclass('public.artist') AS artist_table;
SQL

echo "[ART-UI-DETAIL-SCROLL] Preflight geslaagd. Deze sprint vereist geen schemawijziging."
