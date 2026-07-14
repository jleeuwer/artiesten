BEGIN;

DO $$ BEGIN
 IF to_regclass('public.musician_in_band') IS NULL THEN RAISE EXCEPTION '[ART-013B-2] BLOCKER: musician_in_band ontbreekt.'; END IF;
 IF to_regclass('public.artist_external_reference') IS NULL THEN RAISE EXCEPTION '[ART-013B-2] BLOCKER: artist_external_reference ontbreekt.'; END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.musician_in_band_proposal (
 proposal_key BIGSERIAL PRIMARY KEY,
 band_artist_key INTEGER NOT NULL REFERENCES public.artist(ar_artist_key) ON DELETE CASCADE,
 proposed_musician_key INTEGER REFERENCES public.musician(mu_musician_key) ON DELETE SET NULL,
 proposed_relation_key BIGINT REFERENCES public.musician_in_band(mb_musician_band_key) ON DELETE SET NULL,
 source_type TEXT NOT NULL DEFAULT 'discogs',
 source_band_external_id TEXT NOT NULL,
 source_person_external_id TEXT NOT NULL,
 source_relationship_id TEXT,
 proposed_person_name TEXT NOT NULL,
 proposed_role TEXT,
 proposed_date_from DATE,
 proposed_date_to DATE,
 match_status TEXT NOT NULL DEFAULT 'new_musician',
 proposal_status TEXT NOT NULL DEFAULT 'new',
 confidence_score NUMERIC(5,2),
 conflict_reason TEXT,
 source_url TEXT,
 raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 reviewed_at TIMESTAMPTZ,
 CONSTRAINT mib_proposal_source_chk CHECK (source_type IN ('discogs','musicbrainz','wikidata')),
 CONSTRAINT mib_proposal_match_chk CHECK (match_status IN ('new_musician','matched_musician','matched_relation','partial','conflict','ambiguous','invalid')),
 CONSTRAINT mib_proposal_status_chk CHECK (proposal_status IN ('new','review_later','ignored','accepted','conflict','invalid'))
);


ALTER TABLE public.musician_in_band_proposal
  ADD COLUMN IF NOT EXISTS proposed_artist_key INTEGER REFERENCES public.artist(ar_artist_key) ON DELETE SET NULL;

ALTER TABLE public.musician_in_band_proposal DROP CONSTRAINT IF EXISTS mib_proposal_match_chk;
ALTER TABLE public.musician_in_band_proposal ADD CONSTRAINT mib_proposal_match_chk CHECK (
  match_status IN ('new_musician','matched_musician','matched_relation','matched_artist_person','artist_type_missing','artist_type_conflict','partial','conflict','ambiguous','invalid')
);
CREATE INDEX IF NOT EXISTS idx_mib_proposal_artist ON public.musician_in_band_proposal (proposed_artist_key);

CREATE UNIQUE INDEX IF NOT EXISTS uq_mib_proposal_source_member
 ON public.musician_in_band_proposal (band_artist_key, lower(source_type), source_band_external_id, source_person_external_id);
CREATE INDEX IF NOT EXISTS idx_mib_proposal_band_status ON public.musician_in_band_proposal (band_artist_key, proposal_status, match_status);
CREATE INDEX IF NOT EXISTS idx_mib_proposal_updated ON public.musician_in_band_proposal (updated_at);

CREATE TABLE IF NOT EXISTS public.musician_in_band_source (
 source_key BIGSERIAL PRIMARY KEY,
 musician_in_band_key BIGINT NOT NULL REFERENCES public.musician_in_band(mb_musician_band_key) ON DELETE CASCADE,
 source_type TEXT NOT NULL,
 source_entity_id TEXT NOT NULL,
 source_relationship_id TEXT,
 source_url TEXT,
 source_role TEXT,
 source_date_from DATE,
 source_date_to DATE,
 raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
 retrieved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 CONSTRAINT mib_source_type_chk CHECK (source_type IN ('manual','discogs','musicbrainz','wikidata'))
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_mib_source_relation_external
 ON public.musician_in_band_source (musician_in_band_key, lower(source_type), source_entity_id);
CREATE INDEX IF NOT EXISTS idx_mib_source_relation ON public.musician_in_band_source (musician_in_band_key);

COMMIT;
