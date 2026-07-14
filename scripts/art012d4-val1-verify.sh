#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"; source "${SCRIPT_DIR}/lib/art012d4-val1-db.sh"
val1_load_env; val1_require_docker
val1_psql -Atqc "SELECT CASE WHEN count(*)=0 THEN 'PASS no duplicate functional proposals' ELSE 'BLOCKER duplicates='||count(*) END FROM (SELECT artist_key,source,source_external_id,proposal_type,normalized_name,count(*) FROM public.artist_name_proposals GROUP BY 1,2,3,4,5 HAVING count(*)>1) d;"
val1_psql -Atqc "SELECT status||'='||count(*) FROM public.artist_name_proposals GROUP BY status ORDER BY status;"
echo '[SUMMARY][ART012D4-VAL1-VERIFY] completed=true'
