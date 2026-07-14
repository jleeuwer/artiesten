#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
source "$ROOT_DIR/scripts/lib/art013b1-db.sh"
art013b1_load_env
art013b1_require_docker
echo "[INFO][ART013B1-MIGRATION] Database: $(art013b1_connection_label)"
art013b1_psql_file "$ROOT_DIR/scripts/sql/20260712_art013b1_musician_in_band_manual_management.sql"
