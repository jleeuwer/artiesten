import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, '..');

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

test('ART-015C design documents transaction-first artist merge execution', () => {
  const doc = read('docs/ART_015C_Artiesten_Merge_Transactie_Audit_Alerts_Ontwerp.md');
  assert.match(doc, /één technische database-transactie/);
  assert.match(doc, /Alles lukt, of niets lukt/);
  assert.match(doc, /BEGIN/);
  assert.match(doc, /COMMIT/);
  assert.match(doc, /ROLLBACK/);
  assert.match(doc, /server-side opnieuw/);
});

test('ART-015C design covers agreed merge scope and validation reset', () => {
  const doc = read('docs/ART_015C_Artiesten_Merge_Transactie_Audit_Alerts_Ontwerp.md');
  for (const expected of [
    'file_details',
    'fd_correct_artist',
    'artiesten_spelling',
    'hitlijsten',
    'staging_hitlijsten',
    'import_scan_items',
    'file_details_version_group_validations',
    'artist_merge_history',
    'admin_audit_log',
    'alerts'
  ]) {
    assert.match(doc, new RegExp(expected));
  }
  assert.match(doc, /resetten\/invalideren/);
});

test('ART-015C migration proposal contains merge metadata and history table', () => {
  const sql = read('scripts/sql/20260525_art015c_artist_merge_execution.sql');
  assert.match(sql, /ar_merged_into_artist_key/);
  assert.match(sql, /ar_merged_at/);
  assert.match(sql, /ar_merge_note/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.artist_merge_history/);
  assert.match(sql, /artist_merge_history_distinct_artists_check/);
  assert.match(sql, /NOT VALID/);
  assert.match(sql, /hitlijsten_ar_artist_key_fkey/);
  assert.match(sql, /staging_hitlijsten_hl_artist_key_fkey/);
  assert.match(sql, /import_scan_items_fd_artist_key_fkey/);
});

test('ART-015C runbook documents Docker PostgreSQL migration and tests', () => {
  const runbook = read('docs/ART_015C_Testcases_en_Runbook.md');
  const script = read('scripts/db-migrate-art015c-docker.sh');
  const packageJson = JSON.parse(read('package.json'));
  assert.match(runbook, /PostgreSQL in Docker/);
  assert.match(runbook, /npm run db:migrate:art015c/);
  assert.match(script, /docker exec -i/);
  assert.match(script, /ARTIST_DB_CONTAINER/);
  assert.equal(packageJson.scripts['db:migrate:art015c'], 'bash scripts/db-migrate-art015c-docker.sh');
  assert.match(packageJson.scripts['test:art015c'], /art015cDocumentation\.contract\.test\.mjs/);
  assert.match(packageJson.scripts['test:art015c'], /art015cImplementation\.contract\.test\.mjs/);
});
