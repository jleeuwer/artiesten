import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const page = fs.readFileSync(new URL('../client/src/components/ArtistPageContent.jsx', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../client/src/app.css', import.meta.url), 'utf8');

test('lijstindicator is gekoppeld aan ar_artist_passing en heeft een expliciete test-id', () => {
  assert.match(page, /const isDeceased = Boolean\(String\(artist\?\.ar_artist_passing \|\| ""\)\.trim\(\)\)/);
  assert.match(page, /data-testid="artist-deceased-indicator"/);
  assert.match(page, /bi bi-hourglass-bottom/);
});

test('detailscherm toont een zichtbare overledenbadge bij gevulde sterfdatum', () => {
  assert.match(page, /detailsArtist\.ar_artist_passing/);
  assert.match(page, /data-testid="artist-details-deceased-indicator"/);
  assert.match(page, /<span>Overleden<\/span>/);
});

test('tooltip bevat de overlijdensdatum wanneer die beschikbaar is', () => {
  assert.match(page, /Artiest overleden\$\{artist\?\.ar_artist_passing/);
  assert.match(page, /Artiest overleden\$\{detailsArtist\.ar_artist_passing/);
});

test('indicator heeft voldoende visueel contrast en detailsbadge is compact', () => {
  assert.match(css, /background: rgba\(var\(--bs-danger-rgb\), 0\.1\)/);
  assert.match(css, /artist-deceased-indicator-detail/);
  assert.match(css, /border-radius: 999px/);
});
