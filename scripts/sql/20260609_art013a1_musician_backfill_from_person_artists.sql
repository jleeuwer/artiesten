-- ART-013A-1 / ART-013A-2 hardened migration.
-- No musician rows are inserted or repaired by this migration.
\set ON_ERROR_STOP on
BEGIN;

DO $$
DECLARE
  duplicate_count integer;
BEGIN
  IF to_regclass('public.musician') IS NULL THEN
    RAISE EXCEPTION '[ART-013A-2] BLOCKER: public.musician ontbreekt.';
  END IF;

  SELECT count(*) INTO duplicate_count
  FROM (
    SELECT ar_artist_key
    FROM public.musician
    WHERE ar_artist_key IS NOT NULL
    GROUP BY ar_artist_key
    HAVING count(*) > 1
  ) d;

  IF duplicate_count > 0 THEN
    RAISE EXCEPTION USING
      MESSAGE = format('[ART-013A-2] BLOCKER: %s dubbele musician.ar_artist_key-koppelingen gevonden.', duplicate_count),
      HINT = 'Voer uit: SELECT ar_artist_key, array_agg(mu_musician_key ORDER BY mu_musician_key) FROM public.musician WHERE ar_artist_key IS NOT NULL GROUP BY ar_artist_key HAVING count(*) > 1;';
  END IF;
END;
$$;

ALTER TABLE public.musician
  ALTER COLUMN mu_musician_dateofbirth DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_musician_ar_artist_key_not_null
  ON public.musician (ar_artist_key)
  WHERE ar_artist_key IS NOT NULL;

COMMENT ON INDEX public.uq_musician_ar_artist_key_not_null IS
  'ART-013A-1/2: prevents duplicate musician rows for one linked artist and supports idempotent backfill.';

COMMIT;
