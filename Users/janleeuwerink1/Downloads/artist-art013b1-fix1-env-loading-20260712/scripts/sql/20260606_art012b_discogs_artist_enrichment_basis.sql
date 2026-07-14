-- ART-012B - Discogs artist enrichment basis
-- Adds generic external reference/cache tables for artist enrichment.

CREATE TABLE IF NOT EXISTS public.artist_external_reference (
  reference_id BIGSERIAL PRIMARY KEY,
  artist_key INTEGER NOT NULL REFERENCES public.artist(ar_artist_key),
  source TEXT NOT NULL,
  external_id TEXT NOT NULL,
  external_url TEXT,
  external_name TEXT,
  confidence_score NUMERIC(5,2),
  status TEXT NOT NULL DEFAULT 'candidate',
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  raw_data_json JSONB,
  CONSTRAINT artist_external_reference_status_chk
    CHECK (status IN ('candidate', 'linked', 'rejected', 'stale', 'error')),
  CONSTRAINT artist_external_reference_source_not_blank_chk
    CHECK (btrim(source) <> ''),
  CONSTRAINT artist_external_reference_external_id_not_blank_chk
    CHECK (btrim(external_id) <> '')
);

CREATE UNIQUE INDEX IF NOT EXISTS artist_external_reference_artist_source_external_uidx
  ON public.artist_external_reference (artist_key, lower(source), external_id);

CREATE INDEX IF NOT EXISTS artist_external_reference_source_external_idx
  ON public.artist_external_reference (lower(source), external_id);

CREATE TABLE IF NOT EXISTS public.artist_enrichment_cache (
  cache_id BIGSERIAL PRIMARY KEY,
  artist_key INTEGER REFERENCES public.artist(ar_artist_key),
  source TEXT NOT NULL,
  external_id TEXT NOT NULL,
  raw_data_json JSONB NOT NULL,
  normalized_data_json JSONB,
  cache_status TEXT NOT NULL DEFAULT 'fetched',
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  cache_error TEXT,
  CONSTRAINT artist_enrichment_cache_status_chk
    CHECK (cache_status IN ('fetched', 'expired', 'failed')),
  CONSTRAINT artist_enrichment_cache_source_not_blank_chk
    CHECK (btrim(source) <> ''),
  CONSTRAINT artist_enrichment_cache_external_id_not_blank_chk
    CHECK (btrim(external_id) <> '')
);

CREATE UNIQUE INDEX IF NOT EXISTS artist_enrichment_cache_artist_source_external_uidx
  ON public.artist_enrichment_cache (coalesce(artist_key, 0), lower(source), external_id);

CREATE TABLE IF NOT EXISTS public.artist_external_image (
  image_id BIGSERIAL PRIMARY KEY,
  artist_key INTEGER NOT NULL REFERENCES public.artist(ar_artist_key),
  source TEXT NOT NULL,
  external_reference_id BIGINT REFERENCES public.artist_external_reference(reference_id),
  external_image_url TEXT NOT NULL,
  external_resource_url TEXT,
  image_type TEXT,
  width INTEGER,
  height INTEGER,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  cache_status TEXT NOT NULL DEFAULT 'remote_only',
  local_cache_path TEXT,
  cached_at TIMESTAMPTZ,
  cache_error TEXT,
  raw_data_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT artist_external_image_cache_status_chk
    CHECK (cache_status IN ('remote_only', 'cached', 'failed', 'expired')),
  CONSTRAINT artist_external_image_source_not_blank_chk
    CHECK (btrim(source) <> ''),
  CONSTRAINT artist_external_image_url_not_blank_chk
    CHECK (btrim(external_image_url) <> ''),
  CONSTRAINT artist_external_image_local_cache_relative_chk
    CHECK (local_cache_path IS NULL OR local_cache_path !~ '^/')
);

CREATE INDEX IF NOT EXISTS artist_external_image_artist_source_idx
  ON public.artist_external_image (artist_key, lower(source));
