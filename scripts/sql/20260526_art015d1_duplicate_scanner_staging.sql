-- ART-015D-1 — Periodieke artist duplicate scanner staging
-- Doel: scan-runs en reviewbare duplicate candidates vastleggen.
-- De scanner voert nooit automatisch een merge uit.

create table if not exists public.artist_duplicate_scan_runs (
  scan_run_id bigserial primary key,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running',
  scanner_version text,
  match_config jsonb not null default '{}'::jsonb,
  candidate_count integer not null default 0,
  error_message text,
  log_file text,
  created_by text,
  constraint artist_duplicate_scan_runs_status_chk check (
    status in ('running', 'completed', 'failed', 'cancelled')
  )
);

create table if not exists public.artist_duplicate_candidates (
  candidate_id bigserial primary key,
  scan_run_id bigint not null references public.artist_duplicate_scan_runs(scan_run_id) on delete cascade,
  artist_key_a integer not null references public.artist(ar_artist_key),
  artist_name_a text not null,
  artist_key_b integer not null references public.artist(ar_artist_key),
  artist_name_b text not null,
  match_score numeric(5,2) not null,
  match_method text not null,
  match_reason text not null,
  match_details jsonb not null default '{}'::jsonb,
  status text not null default 'new',
  review_decision text,
  review_note text,
  reviewed_at timestamptz,
  reviewed_by text,
  merge_id bigint,
  created_at timestamptz not null default now(),
  constraint artist_duplicate_candidates_pair_chk check (artist_key_a <> artist_key_b),
  constraint artist_duplicate_candidates_status_chk check (
    status in ('new', 'reviewing', 'not_duplicate', 'merge_planned', 'merged', 'ignored', 'error')
  )
);

-- PostgreSQL expression indexes cannot be declared as table constraints.
-- This prevents the same pair appearing twice in one run, regardless of A/B order.
create unique index if not exists artist_duplicate_candidates_run_pair_uq
on public.artist_duplicate_candidates (
  scan_run_id,
  least(artist_key_a, artist_key_b),
  greatest(artist_key_a, artist_key_b)
);

create index if not exists artist_duplicate_candidates_status_idx
on public.artist_duplicate_candidates(status, match_score desc, created_at desc);

create index if not exists artist_duplicate_candidates_artist_a_idx
on public.artist_duplicate_candidates(artist_key_a);

create index if not exists artist_duplicate_candidates_artist_b_idx
on public.artist_duplicate_candidates(artist_key_b);

comment on table public.artist_duplicate_scan_runs is
  'ART-015D-1 scan-run registratie voor periodieke artist duplicate scanner.';

comment on table public.artist_duplicate_candidates is
  'ART-015D-1 reviewbare duplicate candidates; scanner voert nooit automatisch een merge uit.';
