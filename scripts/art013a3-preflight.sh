#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/lib/art013a3-db.sh"; art013a3_load_env; art013a3_require_docker
echo "[INFO][ART013A3-PREFLIGHT] Database: ${DB_CONTAINER}/${DB_NAME} as ${DB_USER}"
art013a3_psql -At <<'SQL'
SELECT CASE WHEN to_regclass('public.artist') IS NOT NULL THEN '[PASS] artist bestaat' ELSE '[BLOCKER] artist ontbreekt' END;
SELECT CASE WHEN to_regclass('public.musician') IS NOT NULL THEN '[PASS] musician bestaat' ELSE '[BLOCKER] musician ontbreekt' END;
SELECT CASE WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='musician' AND column_name='ar_artist_key') THEN '[PASS] musician.ar_artist_key bestaat' ELSE '[BLOCKER] musician.ar_artist_key ontbreekt' END;
SELECT '[INFO] standalone musicians='||count(*) FROM public.musician WHERE ar_artist_key IS NULL;
SELECT '[BLOCKER] duplicate artist-links='||count(*) FROM (SELECT ar_artist_key FROM public.musician WHERE ar_artist_key IS NOT NULL GROUP BY ar_artist_key HAVING count(*)>1)d;
SELECT '[WARNING] actieve person-artists zonder musician='||count(*) FROM public.artist a LEFT JOIN public.musician m ON m.ar_artist_key=a.ar_artist_key WHERE COALESCE(a.ar_artist_type,'unknown')='person' AND COALESCE(a.ar_is_deleted,false)=false AND m.mu_musician_key IS NULL;
SELECT '[WARNING] musicians gekoppeld aan niet-person artist='||count(*) FROM public.musician m JOIN public.artist a ON a.ar_artist_key=m.ar_artist_key WHERE COALESCE(a.ar_artist_type,'unknown')<>'person';
SQL
