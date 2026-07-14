import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const page = fs.readFileSync(new URL('../client/src/components/ArtistPageContent.jsx', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../client/src/app.css', import.meta.url), 'utf8');

test('hourglass gebruikt een ingebouwd SVG en is niet afhankelijk van Bootstrap Icons font', () => {
  assert.match(page, /function HourglassBottomIcon/);
  assert.match(page, /viewBox="0 0 16 16"/);
  assert.match(page, /className={`artist-hourglass-icon/);
  assert.doesNotMatch(page, /bi bi-hourglass-bottom/);
});

test('tabelindicator gebruikt de herbruikbare overledenstatus met lijst test-id', () => {
  assert.match(page, /passingDate={artist\.ar_artist_passing}/);
  assert.match(page, /testId="artist-deceased-indicator"/);
  assert.match(page, /compact/);
});

test('relatie-inzicht toont de overledenbadge naast de artiestennaam', () => {
  assert.match(page, /passingDate={relationArtist\.ar_artist_passing}/);
  assert.match(page, /testId="artist-relation-deceased-indicator"/);
});

test('offcanvas-details toont eveneens de overledenbadge', () => {
  assert.match(page, /passingDate={detailsArtist\.ar_artist_passing}/);
  assert.match(page, /testId="artist-details-deceased-indicator"/);
});

test('badge heeft datum in tooltip en toegankelijke naam', () => {
  assert.match(page, /const label = `Artiest overleden op \$\{fmtDate\(normalizedDate\)\}`/);
  assert.match(page, /title={label}/);
  assert.match(page, /aria-label={label}/);
  assert.match(page, /<span>Overleden<\/span>/);
});

test('SVG heeft vaste styling voor lijst en detailbadge', () => {
  assert.match(css, /ART-UI-POLISH-1-Fix-2/);
  assert.match(css, /\.artist-hourglass-icon/);
  assert.match(css, /\.artist-deceased-indicator-detail \.artist-hourglass-icon/);
});
