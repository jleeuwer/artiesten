#!/usr/bin/env python3
"""ART-015D-1 periodic artist duplicate scanner.

This scanner is intentionally review-only: it writes duplicate candidates to
staging tables and never performs an artist merge.

It uses the user's Docker PostgreSQL setup through `docker exec ... psql`, so no
external Python database package is required.
"""
from __future__ import annotations

import argparse
import csv
import datetime as dt
import difflib
import io
import json
import os
import re
import subprocess
import sys
import unicodedata
from collections import defaultdict
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable, Any

SCANNER_VERSION = "art015d2a-20260526"
DEFAULT_MIN_SCORE = 82.0


def load_env(path: Path) -> None:
    if not path.exists():
        return
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        os.environ.setdefault(key, value)


def timestamp() -> str:
    return dt.datetime.now().strftime("%Y%m%d-%H%M%S")


class ScannerLogger:
    def __init__(self, log_file: Path, verbose: bool = False) -> None:
        self.log_file = log_file
        self.verbose = verbose
        self.log_file.parent.mkdir(parents=True, exist_ok=True)

    def _write(self, level: str, message: str, **meta: Any) -> None:
        record = {
            "ts": dt.datetime.now(dt.timezone.utc).isoformat(),
            "level": level,
            "message": message,
            **meta,
        }
        line = json.dumps(record, ensure_ascii=False, sort_keys=True)
        with self.log_file.open("a", encoding="utf-8") as handle:
            handle.write(line + "\n")
        if self.verbose or level in {"warn", "error", "info"}:
            print(f"[{level.upper()}] {message}" + (f" {meta}" if meta else ""))

    def debug(self, message: str, **meta: Any) -> None:
        if self.verbose:
            self._write("debug", message, **meta)

    def info(self, message: str, **meta: Any) -> None:
        self._write("info", message, **meta)

    def warn(self, message: str, **meta: Any) -> None:
        self._write("warn", message, **meta)

    def error(self, message: str, **meta: Any) -> None:
        self._write("error", message, **meta)


class PsqlDocker:
    def __init__(self, container: str, db_user: str, db_name: str, logger: ScannerLogger) -> None:
        self.container = container
        self.db_user = db_user
        self.db_name = db_name
        self.logger = logger

    def run(self, sql: str, *, tuples_only: bool = False) -> str:
        """Run SQL through psql stdin.

        ART-015D-2A-Fix-1: never pass generated batch SQL through
        `psql -c <sql>`. Large duplicate scans can create hundreds of candidate
        rows and exceed the OS argument-length limit when the SQL is passed as a
        command argument. Supplying the SQL via stdin keeps the command line
        small and makes the scanner safe for larger batches.
        """
        cmd = [
            "docker", "exec", "-i", self.container,
            "psql", "-v", "ON_ERROR_STOP=1", "-X", "-q",
            "-U", self.db_user, "-d", self.db_name,
        ]
        if tuples_only:
            cmd.extend(["-t", "-A"])
        result = subprocess.run(cmd, input=sql, text=True, capture_output=True, check=False)
        if result.returncode != 0:
            self.logger.error("psql command failed", stderr=result.stderr.strip())
            raise RuntimeError(result.stderr.strip() or "psql command failed")
        return result.stdout

    def copy_csv(self, select_sql: str) -> list[dict[str, str]]:
        sql = f"copy ({select_sql}) to stdout with csv header"
        stdout = self.run(sql)
        return list(csv.DictReader(io.StringIO(stdout)))


def sql_quote(value: Any) -> str:
    if value is None:
        return "null"
    text = str(value)
    return "'" + text.replace("'", "''") + "'"


def json_sql(value: Any) -> str:
    return sql_quote(json.dumps(value, ensure_ascii=False, sort_keys=True)) + "::jsonb"


def normalize_name(value: str) -> str:
    value = value or ""
    value = unicodedata.normalize("NFKD", value)
    value = "".join(ch for ch in value if not unicodedata.combining(ch))
    value = value.lower().strip()
    value = value.replace("&", " and ")
    value = re.sub(r"[^a-z0-9]+", " ", value)
    value = re.sub(r"\s+", " ", value).strip()
    return value


def tokens(value: str) -> set[str]:
    return {part for part in normalize_name(value).split() if part}


