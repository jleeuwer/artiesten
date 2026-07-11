#!/usr/bin/env bash
set -euo pipefail

ART013A2_SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ART013A2_PROJECT_DIR="$(cd "${ART013A2_SCRIPT_DIR}/.." && pwd)"
ART013A2_ENV_FILE="${ART013A2_PROJECT_DIR}/.env"

art013a2_load_env() {
  if [[ -f "${ART013A2_ENV_FILE}" ]]; then
    set -a
    # shellcheck disable=SC1090
    source "${ART013A2_ENV_FILE}"
    set +a
  fi

  DB_CONTAINER="${ARTIST_DB_CONTAINER:-my-postgresdb}"
  DB_USER="${ARTIST_DB_USER:-postgres}"
  DB_NAME="${ARTIST_DB_NAME:-musicdb}"
  export DB_CONTAINER DB_USER DB_NAME
}

art013a2_require_docker() {
  if ! command -v docker >/dev/null 2>&1; then
    echo "[BLOCKER][ART013A2-DOCKER-MISSING] Docker CLI is niet beschikbaar." >&2
    return 20
  fi
  if ! docker inspect "${DB_CONTAINER}" >/dev/null 2>&1; then
    echo "[BLOCKER][ART013A2-CONTAINER-MISSING] PostgreSQL-container '${DB_CONTAINER}' is niet bereikbaar." >&2
    return 21
  fi
}

art013a2_psql() {
  docker exec -i "${DB_CONTAINER}" psql -X -v ON_ERROR_STOP=1 -U "${DB_USER}" -d "${DB_NAME}" "$@"
}

art013a2_psql_file() {
  local file="$1"
  shift || true
  art013a2_psql "$@" < "${file}"
}

art013a2_connection_label() {
  printf '%s/%s as %s' "${DB_CONTAINER}" "${DB_NAME}" "${DB_USER}"
}
