-- ART-013A-2 data preflight. Run only after schema preflight has no blockers.
\pset pager off
\echo '[INFO][ART013A2-DATA] Duplicate gekoppelde musicians'
WITH duplicates AS (
  SELECT ar_artist_key, count(*) AS row_count,
         string_agg(mu_musician_key::text, ', ' ORDER BY mu_musician_key) AS musician_keys
  FROM public.musician
  WHERE ar_artist_key IS NOT NULL
  GROUP BY ar_artist_key
  HAVING count(*) > 1
)
SELECT format('[BLOCKER][ART013A2-DUPLICATE-LINK] artist_key=%s musician_keys=%s count=%s', ar_artist_key, musician_keys, row_count) AS result
FROM duplicates
ORDER BY ar_artist_key;

\echo '[INFO][ART013A2-DATA] Samenvatting'
WITH maxlen AS (
  SELECT character_maximum_length AS name_max
  FROM information_schema.columns
  WHERE table_schema='public' AND table_name='musician' AND column_name='mu_musician_name'
), person AS (
  SELECT a.*,
         EXISTS (SELECT 1 FROM public.musician m WHERE m.ar_artist_key=a.ar_artist_key) AS linked,
         nullif(btrim(coalesce(a.ar_artist_name::text,'')),'') IS NULL AS blank_name,
         (SELECT name_max FROM maxlen) IS NOT NULL
           AND char_length(a.ar_artist_name::text) > (SELECT name_max FROM maxlen) AS name_too_long
  FROM public.artist a
  WHERE coalesce(a.ar_artist_type,'unknown')='person'
)
SELECT
  count(*) AS person_artists,
  count(*) FILTER (WHERE linked) AS already_linked,
  count(*) FILTER (WHERE NOT linked AND NOT blank_name AND NOT name_too_long) AS valid_missing,
  count(*) FILTER (WHERE NOT linked AND blank_name) AS invalid_blank_name,
  count(*) FILTER (WHERE NOT linked AND name_too_long) AS invalid_name_too_long
FROM person;

\echo '[INFO][ART013A2-DATA] Waarschuwingen kandidaten'
WITH maxlen AS (
  SELECT character_maximum_length AS name_max
  FROM information_schema.columns
  WHERE table_schema='public' AND table_name='musician' AND column_name='mu_musician_name'
)
SELECT format('[WARNING][ART013A2-BLANK-NAME] artist_key=%s heeft geen bruikbare artiestnaam.', a.ar_artist_key) AS result
FROM public.artist a
WHERE coalesce(a.ar_artist_type,'unknown')='person'
  AND NOT EXISTS (SELECT 1 FROM public.musician m WHERE m.ar_artist_key=a.ar_artist_key)
  AND nullif(btrim(coalesce(a.ar_artist_name::text,'')),'') IS NULL
UNION ALL
SELECT format('[WARNING][ART013A2-NAME-TOO-LONG] artist_key=%s naamlengte=%s maximum=%s.', a.ar_artist_key, char_length(a.ar_artist_name::text), maxlen.name_max) AS result
FROM public.artist a CROSS JOIN maxlen
WHERE coalesce(a.ar_artist_type,'unknown')='person'
  AND NOT EXISTS (SELECT 1 FROM public.musician m WHERE m.ar_artist_key=a.ar_artist_key)
  AND maxlen.name_max IS NOT NULL
  AND char_length(a.ar_artist_name::text) > maxlen.name_max
ORDER BY result;
