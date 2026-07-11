import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, '..');

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

test('ART-015C-3-Fix-3 merge history card shows merge id and artist keys', () => {
  const component = read('client/src/components/ArtistPageContent.jsx');

  assert.match(component, /<th>Merge<\/th>/);
  assert.match(component, /#\{row\.merge_id\}/);
  assert.match(component, /Redundant:\s*<code>#\{row\.redundant_artist_key\}<\/code>/);
  assert.match(component, /Leidend:\s*<code>#\{row\.replacement_artist_key\}<\/code>/);
  assert.match(component, /affectedCountEntries\(row\.affected_counts\)/);
});

test('ART-015C-3-Fix-3 merge result shows redundant and leading artist keys', () => {
  const component = read('client/src/components/ArtistPageContent.jsx');

  assert.match(component, /className="mb-3 artist-merge-result"/);
  assert.match(component, /Merge-ID:\s*<code>#\{mergeResult\.mergeId\}<\/code>/);
  assert.match(component, /Redundant:\s*<code>#\{mergeResult\.redundantArtist\?\.ar_artist_key\}<\/code>/);
  assert.match(component, /Leidend:\s*<code>#\{mergeResult\.replacementArtist\?\.ar_artist_key\}<\/code>/);
  assert.match(component, /affectedCountEntries\(mergeResult\.affectedCounts\)/);
});

test('ART-015C-3-Fix-3 affected counts are rendered with readable labels', () => {
  const component = read('client/src/components/ArtistPageContent.jsx');
  const docs = read('docs/ART_015C_3_Mergehistorie_Samengevoegde_Artiesten.md');

  assert.match(component, /function formatAffectedKey\s*\(/);
  assert.match(component, /Spellingen bijgewerkt/);
  assert.match(component, /Spellingen ontdubbeld/);
  assert.match(component, /Validaties gereset/);
  assert.match(component, /function affectedCountEntries\s*\(/);
  assert.match(docs, /ART-015C-3-Fix-3/);
  assert.match(docs, /redundante artist key/);
});
