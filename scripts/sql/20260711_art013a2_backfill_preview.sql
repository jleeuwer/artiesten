\pset pager off
\echo '[INFO][ART013A2-PREVIEW] Preview voert geen wijzigingen uit.'
WITH maxlen AS (
  SELECT character_maximum_length AS name_max
  FROM information_schema.columns
  WHERE table_schema='public' AND table_name='musician' AND column_name='mu_musician_name'
), candidates AS (
  SELECT a.*,
    CASE
      WHEN nullif(btrim(coalesce(a.ar_artist_name::text,'')),'') IS NULL THEN 'EMPTY_NAME'
      WHEN maxlen.name_max IS NOT NULL AND char_length(a.ar_artist_name::text)>maxlen.name_max THEN 'NAME_TOO_LONG'
      ELSE NULL
    END AS exclusion_reason
  FROM public.artist a CROSS JOIN maxlen
  WHERE coalesce(a.ar_artist_type,'unknown')='person'
    AND NOT EXISTS (SELECT 1 FROM public.musician m WHERE m.ar_artist_key=a.ar_artist_key)
)
SELECT
  (SELECT count(*) FROM public.artist WHERE coalesce(ar_artist_type,'unknown')='person') AS person_artists,
  (SELECT count(*) FROM public.artist a WHERE coalesce(a.ar_artist_type,'unknown')='person' AND EXISTS (SELECT 1 FROM public.musician m WHERE m.ar_artist_key=a.ar_artist_key)) AS already_linked,
  count(*) FILTER (WHERE exclusion_reason IS NULL) AS valid_candidates,
  count(*) FILTER (WHERE exclusion_reason IS NOT NULL) AS excluded_candidates
FROM candidates;

\echo '[INFO][ART013A2-PREVIEW] Geldige kandidaten'
WITH maxlen AS (
  SELECT character_maximum_length AS name_max FROM information_schema.columns
  WHERE table_schema='public' AND table_name='musician' AND column_name='mu_musician_name'
)
SELECT a.ar_artist_key, a.ar_artist_name,
       a.ar_artist_dateofbirth::text AS ar_artist_dateofbirth,
       a.ar_artist_passing::text AS ar_artist_passing,
       a.ar_website_url
FROM public.artist a CROSS JOIN maxlen
WHERE coalesce(a.ar_artist_type,'unknown')='person'
  AND NOT EXISTS (SELECT 1 FROM public.musician m WHERE m.ar_artist_key=a.ar_artist_key)
  AND nullif(btrim(coalesce(a.ar_artist_name::text,'')),'') IS NOT NULL
  AND (maxlen.name_max IS NULL OR char_length(a.ar_artist_name::text)<=maxlen.name_max)
ORDER BY a.ar_artist_name, a.ar_artist_key;

\echo '[INFO][ART013A2-PREVIEW] Uitgesloten kandidaten'
WITH maxlen AS (
  SELECT character_maximum_length AS name_max FROM information_schema.columns
  WHERE table_schema='public' AND table_name='musician' AND column_name='mu_musician_name'
)
SELECT a.ar_artist_key, a.ar_artist_name,
       CASE WHEN nullif(btrim(coalesce(a.ar_artist_name::text,'')),'') IS NULL THEN 'EMPTY_NAME'
            WHEN maxlen.name_max IS NOT NULL AND char_length(a.ar_artist_name::text)>maxlen.name_max THEN 'NAME_TOO_LONG'
       END AS exclusion_reason
FROM public.artist a CROSS JOIN maxlen
WHERE coalesce(a.ar_artist_type,'unknown')='person'
  AND NOT EXISTS (SELECT 1 FROM public.musician m WHERE m.ar_artist_key=a.ar_artist_key)
  AND (nullif(btrim(coalesce(a.ar_artist_name::text,'')),'') IS NULL
       OR (maxlen.name_max IS NOT NULL AND char_length(a.ar_artist_name::text)>maxlen.name_max))
ORDER BY a.ar_artist_key;
