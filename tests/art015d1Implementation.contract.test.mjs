import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

function read(file) {
  assert.ok(fs.existsSync(file), `${file} should exist`);
  return fs.readFileSync(file, 'utf8');
}

test('ART-015D-1 adds staging migration for scan runs and duplicate candidates', () => {
  const sql = read('scripts/sql/20260526_art015d1_duplicate_scanner_staging.sql');
  assert.match(sql, /create table if not exists public\.artist_duplicate_scan_runs/i);
  assert.match(sql, /create table if not exists public\.artist_duplicate_candidates/i);
  assert.match(sql, /scanner voert nooit automatisch een merge uit/i);
  assert.match(sql, /artist_duplicate_candidates_run_pair_uq/i);
  for (const status of ['new', 'reviewing', 'not_duplicate', 'merge_planned', 'merged', 'ignored', 'error']) {
    assert.match(sql, new RegExp(status));
  }
});

test('ART-015D-1 provides Docker-proof migration and scanner run scripts', () => {
  const migrateScript = read('scripts/db-migrate-art015d1-docker.sh');
  assert.match(migrateScript, /docker exec -i/);
  assert.match(migrateScript, /ARTIST_DB_CONTAINER/);
  assert.match(migrateScript, /20260526_art015d1_duplicate_scanner_staging\.sql/);
  assert.match(migrateScript, /art015d1-migration-\$\(date \+%Y%m%d-%H%M%S\)\.log/);

  const runScript = read('scripts/run-artist-duplicate-scanner.sh');
  assert.match(runScript, /python3 scripts\/artist_duplicate_scanner\.py/);
  assert.match(runScript, /ARTIST_DUPLICATE_MIN_SCORE/);
  assert.match(runScript, /ARTIST_DUPLICATE_MAX_CANDIDATES/);
});

test('ART-015D-1 Python scanner contains fuzzy matching, staging inserts and no merge execution', () => {
  const scanner = read('scripts/artist_duplicate_scanner.py');
  assert.match(scanner, /def normalize_name/);
  assert.match(scanner, /difflib\.SequenceMatcher/);
  assert.match(scanner, /artiesten_spelling/);
  assert.match(scanner, /insert into public\.artist_duplicate_scan_runs/i);
  assert.match(scanner, /insert into public\.artist_duplicate_candidates/i);
  assert.match(scanner, /artist_duplicate_scan\.completed/);
  assert.match(scanner, /--dry-run/);
  assert.doesNotMatch(scanner, /mergeArtists|merge\/execute|artist_merge_history\s*\(/);
});

test('ART-015D-1 package scripts and docs mention migration and scan commands', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.scripts['db:migrate:art015d1'], 'bash scripts/db-migrate-art015d1-docker.sh');
  assert.equal(pkg.scripts['scan:duplicates'], 'bash scripts/run-artist-duplicate-scanner.sh');
  assert.equal(pkg.scripts['test:art015d1'], 'node --test tests/art015d1Implementation.contract.test.mjs');

  assert.match(read('Readme.md'), /npm run db:migrate:art015d1/);
  assert.match(read('Readme.md'), /npm run scan:duplicates/);
  assert.match(read('docs/ART_015D_Testcases_en_Runbook.md'), /ART-015D-1/);
  assert.match(read('docs/ART_015D_Periodieke_Duplicate_Scanner_Functioneel_Technisch_Ontwerp.md'), /scripts\/artist_duplicate_scanner\.py/);
});
