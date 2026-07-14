\pset pager off
BEGIN;
WITH maxlen AS (
  SELECT character_maximum_length AS name_max FROM information_schema.columns
  WHERE table_schema='public' AND table_name='musician' AND column_name='mu_musician_name'
), candidates AS (
  SELECT a.ar_artist_key, a.ar_artist_name, a.ar_artist_dateofbirth,
         a.ar_artist_passing, a.ar_website_url
  FROM public.artist a CROSS JOIN maxlen
  WHERE coalesce(a.ar_artist_type,'unknown')='person'
    AND NOT EXISTS (SELECT 1 FROM public.musician m WHERE m.ar_artist_key=a.ar_artist_key)
    AND nullif(btrim(coalesce(a.ar_artist_name::text,'')),'') IS NOT NULL
    AND (maxlen.name_max IS NULL OR char_length(a.ar_artist_name::text)<=maxlen.name_max)
), inserted AS (
  INSERT INTO public.musician (
    ar_artist_key, mu_musician_name, mu_musician_dateofbirth,
    mu_musician_passing, mu_website_url, mu_musician_notes
  )
  SELECT ar_artist_key, ar_artist_name::text, ar_artist_dateofbirth,
         ar_artist_passing, ar_website_url, NULL::text
  FROM candidates
  ON CONFLICT DO NOTHING
  RETURNING mu_musician_key, ar_artist_key
)
SELECT
  (SELECT count(*) FROM candidates) AS selected_candidates,
  count(*) AS inserted_musicians,
  (SELECT count(*) FROM candidates)-count(*) AS skipped_by_conflict
FROM inserted;
COMMIT;
