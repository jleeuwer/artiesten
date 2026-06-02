#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env"
SQL_FILE="${ROOT_DIR}/scripts/sql/20260526_art015d2a_duplicate_scanner_rerun_hardening.sql"
LOG_DIR="${ROOT_DIR}/logs"
mkdir -p "${LOG_DIR}"
LOG_FILE="${LOG_DIR}/db-migrate-art015d2a-$(date +%Y%m%d-%H%M%S).log"

if [[ -f "${ENV_FILE}" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "${ENV_FILE}"
  set +a
fi

ARTIST_DB_CONTAINER="${ARTIST_DB_CONTAINER:-my-postgresdb}"
ARTIST_DB_USER="${ARTIST_DB_USER:-postgres}"
ARTIST_DB_NAME="${ARTIST_DB_NAME:-musicdb}"

{
  echo "[INFO] ART-015D-2A duplicate scanner rerun hardening migration"
  echo "[INFO] sql_file=${SQL_FILE}"
  echo "[INFO] container=${ARTIST_DB_CONTAINER} db=${ARTIST_DB_NAME} user=${ARTIST_DB_USER}"
  docker exec -i "${ARTIST_DB_CONTAINER}" psql -v ON_ERROR_STOP=1 -U "${ARTIST_DB_USER}" -d "${ARTIST_DB_NAME}" < "${SQL_FILE}"
  echo "[INFO] migration completed"
} 2>&1 | tee "${LOG_FILE}"
