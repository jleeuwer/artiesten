import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const component = fs.readFileSync('client/src/components/ArtistPageContent.jsx', 'utf8');
const css = fs.readFileSync('client/src/app.css', 'utf8');

test('collapsible relation sections bind their visibility to the open state', () => {
  assert.match(component, /hidden=\{!open\}/);
  assert.match(component, /aria-expanded=\{open\}/);
});

test('collapsed relation section bodies cannot be made visible by author CSS', () => {
  assert.match(css, /\.artist-collapsible-section-body\[hidden\]\s*\{[\s\S]*?display:\s*none\s*!important;/);
});
