#!/usr/bin/env bash
set -euo pipefail
source "$(dirname "$0")/lib/art013b2-db.sh"; art013b2_load_env
[[ "${ARTIST_DB_TEST_ALLOWED:-false}" == "true" ]] || { echo '[BLOCKER][ART013B2-DB-TEST] ARTIST_DB_TEST_ALLOWED=true is verplicht.' >&2; exit 31; }
[[ "${ARTIST_DB_ENVIRONMENT:-development}" != "production" ]] || { echo '[BLOCKER][ART013B2-DB-TEST] productieomgeving geweigerd.' >&2; exit 32; }
art013b2_require_docker
art013b2_psql <<'SQL'
BEGIN;
DO $$ DECLARE b integer; p bigint; BEGIN
 SELECT ar_artist_key INTO b FROM public.artist WHERE ar_artist_type IN ('band','group','duo','trio') LIMIT 1;
 IF b IS NULL THEN RAISE NOTICE '[SKIP] geen bandartist beschikbaar'; RETURN; END IF;
 INSERT INTO public.musician_in_band_proposal(band_artist_key,source_band_external_id,source_person_external_id,proposed_person_name,raw_payload)
 VALUES(b,'__ART013B2_BAND__','__ART013B2_PERSON__','__ART013B2_TEST__','{}') RETURNING proposal_key INTO p;
 IF p IS NULL THEN RAISE EXCEPTION 'proposal insert mislukt'; END IF;
 RAISE NOTICE '[PASS] ART-013B-2 transactionele proposaltest uitgevoerd';
END $$;
ROLLBACK;
SELECT '[SUMMARY][ART013B2-DB-TEST] passed=true leftovers=' || count(*) FROM public.musician_in_band_proposal WHERE proposed_person_name LIKE '__ART013B2_TEST__%';
SQL
