BEGIN;

DO $$
DECLARE
  constraint_row record;
BEGIN
  IF to_regclass('public.musician_in_band') IS NULL THEN
    RAISE EXCEPTION '[ART-013B-2-FIX-3] BLOCKER: public.musician_in_band ontbreekt.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema='public'
      AND table_name='musician_in_band'
      AND column_name='mb_source_type'
  ) THEN
    RAISE EXCEPTION '[ART-013B-2-FIX-3] BLOCKER: kolom mb_source_type ontbreekt.';
  END IF;

  -- Verwijder iedere bestaande CHECK-constraint die mb_source_type beperkt.
  -- Dit vangt ook legacy-constraints met een andere naam af.
  FOR constraint_row IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname='public'
      AND t.relname='musician_in_band'
      AND c.contype='c'
      AND pg_get_constraintdef(c.oid) ILIKE '%mb_source_type%'
  LOOP
    EXECUTE format('ALTER TABLE public.musician_in_band DROP CONSTRAINT %I', constraint_row.conname);
  END LOOP;
END $$;

-- Normaliseer bestaande waarden zodat oude hoofdletters/spaties de nieuwe
-- constraint niet blokkeren.
UPDATE public.musician_in_band
SET mb_source_type = lower(btrim(mb_source_type))
WHERE mb_source_type IS NOT NULL
  AND mb_source_type <> lower(btrim(mb_source_type));

ALTER TABLE public.musician_in_band
  ALTER COLUMN mb_source_type SET DEFAULT 'manual';

ALTER TABLE public.musician_in_band
  ADD CONSTRAINT ck_musician_in_band_source_type
  CHECK (
    lower(btrim(mb_source_type)) IN (
      'manual','book','website','liner_notes','other',
      'discogs','musicbrainz','wikidata'
    )
  );

COMMIT;
