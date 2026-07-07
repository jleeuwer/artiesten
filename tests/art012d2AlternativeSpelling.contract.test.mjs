import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('ART-012D-2 backend adds Discogs proposal as alternative spelling safely', () => {
  const model = read('models/artist.js');
  const controller = read('controllers/artistController.js');
  const routes = read('routes/artistRoutes.js');
  const api = read('client/src/api.js');

  assert.match(model, /async function addDiscogsAlternativeSpelling/);
  assert.match(model, /INSERT INTO public\.artiesten_spelling/);
  assert.match(model, /as_alternatieve_spelling, as_artist_key/);
  assert.match(model, /ALREADY_CANONICAL/);
  assert.match(model, /ALREADY_ALTERNATIVE_SPELLING/);
  assert.match(model, /SPELLING_CONFLICT_OTHER_ARTIST/);
  assert.match(model, /artist_discogs_spelling_optional_audit/);
  assert.match(model, /De lokale canonical artist name is niet gewijzigd/);

  assert.match(controller, /async function addDiscogsAlternativeSpelling/);
  assert.match(routes, /post\("\/:id\/discogs\/spelling-proposals\/alternative"/);
  assert.match(api, /addDiscogsAlternativeSpelling/);
});

test('ART-012D-2 frontend add-as-spelling is now exposed through the persistent reviewqueue', () => {
  const app = read('client/src/components/ArtistPageContent.jsx');

  assert.match(app, /Voeg toe als spelling/);
  assert.match(app, /applyDiscogsNameQueueProposalAsSpelling/);
  assert.match(app, /function canApplyNameProposal/);
  assert.match(app, /\["new", "review_later"\]\.includes\(status\)/);
  assert.match(app, /Niet toepasbaar: spelling is elders gekoppeld/);
  assert.match(app, /Bestaat al bij deze artiest/);
  assert.match(app, /Alternatieve spelling toegevoegd/);
  assert.doesNotMatch(app, /artist-discogs-add-spelling-btn/);
});

test('ART-012D-2 docs and package scripts are wired', () => {
  const design = read('docs/ART_012D_2_Discogs_Naam_Als_Alternatieve_Spelling.md');
  const runbook = read('docs/ART_012D_2_Testcases_en_Runbook.md');
  const backlog = read('docs/BACKLOG.md');
  const pkg = JSON.parse(read('package.json'));

  assert.match(design, /POST \/api\/artists\/:id\/discogs\/spelling-proposals\/alternative/);
  assert.match(design, /canonical artist name blijft ongewijzigd/);
  assert.match(design, /Conflictafhandeling/);
  assert.match(runbook, /TC-ART012D2-001/);
  assert.match(backlog, /ART-012D-2 — Discogs naam toevoegen als alternatieve spelling/);
  assert.match(pkg.scripts['test:art012d2'], /art012d2AlternativeSpelling\.contract\.test\.mjs/);
  assert.match(pkg.scripts['test:art012d'], /art012d2AlternativeSpelling\.contract\.test\.mjs/);
});