def similarity_ratio(left: str, right: str) -> float:
    left_norm = normalize_name(left)
    right_norm = normalize_name(right)
    if not left_norm or not right_norm:
        return 0.0
    if left_norm == right_norm:
        return 100.0
    seq_ratio = difflib.SequenceMatcher(None, left_norm, right_norm).ratio() * 100.0
    left_tokens = set(left_norm.split())
    right_tokens = set(right_norm.split())
    token_ratio = 0.0
    if left_tokens and right_tokens:
        token_ratio = len(left_tokens & right_tokens) / len(left_tokens | right_tokens) * 100.0
    return max(seq_ratio, token_ratio)


def is_short_risky_name(name: str) -> bool:
    norm = normalize_name(name)
    return len(norm) <= 4 or len(norm.split()) == 1 and len(norm) <= 5


@dataclass
class ArtistVariant:
    artist_key: int
    artist_name: str
    variant: str
    source: str
    norm: str = field(init=False)

    def __post_init__(self) -> None:
        self.norm = normalize_name(self.variant)


@dataclass
class Candidate:
    artist_key_a: int
    artist_name_a: str
    artist_key_b: int
    artist_name_b: str
    score: float
    method: str
    reason: str
    details: dict[str, Any]

    @property
    def pair_key(self) -> tuple[int, int]:
        return tuple(sorted((self.artist_key_a, self.artist_key_b)))  # type: ignore[return-value]


def fetch_variants(db: PsqlDocker) -> list[ArtistVariant]:
    artist_rows = db.copy_csv(
        """
        select
          ar_artist_key::int as artist_key,
          ar_artist_name::text as artist_name
        from public.artist
        where coalesce(ar_is_deleted, false) = false
          and ar_merged_into_artist_key is null
        order by ar_artist_key
        """
    )
    variants: list[ArtistVariant] = []
    artist_names: dict[int, str] = {}
    for row in artist_rows:
        key = int(row["artist_key"])
        name = row["artist_name"]
        artist_names[key] = name
        variants.append(ArtistVariant(key, name, name, "artist"))

    spelling_rows = db.copy_csv(
        """
        select
          s.as_artist_key::int as artist_key,
          a.ar_artist_name::text as artist_name,
          s.as_alternatieve_spelling::text as spelling
        from public.artiesten_spelling s
        join public.artist a on a.ar_artist_key = s.as_artist_key
        where s.as_artist_key is not null
          and s.as_alternatieve_spelling is not null
          and coalesce(a.ar_is_deleted, false) = false
          and a.ar_merged_into_artist_key is null
        order by s.as_artist_key, s.as_alternatieve_spelling
        """
    )
    for row in spelling_rows:
        key = int(row["artist_key"])
        variants.append(ArtistVariant(key, row["artist_name"] or artist_names.get(key, ""), row["spelling"], "artiesten_spelling"))
    return [variant for variant in variants if variant.norm]


def candidate_from_variants(left: ArtistVariant, right: ArtistVariant, min_score: float) -> Candidate | None:
    if left.artist_key == right.artist_key:
        return None
    score = similarity_ratio(left.variant, right.variant)
    if left.norm == right.norm:
        score = 100.0
        method = "exact_normalized"
    else:
        method = "fuzzy_name"
        if left.source == "artiesten_spelling" or right.source == "artiesten_spelling":
            method = "fuzzy_spelling"
            score = min(100.0, score + 3.0)

    # Short artist names cause false positives, so require exact normalized match
    # or a very high score.
    if (is_short_risky_name(left.variant) or is_short_risky_name(right.variant)) and score < 96.0:
        return None
    if score < min_score:
        return None

    a_key, b_key = sorted((left.artist_key, right.artist_key))
    if a_key == left.artist_key:
        a_name, b_name = left.artist_name, right.artist_name
    else:
        a_name, b_name = right.artist_name, left.artist_name

    details = {
        "left": {
            "artist_key": left.artist_key,
            "artist_name": left.artist_name,
            "variant": left.variant,
            "source": left.source,
            "normalized": left.norm,
        },
        "right": {
            "artist_key": right.artist_key,
            "artist_name": right.artist_name,
            "variant": right.variant,
            "source": right.source,
            "normalized": right.norm,
        },
        "token_overlap": sorted(tokens(left.variant) & tokens(right.variant)),
        "short_name_guard": is_short_risky_name(left.variant) or is_short_risky_name(right.variant),
    }
    reason = f"{left.source}:{left.variant} ↔ {right.source}:{right.variant}"
    return Candidate(a_key, a_name, b_key, b_name, round(score, 2), method, reason, details)


