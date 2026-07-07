import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

const design = read('docs/ART_015D_3_Scheduling_Alerts_Operational_Hardening.md');
const runbook = read('docs/ART_015D_3_Testcases_en_Runbook.md');
const scanner = read('scripts/artist_duplicate_scanner.py');
const wrapper = read('scripts/run-artist-duplicate-scanner.sh');
const startapp = read('startapp.sh');

test('ART-015D-3 documents scheduling variants and operational flow', () => {
  assert.match(design, /scanner → staging candidates → reviewqueue → impactscan → transactionele merge/);
  assert.match(design, /Handmatig starten/);
  assert.match(design, /Crontab/);
  assert.match(design, /macOS launchd/);
  assert.match(design, /Custom Python scheduler/);
  assert.match(design, /Reviewqueue operationele flow/);
});

test('ART-015D-3 documents alert and mail strategy without hard mail coupling', () => {
  assert.match(design, /Alertstrategie/);
  assert.match(design, /public\.alerts/);
  assert.match(design, /artist-duplicate-scanner/);
  assert.match(design, /Mail wordt.*functioneel voorbereid/);
  assert.match(design, /niet hard geïmplementeerd/);
  assert.match(runbook, /Alerttest/);
  assert.match(runbook, /module_key = 'artist-duplicate-scanner'/);
});

test('ART-015D-3 startapp script is present, executable oriented and writes timestamped logs', () => {
  assert.ok(fs.existsSync(path.join(root, 'startapp.sh')), 'startapp.sh should exist');
  const mode = fs.statSync(path.join(root, 'startapp.sh')).mode;
  assert.ok((mode & 0o111) !== 0, 'startapp.sh should be executable');
  assert.match(startapp, /mkdir -p logs/);
  assert.match(startapp, /npm run install:all/);
  assert.match(startapp, /npm run build/);
  assert.match(startapp, /npm run test:all/);
  assert.match(startapp, /npm run dev/);
  assert.match(startapp, /date \+%Y%m%d-%H%M%S/);
});

test('ART-015D-3 scanner and wrapper retain alert and logging controls', () => {
  assert.match(scanner, /--no-alert/);
  assert.match(scanner, /write_alert/);
  assert.match(scanner, /insert into public\.alerts/);
  assert.match(scanner, /artist-duplicate-scanner/);
  assert.match(wrapper, /logs/);
  assert.match(wrapper, /artist-duplicate-scanner-wrapper-/);
});

test('ART-015D-3 package script and documentation are wired', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.scripts['test:art015d3'], 'node --test tests/art015d3OperationalHardening.contract.test.mjs');
  assert.match(pkg.scripts['test:art015d'], /test:art015d3/);
  assert.match(read('Readme.md'), /ART-015D-3/);
  assert.match(read('docs/BACKLOG.md'), /ART-015D-3/);
  assert.match(read('docs/PROJECT_NOTES.md'), /ART-015D-3/);
});
