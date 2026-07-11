import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';

const modalSource = readFileSync('client/src/components/ArtistFormModal.jsx', 'utf8');
const cssSource = readFileSync('client/src/app.css', 'utf8');
const packageSource = readFileSync('package.json', 'utf8');

test('ART-UI-Date-1-Fix-1 gebruikt een expliciete Nederlandse datepicker popover', () => {
  assert.match(modalSource, /function DutchDateInput\(/);
  assert.match(modalSource, /artist-date-picker-popover/);
  assert.match(modalSource, /Gebruik datum/);
  assert.match(modalSource, /Dag/);
  assert.match(modalSource, /Maand/);
  assert.match(modalSource, /Jaar/);
  assert.match(modalSource, /12-03-1947/);
  assert.match(modalSource, /10-01-2016/);
});

test('ART-UI-Date-1-Fix-1 verwijdert de onbetrouwbare transparante native date overlay', () => {
  assert.doesNotMatch(modalSource, /artist-hidden-date-picker/);
  assert.doesNotMatch(modalSource, /showPicker/);
  assert.doesNotMatch(cssSource, /artist-hidden-date-picker/);
  assert.match(cssSource, /artist-date-picker-grid/);
  assert.match(cssSource, /z-index:\s*1065/);
});

test('ART-UI-Date-1-Fix-1 heeft een gericht npm testscript', () => {
  assert.match(packageSource, /"test:artuidate1:fix1"/);
  assert.match(packageSource, /artUiDate1Fix1DatepickerPopover\.contract\.test\.mjs/);
});
