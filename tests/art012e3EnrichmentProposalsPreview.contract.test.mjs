import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read = (p) => fs.readFileSync(p, 'utf8');

test('ART-012E-3 database migration creates enrichment proposals preview table', () => {
  const sql = read('scripts/sql/20260608_art012e3_enrichment_proposals_preview.sql');
  const migrate = read('scripts/db-migrate-art012e3-docker.sh');
  const pkg = JSON.parse(read('package.json'));

  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.artist_enrichment_proposals/);
  assert.match(sql, /proposal_type TEXT NOT NULL/);
  assert.match(sql, /target_field TEXT NOT NULL/);
  assert.match(sql, /extraction_confidence TEXT NOT NULL/);
  assert.match(sql, /extraction_context TEXT/);
  assert.match(sql, /profile_text_regex/);
  assert.match(sql, /uq_artist_enrichment_proposals_dedupe/);
  assert.match(sql, /idx_artist_enrichment_proposals_artist_status/);
  assert.match(migrate, /20260608_art012e3_enrichment_proposals_preview\.sql/);
  assert.equal(pkg.scripts['db:migrate:art012e3'], 'bash scripts/db-migrate-art012e3-docker.sh');
  assert.equal(pkg.scripts['test:art012e3'], 'node --test tests/art012e3EnrichmentProposalsPreview.contract.test.mjs');
  assert.match(pkg.scripts['test:art012'], /test:art012e3/);
});

test('ART-012E-3 backend exposes read-only enrichment proposal endpoints and services', () => {
  const routes = read('routes/artistRoutes.js');
  const controller = read('controllers/artistController.js');
  const model = read('models/artist.js');

  assert.match(routes, /get\("\/:id\/discogs\/enrichment-proposals"/);
  assert.match(routes, /post\("\/:id\/discogs\/enrichment-proposals\/generate"/);

  assert.match(controller, /getDiscogsEnrichmentProposals/);
  assert.match(controller, /generateDiscogsEnrichmentProposals/);
  assert.match(controller, /Artist\.listDiscogsEnrichmentProposals/);
  assert.match(controller, /Artist\.generateDiscogsEnrichmentProposals/);

  assert.match(model, /async function listDiscogsEnrichmentProposals/);
  assert.match(model, /async function generateDiscogsEnrichmentProposals/);
  assert.match(model, /extractDiscogsEnrichmentProposalValues/);
  assert.match(model, /extractDateProposalFromProfile/);
  assert.match(model, /inferArtistTypeFromDiscogs/);
  assert.match(model, /profile_text_regex/);
  assert.match(model, /not_applicable/);
  assert.match(model, /Geen gekoppelde Discogs artist gevonden/);
});

test('ART-012E-3 frontend shows read-only Discogs enrichment proposals', () => {
  const api = read('client/src/api.js');
  const page = read('client/src/components/ArtistPageContent.jsx');
  const css = read('client/src/app.css');

  assert.match(api, /getDiscogsEnrichmentProposals/);
  assert.match(api, /generateDiscogsEnrichmentProposals/);
  assert.match(api, /\/api\/artists\/\$\{id\}\/discogs\/enrichment-proposals/);
  assert.match(api, /\/api\/artists\/\$\{id\}\/discogs\/enrichment-proposals\/generate/);

  assert.match(page, /discogsEnrichment/);
  assert.match(page, /loadDiscogsEnrichmentProposals/);
  assert.match(page, /generateDiscogsEnrichmentProposals/);
  assert.match(page, /Discogs verrijkingsvoorstellen/);
  assert.match(page, /Read-only preview/);
  assert.match(page, /Genereer voorstellen/);
  assert.match(page, /enrichmentStatusVariant/);
  assert.match(page, /enrichmentConfidenceVariant/);
  assert.match(page, /extraction_context/);
  assert.match(page, /ART-012E-4/);
  assert.match(page, /EnrichmentValue/);
  assert.match(page, /Open link/);
  assert.match(page, /artist-discogs-enrichment-context/);
  assert.match(css, /artist-discogs-enrichment-preview/);
  assert.match(css, /artist-discogs-enrichment-table/);
  assert.match(css, /table-layout: fixed/);
  assert.match(css, /artist-discogs-enrichment-url/);
  assert.match(css, /text-overflow: ellipsis/);
});

test('ART-012E-3 documentation and release notes are present', () => {
  const docPath = 'docs/ART_012E_3_Enrichment_Proposals_Preview.md';
  const runbookPath = 'docs/ART_012E_3_Testcases_en_Runbook.md';
  const releasePath = 'Release Notes/ART_012E_3_Enrichment_Proposals_Preview_Release_Notes.md';
  const backlog = read('docs/BACKLOG.md');
  const notes = read('docs/PROJECT_NOTES.md');
  const readme = read('Readme.md');

  for (const p of [docPath, runbookPath, releasePath]) {
    assert.equal(fs.existsSync(path.join(process.cwd(), p)), true, `${p} missing`);
  }

  assert.match(read(docPath), /read-only/i);
  assert.match(read(docPath), /artist_enrichment_proposals/);
  assert.match(read(docPath), /profieltekst/i);
  assert.match(read(runbookPath), /db:migrate:art012e3/);
  assert.match(read(runbookPath), /2>&1 \| tee/);
  assert.match(read(releasePath), /ART-012E-3/);
  assert.match(backlog, /ART-012E-3/);
  assert.match(notes, /ART-012E-3/);
  assert.match(readme, /ART-012E-3/);
});