def find_candidates(variants: list[ArtistVariant], min_score: float, max_candidates: int) -> list[Candidate]:
    best: dict[tuple[int, int], Candidate] = {}

    exact_buckets: dict[str, list[ArtistVariant]] = defaultdict(list)
    fuzzy_buckets: dict[tuple[str, int], list[ArtistVariant]] = defaultdict(list)
    token_buckets: dict[str, list[ArtistVariant]] = defaultdict(list)

    for variant in variants:
        exact_buckets[variant.norm].append(variant)
        first = variant.norm[:1]
        fuzzy_buckets[(first, len(variant.norm) // 4)].append(variant)
        for token in tokens(variant.variant):
            if len(token) >= 4:
                token_buckets[token].append(variant)

    def consider(left: ArtistVariant, right: ArtistVariant) -> None:
        cand = candidate_from_variants(left, right, min_score)
        if not cand:
            return
        previous = best.get(cand.pair_key)
        if previous is None or cand.score > previous.score:
            best[cand.pair_key] = cand

    for bucket in exact_buckets.values():
        if len(bucket) > 1:
            for i in range(len(bucket)):
                for j in range(i + 1, len(bucket)):
                    consider(bucket[i], bucket[j])

    # Fuzzy comparisons within small length/initial buckets.
    for (first, length_bucket), bucket in fuzzy_buckets.items():
        neighbourhood = []
        for delta in (-1, 0, 1):
            neighbourhood.extend(fuzzy_buckets.get((first, length_bucket + delta), []))
        for left in bucket:
            for right in neighbourhood:
                if left.artist_key < right.artist_key:
                    consider(left, right)

    # Token-bucket comparisons catch punctuation/articles/spelling cases.
    for bucket in token_buckets.values():
        if len(bucket) > 80:
            # Avoid very generic tokens creating huge false-positive buckets.
            continue
        for i in range(len(bucket)):
            for j in range(i + 1, len(bucket)):
                consider(bucket[i], bucket[j])

    return sorted(best.values(), key=lambda item: (-item.score, item.artist_name_a, item.artist_name_b))[:max_candidates]


def create_scan_run(db: PsqlDocker, args: argparse.Namespace, log_file: Path) -> int:
    config = {
        "min_score": args.min_score,
        "max_candidates": args.max_candidates,
        "short_name_guard": True,
        "sources": ["artist.ar_artist_name", "artiesten_spelling.as_alternatieve_spelling"],
    }
    sql = f"""
      insert into public.artist_duplicate_scan_runs
        (status, scanner_version, match_config, log_file, created_by)
      values
        ('running'::text, {sql_quote(SCANNER_VERSION)}::text, {json_sql(config)}, {sql_quote(str(log_file))}::text, {sql_quote(args.created_by)}::text)
      returning scan_run_id;
    """
    return int(db.run(sql, tuples_only=True).strip())


def complete_scan_run(
    db: PsqlDocker,
    scan_run_id: int,
    status: str,
    candidate_count: int,
    error_message: str | None = None,
    *,
    candidates_found: int = 0,
    candidates_inserted: int = 0,
    candidates_updated_existing: int = 0,
    candidates_skipped_reviewed: int = 0,
) -> None:
    sql = f"""
      update public.artist_duplicate_scan_runs
      set finished_at = now(),
          status = {sql_quote(status)}::text,
          candidate_count = {int(candidate_count)}::integer,
          candidates_found = {int(candidates_found)}::integer,
          candidates_inserted = {int(candidates_inserted)}::integer,
          candidates_updated_existing = {int(candidates_updated_existing)}::integer,
          candidates_skipped_reviewed = {int(candidates_skipped_reviewed)}::integer,
          error_message = {sql_quote(error_message)}::text
      where scan_run_id = {int(scan_run_id)}::bigint;
    """
    db.run(sql)


def fetch_existing_candidate_index(db: PsqlDocker, pair_keys: set[tuple[int, int]]) -> dict[tuple[int, int], dict[str, str]]:
    if not pair_keys:
        return {}
    pair_values = ", ".join(f"({low}::integer, {high}::integer)" for low, high in sorted(pair_keys))
    rows = db.copy_csv(
        f"""
        with requested_pairs(artist_key_low, artist_key_high) as (
          values {pair_values}
        ), ranked as (
          select
            c.candidate_id::text as candidate_id,
            c.artist_key_low::text as artist_key_low,
            c.artist_key_high::text as artist_key_high,
            c.status::text as status,
            c.match_score::text as match_score,
            row_number() over (
              partition by c.artist_key_low, c.artist_key_high
              order by
                case when c.status in ('new', 'reviewing', 'merge_planned', 'error') then 0 else 1 end,
                c.last_seen_at desc nulls last,
                c.created_at desc
            ) as row_nr
          from public.artist_duplicate_candidates c
          join requested_pairs p
            on p.artist_key_low = c.artist_key_low
           and p.artist_key_high = c.artist_key_high
        )
        select candidate_id, artist_key_low, artist_key_high, status, match_score
        from ranked
        where row_nr = 1
        """
    )
    return {(int(row["artist_key_low"]), int(row["artist_key_high"])): row for row in rows}


def persist_candidates(db: PsqlDocker, scan_run_id: int, candidates: list[Candidate], logger: ScannerLogger) -> dict[str, int]:
    stats = {
        "found": len(candidates),
        "inserted": 0,
        "updated_existing": 0,
        "skipped_reviewed": 0,
    }
    if not candidates:
        return stats

    reviewed_statuses = {"not_duplicate", "ignored", "merged"}
    open_statuses = {"new", "reviewing", "merge_planned", "error"}
    existing = fetch_existing_candidate_index(db, {cand.pair_key for cand in candidates})

    inserts: list[Candidate] = []
    updates: list[tuple[Candidate, int]] = []
    for cand in candidates:
        existing_row = existing.get(cand.pair_key)
        if existing_row is None:
            inserts.append(cand)
            continue
        status = existing_row["status"]
        if status in reviewed_statuses:
            stats["skipped_reviewed"] += 1
            logger.debug("artist_duplicate_scan.skip_reviewed", pair_key=cand.pair_key, status=status)
            continue
        if status in open_statuses:
            updates.append((cand, int(existing_row["candidate_id"])))
            continue
        # Unknown future status: keep safe by skipping rather than duplicating.
        stats["skipped_reviewed"] += 1
        logger.warn("artist_duplicate_scan.skip_unknown_status", pair_key=cand.pair_key, status=status)

    if inserts:
        values = []
        for cand in inserts:
            low, high = cand.pair_key
            values.append(
                "(" + ", ".join([
                    f"{scan_run_id}::bigint",
                    f"{cand.artist_key_a}::integer",
                    f"{sql_quote(cand.artist_name_a)}::text",
                    f"{cand.artist_key_b}::integer",
                    f"{sql_quote(cand.artist_name_b)}::text",
                    f"{low}::integer",
                    f"{high}::integer",
                    f"{cand.score:.2f}::numeric(5,2)",
                    f"{sql_quote(cand.method)}::text",
                    f"{sql_quote(cand.reason)}::text",
                    json_sql(cand.details),
                    "'new'::text",
                    f"{scan_run_id}::bigint",
                    f"{scan_run_id}::bigint",
                    "1::integer",
                ]) + ")"
            )
        sql = f"""
          insert into public.artist_duplicate_candidates
            (scan_run_id, artist_key_a, artist_name_a, artist_key_b, artist_name_b,
             artist_key_low, artist_key_high, match_score, match_method, match_reason,
             match_details, status, first_seen_scan_run_id, last_seen_scan_run_id, times_seen)
          values
            {', '.join(values)}
          on conflict on constraint artist_duplicate_candidates_pair_chk do nothing;
        """
        # The named conflict target above is intentionally not used because CHECK
        # constraints cannot be conflict targets. Use the partial unique index by
        # falling back to generic ON CONFLICT DO NOTHING below.
        sql = sql.replace("on conflict on constraint artist_duplicate_candidates_pair_chk do nothing", "on conflict do nothing")
        db.run(sql)
        stats["inserted"] = len(inserts)

    for cand, candidate_id in updates:
        sql = f"""
          update public.artist_duplicate_candidates
          set last_seen_at = now(),
              last_seen_scan_run_id = {int(scan_run_id)}::bigint,
              times_seen = coalesce(times_seen, 1) + 1,
              match_score = greatest(match_score, {cand.score:.2f}::numeric(5,2)),
              match_method = case when {cand.score:.2f}::numeric(5,2) >= match_score then {sql_quote(cand.method)}::text else match_method end,
              match_reason = case when {cand.score:.2f}::numeric(5,2) >= match_score then {sql_quote(cand.reason)}::text else match_reason end,
              match_details = case when {cand.score:.2f}::numeric(5,2) >= match_score then {json_sql(cand.details)} else match_details end
          where candidate_id = {int(candidate_id)}::bigint;
        """
        db.run(sql)
    stats["updated_existing"] = len(updates)
    return stats


def write_alert(db: PsqlDocker, scan_run_id: int, candidate_count: int) -> None:
    severity = "warning" if candidate_count >= 25 else "info"
    title = "Artiesten duplicate scan afgerond"
    body = f"Scan-run {scan_run_id} heeft {candidate_count} mogelijke dubbele artiesten gevonden."
    sql = f"""
      insert into public.alerts(app_key, module_key, title, body, severity, status)
      values ('artist'::text, 'artist-duplicate-scanner'::text, {sql_quote(title)}::text, {sql_quote(body)}::text, {sql_quote(severity)}::text, 'open'::text);
    """
    db.run(sql)


def parse_args(argv: Iterable[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="ART-015D-1 artist duplicate scanner")
    parser.add_argument("--env", default=".env", help="Path to .env file")
    parser.add_argument("--min-score", type=float, default=DEFAULT_MIN_SCORE)
    parser.add_argument("--max-candidates", type=int, default=500)
    parser.add_argument("--log-dir", default="logs")
    parser.add_argument("--created-by", default="artist_duplicate_scanner.py")
    parser.add_argument("--dry-run", action="store_true", help="Calculate candidates but do not write staging rows")
    parser.add_argument("--no-alert", action="store_true", help="Do not write Shellstarter alert after successful scan")
    parser.add_argument("--verbose", action="store_true")
    return parser.parse_args(list(argv))


def main(argv: Iterable[str]) -> int:
    args = parse_args(argv)
    load_env(Path(args.env))

    log_dir = Path(args.log_dir)
    log_file = log_dir / f"artist-duplicate-scanner-{timestamp()}.jsonl"
    logger = ScannerLogger(log_file, args.verbose)
    container = os.environ.get("ARTIST_DB_CONTAINER", "my-postgresdb")
    db_user = os.environ.get("ARTIST_DB_USER", "postgres")
    db_name = os.environ.get("ARTIST_DB_NAME", "musicdb")
    db = PsqlDocker(container, db_user, db_name, logger)

    scan_run_id: int | None = None
    logger.info("artist_duplicate_scan.start", scanner_version=SCANNER_VERSION, min_score=args.min_score, dry_run=args.dry_run)
    try:
        variants = fetch_variants(db)
        logger.info("artist_duplicate_scan.loaded_variants", variant_count=len(variants))
        candidates = find_candidates(variants, args.min_score, args.max_candidates)
        logger.info("artist_duplicate_scan.candidates_calculated", candidate_count=len(candidates))

        if args.dry_run:
            for cand in candidates[:20]:
                print(f"{cand.score:6.2f} {cand.artist_key_a}:{cand.artist_name_a} <-> {cand.artist_key_b}:{cand.artist_name_b} [{cand.method}]")
            logger.info("artist_duplicate_scan.dry_run_complete", candidate_count=len(candidates), log_file=str(log_file))
            return 0

        scan_run_id = create_scan_run(db, args, log_file)
        stats = persist_candidates(db, scan_run_id, candidates, logger)
        active_count = stats["inserted"] + stats["updated_existing"]
        complete_scan_run(
            db,
            scan_run_id,
            "completed",
            active_count,
            candidates_found=stats["found"],
            candidates_inserted=stats["inserted"],
            candidates_updated_existing=stats["updated_existing"],
            candidates_skipped_reviewed=stats["skipped_reviewed"],
        )
        if not args.no_alert:
            write_alert(db, scan_run_id, active_count)
        logger.info("artist_duplicate_scan.completed", scan_run_id=scan_run_id, log_file=str(log_file), **stats)
        return 0
    except Exception as exc:  # noqa: BLE001 - script boundary: log and mark failed run
        logger.error("artist_duplicate_scan.failed", error=str(exc), scan_run_id=scan_run_id)
        if scan_run_id is not None:
            try:
                complete_scan_run(db, scan_run_id, "failed", 0, str(exc))
            except Exception as update_exc:  # noqa: BLE001
                logger.error("artist_duplicate_scan.failed_status_update_failed", error=str(update_exc), scan_run_id=scan_run_id)
        return 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
