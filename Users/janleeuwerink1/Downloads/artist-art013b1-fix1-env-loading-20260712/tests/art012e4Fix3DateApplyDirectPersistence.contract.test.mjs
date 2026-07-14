import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const artistModel = fs.readFileSync('models/artist.js', 'utf8');

test('ART-012E-4-Fix-3 date apply locks current artist row and performs direct date update', () => {
  assert.match(artistModel, /FOR UPDATE/);
  assert.match(artistModel, /const currentValue = currentArtist\[`\$\{sqlField\}_text`\] \|\| null/);
  assert.match(artistModel, /SET \$\{sqlField\} = \$2::date/);
  assert.match(artistModel, /ARTIST_DATE_APPLY_NOT_PERSISTED/);
  assert.match(artistModel, /SELECT \$\{sqlField\}::text AS persisted_date/);
});

test('ART-012E-4-Fix-3 still requires explicit overwrite when local date differs', () => {
  assert.match(artistModel, /valueDiffers && !confirmOverwrite/);
  assert.match(artistModel, /CONFIRM_OVERWRITE_REQUIRED/);
});
