#!/usr/bin/env bash
set -euo pipefail
VAL1_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VAL1_PROJECT_DIR="$(cd "${VAL1_SCRIPT_DIR}/.." && pwd)"
val1_load_env() {
  if [[ -f "${VAL1_PROJECT_DIR}/.env" ]]; then set -a; source "${VAL1_PROJECT_DIR}/.env"; set +a; fi
  DB_CONTAINER="${ARTIST_DB_CONTAINER:-my-postgresdb}"
  DB_USER="${ARTIST_DB_USER:-postgres}"
  DB_NAME="${ARTIST_DB_NAME:-musicdb}"
  export DB_CONTAINER DB_USER DB_NAME
}
val1_require_docker() {
  command -v docker >/dev/null 2>&1 || { echo '[BLOCKER][ART012D4-VAL1] Docker CLI ontbreekt.' >&2; return 20; }
  docker inspect "${DB_CONTAINER}" >/dev/null 2>&1 || { echo "[BLOCKER][ART012D4-VAL1] Container ${DB_CONTAINER} niet bereikbaar." >&2; return 21; }
}
val1_psql() { docker exec -i "${DB_CONTAINER}" psql -X -v ON_ERROR_STOP=1 -U "${DB_USER}" -d "${DB_NAME}" "$@"; }
val1_psql_file() { val1_psql < "$1"; }
