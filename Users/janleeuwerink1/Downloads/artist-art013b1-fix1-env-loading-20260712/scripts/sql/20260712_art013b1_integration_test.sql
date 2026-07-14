\set ON_ERROR_STOP on
BEGIN;
DO $$
DECLARE
  person_key public.artist.ar_artist_key%TYPE;
  band_key public.artist.ar_artist_key%TYPE;
  musician_key public.musician.mu_musician_key%TYPE;
  relation_key public.musician_in_band.mb_musician_band_key%TYPE;
  leftovers_before bigint;
BEGIN
  SELECT count(*) INTO leftovers_before FROM public.musician_in_band mb JOIN public.musician m ON m.mu_musician_key=mb.mb_musician_key WHERE m.mu_musician_name LIKE '__ART013B1_TEST__%';
  IF leftovers_before <> 0 THEN RAISE EXCEPTION 'ART-013B-1 test leftovers already exist'; END IF;
  INSERT INTO public.artist(ar_artist_name,ar_artist_type) VALUES('__ART013B1_TEST__ Person','person') RETURNING ar_artist_key INTO person_key;
  INSERT INTO public.artist(ar_artist_name,ar_artist_type) VALUES('__ART013B1_TEST__ Band','band') RETURNING ar_artist_key INTO band_key;
  INSERT INTO public.musician(ar_artist_key,mu_musician_name,mu_musician_notes) VALUES(person_key,'__ART013B1_TEST__ Musician',NULL) RETURNING mu_musician_key INTO musician_key;
  INSERT INTO public.musician_in_band(mb_musician_key,mb_artist_key,mb_role,mb_date_from,mb_date_to,mb_date_from_precision,mb_date_to_precision,mb_source_type,mb_notes)
  VALUES(musician_key,band_key,'gitaar',DATE '1962-01-01',DATE '1969-01-01','year','year','manual','test') RETURNING mb_musician_band_key INTO relation_key;
  IF NOT EXISTS(SELECT 1 FROM public.musician_in_band WHERE mb_musician_band_key=relation_key AND mb_role='gitaar') THEN RAISE EXCEPTION 'create failed'; END IF;
  UPDATE public.musician_in_band SET mb_role='leadgitaar',mb_updated_at=now() WHERE mb_musician_band_key=relation_key;
  IF NOT EXISTS(SELECT 1 FROM public.musician_in_band WHERE mb_musician_band_key=relation_key AND mb_role='leadgitaar') THEN RAISE EXCEPTION 'update failed'; END IF;
  DELETE FROM public.musician_in_band WHERE mb_musician_band_key=relation_key;
  IF NOT EXISTS(SELECT 1 FROM public.musician WHERE mu_musician_key=musician_key) OR NOT EXISTS(SELECT 1 FROM public.artist WHERE ar_artist_key=band_key) THEN RAISE EXCEPTION 'delete cascaded incorrectly'; END IF;
  RAISE NOTICE '[PASS] ART-013B-1 create/update/delete scenarios executed.';
END $$;
ROLLBACK;
