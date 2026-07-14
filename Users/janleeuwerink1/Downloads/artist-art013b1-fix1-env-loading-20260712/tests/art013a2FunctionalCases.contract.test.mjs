import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const runbook = fs.readFileSync('docs/ART_013A_2_Testcases_en_Runbook.md', 'utf8');
const design = fs.readFileSync('docs/ART_013A_2_Databasevalidatie_Backfill_Hardening_Functioneel_Technisch_Ontwerp.md', 'utf8');
const release = fs.readFileSync('Release Notes/ART_013A_2_Databasevalidatie_Backfill_Hardening_Release_Notes.md', 'utf8');
const backlog = fs.readFileSync('docs/BACKLOG.md', 'utf8');
const notes = fs.readFileSync('docs/PROJECT_NOTES.md', 'utf8');

test('all 65 functional testcase identifiers remain documented', () => {
  for (let i = 1; i <= 65; i += 1) {
    const id = `ART013A2-FT-${String(i).padStart(3, '0')}`;
    assert.match(runbook, new RegExp(id), `${id} ontbreekt`);
  }
});

test('documentation is updated from design to implemented status', () => {
  for (const text of [design, release, backlog, notes]) assert.match(text, /ART-013A-2/);
  assert.match(design, /Status: geïmplementeerd/i);
  assert.match(release, /geïmplementeerd/i);
  assert.match(runbook, /musician:preflight/);
  assert.match(runbook, /musician:verify/);
  assert.match(runbook, /test:art013a2:contract/);
  assert.match(runbook, /test:art013a2:db/);
  assert.match(runbook, /ARTIST_DB_TEST_ALLOWED=true/);
});

test('next agreed backlog order remains recorded', () => {
  assert.match(backlog, /ART-UI-Polish/i);
  assert.match(backlog, /ART-012D-4/i);
  assert.match(backlog, /ART-013B/i);
  assert.match(backlog, /ART-014/i);
});
