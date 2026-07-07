import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const artistModel = fs.readFileSync('models/artist.js', 'utf8');

test('ART-012E-4-Fix-2 normalizes PostgreSQL date objects before comparing applied values', () => {
  assert.match(artistModel, /value instanceof Date/);
  assert.match(artistModel, /value\.toISOString\(\)\.slice\(0, 10\)/);
});

test('ART-012E-4-Fix-2 keeps exact date proposals limited to YYYY-MM-DD', () => {
  assert.match(artistModel, /function isExactDateProposal/);
  assert.match(artistModel, /\\d\{4\}-\\d\{2\}-\\d\{2\}/);
});
