import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const artistModel = fs.readFileSync('models/artist.js', 'utf8');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

test('ART-012E-4-Fix-4 verifies date persistence using PostgreSQL date text, not JavaScript Date conversion', () => {
  assert.match(artistModel, /ar_artist_dateofbirth::text AS ar_artist_dateofbirth_text/);
  assert.match(artistModel, /ar_artist_passing::text AS ar_artist_passing_text/);
  assert.match(artistModel, /\$\{sqlField\}::text AS applied_date/);
  assert.match(artistModel, /SELECT \$\{sqlField\}::text AS persisted_date/);
  assert.doesNotMatch(artistModel, /const appliedValue = formatLocalDateValue\(row\?\.\[sqlField\]\)/);
});

test('ART-012E-4-Fix-4 is included in focused ART-012E-4 test script', () => {
  assert.match(packageJson.scripts['test:art012e4'], /art012e4Fix4DateApplyTextPersistence\.contract\.test\.mjs/);
  assert.equal(packageJson.scripts['test:art012e4fix4'], 'node --test tests/art012e4Fix4DateApplyTextPersistence.contract.test.mjs');
});
