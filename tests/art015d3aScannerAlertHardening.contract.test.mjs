import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

const scanner = read('scripts/artist_duplicate_scanner.py');

test('ART-015D-3A scanner builds success and failure alerts with configurable threshold', () => {
  assert.match(scanner, /SCANNER_VERSION = "art015d3[ac]-20260602"/);
  assert.match(scanner, /def build_alert/);
  assert.match(scanner, /ARTIST_DUPLICATE_ALERT_WARNING_THRESHOLD/);
  assert.match(scanner, /severity = "warning" if active_count >= warning_threshold(?: or has_stale_warning)? else "info"/);
  assert.match(scanner, /"severity": "danger"/);
  assert.match(scanner, /Artiesten duplicate scan mislukt/);
  assert.match(scanner, /Gevonden:/);
  assert.match(scanner, /nieuw:/);
  assert.match(scanner, /bestaand bijgewerkt:/);
});

test('ART-015D-3A alert writing is optional and may not fail the scanner run', () => {
  assert.match(scanner, /def maybe_write_alert/);
  assert.match(scanner, /ARTIST_DUPLICATE_ALERT_ENABLED/);
  assert.match(scanner, /alert_skipped_no_active_candidates/);
  assert.match(scanner, /alert_failed/);
  assert.match(scanner, /alert failure must not fail the scan itself/);
  assert.match(scanner, /if not args\.no_alert/);
});

test('ART-015D-3A env and docs are wired', () => {
  const env = read('.env.example');
  assert.match(env, /ARTIST_DUPLICATE_ALERT_ENABLED=true/);
  assert.match(env, /ARTIST_DUPLICATE_ALERT_WARNING_THRESHOLD=25/);
  assert.match(read('docs/ART_015D_3A_Scanner_Alert_Hardening.md'), /Scanner alert hardening/);
  assert.match(read('Release Notes/ART_015D_3A_Scanner_Alert_Hardening_Release_Notes.md'), /Geen nieuwe SQL-migratie nodig/);
  assert.match(read('Readme.md'), /ART-015D-3A/);
});

test('ART-015D-3A package scripts are wired into ART-015D test suite', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.scripts['test:art015d3a'], 'node --test tests/art015d3aScannerAlertHardening.contract.test.mjs');
  assert.match(pkg.scripts['test:art015d'], /test:art015d3a/);
});
