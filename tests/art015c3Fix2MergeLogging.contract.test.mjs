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

test('ART-015C-3-Fix-2 merge SQL parameters use explicit casts for nullable/audit/alert fields', () => {
  const model = read('models/artist.js');
  for (const expected of [
    '$1::integer',
    '$2::integer',
    '$3::public.citext',
    '$5::text',
    '$6::text',
    '$7::jsonb',
    '$8::jsonb',
    '$9::jsonb',
    '$1::text',
    '$2::text',
    '$1::bigint',
  ]) {
    assert.match(model, new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(model, /VALUES \(\$1::integer, \$2::integer, \$3::public\.citext, \$4::public\.citext, \$5::text, \$6::text, \$7::jsonb, \$8::jsonb, \$9::jsonb/);
  assert.match(model, /VALUES \(\$1::text, 'artist', \$2::text, 'artist_merge', \$3::jsonb, \$4::jsonb, \$5::jsonb\)/);
  assert.match(model, /VALUES \('artist', 'artist-merge', 'Artiesten merge uitgevoerd', \$1::text, \$2::text, 'open'\)/);
});

test('ART-015C-3-Fix-2 merge service has structured step logging and rollback diagnostics', () => {
  const model = read('models/artist.js');
  const controller = read('controllers/artistController.js');
  const component = read('client/src/components/ArtistPageContent.jsx');

  assert.match(model, /createMergeLogger/);
  assert.match(model, /mergeLog\.info\("start"/);
  assert.match(model, /currentStep = "insert_artist_merge_history"/);
  assert.match(model, /currentStep = "insert_admin_audit_log"/);
  assert.match(model, /currentStep = "insert_shellstarter_alert"/);
  assert.match(model, /mergeLog\.error\("rollback"/);
  assert.match(model, /failedStep: currentStep/);
  assert.match(model, /safeMessage = "Merge is niet uitgevoerd; de transactie is teruggedraaid\."/);

  assert.match(controller, /mergeStep/);
  assert.match(controller, /transaction: "rolled_back"/);
  assert.match(controller, /Zie serverlog voor technische details/);
  assert.match(component, /payload\?\.mergeStep/);
  assert.match(component, /Stap: \$\{step\}/);
});

test('ART-015C-3-Fix-2 logger respects LOG_LEVEL and writes structured metadata', () => {
  const logger = read('config/logger.js');
  const env = read('.env.example');

  assert.match(logger, /process\.env\.LOG_LEVEL/);
  assert.match(logger, /JSON\.stringify\(meta\)/);
  assert.match(env, /LOG_LEVEL=info/);
});
