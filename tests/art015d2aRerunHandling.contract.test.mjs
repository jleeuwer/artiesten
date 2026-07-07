import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

function read(file) {
  assert.ok(fs.existsSync(file), `${file} should exist`);
  return fs.readFileSync(file, 'utf8');
}

test('ART-015D-2A adds rerun-hardening migration with durable pair keys and scan stats', () => {
  const sql = read('scripts/sql/20260526_art015d2a_duplicate_scanner_rerun_hardening.sql');
  assert.match(sql, /add column if not exists artist_key_low integer/i);
  assert.match(sql, /add column if not exists artist_key_high integer/i);
  assert.match(sql, /add column if not exists first_seen_at timestamptz/i);
  assert.match(sql, /add column if not exists last_seen_at timestamptz/i);
  assert.match(sql, /add column if not exists times_seen integer not null default 1/i);
  assert.match(sql, /candidates_inserted integer not null default 0/i);
  assert.match(sql, /candidates_updated_existing integer not null default 0/i);
  assert.match(sql, /candidates_skipped_reviewed integer not null default 0/i);
  assert.match(sql, /least\(artist_key_a, artist_key_b\)/i);
  assert.match(sql, /greatest\(artist_key_a, artist_key_b\)/i);
  assert.match(sql, /artist_duplicate_candidates_open_pair_uq/i);
});

test('ART-015D-2A scanner updates existing open candidates and skips reviewed pairs', () => {
  const scanner = read('scripts/artist_duplicate_scanner.py');
  assert.match(scanner, /SCANNER_VERSION = "art015d(?:2a|3a|3c)-/);
  assert.match(scanner, /def fetch_existing_candidate_index/);
  assert.match(scanner, /def persist_candidates/);
  assert.match(scanner, /reviewed_statuses = \{"not_duplicate", "ignored", "merged"\}/);
  assert.match(scanner, /open_statuses = \{"new", "reviewing", "merge_planned", "error"\}/);
  assert.match(scanner, /times_seen = coalesce\(times_seen, 1\) \+ 1/);
  assert.match(scanner, /last_seen_scan_run_id = \{int\(scan_run_id\)\}::bigint/);
  assert.match(scanner, /candidates_skipped_reviewed/);
  assert.match(scanner, /candidates_updated_existing/);
});

test('ART-015D-2A provides Docker migration script, package command and docs', () => {
  const script = read('scripts/db-migrate-art015d2a-docker.sh');
  assert.match(script, /docker exec -i/);
  assert.match(script, /ARTIST_DB_CONTAINER/);
  assert.match(script, /20260526_art015d2a_duplicate_scanner_rerun_hardening\.sql/);

  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.scripts['db:migrate:art015d2a'], 'bash scripts/db-migrate-art015d2a-docker.sh');
  assert.equal(pkg.scripts['test:art015d2a'], 'node --test tests/art015d2aRerunHandling.contract.test.mjs');
  assert.match(pkg.scripts['test:art015d'], /tests\/art015d2aRerunHandling\.contract\.test\.mjs/);

  assert.match(read('Readme.md'), /npm run db:migrate:art015d2a/);
  assert.match(read('docs/ART_015D_Testcases_en_Runbook.md'), /ART-015D-2A/);
  assert.match(read('docs/ART_015D_Periodieke_Duplicate_Scanner_Functioneel_Technisch_Ontwerp.md'), /rerun handling/i);
});
