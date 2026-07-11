-- ART-013A-2 transactionele integratietest.
-- Vereist psql variabele test_prefix en draait volledig binnen ROLLBACK.
\set ON_ERROR_STOP on
BEGIN;

DO $$
DECLARE
  person_key public.artist.ar_artist_key%TYPE;
  band_key public.artist.ar_artist_key%TYPE;
  unlinked_key public.artist.ar_artist_key%TYPE;
  musician_key public.musician.mu_musician_key%TYPE;
  before_artist_count bigint;
  after_artist_count bigint;
  before_musician_count bigint;
  after_musician_count bigint;
  actual_name text;
  actual_birth date;
  actual_passing date;
  actual_url text;
BEGIN
  SELECT count(*) INTO before_artist_count FROM public.artist;
  SELECT count(*) INTO before_musician_count FROM public.musician;

  -- Generate keys only when keys have no defaults. Existing sequence/defaults are preferred.
  INSERT INTO public.artist (ar_artist_name, ar_artist_type, ar_artist_dateofbirth, ar_artist_passing, ar_website_url)
  VALUES ('__ART013A2_TEST__ Person', 'person', DATE '1980-01-02', NULL, 'https://example.invalid/person')
  RETURNING ar_artist_key INTO person_key;

  INSERT INTO public.artist (ar_artist_name, ar_artist_type, ar_artist_dateofbirth, ar_artist_passing, ar_website_url)
  VALUES ('__ART013A2_TEST__ Band', 'band', NULL, NULL, 'https://example.invalid/band')
  RETURNING ar_artist_key INTO band_key;

  INSERT INTO public.artist (ar_artist_name, ar_artist_type, ar_artist_dateofbirth, ar_artist_passing, ar_website_url)
  VALUES ('__ART013A2_TEST__ Unlinked', 'person', DATE '1990-03-04', NULL, NULL)
  RETURNING ar_artist_key INTO unlinked_key;

  INSERT INTO public.musician (
    ar_artist_key, mu_musician_name, mu_musician_dateofbirth,
    mu_musician_passing, mu_website_url, mu_musician_notes
  ) VALUES (
    person_key, '__ART013A2_TEST__ Old', DATE '1970-01-01', NULL, 'https://example.invalid/old', NULL
  ) RETURNING mu_musician_key INTO musician_key;

  UPDATE public.artist
  SET ar_artist_name='__ART013A2_TEST__ Updated',
      ar_artist_dateofbirth=DATE '1981-02-03',
      ar_artist_passing=DATE '2020-04-05',
      ar_website_url='https://example.invalid/updated'
  WHERE ar_artist_key=person_key;

  SELECT mu_musician_name, mu_musician_dateofbirth, mu_musician_passing, mu_website_url
  INTO actual_name, actual_birth, actual_passing, actual_url
  FROM public.musician WHERE mu_musician_key=musician_key;

  IF actual_name <> '__ART013A2_TEST__ Updated' OR actual_birth <> DATE '1981-02-03'
     OR actual_passing <> DATE '2020-04-05' OR actual_url <> 'https://example.invalid/updated' THEN
    RAISE EXCEPTION 'FT-044/045 person sync failed';
  END IF;

  IF EXISTS (SELECT 1 FROM public.musician WHERE ar_artist_key=unlinked_key) THEN
    RAISE EXCEPTION 'FT-049 trigger created a musician for unlinked artist';
  END IF;

  UPDATE public.artist SET ar_artist_name='__ART013A2_TEST__ Band changed' WHERE ar_artist_key=band_key;
  IF EXISTS (SELECT 1 FROM public.musician WHERE ar_artist_key=band_key) THEN
    RAISE EXCEPTION 'FT-047 band update created or changed a musician';
  END IF;

  UPDATE public.musician SET mu_musician_name='__ART013A2_TEST__ Musician side' WHERE mu_musician_key=musician_key;
  IF (SELECT ar_artist_name FROM public.artist WHERE ar_artist_key=person_key) = '__ART013A2_TEST__ Musician side' THEN
    RAISE EXCEPTION 'FT-050 reverse sync detected';
  END IF;

  BEGIN
    DELETE FROM public.artist WHERE ar_artist_key=person_key;
  EXCEPTION WHEN foreign_key_violation THEN
    RAISE NOTICE '[PASS] FT-055 delete is blocked by referential integrity; musician remains.';
  END;
  IF NOT EXISTS (SELECT 1 FROM public.musician WHERE mu_musician_key=musician_key) THEN
    RAISE EXCEPTION 'FT-055 artist delete removed musician';
  END IF;

  SELECT count(*) INTO after_artist_count FROM public.artist;
  SELECT count(*) INTO after_musician_count FROM public.musician;
  RAISE NOTICE '[PASS] ART-013A-2 integration scenarios executed. before_artist=%, after_artist=%, before_musician=%, after_musician=%',
    before_artist_count, after_artist_count, before_musician_count, after_musician_count;
END;
$$;

ROLLBACK;
