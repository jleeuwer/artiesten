import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const page = fs.readFileSync('client/src/components/ArtistPageContent.jsx', 'utf8');
const css = fs.readFileSync('client/src/app.css', 'utf8');
const tableViewport = fs.readFileSync('client/src/features/art-ui-2/ArtistTableViewport.jsx', 'utf8');
const envExample = fs.readFileSync('.env.example', 'utf8');
const design = fs.readFileSync('docs/ART_UI_2_FASE_1_2_Scroll_Paneelstructuur_Functioneel_Technisch_Ontwerp.md', 'utf8');

const cases = [
  ['UI2-012-TC-001', /artist-workspace-detail-region/],
  ['UI2-012-TC-002', /data-scroll-container="artist-details"/],
  ['UI2-012-TC-003', /artist-workspace-table-region/],
  ['UI2-012-TC-004', /data-scroll-container="artist-table"/],
  ['UI2-012-TC-005', /\.artist-workspace-detail-region\s*\{[\s\S]*?max-height:\s*none;/],
  ['UI2-012-TC-006', /\.artist-workspace-detail-region\s*\{[\s\S]*?overflow:\s*visible;/],
  ['UI2-012-TC-007', /\.artist-workspace-detail-region \.artist-relation-table-scroll\s*\{[\s\S]*?overflow-y:\s*visible;/],
  ['UI2-012-TC-008', /\.artist-workspace-detail-region \.artist-relation-table-scroll\s*\{[\s\S]*?overflow-x:\s*auto;/],
  ['UI2-012-TC-009', /\.artist-workspace-detail-region \.artist-discogs-results-wrap\s*\{[\s\S]*?overflow-y:\s*visible;/],
  ['UI2-012-TC-010', /\.artist-workspace-detail-region \.artist-discogs-image-grid\s*\{[\s\S]*?max-height:\s*none;/],
  ['UI2-012-TC-011', /\.artist-form-modal \.modal-body\s*\{[\s\S]*?overflow-y:\s*auto;/],
  ['UI2-012-TC-012', /import\.meta\.env\.DEV[\s\S]*VITE_ARTIST_UI_SCROLL_DEBUG/],
  ['UI2-012-TC-013', /VITE_ARTIST_UI_SCROLL_DEBUG=false/],
  ['UI2-012-TC-014', /geen database- of API-wijziging/i],
  ['UI2-012-TC-015', /artist-workspace-detail-region/],
  ['UI2-012-TC-016', /<ArtistFormModal/],
  ['UI2-012-TC-017', /<Offcanvas/],
  ['UI2-012-TC-018', /relationPanelView/],
  ['UI2-012-TC-019', />Discogs</],
  ['UI2-012-TC-020', /<BandMembershipPanel/],
  ['UI2-012-TC-021', /Discogs naamvoorstellen reviewqueue|artistNameProposal/],
  ['UI2-012-TC-022', /Discogs verrijkingsvoorstellen|enrichmentProposal/],
  ['UI2-012-TC-023', /Terug naar artiestenlijst/],
];

for (const [id, regex] of cases) {
  test(`${id} contract blijft geborgd`, () => {
    const number = Number(id.slice(-3));
    const source = id === 'UI2-012-TC-013' ? envExample
      : id === 'UI2-012-TC-014' ? design
      : (number >= 5 && number <= 11) ? css
      : (number === 3 || number === 4) ? `${page}\n${tableViewport}`
      : page;
    assert.match(source, regex);
  });
}

test('scroll debug CSS is scoped and disabled by default', () => {
  assert.match(css, /\.artist-app-root\[data-scroll-debug='true'\]/);
  assert.match(page, /data-scroll-debug=\{scrollDebug \? "true" : "false"\}/);
});

test('ART-UI-2 does not add backend or migration files', () => {
  const suspicious = fs.readdirSync('scripts').filter((name) => /art[-_]?ui[-_]?2/i.test(name) && /(migrate|db|sql|docker)/i.test(name));
  assert.deepEqual(suspicious, []);
});
