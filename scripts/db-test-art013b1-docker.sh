#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
source "$ROOT_DIR/scripts/lib/art013b1-db.sh"
art013b1_load_env

if [[ "${ARTIST_DB_TEST_ALLOWED:-false}" != "true" ]]; then
  echo "[BLOCKER][ART013B1-TEST-GUARD] Zet ARTIST_DB_TEST_ALLOWED=true in .env of voor dit commando." >&2
  exit 30
fi
if [[ "${NODE_ENV:-development}" == "production" || "${ARTIST_DB_ENVIRONMENT:-development}" == "production" ]]; then
  echo "[BLOCKER][ART013B1-PRODUCTION-GUARD] Niet toegestaan in productie." >&2
  exit 31
fi

art013b1_require_docker
echo "[INFO][ART013B1-DB-TEST] Database: $(art013b1_connection_label)"
art013b1_psql_file "$ROOT_DIR/scripts/sql/20260712_art013b1_preflight.sql"
art013b1_psql_file "$ROOT_DIR/scripts/sql/20260712_art013b1_integration_test.sql"
leftovers="$(art013b1_psql -Atqc "SELECT count(*) FROM public.musician m WHERE m.mu_musician_name LIKE '__ART013B1_TEST__%';")"
[[ "$leftovers" == "0" ]] || { echo "[BLOCKER][ART013B1-LEFTOVERS] leftovers=$leftovers" >&2; exit 32; }
echo "[SUMMARY][ART013B1-DB-TEST] passed=true leftovers=0"
