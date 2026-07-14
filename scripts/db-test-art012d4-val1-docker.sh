#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"; source "${SCRIPT_DIR}/lib/art012d4-val1-db.sh"
val1_load_env
[[ "${ARTIST_DB_TEST_ALLOWED:-false}" == "true" ]] || { echo '[BLOCKER] Zet ARTIST_DB_TEST_ALLOWED=true.' >&2; exit 30; }
[[ "${NODE_ENV:-development}" != "production" && "${ARTIST_DB_ENVIRONMENT:-development}" != "production" ]] || { echo '[BLOCKER] Niet toegestaan in productie.' >&2; exit 31; }
val1_require_docker
"${SCRIPT_DIR}/art012d4-val1-preflight.sh"
val1_psql_file "${SCRIPT_DIR}/sql/20260711_art012d4_val1_integration_test.sql"
echo '[SUMMARY][ART012D4-VAL1-DB-TEST] passed=true leftovers=0'
