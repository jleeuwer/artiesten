-- ART-012D-4-Fix-1 — Name proposal reviewqueue hardening
-- Adds review/apply metadata, invalid status support, and indexes for filtered reviewqueue usage.

ALTER TABLE public.artist_name_proposals
  ADD COLUMN IF NOT EXISTS reviewed_by text,
  ADD COLUMN IF NOT EXISTS applied_by text,
  ADD COLUMN IF NOT EXISTS ignored_by text;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'artist_name_proposals_status_chk'
      AND conrelid = 'public.artist_name_proposals'::regclass
  ) THEN
    ALTER TABLE public.artist_name_proposals
      DROP CONSTRAINT artist_name_proposals_status_chk;
  END IF;
END $$;

ALTER TABLE public.artist_name_proposals
  ADD CONSTRAINT artist_name_proposals_status_chk
  CHECK (status IN ('new', 'added', 'ignored', 'conflict', 'review_later', 'existing', 'invalid'));

CREATE INDEX IF NOT EXISTS idx_artist_name_proposals_artist_status_fix1
  ON public.artist_name_proposals (artist_key, status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_artist_name_proposals_type_fix1
  ON public.artist_name_proposals (artist_key, proposal_type, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_artist_name_proposals_normalized_fix1
  ON public.artist_name_proposals (lower(normalized_name));
