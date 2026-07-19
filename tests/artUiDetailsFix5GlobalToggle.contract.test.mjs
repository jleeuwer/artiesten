import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('client/src/components/ArtistPageContent.jsx', 'utf8');

test('één knop toont of verbergt alle vier detailsecties', () => {
  assert.match(source, /className="artist-relation-details-toggle"/);
  assert.match(source, /onClick=\{\(\) => setShowRelationDetails\(\(current\) => !current\)\}/);
  assert.match(source, /Toon details/);
  assert.match(source, /Verberg details/);
  assert.match(source, /aria-expanded=\{showRelationDetails\}/);
});

test('globale detailkeuze wordt alleen voor de sessie onthouden', () => {
  assert.match(source, /sessionStorage\.getItem\("artist\.showRelationDetails"\)/);
  assert.match(source, /sessionStorage\.setItem\("artist\.showRelationDetails", String\(showRelationDetails\)\)/);
});

test('individuele sectieheaders zijn gewone headers en geen toggles', () => {
  assert.match(source, /function RelationDetailSection/);
  assert.match(source, /<h3 className="h6 mb-0">\{title\}<\/h3>/);
  assert.doesNotMatch(source, /artist-collapsible-section-toggle/);
});
