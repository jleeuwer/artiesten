import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read = (p) => fs.readFileSync(p, 'utf8');

test('ART-012E-1 database migration adds artist type foundation', () => {
  const sql = read('scripts/sql/20260608_art012e1_discogs_link_artist_type.sql');
  const migrate = read('scripts/db-migrate-art012e1-docker.sh');
  const pkg = JSON.parse(read('package.json'));

  assert.match(sql, /ADD COLUMN IF NOT EXISTS ar_artist_type TEXT NOT NULL DEFAULT 'unknown'/);
  assert.match(sql, /artist_ar_artist_type_chk/);
  for (const value of ['unknown', 'person', 'duo', 'trio', 'group', 'band', 'alias', 'project']) {
    assert.match(sql, new RegExp(`'${value}'`));
  }
  assert.match(sql, /idx_artist_ar_artist_type/);
  assert.match(migrate, /20260608_art012e1_discogs_link_artist_type\.sql/);
  assert.equal(pkg.scripts['db:migrate:art012e1'], 'bash scripts/db-migrate-art012e1-docker.sh');
});

test('ART-012E-1 backend exposes artist type and Discogs linked indicator', () => {
  const model = read('models/artist.js');
  const controller = read('controllers/artistController.js');

  assert.match(model, /COALESCE\(a\.ar_artist_type, 'unknown'\) AS ar_artist_type/);
  assert.match(model, /has_discogs_link/);
  assert.match(model, /artist_external_reference aer/);
  assert.match(model, /lower\(aer\.source\) = 'discogs'/);
  assert.match(model, /aer\.status = 'linked'/);
  assert.match(model, /discogs_external_name/);
  assert.match(model, /ar_artist_type = \$6/);
  assert.match(controller, /ar_artist_type: text\(body\.ar_artist_type\) \|\| 'unknown'/);
});

test('ART-012E-1 frontend shows bi-link Discogs icon and editable artist type', () => {
  const page = read('client/src/components/ArtistPageContent.jsx');
  const modal = read('client/src/components/ArtistFormModal.jsx');
  const css = read('client/src/app.css');

  assert.match(page, /function DiscogsLinkedIcon/);
  assert.match(page, /<i className="bi bi-link"/);
  assert.match(page, /Discogs gekoppeld/);
  assert.match(page, /has_discogs_link/);
  assert.match(page, /artistTypeLabel/);
  assert.match(page, /ar_artist_type/);

  assert.match(modal, /ARTIST_TYPE_OPTIONS/);
  assert.match(modal, /value: "duo"/);
  assert.match(modal, /value: "trio"/);
  assert.match(modal, /Form\.Select/);
  assert.match(modal, /ar_artist_type/);

  assert.match(css, /artist-discogs-link-indicator/);
  assert.match(css, /bi-link::before/);
});

test('ART-012E-1 documentation and release notes are present', () => {
  const docPath = 'docs/ART_012E_1_Discogs_Link_Artist_Type.md';
  const runbookPath = 'docs/ART_012E_1_Testcases_en_Runbook.md';
  const releasePath = 'Release Notes/ART_012E_1_Discogs_Link_Artist_Type_Release_Notes.md';
  const backlog = read('docs/BACKLOG.md');
  const notes = read('docs/PROJECT_NOTES.md');
  const readme = read('Readme.md');

  for (const p of [docPath, runbookPath, releasePath]) {
    assert.equal(fs.existsSync(path.join(process.cwd(), p)), true, `${p} missing`);
  }
  assert.match(read(docPath), /<i class="bi bi-link"><\/i>/);
  assert.match(read(docPath), /artist type/i);
  assert.match(read(runbookPath), /db:migrate:art012e1/);
  assert.match(read(releasePath), /ART-012E-1/);
  assert.match(backlog, /ART-012E-1/);
  assert.match(notes, /ART-012E-1/);
  assert.match(readme, /ART-012E-1/);
});


test('ART-012E-1 Fix 1 refreshes Discogs link icon immediately after linking', () => {
  const page = read('client/src/components/ArtistPageContent.jsx');
  const release = read('Release Notes/ART_012E_1_Fix_1_Discogs_Link_Icon_Refresh_Release_Notes.md');

  assert.match(page, /const linkedArtist = \{/);
  assert.match(page, /has_discogs_link: true/);
  assert.match(page, /discogs_external_id:/);
  assert.match(page, /discogs_external_name:/);
  assert.match(page, /setDiscogsLinkedArtistKeys/);
  assert.match(page, /next\.add\(Number\(linkedArtist\.ar_artist_key\)\)/);
  assert.match(page, /setItems\(\(prev\) => prev\.map/);
  assert.match(page, /Number\(item\.ar_artist_key\) === Number\(linkedArtist\.ar_artist_key\)/);
  assert.match(page, /has_discogs_link: true/);
  assert.match(page, /isDiscogsLinkedArtist/);
  assert.match(page, /load\(\{ silent: true \}\)/);
  assert.match(page, /if \(data\?\.artist\) \{/);
  assert.match(page, /item\.ar_artist_key === data\.artist\.ar_artist_key/);
  assert.match(release, /direct verversen/i);
  assert.match(release, /<i class="bi bi-link"><\/i>/);
});
