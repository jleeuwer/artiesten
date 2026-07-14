#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/lib/art013a3-db.sh"; art013a3_load_env; art013a3_require_docker
echo "[INFO][ART013A3-MIGRATION] Database: ${DB_CONTAINER}/${DB_NAME} as ${DB_USER}"
art013a3_psql_file "$(dirname "$0")/sql/20260712_art013a3_artist_musician_asymmetric_model.sql"
