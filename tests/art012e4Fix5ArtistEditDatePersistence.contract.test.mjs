import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const artistModel = fs.readFileSync('models/artist.js', 'utf8');
const artistController = fs.readFileSync('controllers/artistController.js', 'utf8');
const formModal = fs.readFileSync('client/src/components/ArtistFormModal.jsx', 'utf8');

test('ART-012E-4-Fix-5: artist edit returns date fields as YYYY-MM-DD text', () => {
  assert.match(artistModel, /a\.ar_artist_dateofbirth::text AS ar_artist_dateofbirth/);
  assert.match(artistModel, /a\.ar_artist_passing::text AS ar_artist_passing/);
  assert.match(artistModel, /ar_artist_dateofbirth::text AS ar_artist_dateofbirth/);
  assert.match(artistModel, /ar_artist_passing::text AS ar_artist_passing/);
});

test('ART-012E-4-Fix-5: artist edit writes date fields with explicit date casts', () => {
  assert.match(artistModel, /VALUES \(\$1, \$2::date, \$3::date, \$4, \$5, \$6\)/);
  assert.match(artistModel, /ar_artist_dateofbirth = \$2::date/);
  assert.match(artistModel, /ar_artist_passing = \$3::date/);
});

test('ART-012E-4-Fix-5: controller accepts only ISO local date values from edit form', () => {
  assert.match(artistController, /function normalizePayload/);
  assert.match(artistController, /const isoDate = \(value\) =>/);
  assert.match(artistController, /\^\\d\{4\}-\\d\{2\}-\\d\{2\}\$/);
  assert.match(artistController, /ar_artist_dateofbirth: isoDate\(body\.ar_artist_dateofbirth\)/);
  assert.match(artistController, /ar_artist_passing: isoDate\(body\.ar_artist_passing\)/);
});

test('ART-012E-4-Fix-5: edit form does not slice arbitrary Date strings into invalid dates', () => {
  assert.match(formModal, /function toIsoDateValue/);
  assert.ok(formModal.includes('const isoDate = v.match(/^(\\d{4}-\\d{2}-\\d{2})/);'));
  assert.match(formModal, /v instanceof Date/);
  assert.match(formModal, /return "";/);
});
