-- ART-015D-2A — Duplicate scanner rerun handling + datamodel hardening
-- Doel: herhaalde scans mogen geen dubbele open review-werkvoorraad veroorzaken.
-- Deze migratie is idempotent en vult bestaande ART-015D-1 data aan.

alter table public.artist_duplicate_scan_runs
  add column if not exists candidates_found integer not null default 0,
  add column if not exists candidates_inserted integer not null default 0,
  add column if not exists candidates_updated_existing integer not null default 0,
  add column if not exists candidates_skipped_reviewed integer not null default 0;

alter table public.artist_duplicate_candidates
  add column if not exists artist_key_low integer,
  add column if not exists artist_key_high integer,
  add column if not exists first_seen_at timestamptz,
  add column if not exists last_seen_at timestamptz,
  add column if not exists first_seen_scan_run_id bigint,
  add column if not exists last_seen_scan_run_id bigint,
  add column if not exists times_seen integer not null default 1;

update public.artist_duplicate_candidates
set artist_key_low = least(artist_key_a, artist_key_b),
    artist_key_high = greatest(artist_key_a, artist_key_b),
    first_seen_at = coalesce(first_seen_at, created_at),
    last_seen_at = coalesce(last_seen_at, created_at),
    first_seen_scan_run_id = coalesce(first_seen_scan_run_id, scan_run_id),
    last_seen_scan_run_id = coalesce(last_seen_scan_run_id, scan_run_id),
    times_seen = greatest(coalesce(times_seen, 1), 1)
where artist_key_low is null
   or artist_key_high is null
   or first_seen_at is null
   or last_seen_at is null
   or first_seen_scan_run_id is null
   or last_seen_scan_run_id is null;

alter table public.artist_duplicate_candidates
  alter column artist_key_low set not null,
  alter column artist_key_high set not null,
  alter column first_seen_at set not null,
  alter column last_seen_at set not null,
  alter column first_seen_scan_run_id set not null,
  alter column last_seen_scan_run_id set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'artist_duplicate_candidates_pair_order_chk'
      and conrelid = 'public.artist_duplicate_candidates'::regclass
  ) then
    alter table public.artist_duplicate_candidates
      add constraint artist_duplicate_candidates_pair_order_chk
      check (artist_key_low = least(artist_key_a, artist_key_b)
             and artist_key_high = greatest(artist_key_a, artist_key_b));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'artist_duplicate_candidates_times_seen_chk'
      and conrelid = 'public.artist_duplicate_candidates'::regclass
  ) then
    alter table public.artist_duplicate_candidates
      add constraint artist_duplicate_candidates_times_seen_chk
      check (times_seen >= 1);
  end if;
end $$;

create index if not exists artist_duplicate_candidates_pair_idx
on public.artist_duplicate_candidates(artist_key_low, artist_key_high);

create index if not exists artist_duplicate_candidates_last_seen_idx
on public.artist_duplicate_candidates(last_seen_at desc, match_score desc);

-- Deze unieke index voorkomt dubbele open werkvoorraad. Als een bestaande database
-- al dubbele open candidates heeft, moet die eerst opgeschoond worden via het
-- diagnostische queryblok in het ART-015D-2A runbook.
do $$
begin
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public'
      and indexname = 'artist_duplicate_candidates_open_pair_uq'
  ) then
    if not exists (
      select 1
      from public.artist_duplicate_candidates
      where status in ('new', 'reviewing', 'merge_planned', 'error')
      group by artist_key_low, artist_key_high
      having count(*) > 1
    ) then
      create unique index artist_duplicate_candidates_open_pair_uq
      on public.artist_duplicate_candidates(artist_key_low, artist_key_high)
      where status in ('new', 'reviewing', 'merge_planned', 'error');
    else
      raise notice 'artist_duplicate_candidates_open_pair_uq not created: duplicate open candidate pairs exist. See ART-015D-2A runbook cleanup query.';
    end if;
  end if;
end $$;

comment on column public.artist_duplicate_candidates.artist_key_low is
  'ART-015D-2A normalized pair key: least(artist_key_a, artist_key_b).';
comment on column public.artist_duplicate_candidates.artist_key_high is
  'ART-015D-2A normalized pair key: greatest(artist_key_a, artist_key_b).';
comment on column public.artist_duplicate_candidates.times_seen is
  'ART-015D-2A number of scanner runs in which this pair was seen.';
comment on column public.artist_duplicate_scan_runs.candidates_inserted is
  'ART-015D-2A number of new candidate rows inserted by this run.';
comment on column public.artist_duplicate_scan_runs.candidates_updated_existing is
  'ART-015D-2A number of existing open candidates updated by this run.';
comment on column public.artist_duplicate_scan_runs.candidates_skipped_reviewed is
  'ART-015D-2A number of candidate pairs skipped because they were already reviewed/merged/ignored.';
