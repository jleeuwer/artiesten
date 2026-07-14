\set ON_ERROR_STOP on
BEGIN;

DO $$
BEGIN
  IF to_regclass('public.artist_name_proposals') IS NULL THEN
    RAISE EXCEPTION 'ART-012D-4 basistabel public.artist_name_proposals ontbreekt';
  END IF;
END $$;

UPDATE public.artist_name_proposals
SET status = lower(trim(status))
WHERE status IS NOT NULL AND status <> lower(trim(status));

DO $$
DECLARE invalid_count bigint;
BEGIN
  SELECT count(*) INTO invalid_count
  FROM public.artist_name_proposals
  WHERE status IS NULL OR status NOT IN ('new','review_later','ignored','added','existing','conflict','invalid');
  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'ART012D4-VAL1: % records met ongeldige status; eerst opschonen', invalid_count;
  END IF;
END $$;

ALTER TABLE public.artist_name_proposals
  DROP CONSTRAINT IF EXISTS chk_artist_name_proposals_status;
ALTER TABLE public.artist_name_proposals
  ADD CONSTRAINT chk_artist_name_proposals_status
  CHECK (status IN ('new','review_later','ignored','added','existing','conflict','invalid'));

CREATE INDEX IF NOT EXISTS idx_artist_name_proposals_artist_status_type
  ON public.artist_name_proposals (artist_key, source, status, proposal_type);
CREATE INDEX IF NOT EXISTS idx_artist_name_proposals_artist_updated
  ON public.artist_name_proposals (artist_key, updated_at DESC);

COMMIT;
