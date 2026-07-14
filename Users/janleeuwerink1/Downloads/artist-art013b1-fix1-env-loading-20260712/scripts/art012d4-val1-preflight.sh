#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"; source "${SCRIPT_DIR}/lib/art012d4-val1-db.sh"
val1_load_env; val1_require_docker
val1_psql -Atqc "SELECT CASE WHEN to_regclass('public.artist_name_proposals') IS NULL THEN 'BLOCKER missing artist_name_proposals' ELSE 'PASS artist_name_proposals present' END;"
val1_psql -Atqc "SELECT CASE WHEN count(*)=0 THEN 'PASS statuses valid' ELSE 'BLOCKER invalid statuses='||count(*) END FROM public.artist_name_proposals WHERE status IS NULL OR status NOT IN ('new','review_later','ignored','added','existing','conflict','invalid');"
val1_psql -Atqc "SELECT 'INFO proposals='||count(*) FROM public.artist_name_proposals;"
echo '[SUMMARY][ART012D4-VAL1-PREFLIGHT] completed=true'
