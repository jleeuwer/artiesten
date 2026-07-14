-- ART-013A-2 read-only database preflight.
-- This file contains SELECT statements only and performs no persistent changes.
\pset pager off
\pset format aligned
\echo '[INFO][ART013A2-PREFLIGHT] Database schema preflight'

WITH required(table_name, column_name, expected_kind) AS (
  VALUES
    ('artist','ar_artist_key','numeric'),
    ('artist','ar_artist_name','text'),
    ('artist','ar_artist_type','text'),
    ('artist','ar_artist_dateofbirth','date'),
    ('artist','ar_artist_passing','date'),
    ('artist','ar_website_url','text'),
    ('musician','mu_musician_key','numeric'),
    ('musician','ar_artist_key','numeric'),
    ('musician','mu_musician_name','text'),
    ('musician','mu_musician_dateofbirth','date'),
    ('musician','mu_musician_passing','date'),
    ('musician','mu_website_url','text'),
    ('musician','mu_musician_notes','text')
), actual AS (
  SELECT c.table_name, c.column_name, c.data_type, c.udt_name,
         c.is_nullable, c.column_default, c.is_identity,
         c.character_maximum_length
  FROM information_schema.columns c
  WHERE c.table_schema='public'
), checks AS (
  SELECT
    CASE WHEN a.column_name IS NULL THEN 'BLOCKER'
         WHEN r.expected_kind='numeric' AND a.udt_name NOT IN ('int2','int4','int8','numeric','uuid') THEN 'BLOCKER'
         WHEN r.expected_kind='text' AND a.udt_name NOT IN ('text','varchar','bpchar','citext') THEN 'BLOCKER'
         WHEN r.expected_kind='date' AND a.udt_name NOT IN ('date','timestamp','timestamptz') THEN 'BLOCKER'
         ELSE 'INFO' END AS severity,
    'ART013A2-COLUMN-' || upper(r.table_name) || '-' || upper(r.column_name) AS code,
    CASE WHEN a.column_name IS NULL THEN format('Vereiste kolom public.%I.%I ontbreekt.', r.table_name, r.column_name)
         ELSE format('public.%I.%I: type=%s nullable=%s max_length=%s', r.table_name, r.column_name, a.udt_name, a.is_nullable, coalesce(a.character_maximum_length::text,'onbeperkt')) END AS message
  FROM required r
  LEFT JOIN actual a USING(table_name,column_name)
)
SELECT format('[%s][%s] %s', severity, code, message) AS result
FROM checks
ORDER BY CASE severity WHEN 'BLOCKER' THEN 1 ELSE 3 END, code;

\echo '[INFO][ART013A2-PREFLIGHT] Verplichte musician-kolommen zonder default buiten backfillmapping'
SELECT format('[BLOCKER][ART013A2-REQUIRED-COLUMN] public.musician.%I is NOT NULL zonder default en wordt niet gevuld door de backfill.', c.column_name) AS result
FROM information_schema.columns c
WHERE c.table_schema='public'
  AND c.table_name='musician'
  AND c.is_nullable='NO'
  AND c.column_default IS NULL
  AND c.is_identity='NO'
  AND c.column_name NOT IN (
    'ar_artist_key','mu_musician_name','mu_musician_dateofbirth',
    'mu_musician_passing','mu_website_url','mu_musician_notes'
  )
ORDER BY c.ordinal_position;

\echo '[INFO][ART013A2-PREFLIGHT] Trigger en functie'
SELECT CASE WHEN EXISTS (
  SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname='fn_artist_sync_to_musician'
) THEN '[INFO][ART013A2-FUNCTION] fn_artist_sync_to_musician aanwezig.'
ELSE '[BLOCKER][ART013A2-FUNCTION-MISSING] fn_artist_sync_to_musician ontbreekt.' END AS result;

SELECT CASE WHEN EXISTS (
  SELECT 1 FROM pg_trigger t
  JOIN pg_class c ON c.oid=t.tgrelid
  JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relname='artist'
    AND t.tgname='trg_artist_sync_to_musician' AND NOT t.tgisinternal
    AND t.tgenabled <> 'D'
) THEN '[INFO][ART013A2-TRIGGER] trg_artist_sync_to_musician aanwezig en enabled.'
ELSE '[BLOCKER][ART013A2-TRIGGER-MISSING] trg_artist_sync_to_musician ontbreekt of is disabled.' END AS result;
