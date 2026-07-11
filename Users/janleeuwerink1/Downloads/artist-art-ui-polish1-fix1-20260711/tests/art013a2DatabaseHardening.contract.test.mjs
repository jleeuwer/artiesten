import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const read = (path) => fs.readFileSync(path, 'utf8');
const exists = (path) => fs.existsSync(path);
const pkg = JSON.parse(read('package.json'));

const files = {
  helper: 'scripts/lib/art013a2-db.sh',
  preflight: 'scripts/musician-preflight.sh',
  verify: 'scripts/musician-verify.sh',
  backfill: 'scripts/backfill-musicians-from-person-artists.sh',
  dbtest: 'scripts/db-test-art013a2-docker.sh',
  migration: 'scripts/sql/20260609_art013a1_musician_backfill_from_person_artists.sql',
  preflightSql: 'scripts/sql/20260711_art013a2_preflight.sql',
  dataPreflightSql: 'scripts/sql/20260711_art013a2_data_preflight.sql',
  previewSql: 'scripts/sql/20260711_art013a2_backfill_preview.sql',
  executeSql: 'scripts/sql/20260711_art013a2_backfill_execute.sql',
  verifySql: 'scripts/sql/20260711_art013a2_verify.sql',
  integrationSql: 'scripts/sql/20260711_art013a2_integration_test.sql'
};

test('ART-013A-2 implementation files and npm contracts exist', () => {
  for (const path of Object.values(files)) assert.equal(exists(path), true, `${path} ontbreekt`);
  assert.equal(pkg.scripts['musician:preflight'], 'bash scripts/musician-preflight.sh');
  assert.equal(pkg.scripts['musician:verify'], 'bash scripts/musician-verify.sh');
  assert.equal(pkg.scripts['test:art013a2:db'], 'bash scripts/db-test-art013a2-docker.sh');
  assert.match(pkg.scripts['test:art013a2'], /test:art013a2:contract.*test:art013a2:db/);
});

test('all ART-013A-2 shell scripts are strict-mode and syntactically valid', () => {
  for (const path of [files.helper, files.preflight, files.verify, files.backfill, files.dbtest, 'scripts/db-migrate-art013a1-docker.sh']) {
    const text = read(path);
    assert.match(text, /^#!\/usr\/bin\/env bash/m);
    assert.match(text, /set -euo pipefail/);
    execFileSync('bash', ['-n', path]);
  }
});

test('preflight SQL is read-only and reports schema, trigger and required-column checks', () => {
  const sql = read(files.preflightSql);
  assert.match(sql, /information_schema\.columns/i);
  assert.match(sql, /ART013A2-REQUIRED-COLUMN/);
  assert.match(sql, /fn_artist_sync_to_musician/);
  assert.match(sql, /trg_artist_sync_to_musician/);
  assert.doesNotMatch(sql, /\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bALTER\b|\bCREATE\b|\bDROP\b/i);
});

test('migration has transaction, ON_ERROR_STOP and duplicate guard before unique index', () => {
  const sql = read(files.migration);
  assert.match(sql, /\\set ON_ERROR_STOP on/i);
  assert.match(sql, /BEGIN;/i);
  assert.match(sql, /HAVING count\(\*\) > 1/i);
  assert.match(sql, /RAISE EXCEPTION/i);
  assert.match(sql, /CREATE UNIQUE INDEX IF NOT EXISTS uq_musician_ar_artist_key_not_null/i);
  assert.ok(sql.indexOf('RAISE EXCEPTION') < sql.indexOf('CREATE UNIQUE INDEX'), 'guard moet voor index staan');
  assert.match(sql, /COMMIT;/i);
});

test('backfill runs central preflight, excludes invalid names and remains idempotent', () => {
  const shell = read(files.backfill);
  const preview = read(files.previewSql);
  const execute = read(files.executeSql);
  assert.match(shell, /musician-preflight\.sh/);
  assert.match(shell, /--preview/);
  assert.match(shell, /--execute/);
  assert.match(preview, /Preview voert geen wijzigingen uit/);
  assert.match(preview, /EMPTY_NAME|NAME_TOO_LONG/);
  assert.match(execute, /NOT EXISTS/i);
  assert.match(execute, /ON CONFLICT DO NOTHING/i);
  assert.doesNotMatch(execute, /UPDATE public\.musician|DELETE FROM public\.musician/i);
});

test('verification covers duplicates, missing links, orphans, non-person links and trigger state', () => {
  const sql = read(files.verifySql);
  for (const term of ['duplicate_links','valid_missing_person_musicians','orphan_musician_links','linked_non_person_artists','trg_artist_sync_to_musician']) {
    assert.match(sql, new RegExp(term));
  }
  assert.match(read(files.verify), /SUMMARY.*blockers=/s);
});

test('database integration test is production guarded and transactionally rolled back', () => {
  const shell = read(files.dbtest);
  const sql = read(files.integrationSql);
  assert.match(shell, /ARTIST_DB_TEST_ALLOWED/);
  assert.match(shell, /production/);
  assert.match(shell, /leftovers/);
  assert.match(sql, /BEGIN;/);
  assert.match(sql, /ROLLBACK;/);
  assert.match(sql, /__ART013A2_TEST__/);
  assert.match(sql, /reverse sync detected/);
  assert.match(sql, /trigger created a musician/);
});

test('credentials are never echoed by ART-013A-2 scripts', () => {
  for (const path of [files.helper, files.preflight, files.verify, files.backfill, files.dbtest]) {
    const text = read(path);
    assert.doesNotMatch(text, /echo[^\n]*(DATABASE_URL|DB_PASSWORD|POSTGRES_PASSWORD)/i);
  }
});
