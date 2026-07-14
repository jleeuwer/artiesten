#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/lib/art012d4-val1-db.sh"
val1_load_env; val1_require_docker
val1_psql_file "${SCRIPT_DIR}/sql/20260711_art012d4_val1_reviewqueue_hardening.sql"
echo '[SUMMARY][ART012D4-VAL1-MIGRATION] passed=true'
