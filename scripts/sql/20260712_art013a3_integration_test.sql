\set ON_ERROR_STOP on
BEGIN;
DO $$
DECLARE band_key bigint; person_key bigint; musician_key bigint; relation_key bigint; cnt integer;
BEGIN
 INSERT INTO public.artist(ar_artist_name,ar_artist_type) VALUES('__ART013A3_TEST__ Band','band') RETURNING ar_artist_key INTO band_key;
 INSERT INTO public.musician(ar_artist_key,mu_musician_name,mu_musician_notes) VALUES(NULL,'__ART013A3_TEST__ Standalone',NULL) RETURNING mu_musician_key INTO musician_key;
 IF (SELECT ar_artist_key FROM public.musician WHERE mu_musician_key=musician_key) IS NOT NULL THEN RAISE EXCEPTION 'standalone musician incorrectly linked'; END IF;
 INSERT INTO public.musician_in_band(mb_musician_key,mb_artist_key,mb_role) VALUES(musician_key,band_key,'test') RETURNING mb_musician_band_key INTO relation_key;
 INSERT INTO public.artist(ar_artist_name,ar_artist_type) VALUES('__ART013A3_TEST__ Person','person') RETURNING ar_artist_key INTO person_key;
 UPDATE public.musician SET ar_artist_key=person_key WHERE mu_musician_key=musician_key;
 UPDATE public.artist SET ar_artist_name='__ART013A3_TEST__ Person updated' WHERE ar_artist_key=person_key;
 IF (SELECT mu_musician_name FROM public.musician WHERE mu_musician_key=musician_key)<>'__ART013A3_TEST__ Person updated' THEN RAISE EXCEPTION 'sync failed'; END IF;
 BEGIN
   INSERT INTO public.musician(ar_artist_key,mu_musician_name) VALUES(person_key,'duplicate');
   RAISE EXCEPTION 'unique index failed';
 EXCEPTION WHEN unique_violation THEN NULL; END;
 SELECT count(*) INTO cnt FROM public.musician_in_band WHERE mb_musician_band_key=relation_key;
 IF cnt<>1 THEN RAISE EXCEPTION 'band relation lost'; END IF;
 RAISE NOTICE '[PASS] ART-013A-3 integration scenarios executed.';
END $$;
ROLLBACK;
