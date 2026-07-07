import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const pageContent = fs.readFileSync('client/src/components/ArtistPageContent.jsx', 'utf8');
const formModal = fs.readFileSync('client/src/components/ArtistFormModal.jsx', 'utf8');

test('ART-012E-4-Fix-6: artist page formats ISO dates as Dutch dd-mm-jjjj display values', () => {
  assert.match(pageContent, /function fmtDate\(v\)/);
  assert.ok(pageContent.includes('const match = text.match(/^(\\d{4})-(\\d{2})-(\\d{2})/);'));
  assert.ok(pageContent.includes('return `${match[3]}-${match[2]}-${match[1]}`;'));
});

test('ART-012E-4-Fix-6: artist table and details continue using the shared display formatter', () => {
  assert.match(pageContent, /fmtDate\(r\.ar_artist_dateofbirth\)/);
  assert.match(pageContent, /fmtDate\(detailsArtist\.ar_artist_dateofbirth\)/);
  assert.match(pageContent, /fmtDate\(detailsArtist\.ar_artist_passing\)/);
});

test('ART-012E-4-Fix-6: edit form accepts Dutch date display values while payload remains ISO', () => {
  assert.match(formModal, /function toDutchDateInputValue/);
  assert.match(formModal, /function dutchDateToIso/);
  assert.match(formModal, /placeholder="dd-mm-jjjj"/);
});
