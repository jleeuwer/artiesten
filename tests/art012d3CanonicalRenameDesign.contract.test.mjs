import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const design = fs.readFileSync('docs/ART_012D_3_Canonical_Rename_Spelling_Aware_Ontwerp.md', 'utf8');
const runbook = fs.readFileSync('docs/ART_012D_3_Testcases_en_Runbook.md', 'utf8');
const backlog = fs.readFileSync('docs/BACKLOG.md', 'utf8');
const projectNotes = fs.readFileSync('docs/PROJECT_NOTES.md', 'utf8');
const readme = fs.readFileSync('Readme.md', 'utf8');

test('ART-012D-3 design documents spelling-aware canonical rename rules', () => {
  assert.match(design, /Discogs artist name/i);
  assert.match(design, /voorstel/i);
  assert.match(design, /artist\.ar_artist_name/i);
  assert.match(design, /artiesten_spelling/i);
  assert.match(design, /nooit rechtstreeks/i);
  assert.match(design, /oude canonical naam/i);
  assert.match(design, /nieuwe canonical naam/i);
  assert.match(design, /één database-transactie/i);
  assert.match(design, /ROLLBACK/i);
});

test('ART-012D-3 runbook covers conflicts and non-synchronized text fields', () => {
  assert.match(runbook, /Conflict met bestaande artist/i);
  assert.match(runbook, /Conflict met spelling van andere artist/i);
  assert.match(runbook, /file_details\.fd_correct_artist/i);
  assert.match(runbook, /wordt niet automatisch herschreven/i);
  assert.match(runbook, /npm run test:art012d3/i);
});

test('ART-012D-3 is wired in backlog, project notes and README', () => {
  assert.match(backlog, /ART-012D-3/i);
  assert.match(backlog, /canonical/i);
  assert.match(backlog, /spelling-aware/i);
  assert.match(projectNotes, /ART-012D-3/i);
  assert.match(projectNotes, /Discogs-koppelen blijft gescheiden van canonical rename/i);
  assert.match(readme, /ART-012D-3/i);
});
