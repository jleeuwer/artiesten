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

test('ART-015C-2 uses clear merge direction labels instead of ambiguous replace labels', () => {
  const component = read('client/src/components/ArtistPageContent.jsx');
  assert.match(component, /Maak kandidaat leidend/);
  assert.match(component, /Maak deze artiest leidend/);
  assert.match(component, /huidige artiest wordt vervangen door kandidaat/);
  assert.match(component, /kandidaat wordt vervangen door huidige artiest/);
  assert.doesNotMatch(component, />\s*Deze vervangen\s*</);
  assert.doesNotMatch(component, />\s*Kandidaat vervangen\s*</);
});

test('ART-015C-2 documentation explains the two merge directions', () => {
  const readme = read('Readme.md');
  const runbook = read('docs/ART_015C_Testcases_en_Runbook.md');
  const releaseNotes = read('Release Notes/ART_015C_2_UI_Hardening_Release_Notes.md');
  for (const doc of [readme, runbook, releaseNotes]) {
    assert.match(doc, /Maak kandidaat leidend/);
    assert.match(doc, /Maak deze artiest leidend/);
  }
});

test('ART-015C-2 renders Bootstrap Icons for favorite state in the artist list button', () => {
  const component = read('client/src/components/ArtistPageContent.jsx');
  assert.match(component, /className=\{r\.ar_is_favorite \? "bi bi-star-fill" : "bi bi-star"\}/);
  assert.match(component, /aria-hidden="true"/);
  assert.match(component, /aria-label=\{r\.ar_is_favorite \? "Verwijder uit favorieten" : "Markeer als favoriet"\}/);
  assert.match(component, /title=\{r\.ar_is_favorite \? "Verwijder uit favorieten" : "Markeer als favoriet"\}/);
});

test('ART-015C-2 provides a Bootstrap Icons-compatible favorite glyph fallback', () => {
  const css = read('client/src/app.css');
  assert.match(css, /artist-favorite-button \.bi-star::before/);
  assert.match(css, /content: "☆"/);
  assert.match(css, /artist-favorite-button \.bi-star-fill::before/);
  assert.match(css, /content: "★"/);
});
