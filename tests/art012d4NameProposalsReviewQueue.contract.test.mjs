import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

test('ART-012D-4 adds persistent artist_name_proposals datamodel and Docker migration', () => {
  const sql = read('scripts/sql/20260608_art012d4_discogs_name_proposals_reviewqueue.sql');
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.artist_name_proposals/);
  assert.match(sql, /proposal_name citext NOT NULL/);
  assert.match(sql, /status IN \('new', 'added', 'ignored', 'conflict', 'review_later', 'existing'\)/);
  assert.match(sql, /uq_artist_name_proposals_dedupe/);

  const script = read('scripts/db-migrate-art012d4-docker.sh');
  assert.match(script, /docker exec -i/);
  assert.match(script, /20260608_art012d4_discogs_name_proposals_reviewqueue\.sql/);

  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.scripts['db:migrate:art012d4'], 'bash scripts/db-migrate-art012d4-docker.sh');
  assert.match(pkg.scripts['test:art012d4'], /tests\/art012d4NameProposalsReviewQueue\.contract\.test\.mjs/);
});

test('ART-012D-4 exposes name proposal reviewqueue endpoints and model functions', () => {
  const routes = read('routes/artistRoutes.js');
  assert.match(routes, /\/:id\/discogs\/name-proposals/);
  assert.match(routes, /\/:id\/discogs\/name-proposals\/generate/);
  assert.match(routes, /\/:id\/discogs\/name-proposals\/:proposalId\/status/);
  assert.match(routes, /\/:id\/discogs\/name-proposals\/:proposalId\/apply-spelling/);

  const controller = read('controllers/artistController.js');
  for (const name of ['listDiscogsNameProposals', 'generateDiscogsNameProposals', 'updateDiscogsNameProposalStatus', 'applyDiscogsNameProposalAsSpelling']) {
    assert.match(controller, new RegExp(`async function ${name}`));
    assert.match(controller, new RegExp(`${name},`));
  }

  const model = read('models/artist.js');
  assert.match(model, /async function generateDiscogsNameProposals/);
  assert.match(model, /extractDiscogsNameProposalValues/);
  assert.match(model, /artist_name_proposals/);
  assert.match(model, /applyDiscogsNameProposalAsSpelling/);
  assert.match(model, /addDiscogsAlternativeSpelling/);
});

test('ART-012D-4 frontend contains persistent reviewqueue UI and API helpers', () => {
  const api = read('client/src/api.js');
  assert.match(api, /listDiscogsNameProposals/);
  assert.match(api, /generateDiscogsNameProposals/);
  assert.match(api, /updateDiscogsNameProposalStatus/);
  assert.match(api, /applyDiscogsNameProposalAsSpelling/);

  const page = read('client/src/components/ArtistPageContent.jsx');
  assert.match(page, /Discogs naamvoorstellen reviewqueue/);
  assert.match(page, /Genereer queue/);
  assert.match(page, /Voeg toe als spelling/);
  assert.match(page, /review_later/);
  assert.match(page, /ignored/);
});

test('ART-012D-4 documentation and release notes are present', () => {
  assert.ok(fs.existsSync(path.join(root, 'docs/ART_012D_4_Discogs_Name_Proposals_Reviewqueue.md')));
  assert.ok(fs.existsSync(path.join(root, 'docs/ART_012D_4_Testcases_en_Runbook.md')));
  assert.ok(fs.existsSync(path.join(root, 'Release Notes/ART_012D_4_Discogs_Name_Proposals_Reviewqueue_Release_Notes.md')));
  assert.match(read('docs/ART_012D_4_Discogs_Name_Proposals_Reviewqueue.md'), /aliases\/name variations/);
});
