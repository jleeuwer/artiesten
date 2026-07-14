\set ON_ERROR_STOP on
BEGIN;
DO $$
DECLARE before_count bigint; after_count bigint;
BEGIN
  SELECT count(*) INTO before_count FROM public.artist_name_proposals;
  IF to_regclass('public.artist_name_proposals') IS NULL THEN RAISE EXCEPTION 'table missing'; END IF;
  IF EXISTS (SELECT 1 FROM public.artist_name_proposals WHERE status NOT IN ('new','review_later','ignored','added','existing','conflict','invalid')) THEN
    RAISE EXCEPTION 'invalid status found';
  END IF;
  SELECT count(*) INTO after_count FROM public.artist_name_proposals;
  RAISE NOTICE '[PASS] ART-012D-4-VAL-1 database invariants. before=%, after=%', before_count, after_count;
END $$;
ROLLBACK;
