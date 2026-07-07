import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pagePath = path.join(__dirname, '..', 'client', 'src', 'components', 'ArtistPageContent.jsx');
const cssPath = path.join(__dirname, '..', 'client', 'src', 'app.css');
const pageSource = fs.readFileSync(pagePath, 'utf8');
const cssSource = fs.readFileSync(cssPath, 'utf8');

test('embedded root removes bootstrap py-4 spacing', () => {
  assert.match(pageSource, /const rootSpacingClass = embeddedInShell \? '' : 'py-4';/);
});

test('embedded surface keeps zero bottom padding', () => {
  assert.match(cssSource, /data-shell-embedded='true'\] \.artist-page-surface \{/);
  assert.match(cssSource, /padding-bottom: 0;/);
});
