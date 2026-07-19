import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const page = fs.readFileSync('client/src/components/ArtistPageContent.jsx', 'utf8');
const layout = fs.readFileSync('client/src/features/art-ui-2/ArtistWorkspaceLayout.jsx', 'utf8');
const viewport = fs.readFileSync('client/src/features/art-ui-2/ArtistTableViewport.jsx', 'utf8');
const profile = fs.readFileSync('client/src/features/art-ui-2/DiscogsProfileImageSection.jsx', 'utf8');
const css = fs.readFileSync('client/src/app.css', 'utf8');
const env = fs.readFileSync('.env.example', 'utf8');

test('workspace layout distinguishes standalone and embedded scroll ownership', () => {
  assert.match(layout, /artist-workspace-embedded/);
  assert.match(layout, /artist-workspace-standalone/);
  assert.match(layout, /artist-workspace-phase34/);
  assert.match(page, /<ArtistWorkspaceLayout embedded=\{embeddedInShell\}/);
});

test('artist table viewport owns the only secondary vertical scroll', () => {
  assert.match(viewport, /artist-table-viewport/);
  assert.match(viewport, /resetKey/);
  assert.match(viewport, /scrollToTop/);
  assert.match(css, /\.artist-table-viewport[\s\S]*overflow:\s*auto/);
  assert.match(css, /max-height:\s*clamp\(/);
});

test('sticky headers and horizontal table width are scoped to phase34', () => {
  assert.match(css, /\.artist-table-phase34 thead th[\s\S]*position:\s*sticky/);
  assert.match(css, /\.artist-table-phase34[\s\S]*min-width/);
});

test('new search context clears old artist detail state and ignores stale list responses', () => {
  assert.match(page, /function clearSelectedArtistContext\(\)/);
  assert.match(page, /setSelectedArtist\(null\)/);
  assert.match(page, /setRelations\(null\)/);
  assert.match(page, /requestId !== artistListRequestRef\.current/);
  assert.match(page, /clearSelectedArtistContext\(\);[\s\S]*setAppliedSearch\(search\)/);
});

test('profile image section is collapsed when a primary image exists', () => {
  assert.match(profile, /useState\(!primaryImage\)/);
  assert.match(profile, /setExpanded\(!primaryImage\)/);
  assert.match(profile, /Profielfoto wijzigen/);
  assert.match(profile, /aria-expanded=\{expanded\}/);
  assert.match(profile, /await onSelectPrimary\(image\);[\s\S]*setExpanded\(false\)/);
  assert.match(profile, /catch[\s\S]*setExpanded\(true\)/);
  assert.match(page, /<DiscogsProfileImageSection/);
});

test('phase34 feature flag is documented', () => {
  assert.match(env, /VITE_ARTIST_UI_WORKSPACE_PHASE34=true/);
  assert.match(page, /VITE_ARTIST_UI_WORKSPACE_PHASE34/);
});

test('phase34 requires no database migration', () => {
  const scripts = JSON.parse(fs.readFileSync('package.json', 'utf8')).scripts;
  assert.ok(!scripts['db:migrate:art-ui2-phase34']);
});
