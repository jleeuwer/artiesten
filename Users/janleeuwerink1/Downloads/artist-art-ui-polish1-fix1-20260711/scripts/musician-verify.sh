#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
# shellcheck source=lib/art013a2-db.sh
source "${SCRIPT_DIR}/lib/art013a2-db.sh"
art013a2_load_env
art013a2_require_docker

echo "[INFO][ART013A2-VERIFY-START] $(art013a2_connection_label)"
"${SCRIPT_DIR}/musician-preflight.sh"
output="$(art013a2_psql_file "${PROJECT_DIR}/scripts/sql/20260711_art013a2_verify.sql")"
printf '%s\n' "${output}"
blocker_rows="$(awk -F'|' '/BLOCKER/ && $2 ~ /[1-9]/ {gsub(/ /,"",$2); if ($2+0>0) n++} END {print n+0}' <<<"${output}")"
blocker_labels="$(grep -c '\[BLOCKER\]' <<<"${output}" || true)"
warning_rows="$(awk -F'|' '/WARNING/ && $2 ~ /[1-9]/ {gsub(/ /,"",$2); if ($2+0>0) n++} END {print n+0}' <<<"${output}")"
blockers=$((blocker_rows + blocker_labels))
echo "[SUMMARY][ART013A2-VERIFY] blockers=${blockers} warnings=${warning_rows}"
(( blockers == 0 )) || exit 4
