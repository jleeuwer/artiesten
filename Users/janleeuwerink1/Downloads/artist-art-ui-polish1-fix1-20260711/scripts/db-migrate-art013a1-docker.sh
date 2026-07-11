#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
SQL_FILE="${PROJECT_DIR}/scripts/sql/20260609_art013a1_musician_backfill_from_person_artists.sql"
# shellcheck source=lib/art013a2-db.sh
source "${SCRIPT_DIR}/lib/art013a2-db.sh"
art013a2_load_env
art013a2_require_docker

echo "[INFO][ART013A2-MIGRATION] Preflight voor $(art013a2_connection_label)"
"${SCRIPT_DIR}/musician-preflight.sh"
echo "[INFO][ART013A2-MIGRATION] ART-013A-1 hardening migration toepassen"
art013a2_psql_file "${SQL_FILE}"
echo "[SUMMARY][ART013A2-MIGRATION] completed=true"
