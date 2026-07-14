import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

test('ART-012D-4-Fix-1 adds migration and package scripts for reviewqueue hardening', () => {
  const sql = read('scripts/sql/20260608_art012d4_fix1_name_proposal_reviewqueue_hardening.sql');
  assert.match(sql, /reviewed_by text/);
  assert.match(sql, /applied_by text/);
  assert.match(sql, /ignored_by text/);
  assert.match(sql, /'invalid'/);
  assert.match(sql, /idx_artist_name_proposals_type_fix1/);

  const script = read('scripts/db-migrate-art012d4-fix1-docker.sh');
  assert.match(script, /docker exec -i/);
  assert.match(script, /to_regclass\('public.artist_name_proposals'\)/);
  assert.match(script, /Base table missing; applying ART-012D-4 base migration first/);
  assert.match(script, /20260608_art012d4_discogs_name_proposals_reviewqueue\.sql/);
  assert.match(script, /20260608_art012d4_fix1_name_proposal_reviewqueue_hardening\.sql/);

  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.scripts['db:migrate:art012d4:fix1'], 'bash scripts/db-migrate-art012d4-fix1-docker.sh');
  assert.equal(pkg.scripts['db:migrate:art012d4:fix2'], 'bash scripts/db-migrate-art012d4-fix1-docker.sh');
  assert.match(pkg.scripts['test:art012d4'], /art012d4Fix1NameProposalReviewQueueHardening/);
});

test('ART-012D-4-Fix-1 backend supports filters, conflict recheck and reopen', () => {
  const controller = read('controllers/artistController.js');
  assert.match(controller, /status: req\.query\?\.status/);
  assert.match(controller, /type: req\.query\?\.type/);
  assert.match(controller, /q: req\.query\?\.q/);

  const model = read('models/artist.js');
  assert.match(model, /async function detectNameProposalConflict/);
  assert.match(model, /normalizeArtistName\(row\.as_alternatieve_spelling\)/);
  assert.match(model, /FOR UPDATE/);
  assert.match(model, /NAME_PROPOSAL_CONFLICT/);
  assert.match(model, /SPELLING_INSERT_CONFLICT/);
  assert.match(model, /reviewed_by/);
  assert.match(model, /filteredSummary/);
  assert.match(model, /allowed = \["new", "ignored", "review_later"\]/);
  assert.match(model, /NAME_PROPOSAL_TRANSITIONS/);
});

test('ART-012D-4-Fix-1 frontend adds filters, status badges and safe actions', () => {
  const api = read('client/src/api.js');
  assert.match(api, /listDiscogsNameProposals: \(id, \{ status = "all", type = "all", q = "" \} = \{\}\)/);

  const page = read('client/src/components/ArtistPageContent.jsx');
  assert.match(page, /discogsNameQueueStatusFilter/);
  assert.match(page, /discogsNameQueueTypeFilter/);
  assert.match(page, /discogsNameQueueSearch/);
  assert.match(page, /Alle statussen/);
  assert.match(page, /Alle types/);
  assert.match(page, /Heropen/);
  assert.match(page, /Niet toepasbaar: spelling is elders gekoppeld/);
  assert.match(page, /canApplyNameProposal/);
  assert.match(page, /nameProposalStatusVariant/);
});

test('ART-012D-4-Fix-1 documentation and release notes are present', () => {
  assert.ok(fs.existsSync(path.join(root, 'docs/ART_012D_4_Fix_1_Name_Proposal_Reviewqueue_Hardening.md')));
  assert.ok(fs.existsSync(path.join(root, 'docs/ART_012D_4_Fix_1_Testcases_en_Runbook.md')));
  assert.ok(fs.existsSync(path.join(root, 'Release Notes/ART_012D_4_Fix_1_Name_Proposal_Reviewqueue_Hardening_Release_Notes.md')));
  assert.match(read('docs/ART_012D_4_Fix_1_Name_Proposal_Reviewqueue_Hardening.md'), /conflictdetectie/i);
});
