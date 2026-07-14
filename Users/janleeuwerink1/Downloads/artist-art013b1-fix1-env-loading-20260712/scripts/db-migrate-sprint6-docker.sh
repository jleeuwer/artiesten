#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SQL_FILE="${ROOT_DIR}/scripts/sql/20260519_artists_sprint6_favorites.sql"
LOG_DIR="${ROOT_DIR}/logs"
STAMP="$(date +%Y%m%d-%H%M%S)"
LOG_FILE="${LOG_DIR}/artists-sprint6-migration-${STAMP}.log"

DB_CONTAINER="${ARTIST_DB_CONTAINER:-my-postgresdb}"
DB_USER="${ARTIST_DB_USER:-postgres}"
DB_NAME="${ARTIST_DB_NAME:-musicdb}"

mkdir -p "${LOG_DIR}"

if [[ ! -f "${SQL_FILE}" ]]; then
  echo "[artist:migrate] SQL file not found: ${SQL_FILE}" | tee "${LOG_FILE}"
  exit 1
fi

if ! docker ps --format '{{.Names}}' | grep -Fxq "${DB_CONTAINER}"; then
  echo "[artist:migrate] PostgreSQL container not running/found: ${DB_CONTAINER}" | tee "${LOG_FILE}"
  echo "[artist:migrate] Set ARTIST_DB_CONTAINER=<container-name> when your container has a different name." | tee -a "${LOG_FILE}"
  exit 1
fi

echo "[artist:migrate] mode=docker-exec" | tee "${LOG_FILE}"
echo "[artist:migrate] container=${DB_CONTAINER}" | tee -a "${LOG_FILE}"
echo "[artist:migrate] database=${DB_NAME}" | tee -a "${LOG_FILE}"
echo "[artist:migrate] user=${DB_USER}" | tee -a "${LOG_FILE}"
echo "[artist:migrate] sql_file=${SQL_FILE}" | tee -a "${LOG_FILE}"

docker exec -i "${DB_CONTAINER}" psql -U "${DB_USER}" -d "${DB_NAME}" < "${SQL_FILE}" 2>&1 | tee -a "${LOG_FILE}"

echo "[artist:migrate] done" | tee -a "${LOG_FILE}"
