#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/lib/art013a3-db.sh"; art013a3_load_env; art013a3_require_docker
[[ "${ARTIST_DB_TEST_ALLOWED:-false}" == "true" ]] || { echo '[BLOCKER][ART013A3-TEST-GUARD] Zet ARTIST_DB_TEST_ALLOWED=true in .env.' >&2; exit 30; }
[[ "${ARTIST_DB_ENVIRONMENT:-development}" != "production" ]] || { echo '[BLOCKER][ART013A3-PRODUCTION-GUARD] Geen DB-test in production.' >&2; exit 31; }
art013a3_psql_file "$(dirname "$0")/sql/20260712_art013a3_integration_test.sql"
leftovers="$(art013a3_psql -Atqc "SELECT (SELECT count(*) FROM public.artist WHERE ar_artist_name LIKE '__ART013A3_TEST__%')+(SELECT count(*) FROM public.musician WHERE mu_musician_name LIKE '__ART013A3_TEST__%');")"
[[ "$leftovers" == "0" ]] || { echo "[FAIL][ART013A3-DB-TEST] leftovers=${leftovers}"; exit 1; }
echo '[SUMMARY][ART013A3-DB-TEST] passed=true leftovers=0'
