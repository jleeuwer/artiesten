import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (p) => fs.readFileSync(p, 'utf8');

test('ART-012D-3B canonical rename execution is wired backend and frontend', () => {
  const model = read('models/artist.js');
  const controller = read('controllers/artistController.js');
  const routes = read('routes/artistRoutes.js');
  const api = read('client/src/api.js');
  const ui = read('client/src/components/ArtistPageContent.jsx');

  assert.match(model, /async function executeDiscogsCanonicalRename/);
  assert.match(model, /BEGIN/);
  assert.match(model, /FOR UPDATE/);
  assert.match(model, /oldCanonicalSpellingInserted/);
  assert.match(model, /newCanonicalSpellingInserted/);
  assert.match(model, /UPDATE public\.artist[\s\S]*ar_artist_name = \$2::public\.citext/);
  assert.match(model, /INSERT INTO public\.artiesten_spelling/);
  assert.match(model, /ROLLBACK/);
  assert.match(model, /discogs_canonical_rename/);

  assert.match(controller, /async function executeDiscogsCanonicalRename/);
  assert.match(routes, /\/discogs\/spelling-proposals\/canonical/);
  assert.match(api, /executeDiscogsCanonicalRename/);
  // ART-012D-4 replaces the legacy inline spelling/canonical UI with the persistent reviewqueue.
  // Backend canonical rename remains available, but no longer appears in the active relation panel.
  assert.doesNotMatch(ui, /Maak canonical/);
  assert.doesNotMatch(ui, /artist-discogs-canonical-rename-execute-btn/);
  assert.match(ui, /Discogs naamvoorstellen reviewqueue/);
});

test('ART-012D-3B documentation describes spelling-aware transaction and exclusions', () => {
  const doc = read('docs/ART_012D_3B_Canonical_Rename_Uitvoering.md');
  const runbook = read('docs/ART_012D_3B_Testcases_en_Runbook.md');
  const backlog = read('docs/BACKLOG.md');
  const notes = read('docs/PROJECT_NOTES.md');
  const readme = read('Readme.md');

  assert.match(doc, /spelling-aware transactie/i);
  assert.match(doc, /oude canonical naam.*alternatieve spelling/i);
  assert.match(doc, /nieuwe canonical naam.*artiesten_spelling/i);
  assert.match(doc, /file_details\.fd_correct_artist.*niet automatisch/i);
  assert.match(runbook, /Maak canonical/);
  assert.match(backlog, /ART-012D-3B/);
  assert.match(notes, /ART-012D-3B/);
  assert.match(readme, /ART-012D-3B/);
});
