import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const modalPath = path.join(__dirname, '..', 'client', 'src', 'components', 'ArtistFormModal.jsx');
const cssPath = path.join(__dirname, '..', 'client', 'src', 'app.css');
const modalSource = fs.readFileSync(modalPath, 'utf8');
const cssSource = fs.readFileSync(cssPath, 'utf8');

test('artist modal is configured as viewport overlay', () => {
  assert.match(modalSource, /className="artist-form-modal"/);
  assert.match(modalSource, /scrollable/);
  assert.match(modalSource, /backdrop="static"/);
  assert.match(modalSource, /dialogClassName="artist-form-modal-dialog"/);
  assert.match(modalSource, /contentClassName="artist-form-modal-content"/);
});

test('embedded surface removes corner whitespace and modal gets viewport sizing rules', () => {
  assert.match(cssSource, /data-shell-embedded='true'\] \.artist-page-surface \{/);
  assert.match(cssSource, /border-radius: 0;/);
  assert.match(cssSource, /\.artist-form-modal-content \{/);
  assert.match(cssSource, /max-height: calc\(100vh - 2rem\)/);
});
