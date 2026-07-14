\pset tuples_only on
SELECT CASE WHEN count(*)=12 THEN '[PASS] ART-013B-1 kolommen aanwezig' ELSE format('[BLOCKER] slechts %s/12 ART-013B-1 kolommen aanwezig',count(*)) END
FROM information_schema.columns
WHERE table_schema='public' AND table_name='musician_in_band'
  AND column_name IN ('mb_musician_band_key','mb_role','mb_date_from','mb_date_to','mb_date_from_precision','mb_date_to_precision','mb_source_type','mb_source_reference','mb_source_url','mb_notes','mb_created_at','mb_updated_at');
SELECT CASE WHEN EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='musician_in_band' AND indexname='uq_musician_in_band_relation_key')
  THEN '[PASS] unieke technische relationsleutel actief'
  ELSE '[BLOCKER] unieke technische relationsleutel ontbreekt'
END;
SELECT format('[INFO] relaties=%s met_rol=%s met_periode=%s',count(*),count(*) FILTER(WHERE mb_role IS NOT NULL),count(*) FILTER(WHERE mb_date_from IS NOT NULL OR mb_date_to IS NOT NULL)) FROM public.musician_in_band;
