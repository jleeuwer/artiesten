import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}
function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

test('ART-015D-3C env and docs are wired', () => {
  const env = read('.env.example');
  assert.match(env, /ARTIST_DUPLICATE_STALE_REVIEW_DAYS=14/);
  assert.match(env, /ARTIST_DUPLICATE_STALE_ALERT_ENABLED=true/);
  assert.match(env, /ARTIST_DUPLICATE_STALE_ALERT_THRESHOLD=1/);

  assert.ok(exists('docs/ART_015D_3C_Stale_Reviewqueue_Signalering.md'));
  assert.ok(exists('docs/ART_015D_3C_Testcases_en_Runbook.md'));
  assert.match(read('docs/ART_015D_3C_Stale_Reviewqueue_Signalering.md'), /Te lang open/);
  assert.match(read('docs/ART_015D_3C_Testcases_en_Runbook.md'), /ARTIST_DUPLICATE_STALE_REVIEW_DAYS=1/);
  assert.match(read('Readme.md'), /ART-015D-3C/);
});

test('ART-015D-3C scanner enriches alerts with stale reviewqueue statistics', () => {
  const scanner = read('scripts/artist_duplicate_scanner.py');
  assert.match(scanner, /SCANNER_VERSION = "art015d3c-20260602"/);
  assert.match(scanner, /def fetch_stale_review_stats/);
  assert.match(scanner, /ARTIST_DUPLICATE_STALE_REVIEW_DAYS/);
  assert.match(scanner, /ARTIST_DUPLICATE_STALE_ALERT_ENABLED/);
  assert.match(scanner, /ARTIST_DUPLICATE_STALE_ALERT_THRESHOLD/);
  assert.match(scanner, /open_count/);
  assert.match(scanner, /stale_count/);
  assert.match(scanner, /oldest_open_days/);
  assert.match(scanner, /Open reviewqueue/);
  assert.match(scanner, /te lang open/);
});

test('ART-015D-3C reviewqueue API returns stale candidate fields', () => {
  const model = read('models/artist.js');
  assert.match(model, /function getDuplicateStaleReviewDays/);
  assert.match(model, /stale_review_days/);
  assert.match(model, /review_age_days/);
  assert.match(model, /is_stale_review_candidate/);
  assert.match(model, /ARTIST_DUPLICATE_STALE_REVIEW_DAYS/);
});

test('ART-015D-3C reviewqueue UI shows stale warning and badge', () => {
  const component = read('client/src/components/ArtistPageContent.jsx');
  const css = read('client/src/app.css');
  assert.match(component, /is_stale_review_candidate/);
  assert.match(component, /Te lang open/);
  assert.match(component, /review_age_days/);
  assert.match(component, /stale_review_days/);
  assert.match(component, /artist-reviewqueue-stale-alert/);
  assert.match(css, /artist-reviewqueue-stale-alert/);
});

test('ART-015D-3C package scripts include stale reviewqueue test', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.match(pkg.scripts['test:art015d3c'], /tests\/art015d3cStaleReviewqueue\.contract\.test\.mjs/);
  assert.match(pkg.scripts['test:art015d'], /test:art015d3c/);
});
