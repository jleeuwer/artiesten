#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/lib/art013b2-db.sh"; art013b2_load_env; art013b2_require_docker
echo "[INFO][ART013B2-MIGRATION] Database: ${DB_CONTAINER}/${DB_NAME} as ${DB_USER}"
art013b2_psql_file "$(dirname "$0")/sql/20260712_art013b2_discogs_band_member_proposals.sql"
art013b2_psql_file "$(dirname "$0")/sql/20260712_art013b2_fix2_source_type_constraint.sql"
art013b2_psql_file "$(dirname "$0")/sql/20260712_art013b2_fix3_source_type_constraint_hardening.sql"
