import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const model = fs.readFileSync('models/artist.js', 'utf8');
const controller = fs.readFileSync('controllers/artistController.js', 'utf8');
const routes = fs.readFileSync('routes/artistRoutes.js', 'utf8');
const api = fs.readFileSync('client/src/api.js', 'utf8');
const page = fs.readFileSync('client/src/components/ArtistPageContent.jsx', 'utf8');
const docs = fs.readFileSync('docs/ART_015D_2B_Reviewqueue_Artiesten_App.md', 'utf8');

test('ART-015D-2B exposes reviewqueue API endpoints', () => {
  assert.match(routes, /router\.get\("\/duplicate-candidates"/);
  assert.match(routes, /router\.patch\("\/duplicate-candidates\/:candidateId\/status"/);
  assert.match(controller, /async function listDuplicateReviewCandidates/);
  assert.match(controller, /async function updateDuplicateCandidateStatus/);
  assert.match(api, /listDuplicateReviewCandidates/);
  assert.match(api, /updateDuplicateCandidateStatus/);
});

test('ART-015D-2B model lists candidates with rerun fields and status filters', () => {
  assert.match(model, /function normalizeCandidateStatusFilter/);
  assert.match(model, /artist_duplicate_candidates c/);
  assert.match(model, /first_seen_at/);
  assert.match(model, /last_seen_at/);
  assert.match(model, /times_seen/);
  assert.match(model, /c\.status = ANY/);
  assert.match(model, /match_score >=/);
  assert.match(model, /artist_name_a ILIKE/);
});

test('ART-015D-2B status updates and merge candidate linkage are implemented', () => {
  assert.match(model, /async function updateDuplicateCandidateStatus/);
  assert.match(model, /reviewed_at = CASE WHEN/);
  assert.match(model, /reviewed_by = CASE WHEN/);
  assert.match(model, /duplicateCandidateId/);
  assert.match(model, /UPDATE public\.artist_duplicate_candidates[\s\S]*status = 'merged'/);
  assert.match(model, /merge_id = \$2::bigint/);
});

test('ART-015D-2B UI contains reviewqueue flow and delegates merge to impactscan', () => {
  assert.match(page, /Duplicate reviewqueue/);
  assert.match(page, /reviewQueueOpen/);
  assert.match(page, /loadReviewQueue/);
  assert.match(page, /Maak B leidend/);
  assert.match(page, /Maak A leidend/);
  assert.match(page, /Geen dubbel/);
  assert.match(page, /Negeren/);
  assert.match(page, /duplicateCandidateId: activeReviewCandidateId/);
  assert.match(page, /api\.updateDuplicateCandidateStatus/);
});

test('ART-015D-2B documentation captures scanner queue and no duplicate merge logic', () => {
  assert.match(docs, /scanner vindt kandidaten/);
  assert.match(docs, /bestaande transactionele merge/);
  assert.match(docs, /De reviewqueue voert zelf geen aparte merge-logica uit/);
  assert.match(docs, /GET\s+\/api\/artists\/duplicate-candidates/);
  assert.match(docs, /PATCH \/api\/artists\/duplicate-candidates\/:candidateId\/status/);
});
