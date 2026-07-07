import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const designPath = 'docs/ART_015A_Artiesten_Ontdubbelen_Functioneel_Technisch_Ontwerp.md';
const runbookPath = 'docs/ART_015A_Testcases_en_Runbook.md';

test('ART-015A design document exists and defines the central merge flow', () => {
  assert.ok(fs.existsSync(path.join(root, designPath)), 'ART-015A design document should exist');
  const content = read(designPath);

  assert.match(content, /Artiesten ontdubbelen/i);
  assert.match(content, /redundante artiest kiezen/i);
  assert.match(content, /vervangende artiest kiezen/i);
  assert.match(content, /impactscan/i);
  assert.match(content, /conflictcontrole/i);
  assert.match(content, /expliciet akkoord/i);
  assert.match(content, /transactie/i);
  assert.match(content, /audit\/history/i);
});

test('ART-015A documents both duplicate discovery variants', () => {
  const content = read(designPath);

  assert.match(content, /Periodieke onderhoudsfunctie met staging/i);
  assert.match(content, /Python duplicate scanner/i);
  assert.match(content, /artist_duplicate_candidates/i);
  assert.match(content, /Geïntegreerde ondersteuning in de Artiesten-app/i);
  assert.match(content, /Artiesten-app interactieve fuzzy search/i);
  assert.match(content, /de uiteindelijke flow blijft hetzelfde/i);
});

test('ART-015A treats fuzzy matching as candidate discovery only', () => {
  const content = read(designPath);

  assert.match(content, /Fuzzy matching als candidate discovery/i);
  assert.match(content, /niet om automatisch te mergen/i);
  assert.match(content, /geen automatische merge/i);
  assert.match(content, /matchscore/i);
  assert.match(content, /matchreden/i);
  assert.match(content, /artiesten_spelling\.as_alternatieve_spelling/i);
});

test('ART-015A impactscan includes current tables and future album relationship scope', () => {
  const content = read(designPath);

  assert.match(content, /file_details\.fd_artist_key/i);
  assert.match(content, /artiesten_spelling\.as_artist_key/i);
  assert.match(content, /albums/i);
  assert.match(content, /album-artists/i);
  assert.match(content, /tracks/i);
  assert.match(content, /Discogs artist-links/i);
  assert.match(content, /artist relationships/i);
});

test('ART-015A runbook and backlog are updated', () => {
  assert.ok(fs.existsSync(path.join(root, runbookPath)), 'ART-015A runbook should exist');

  const runbook = read(runbookPath);
  assert.match(runbook, /ART-015A-DOC-001/);
  assert.match(runbook, /ART-015A-DOC-006/);
  assert.match(runbook, /npm run test:art015a/);

  const backlog = read('docs/BACKLOG.md');
  assert.match(backlog, /ART-015A.*Artiesten ontdubbelen/i);
  assert.match(backlog, /periodieke onderhoudsfunctie/i);
  assert.match(backlog, /geïntegreerde ondersteuning/i);
  assert.match(backlog, /ART-015B/i);
  assert.match(backlog, /ART-015D/i);

  const notes = read('docs/PROJECT_NOTES.md');
  assert.match(notes, /2026-05-25.*ART-015A ontwerp/i);
});
