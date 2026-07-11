#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
# shellcheck source=lib/art013a2-db.sh
source "${SCRIPT_DIR}/lib/art013a2-db.sh"
art013a2_load_env

SCHEMA_SQL="${PROJECT_DIR}/scripts/sql/20260711_art013a2_preflight.sql"
DATA_SQL="${PROJECT_DIR}/scripts/sql/20260711_art013a2_data_preflight.sql"

echo "[INFO][ART013A2-PREFLIGHT-START] $(art013a2_connection_label)"
art013a2_require_docker

schema_output="$(art013a2_psql_file "${SCHEMA_SQL}")"
printf '%s\n' "${schema_output}"
schema_blockers="$(grep -c '\[BLOCKER\]' <<<"${schema_output}" || true)"

if (( schema_blockers > 0 )); then
  warnings="$(grep -c '\[WARNING\]' <<<"${schema_output}" || true)"
  echo "[SUMMARY][ART013A2-PREFLIGHT] blockers=${schema_blockers} warnings=${warnings} data_checks=skipped"
  exit 3
fi

data_output="$(art013a2_psql_file "${DATA_SQL}")"
printf '%s\n' "${data_output}"
blockers="$(grep -c '\[BLOCKER\]' <<<"${data_output}" || true)"
warnings="$(grep -c '\[WARNING\]' <<<"${data_output}" || true)"
echo "[SUMMARY][ART013A2-PREFLIGHT] blockers=${blockers} warnings=${warnings} data_checks=completed"
(( blockers == 0 )) || exit 3
