\pset tuples_only on
SELECT CASE WHEN to_regclass('public.musician_in_band') IS NULL THEN '[BLOCKER] musician_in_band ontbreekt' ELSE '[PASS] musician_in_band bestaat' END;
SELECT CASE WHEN count(*)=3 THEN '[PASS] bekende sleutelkolommen aanwezig' ELSE '[BLOCKER] verwacht mb_musician_band_key, mb_musician_key en mb_artist_key' END FROM information_schema.columns WHERE table_schema='public' AND table_name='musician_in_band' AND column_name IN ('mb_musician_band_key','mb_musician_key','mb_artist_key');
SELECT format('[INFO] bestaande relaties=%s',count(*)) FROM public.musician_in_band;
SELECT format('[WARNING] exacte bestaande sleutelduplicaten=%s',count(*)) FROM (SELECT mb_musician_key,mb_artist_key,count(*) FROM public.musician_in_band GROUP BY 1,2 HAVING count(*)>1) d;
