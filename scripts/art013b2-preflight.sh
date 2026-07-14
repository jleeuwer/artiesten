#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/lib/art013b2-db.sh"; art013b2_load_env; art013b2_require_docker
echo "[INFO][ART013B2-PREFLIGHT] Database: ${DB_CONTAINER}/${DB_NAME} as ${DB_USER}"
art013b2_psql <<'SQL'
DO $$ BEGIN
 IF to_regclass('public.artist') IS NULL THEN RAISE EXCEPTION '[BLOCKER] artist ontbreekt'; END IF;
 IF to_regclass('public.musician') IS NULL THEN RAISE EXCEPTION '[BLOCKER] musician ontbreekt'; END IF;
 IF to_regclass('public.musician_in_band') IS NULL THEN RAISE EXCEPTION '[BLOCKER] musician_in_band ontbreekt'; END IF;
 IF to_regclass('public.artist_external_reference') IS NULL THEN RAISE EXCEPTION '[BLOCKER] artist_external_reference ontbreekt'; END IF;
END $$;
SELECT '[PASS] gekoppelde Discogs-bands=' || count(*) FROM public.artist_external_reference r JOIN public.artist a ON a.ar_artist_key=r.artist_key WHERE lower(r.source)='discogs' AND r.status='linked' AND a.ar_artist_type IN ('band','group','duo','trio');
SELECT CASE WHEN to_regclass('public.musician_in_band_proposal') IS NULL THEN '[INFO] proposal-tabel ontbreekt en wordt door migratie toegevoegd' ELSE '[PASS] proposal-tabel bestaat' END;
SELECT CASE WHEN to_regclass('public.musician_in_band_source') IS NULL THEN '[INFO] source-tabel ontbreekt en wordt door migratie toegevoegd' ELSE '[PASS] source-tabel bestaat' END;
SELECT CASE
  WHEN EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid=c.conrelid
    JOIN pg_namespace n ON n.oid=t.relnamespace
    WHERE n.nspname='public' AND t.relname='musician_in_band'
      AND c.conname='ck_musician_in_band_source_type'
      AND pg_get_constraintdef(c.oid) ILIKE '%discogs%'
  ) THEN '[PASS] bronconstraint ondersteunt discogs'
  ELSE '[INFO] bronconstraint ondersteunt discogs nog niet en wordt door Fix-2-migratie bijgewerkt'
END;
SQL
