#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/lib/art013b2-db.sh"
art013b2_load_env
art013b2_require_docker

echo "[INFO][ART013B2-VERIFY] Database: ${DB_CONTAINER}/${DB_NAME} as ${DB_USER}"
art013b2_psql <<'SQL'
SELECT CASE WHEN to_regclass('public.musician_in_band_proposal') IS NOT NULL
  THEN '[PASS] musician_in_band_proposal bestaat'
  ELSE '[BLOCKER] musician_in_band_proposal ontbreekt' END;
SELECT CASE WHEN to_regclass('public.musician_in_band_source') IS NOT NULL
  THEN '[PASS] musician_in_band_source bestaat'
  ELSE '[BLOCKER] musician_in_band_source ontbreekt' END;

SELECT '[INFO] actieve source-type constraints:';
SELECT c.conname || ' => ' || pg_get_constraintdef(c.oid)
FROM pg_constraint c
JOIN pg_class t ON t.oid=c.conrelid
JOIN pg_namespace n ON n.oid=t.relnamespace
WHERE n.nspname='public'
  AND t.relname='musician_in_band'
  AND c.contype='c'
  AND pg_get_constraintdef(c.oid) ILIKE '%mb_source_type%'
ORDER BY c.conname;

SELECT CASE WHEN EXISTS (
  SELECT 1
  FROM pg_constraint c
  JOIN pg_class t ON t.oid=c.conrelid
  JOIN pg_namespace n ON n.oid=t.relnamespace
  WHERE n.nspname='public'
    AND t.relname='musician_in_band'
    AND c.contype='c'
    AND c.conname='ck_musician_in_band_source_type'
    AND pg_get_constraintdef(c.oid) ILIKE '%discogs%'
    AND pg_get_constraintdef(c.oid) ILIKE '%musicbrainz%'
    AND pg_get_constraintdef(c.oid) ILIKE '%wikidata%'
) THEN '[PASS] ck_musician_in_band_source_type ondersteunt externe bronnen'
ELSE '[BLOCKER] source-type constraint ondersteunt externe bronnen niet' END;

SELECT CASE WHEN count(*)=0
  THEN '[PASS] alle bestaande mb_source_type waarden zijn geldig'
  ELSE '[BLOCKER] ongeldige mb_source_type waarden=' || count(*) END
FROM public.musician_in_band
WHERE mb_source_type IS NULL
   OR lower(btrim(mb_source_type)) NOT IN (
     'manual','book','website','liner_notes','other',
     'discogs','musicbrainz','wikidata'
   );
SQL
