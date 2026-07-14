\pset tuples_only on
SELECT CASE WHEN to_regclass('public.musician_in_band') IS NULL
  THEN '[BLOCKER] musician_in_band ontbreekt'
  ELSE '[PASS] musician_in_band bestaat'
END;

SELECT CASE WHEN EXISTS(
  SELECT 1 FROM information_schema.columns
  WHERE table_schema='public' AND table_name='musician_in_band' AND column_name='mb_musician_key'
) THEN '[PASS] musician foreign-keykolom: mb_musician_key'
  ELSE '[BLOCKER] musician foreign-keykolom mb_musician_key ontbreekt'
END;

SELECT CASE WHEN EXISTS(
  SELECT 1 FROM information_schema.columns
  WHERE table_schema='public' AND table_name='musician_in_band' AND column_name='mb_artist_key'
) THEN '[PASS] band foreign-keykolom: mb_artist_key'
  ELSE '[BLOCKER] band foreign-keykolom mb_artist_key ontbreekt'
END;

SELECT CASE WHEN EXISTS(
  SELECT 1 FROM information_schema.columns
  WHERE table_schema='public' AND table_name='musician_in_band' AND column_name='mb_musician_band_key'
) THEN '[PASS] technische relationsleutel aanwezig: mb_musician_band_key'
  ELSE '[INFO] technische relationsleutel mb_musician_band_key ontbreekt en wordt door de migratie toegevoegd'
END;

SELECT format('[INFO] bestaande relaties=%s',count(*)) FROM public.musician_in_band;
SELECT format('[WARNING] exacte bestaande sleutelduplicaten=%s',count(*))
FROM (
  SELECT mb_musician_key,mb_artist_key,count(*)
  FROM public.musician_in_band
  GROUP BY 1,2
  HAVING count(*)>1
) d;
