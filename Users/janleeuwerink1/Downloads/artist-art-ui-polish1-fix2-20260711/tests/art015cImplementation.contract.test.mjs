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

test('ART-015C-1 exposes transactionele merge execution endpoint and API client', () => {
  const routes = read('routes/artistRoutes.js');
  const controller = read('controllers/artistController.js');
  const api = read('client/src/api.js');

  assert.match(routes, /router\.post\("\/merge\/execute"/);
  assert.match(controller, /async function executeMerge\s*\(/);
  assert.match(controller, /Artist\.executeArtistMerge/);
  assert.match(api, /executeArtistMerge/);
  assert.match(api, /\/api\/artists\/merge\/execute/);
});

test('ART-015C-1 merge service is één database-transactie with rollback on failure', () => {
  const model = read('models/artist.js');
  assert.match(model, /async function executeArtistMerge\s*\(/);
  assert.match(model, /await client\.query\("BEGIN"\)/);
  assert.match(model, /FOR UPDATE/);
  assert.match(model, /await client\.query\("COMMIT"\)/);
  assert.match(model, /await client\.query\("ROLLBACK"\)/);
  assert.match(model, /client\.release\(\)/);
});

test('ART-015C-1 merge service updates agreed scope and records audit alert history', () => {
  const model = read('models/artist.js');
  for (const expected of [
    'UPDATE public.file_details',
    'fd_correct_artist',
    'UPDATE public.artiesten_spelling',
    'DELETE FROM public.artiesten_spelling',
    'UPDATE public.hitlijsten',
    'UPDATE public.staging_hitlijsten',
    'UPDATE public.import_scan_items',
    'file_details_version_group_validations',
    'artist_merge_history',
    'admin_audit_log',
    'public.alerts'
  ]) {
    assert.match(model, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(model, /ar_merged_into_artist_key/);
  assert.match(model, /ar_merged_at/);
  assert.match(model, /ar_merge_note/);
});

test('ART-015C-1 frontend requires reason and explicit confirmation before merge', () => {
  const component = read('client/src/components/ArtistPageContent.jsx');
  assert.match(component, /ART-015C Merge uitvoeren/);
  assert.match(component, /Merge definitief uitvoeren/);
  assert.match(component, /mergeReason/);
  assert.match(component, /mergeConfirmed/);
  assert.match(component, /Ik heb de impactscan gecontroleerd/);
  assert.match(component, /executeMergeFromImpact/);
});

test('ART-015C-1 migration script contains execution migration and FK hardening', () => {
  const sql = read('scripts/sql/20260525_art015c_artist_merge_execution.sql');
  const script = read('scripts/db-migrate-art015c-docker.sh');
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.artist_merge_history/);
  assert.match(sql, /ar_merged_into_artist_key/);
  assert.match(sql, /NOT VALID/);
  assert.match(sql, /hitlijsten_ar_artist_key_fkey/);
  assert.match(sql, /staging_hitlijsten_hl_artist_key_fkey/);
  assert.match(sql, /import_scan_items_fd_artist_key_fkey/);
  assert.match(script, /20260525_art015c_artist_merge_execution\.sql/);
});
