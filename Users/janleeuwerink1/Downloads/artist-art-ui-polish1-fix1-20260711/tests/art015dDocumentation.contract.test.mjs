import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const designPath = 'docs/ART_015D_Periodieke_Duplicate_Scanner_Functioneel_Technisch_Ontwerp.md';
const runbookPath = 'docs/ART_015D_Testcases_en_Runbook.md';

function read(file) {
  assert.ok(fs.existsSync(file), `${file} should exist`);
  return fs.readFileSync(file, 'utf8');
}

test('ART-015D design documents the periodic scanner architecture', () => {
  const doc = read(designPath);
  assert.match(doc, /Python duplicate scanner/);
  assert.match(doc, /artist_duplicate_scan_runs/);
  assert.match(doc, /artist_duplicate_candidates/);
  assert.match(doc, /scanner voert zelf nooit een merge uit/i);
  assert.match(doc, /staging\/reviewqueue/);
  assert.match(doc, /bestaande impactscan/);
  assert.match(doc, /bestaande transactionele merge-service/);
});

test('ART-015D design documents candidate status flow and scheduling', () => {
  const doc = read(designPath);
  for (const status of ['new', 'reviewing', 'not_duplicate', 'merge_planned', 'merged', 'ignored', 'error']) {
    assert.match(doc, new RegExp(status));
  }
  assert.match(doc, /Crontab/);
  assert.match(doc, /Custom Python scheduler/);
  assert.match(doc, /Shellstarter alerts\/mail/);
});

test('ART-015D runbook documents future scanner tests and Docker-aware database context', () => {
  const doc = read(runbookPath);
  assert.match(doc, /npm run test:art015d/);
  assert.match(doc, /Scanner voert geen merge uit/);
  assert.match(doc, /Docker PostgreSQL context/);
  assert.match(doc, /localhost:5433/);
  assert.match(doc, /ART-015C-service/);
});
