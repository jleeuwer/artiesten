BEGIN;

DO $$
BEGIN
  IF to_regclass('public.musician_in_band') IS NULL THEN
    RAISE EXCEPTION '[ART-013B-2-FIX-2] BLOCKER: public.musician_in_band ontbreekt.';
  END IF;
END $$;

ALTER TABLE public.musician_in_band
  DROP CONSTRAINT IF EXISTS ck_musician_in_band_source_type;

ALTER TABLE public.musician_in_band
  ADD CONSTRAINT ck_musician_in_band_source_type
  CHECK (mb_source_type IN (
    'manual','book','website','liner_notes','other',
    'discogs','musicbrainz','wikidata'
  ));

COMMIT;
