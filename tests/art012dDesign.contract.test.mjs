import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('ART-012D design documents Discogs spelling proposal rules', () => {
  const design = read('docs/ART_012D_Discogs_Naamvoorstellen_Artiestenspelling_Functioneel_Technisch_Ontwerp.md');
  assert.match(design, /Discogs artist name = bronvoorstel/);
  assert.match(design, /De lokale artistnaam mag nooit rechtstreeks uit Discogs worden overschreven/);
  assert.match(design, /artiesten_spelling\.as_alternatieve_spelling/);
  assert.match(design, /Oude canonical artist name behouden als alternatieve spelling/);
  assert.match(design, /Maak Discogs naam canonical/);
  assert.match(design, /ART-012D-1/);
});

test('ART-012D runbook defines conflict and transaction tests', () => {
  const runbook = read('docs/ART_012D_Testcases_en_Runbook.md');
  assert.match(runbook, /TC-ART012D-004/);
  assert.match(runbook, /conflicterende artist key/);
  assert.match(runbook, /Canonical rename moet in één transactie gebeuren/);
  assert.match(runbook, /npm run test:art012d/);
});

test('ART-012D backlog and project notes are updated', () => {
  const backlog = read('docs/BACKLOG.md');
  const notes = read('docs/PROJECT_NOTES.md');
  assert.match(backlog, /ART-012D — Discogs naamvoorstellen en artiestenspelling toepassen/);
  assert.match(backlog, /Status: functioneel\/technisch uitgewerkt/);
  assert.match(notes, /ART-012D — Discogs naamvoorstellen en artiestenspelling/);
  assert.match(notes, /Discogs artist names zijn bronvoorstellen/);
});
