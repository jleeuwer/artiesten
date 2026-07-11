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

test('ART-015B exposes read-only duplicate candidate and impactscan endpoints', () => {
  const routes = read('routes/artistRoutes.js');
  const controller = read('controllers/artistController.js');
  const model = read('models/artist.js');

  assert.match(routes, /router\.get\("\/merge\/impact"/);
  assert.match(routes, /router\.get\("\/:id\/duplicate-candidates"/);
  assert.match(controller, /async function findDuplicateCandidates\s*\(/);
  assert.match(controller, /async function getMergeImpact\s*\(/);
  assert.match(model, /async function findDuplicateCandidates\s*\(/);
  assert.match(model, /async function getMergeImpact\s*\(/);
  assert.match(model, /canExecuteMergeInThisSprint/);
});

test('ART-015B fuzzy matching is candidate discovery only', () => {
  const model = read('models/artist.js');
  assert.match(model, /function normalizeArtistName\s*\(/);
  assert.match(model, /function fuzzyScore\s*\(/);
  assert.match(model, /levenshtein/);
  assert.match(model, /artiesten_spelling/);
  assert.match(model, /Fuzzy matching is alleen kandidaatdetectie/);
  assert.match(model, /Fuzzy matching is alleen kandidaatdetectie/);
});

test('ART-015B impactscan covers file_details and artiesten_spelling samples and conflicts', () => {
  const model = read('models/artist.js');
  assert.match(model, /file_details/);
  assert.match(model, /fd_artist_key/);
  assert.match(model, /artiesten_spelling/);
  assert.match(model, /as_artist_key/);
  assert.match(model, /conflicts_with_replacement/);
  assert.match(model, /futureScopes/);
  assert.match(model, /albums en album_artists/);
});

test('ART-015B frontend integrates duplicate search and impactscan in relation panel', () => {
  const api = read('client/src/api.js');
  const component = read('client/src/components/ArtistPageContent.jsx');

  assert.match(api, /findDuplicateCandidates/);
  assert.match(api, /getMergeImpact/);
  assert.match(component, /Zoek mogelijke dubbelen/);
  assert.match(component, /Maak kandidaat leidend/);
  assert.match(component, /Maak deze artiest leidend/);
  assert.match(component, /ART-015C Merge uitvoeren/);
  assert.match(component, /backend valideert de impact opnieuw/);
  assert.match(component, /openMergeImpact/);
});
