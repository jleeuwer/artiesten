import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read = (p) => fs.readFileSync(p, 'utf8');

test('ART-012E-2 database migration enforces one primary Discogs profile image per artist', () => {
  const sql = read('scripts/sql/20260608_art012e2_discogs_profile_image.sql');
  const migrate = read('scripts/db-migrate-art012e2-docker.sh');
  const pkg = JSON.parse(read('package.json'));

  assert.match(sql, /uq_artist_external_image_one_primary/);
  assert.match(sql, /WHERE is_primary = true/);
  assert.match(sql, /row_number\(\) OVER/);
  assert.match(sql, /idx_artist_external_image_artist_primary/);
  assert.match(migrate, /20260608_art012e2_discogs_profile_image\.sql/);
  assert.equal(pkg.scripts['db:migrate:art012e2'], 'bash scripts/db-migrate-art012e2-docker.sh');
  assert.equal(pkg.scripts['test:art012e2'], 'node --test tests/art012e2DiscogsProfileImage.contract.test.mjs');
  assert.match(pkg.scripts['test:art012'], /test:art012e2/);
});

test('ART-012E-2 backend exposes Discogs images and primary image selection', () => {
  const routes = read('routes/artistRoutes.js');
  const controller = read('controllers/artistController.js');
  const model = read('models/artist.js');

  assert.match(routes, /get\("\/:id\/discogs\/images"/);
  assert.match(routes, /post\("\/:id\/discogs\/images\/:imageId\/primary"/);

  assert.match(controller, /getDiscogsImages/);
  assert.match(controller, /setPrimaryDiscogsImage/);
  assert.match(controller, /Artist\.listDiscogsImages/);
  assert.match(controller, /Artist\.setPrimaryDiscogsImage/);

  assert.match(model, /async function listDiscogsImages/);
  assert.match(model, /async function setPrimaryDiscogsImage/);
  assert.match(model, /artist_external_image/);
  assert.match(model, /is_primary = false/);
  assert.match(model, /is_primary = true/);
  assert.match(model, /discogs_primary_image_selected/);
  assert.match(model, /primaryDiscogsImage/);
  assert.match(model, /primary_image_url/);
});

test('ART-012E-2 frontend shows profile photo grid and calls primary image API', () => {
  const api = read('client/src/api.js');
  const page = read('client/src/components/ArtistPageContent.jsx');
  const css = read('client/src/app.css');
  const profileSection = read('client/src/features/art-ui-2/DiscogsProfileImageSection.jsx');

  assert.match(api, /getDiscogsImages/);
  assert.match(api, /setPrimaryDiscogsImage/);
  assert.match(api, /\/api\/artists\/\$\{id\}\/discogs\/images\/\$\{imageId\}\/primary/);

  assert.match(page, /function DiscogsProfileImage/);
  assert.match(page, /relationPrimaryImage/);
  assert.match(page, /relationDiscogsImages/);
  assert.match(page, /<DiscogsProfileImageSection/);
  assert.match(profileSection, /Profielfoto uit Discogs images/);
  assert.match(profileSection, /Maak profielfoto/);
  assert.match(profileSection, /Huidige profielfoto/);
  assert.match(page, /Primaire profielfoto bijgewerkt/);
  assert.match(profileSection, /artist-discogs-image-grid/);
  assert.match(page, /await loadRelations\(\{ \.\.\.relationArtist, \.\.\.artistPatch \}, \{ scrollToPanel: false \}\)/);

  const modal = read('client/src/components/ArtistFormModal.jsx');
  assert.match(modal, /function ArtistProfileHeader/);
  assert.match(modal, /Artiestprofiel/);
  assert.match(modal, /Discogs gekoppeld/);
  assert.match(modal, /primaryDiscogsImage/);
  // Keep the historical ART-012E-2 contract focused on the required profile-header wiring.
  // Newer sprints may add extra props, such as the live passing date used by
  // ART-UI-POLISH-1-Fix-3, without breaking the original profile-image feature.
  assert.match(modal, /<ArtistProfileHeader\b/);
  assert.match(modal, /artist=\{artist\}/);
  assert.match(modal, /relations=\{relations\}/);
  assert.match(modal, /loading=\{relationsLoading\}/);
  assert.match(modal, /passingDate=\{form\.ar_artist_passing\}/);

  assert.match(css, /artist-profile-image/);
  assert.match(css, /artist-discogs-image-grid/);
  assert.match(css, /artist-discogs-image-card-primary/);
  assert.match(css, /artist-edit-profile-header/);
});

test('ART-012E-2 documentation and release notes are present', () => {
  const docPath = 'docs/ART_012E_2_Discogs_Profile_Image.md';
  const runbookPath = 'docs/ART_012E_2_Testcases_en_Runbook.md';
  const releasePath = 'Release Notes/ART_012E_2_Discogs_Profile_Image_Release_Notes.md';
  const backlog = read('docs/BACKLOG.md');
  const notes = read('docs/PROJECT_NOTES.md');
  const readme = read('Readme.md');

  for (const p of [docPath, runbookPath, releasePath]) {
    assert.equal(fs.existsSync(path.join(process.cwd(), p)), true, `${p} missing`);
  }

  assert.match(read(docPath), /artist_external_image\.is_primary/);
  assert.match(read(docPath), /Profielfoto/);
  assert.match(read(runbookPath), /db:migrate:art012e2/);
  assert.match(read(runbookPath), /2>&1 \| tee/);
  assert.match(read(releasePath), /ART-012E-2/);
  assert.match(backlog, /ART-012E-2/);
  assert.match(notes, /ART-012E-2/);
  assert.match(readme, /ART-012E-2/);
});
