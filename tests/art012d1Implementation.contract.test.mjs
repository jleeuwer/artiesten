import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('ART-012D-1 backend exposes read-only Discogs spelling proposals', () => {
  const model = read('models/artist.js');
  const controller = read('controllers/artistController.js');
  const routes = read('routes/artistRoutes.js');

  assert.match(model, /async function getDiscogsSpellingProposals/);
  assert.match(model, /artist_external_reference/);
  assert.match(model, /artist_enrichment_cache/);
  assert.match(model, /artiesten_spelling/);
  assert.match(model, /conflict_other_artist/);
  assert.match(model, /already_alternative_spelling/);
  assert.match(model, /ART-012D-1 toont alleen voorstellen/);
  const proposalFunctionBody = model.slice(
    model.indexOf('async function getDiscogsSpellingProposals'),
    model.indexOf('async function addDiscogsAlternativeSpelling')
  );
  assert.doesNotMatch(proposalFunctionBody, /INSERT INTO public\.artiesten_spelling/);

  assert.match(controller, /async function getDiscogsSpellingProposals/);
  assert.match(routes, /\/:id\/discogs\/spelling-proposals/);
});

test('ART-012D-1 legacy spelling proposal API remains available but legacy UI block is removed', () => {
  const app = read('client/src/components/ArtistPageContent.jsx');
  const api = read('client/src/api.js');

  assert.match(api, /getDiscogsSpellingProposals/);
  assert.doesNotMatch(app, /Toon spellingvoorstellen/);
  assert.doesNotMatch(app, /className=\"artist-discogs-proposals mb-2 small border rounded p-2\"/);
  assert.match(app, /Discogs naamvoorstellen reviewqueue/);
});

test('ART-012D-1 docs and package scripts are wired', () => {
  const design = read('docs/ART_012D_1_Discogs_Spellingvoorstellen_Implementatie.md');
  const runbook = read('docs/ART_012D_1_Testcases_en_Runbook.md');
  const pkg = JSON.parse(read('package.json'));
  const backlog = read('docs/BACKLOG.md');

  assert.match(design, /GET \/api\/artists\/:id\/discogs\/spelling-proposals/);
  assert.match(design, /geen database-mutaties/);
  assert.match(design, /conflict_other_artist/);
  assert.match(runbook, /TC-ART012D1-006/);
  assert.match(backlog, /ART-012D-1 — Discogs spellingvoorstellen tonen zonder mutaties/);
  assert.match(pkg.scripts['test:art012d1'], /art012d1Implementation\.contract\.test\.mjs/);
  assert.match(pkg.scripts['test:art012d'], /art012d1Implementation\.contract\.test\.mjs/);
});
