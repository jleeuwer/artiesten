\set ON_ERROR_STOP on
BEGIN;

DO $$
DECLARE dup_count integer;
BEGIN
  IF to_regclass('public.artist') IS NULL OR to_regclass('public.musician') IS NULL THEN
    RAISE EXCEPTION '[ART-013A-3] BLOCKER: public.artist en/of public.musician ontbreekt.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='musician' AND column_name='ar_artist_key') THEN
    RAISE EXCEPTION '[ART-013A-3] BLOCKER: musician.ar_artist_key ontbreekt.';
  END IF;
  SELECT count(*) INTO dup_count FROM (
    SELECT ar_artist_key FROM public.musician WHERE ar_artist_key IS NOT NULL GROUP BY ar_artist_key HAVING count(*)>1
  ) d;
  IF dup_count>0 THEN
    RAISE EXCEPTION '[ART-013A-3] BLOCKER: % dubbele musician-ar_artist_key koppelingen.',dup_count;
  END IF;
END $$;

ALTER TABLE public.musician ALTER COLUMN ar_artist_key DROP NOT NULL;
ALTER TABLE public.musician ALTER COLUMN mu_musician_dateofbirth DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_musician_ar_artist_key_not_null
  ON public.musician(ar_artist_key) WHERE ar_artist_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS ix_musician_name_lower
  ON public.musician(lower(trim(mu_musician_name)));

CREATE OR REPLACE FUNCTION public.fn_artist_sync_to_musician()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF COALESCE(NEW.ar_artist_type,'unknown')='person' THEN
    UPDATE public.musician
       SET mu_musician_name=NEW.ar_artist_name::text,
           mu_musician_dateofbirth=NEW.ar_artist_dateofbirth,
           mu_musician_passing=NEW.ar_artist_passing,
           mu_website_url=NEW.ar_website_url
     WHERE ar_artist_key=NEW.ar_artist_key;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_artist_sync_to_musician ON public.artist;
CREATE TRIGGER trg_artist_sync_to_musician
AFTER UPDATE OF ar_artist_name,ar_artist_dateofbirth,ar_artist_passing,ar_website_url,ar_artist_type
ON public.artist FOR EACH ROW
WHEN (OLD.ar_artist_name IS DISTINCT FROM NEW.ar_artist_name
   OR OLD.ar_artist_dateofbirth IS DISTINCT FROM NEW.ar_artist_dateofbirth
   OR OLD.ar_artist_passing IS DISTINCT FROM NEW.ar_artist_passing
   OR OLD.ar_website_url IS DISTINCT FROM NEW.ar_website_url
   OR OLD.ar_artist_type IS DISTINCT FROM NEW.ar_artist_type)
EXECUTE FUNCTION public.fn_artist_sync_to_musician();

COMMENT ON COLUMN public.musician.ar_artist_key IS
'ART-013A-3: optionele 0..1 koppeling vanuit musician; iedere actieve person-artist hoort applicatief exact één musician te hebben.';
COMMENT ON INDEX public.uq_musician_ar_artist_key_not_null IS
'ART-013A-3: maximaal één musician per gekoppelde artist; standalone musicians hebben NULL.';
COMMIT;
