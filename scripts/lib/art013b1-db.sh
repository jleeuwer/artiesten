#!/usr/bin/env bash
set -euo pipefail

ART013B1_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ART013B1_PROJECT_DIR="$(cd "${ART013B1_SCRIPT_DIR}/.." && pwd)"
ART013B1_ENV_FILE="${ART013B1_PROJECT_DIR}/.env"

art013b1_load_env() {
  if [[ -f "${ART013B1_ENV_FILE}" ]]; then
    set -a
    # shellcheck disable=SC1090
    source "${ART013B1_ENV_FILE}"
    set +a
  fi

  DB_CONTAINER="${ARTIST_DB_CONTAINER:-my-postgresdb}"
  DB_USER="${ARTIST_DB_USER:-postgres}"
  DB_NAME="${ARTIST_DB_NAME:-musicdb}"
  export DB_CONTAINER DB_USER DB_NAME
}

art013b1_require_docker() {
  if ! command -v docker >/dev/null 2>&1; then
    echo "[BLOCKER][ART013B1-DOCKER-MISSING] Docker CLI is niet beschikbaar." >&2
    return 20
  fi
  if ! docker inspect "${DB_CONTAINER}" >/dev/null 2>&1; then
    echo "[BLOCKER][ART013B1-CONTAINER-MISSING] PostgreSQL-container '${DB_CONTAINER}' is niet bereikbaar. Controleer ARTIST_DB_CONTAINER in .env." >&2
    return 21
  fi
}

art013b1_psql() {
  docker exec -i "${DB_CONTAINER}" psql -X -v ON_ERROR_STOP=1 -U "${DB_USER}" -d "${DB_NAME}" "$@"
}

art013b1_psql_file() {
  local file="$1"
  shift || true
  art013b1_psql "$@" < "${file}"
}

art013b1_connection_label() {
  printf '%s/%s as %s' "${DB_CONTAINER}" "${DB_NAME}" "${DB_USER}"
}
