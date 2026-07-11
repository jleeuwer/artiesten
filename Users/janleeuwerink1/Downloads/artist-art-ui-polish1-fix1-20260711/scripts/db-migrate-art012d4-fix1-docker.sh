#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env"
BASE_SQL_FILE="${SCRIPT_DIR}/sql/20260608_art012d4_discogs_name_proposals_reviewqueue.sql"
FIX_SQL_FILE="${SCRIPT_DIR}/sql/20260608_art012d4_fix1_name_proposal_reviewqueue_hardening.sql"

if [[ -f "${ENV_FILE}" ]]; then
  # shellcheck disable=SC1090
  set -a
  source "${ENV_FILE}"
  set +a
fi

DB_CONTAINER="${ARTIST_DB_CONTAINER:-${DB_CONTAINER:-my-postgresdb}}"
DB_NAME="${ARTIST_DB_NAME:-${DB_NAME:-musicdb}}"
DB_USER="${ARTIST_DB_USER:-${DB_USER:-postgres}}"

if [[ ! -f "${BASE_SQL_FILE}" ]]; then
  echo "Base SQL file not found: ${BASE_SQL_FILE}" >&2
  exit 1
fi

if [[ ! -f "${FIX_SQL_FILE}" ]]; then
  echo "Fix SQL file not found: ${FIX_SQL_FILE}" >&2
  exit 1
fi

echo "[ART-012D-4-Fix-1] Checking base table public.artist_name_proposals in ${DB_CONTAINER}/${DB_NAME} as ${DB_USER}"
TABLE_EXISTS="$(docker exec -i "${DB_CONTAINER}" psql -U "${DB_USER}" -d "${DB_NAME}" -tAc "select to_regclass('public.artist_name_proposals') is not null")"

if [[ "${TABLE_EXISTS}" != "t" ]]; then
  echo "[ART-012D-4-Fix-1] Base table missing; applying ART-012D-4 base migration first: ${BASE_SQL_FILE}"
  docker exec -i "${DB_CONTAINER}" psql -U "${DB_USER}" -d "${DB_NAME}" -v ON_ERROR_STOP=1 < "${BASE_SQL_FILE}"
else
  echo "[ART-012D-4-Fix-1] Base table already exists; skipping ART-012D-4 base migration"
fi

echo "[ART-012D-4-Fix-1] Applying hardening migration: ${FIX_SQL_FILE}"
docker exec -i "${DB_CONTAINER}" psql -U "${DB_USER}" -d "${DB_NAME}" -v ON_ERROR_STOP=1 < "${FIX_SQL_FILE}"
echo "[ART-012D-4-Fix-1] Done"
