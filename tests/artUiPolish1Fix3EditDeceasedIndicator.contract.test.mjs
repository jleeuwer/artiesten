import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const modal = fs.readFileSync(new URL('../client/src/components/ArtistFormModal.jsx', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../client/src/app.css', import.meta.url), 'utf8');

test('Edit artist modal bevat een ingebouwd SVG-hourglass', () => {
  assert.match(modal, /function HourglassBottomIcon/);
  assert.match(modal, /viewBox="0 0 16 16"/);
  assert.doesNotMatch(modal, /bi bi-hourglass-bottom/);
});

test('Edit profielheader toont overledenstatus op basis van het actuele formulierdatumveld', () => {
  assert.match(modal, /function EditDeceasedStatusBadge/);
  assert.match(modal, /data-testid="artist-edit-deceased-indicator"/);
  assert.match(modal, /passingDate=\{form\.ar_artist_passing\}/);
  assert.match(modal, /<EditDeceasedStatusBadge passingDate=\{passingDate \|\| source\.ar_artist_passing\} \/>/);
});

test('Edit overledenstatus heeft tooltip, toegankelijke naam en zichtbaar label', () => {
  assert.match(modal, /const label = `Artiest overleden op \$\{displayDate\}`/);
  assert.match(modal, /title=\{label\}/);
  assert.match(modal, /aria-label=\{label\}/);
  assert.match(modal, /<span>Overleden<\/span>/);
});

test('Edit indicator gebruikt expliciete styling hook', () => {
  assert.match(css, /ART-UI-POLISH-1-Fix-3/);
  assert.match(css, /\.artist-edit-deceased-indicator/);
});
