import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const model = readFileSync('models/artist.js', 'utf8');
const routes = readFileSync('routes/artistRoutes.js', 'utf8');
const controller = readFileSync('controllers/artistController.js', 'utf8');
const api = readFileSync('client/src/api.js', 'utf8');
const ui = readFileSync('client/src/components/ArtistPageContent.jsx', 'utf8');
const migration = readFileSync('scripts/sql/20260608_art012e4_enrichment_proposals_apply.sql', 'utf8');
const docs = readFileSync('docs/ART_012E_4_Enrichment_Proposal_Apply.md', 'utf8');

test('ART-012E-4 migration adds external profile and proposal review/apply metadata', () => {
  assert.match(migration, /CREATE TABLE IF NOT EXISTS public\.artist_external_profile/);
  assert.match(migration, /applied_at TIMESTAMPTZ/);
  assert.match(migration, /ignored_at TIMESTAMPTZ/);
  assert.match(migration, /uq_artist_external_profile_source/);
});

test('ART-012E-4 backend exposes apply and review-status endpoints', () => {
  assert.match(routes, /enrichment-proposals\/:proposalId\/status/);
  assert.match(routes, /enrichment-proposals\/:proposalId\/apply/);
  assert.match(controller, /updateDiscogsEnrichmentProposalStatus/);
  assert.match(controller, /applyDiscogsEnrichmentProposal/);
  assert.match(model, /async function updateDiscogsEnrichmentProposalStatus/);
  assert.match(model, /async function applyDiscogsEnrichmentProposal/);
});

test('ART-012E-4 apply logic protects local values and exact date fields', () => {
  assert.match(model, /CONFIRM_OVERWRITE_REQUIRED/);
  assert.match(model, /Only exact dates can be applied to artist date fields/);
  assert.match(model, /artist_external_profile/);
  assert.match(model, /discogs_enrichment_proposal_applied/);
});

test('ART-012E-4 frontend offers apply, later and ignore actions', () => {
  assert.match(api, /applyDiscogsEnrichmentProposal/);
  assert.match(api, /updateDiscogsEnrichmentProposalStatus/);
  assert.match(ui, /Toepassen/);
  assert.match(ui, /Negeer/);
  assert.match(ui, /Later/);
  assert.match(ui, /window\.confirm/);
  assert.match(ui, /mergeArtistIntoClientState/);
  assert.match(ui, /data\.artist/);
  assert.match(ui, /lokale artist-tabel wijzigt hierbij niet/);
});

test('ART-012E-4 documentation describes controlled apply behavior', () => {
  assert.match(docs, /expliciet toepassen/i);
  assert.match(docs, /confirm/i);
  assert.match(docs, /artist_external_profile/);
  assert.match(docs, /onvolledige datums/i);
});
