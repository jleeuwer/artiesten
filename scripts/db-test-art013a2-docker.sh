#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
# shellcheck source=lib/art013a2-db.sh
source "${SCRIPT_DIR}/lib/art013a2-db.sh"
art013a2_load_env

if [[ "${ARTIST_DB_TEST_ALLOWED:-false}" != "true" ]]; then
  echo "[BLOCKER][ART013A2-TEST-GUARD] Zet ARTIST_DB_TEST_ALLOWED=true voor transactionele database-integratietests." >&2
  exit 30
fi
if [[ "${NODE_ENV:-development}" == "production" || "${ARTIST_DB_ENVIRONMENT:-development}" == "production" ]]; then
  echo "[BLOCKER][ART013A2-PRODUCTION-GUARD] Integratietests zijn niet toegestaan in productie." >&2
  exit 31
fi
if [[ ! "${DB_NAME}" =~ (test|dev|development|musicdb) ]]; then
  echo "[BLOCKER][ART013A2-DB-NAME-GUARD] Database '${DB_NAME}' is niet als test/development toegestaan." >&2
  exit 32
fi

art013a2_require_docker
"${SCRIPT_DIR}/musician-preflight.sh"
echo "[INFO][ART013A2-DB-TEST] Transactionele integratietest op $(art013a2_connection_label)"
art013a2_psql_file "${PROJECT_DIR}/scripts/sql/20260711_art013a2_integration_test.sql"

leftovers="$(art013a2_psql -Atqc "SELECT (SELECT count(*) FROM public.artist WHERE ar_artist_name::text LIKE '__ART013A2_TEST__%') + (SELECT count(*) FROM public.musician WHERE mu_musician_name::text LIKE '__ART013A2_TEST__%');")"
if [[ "${leftovers}" != "0" ]]; then
  echo "[BLOCKER][ART013A2-TEST-CLEANUP] ${leftovers} testrecords achtergebleven." >&2
  exit 33
fi
echo "[SUMMARY][ART013A2-DB-TEST] passed=true leftovers=0"
