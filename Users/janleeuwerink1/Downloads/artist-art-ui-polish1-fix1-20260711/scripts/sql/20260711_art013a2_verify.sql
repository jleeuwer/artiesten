-- ART-013A-2 post-run verification.
\pset pager off
\echo '[INFO][ART013A2-VERIFY] Datakwaliteitscontroles'

WITH duplicate_links AS (
  SELECT ar_artist_key FROM public.musician
  WHERE ar_artist_key IS NOT NULL
  GROUP BY ar_artist_key HAVING count(*) > 1
), maxlen AS (
  SELECT character_maximum_length AS name_max FROM information_schema.columns
  WHERE table_schema='public' AND table_name='musician' AND column_name='mu_musician_name'
), valid_missing AS (
  SELECT a.ar_artist_key FROM public.artist a CROSS JOIN maxlen
  WHERE coalesce(a.ar_artist_type,'unknown')='person'
    AND nullif(btrim(coalesce(a.ar_artist_name::text,'')),'') IS NOT NULL
    AND (maxlen.name_max IS NULL OR char_length(a.ar_artist_name::text)<=maxlen.name_max)
    AND NOT EXISTS (SELECT 1 FROM public.musician m WHERE m.ar_artist_key=a.ar_artist_key)
), orphan_links AS (
  SELECT m.mu_musician_key FROM public.musician m
  WHERE m.ar_artist_key IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM public.artist a WHERE a.ar_artist_key=m.ar_artist_key)
), non_person_links AS (
  SELECT m.mu_musician_key FROM public.musician m
  JOIN public.artist a ON a.ar_artist_key=m.ar_artist_key
  WHERE coalesce(a.ar_artist_type,'unknown') <> 'person'
)
SELECT 'duplicate_links' AS check_name, count(*) AS issue_count, 'BLOCKER' AS severity FROM duplicate_links
UNION ALL
SELECT 'valid_missing_person_musicians', count(*), 'BLOCKER' FROM valid_missing
UNION ALL
SELECT 'orphan_musician_links', count(*), 'BLOCKER' FROM orphan_links
UNION ALL
SELECT 'linked_non_person_artists', count(*), 'WARNING' FROM non_person_links
ORDER BY severity, check_name;

SELECT CASE WHEN EXISTS (
  SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname='fn_artist_sync_to_musician'
) THEN '[INFO][ART013A2-VERIFY-FUNCTION] aanwezig'
ELSE '[BLOCKER][ART013A2-VERIFY-FUNCTION] ontbreekt' END AS result;

SELECT CASE WHEN EXISTS (
  SELECT 1 FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace
  WHERE n.nspname='public' AND c.relname='artist' AND t.tgname='trg_artist_sync_to_musician'
    AND NOT t.tgisinternal AND t.tgenabled <> 'D'
) THEN '[INFO][ART013A2-VERIFY-TRIGGER] aanwezig en enabled'
ELSE '[BLOCKER][ART013A2-VERIFY-TRIGGER] ontbreekt of disabled' END AS result;
