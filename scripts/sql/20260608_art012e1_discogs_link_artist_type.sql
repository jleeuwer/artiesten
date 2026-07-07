-- ART-012E-1 - Discogs linked indicator and artist type foundation
-- Adds a local artist classification used by later controlled Discogs enrichment.

ALTER TABLE public.artist
  ADD COLUMN IF NOT EXISTS ar_artist_type TEXT NOT NULL DEFAULT 'unknown';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'artist_ar_artist_type_chk'
      AND conrelid = 'public.artist'::regclass
  ) THEN
    ALTER TABLE public.artist
      ADD CONSTRAINT artist_ar_artist_type_chk
      CHECK (ar_artist_type IN (
        'unknown',
        'person',
        'duo',
        'trio',
        'group',
        'band',
        'alias',
        'project'
      ));
  END IF;
END $$;

UPDATE public.artist
SET ar_artist_type = 'unknown'
WHERE ar_artist_type IS NULL OR btrim(ar_artist_type) = '';

CREATE INDEX IF NOT EXISTS idx_artist_ar_artist_type
  ON public.artist (ar_artist_type);
