import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const component = fs.readFileSync('client/src/components/ArtistPageContent.jsx', 'utf8');
const css = fs.readFileSync('client/src/app.css', 'utf8');

test('ART-015C-3-Fix-4 merge history uses a dedicated readable scroll wrapper', () => {
  assert.match(component, /artist-relation-table-scroll artist-merge-history-table-wrap/);
  assert.match(component, /artist-merge-history-table/);
  assert.match(css, /\.artist-merge-history-table-wrap\s*\{/);
  assert.match(css, /padding-bottom:\s*1\.25rem/);
  assert.match(css, /scrollbar-gutter:\s*stable both-edges/);
});

test('ART-015C-3-Fix-4 merge history cells wrap text instead of forcing unreadable nowrap rows', () => {
  assert.match(css, /\.artist-merge-history-table td,\s*\n\.artist-merge-history-table th\s*\{[^}]*white-space:\s*normal/s);
  assert.match(css, /overflow-wrap:\s*anywhere/);
  assert.match(css, /vertical-align:\s*top/);
});

test('ART-015C-3-Fix-4 affected counts render as compact chips', () => {
  assert.match(component, /artist-merge-history-impact-list/);
  assert.match(component, /artist-merge-history-impact-chip/);
  assert.match(component, /aria-label="Geraakte records per onderdeel"/);
  assert.match(css, /\.artist-merge-history-impact-list\s*\{[^}]*flex-wrap:\s*wrap/s);
  assert.match(css, /\.artist-merge-history-impact-chip\s*\{[^}]*border-radius:\s*999px/s);
});
