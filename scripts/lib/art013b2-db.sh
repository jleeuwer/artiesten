#!/usr/bin/env bash
set -euo pipefail
ART013B2_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ART013B2_PROJECT_DIR="$(cd "${ART013B2_SCRIPT_DIR}/.." && pwd)"
ART013B2_ENV_FILE="${ART013B2_PROJECT_DIR}/.env"
art013b2_load_env(){ if [[ -f "${ART013B2_ENV_FILE}" ]]; then set -a; source "${ART013B2_ENV_FILE}"; set +a; fi; DB_CONTAINER="${ARTIST_DB_CONTAINER:-my-postgresdb}"; DB_USER="${ARTIST_DB_USER:-postgres}"; DB_NAME="${ARTIST_DB_NAME:-musicdb}"; export DB_CONTAINER DB_USER DB_NAME; }
art013b2_require_docker(){ command -v docker >/dev/null 2>&1 || { echo '[BLOCKER][ART013B2-DOCKER-MISSING] Docker CLI ontbreekt.' >&2; return 20; }; docker inspect "${DB_CONTAINER}" >/dev/null 2>&1 || { echo "[BLOCKER][ART013B2-CONTAINER-MISSING] ${DB_CONTAINER} niet bereikbaar." >&2; return 21; }; }
art013b2_psql(){ docker exec -i "${DB_CONTAINER}" psql -X -v ON_ERROR_STOP=1 -U "${DB_USER}" -d "${DB_NAME}" "$@"; }
art013b2_psql_file(){ local f="$1"; shift || true; art013b2_psql "$@" < "$f"; }
