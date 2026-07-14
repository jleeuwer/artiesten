#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/lib/art013a3-db.sh"; art013a3_load_env; art013a3_require_docker
echo "[INFO][ART013A3-VERIFY] Database: ${DB_CONTAINER}/${DB_NAME} as ${DB_USER}"
art013a3_psql -P pager=off <<'SQL'
SELECT 'standalone_musicians' check_name,count(*) value FROM public.musician WHERE ar_artist_key IS NULL
UNION ALL SELECT 'person_artists_without_musician',count(*) FROM public.artist a LEFT JOIN public.musician m ON m.ar_artist_key=a.ar_artist_key WHERE COALESCE(a.ar_artist_type,'unknown')='person' AND COALESCE(a.ar_is_deleted,false)=false AND m.mu_musician_key IS NULL
UNION ALL SELECT 'duplicate_artist_links',count(*) FROM (SELECT ar_artist_key FROM public.musician WHERE ar_artist_key IS NOT NULL GROUP BY ar_artist_key HAVING count(*)>1)d
UNION ALL SELECT 'non_person_links',count(*) FROM public.musician m JOIN public.artist a ON a.ar_artist_key=m.ar_artist_key WHERE COALESCE(a.ar_artist_type,'unknown')<>'person';
SELECT indexname FROM pg_indexes WHERE schemaname='public' AND tablename='musician' AND indexname='uq_musician_ar_artist_key_not_null';
SELECT tgname FROM pg_trigger WHERE tgrelid='public.artist'::regclass AND tgname='trg_artist_sync_to_musician' AND NOT tgisinternal;
SQL
