#!/usr/bin/env bash
set -euo pipefail
MODE="preview"
case "${1:-}" in
  ""|--preview) MODE="preview" ;;
  --execute) MODE="execute" ;;
  *) echo "Usage: $0 [--preview|--execute]" >&2; exit 2 ;;
esac
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
# shellcheck source=lib/art013a2-db.sh
source "${SCRIPT_DIR}/lib/art013a2-db.sh"
art013a2_load_env
art013a2_require_docker

echo "[INFO][ART013A2-BACKFILL] mode=${MODE} target=$(art013a2_connection_label)"
"${SCRIPT_DIR}/musician-preflight.sh"

if [[ "${MODE}" == "preview" ]]; then
  art013a2_psql_file "${PROJECT_DIR}/scripts/sql/20260711_art013a2_backfill_preview.sql"
  echo "[SUMMARY][ART013A2-BACKFILL] mode=preview changed=0"
else
  art013a2_psql_file "${PROJECT_DIR}/scripts/sql/20260711_art013a2_backfill_execute.sql"
  echo "[SUMMARY][ART013A2-BACKFILL] mode=execute completed=true"
fi
