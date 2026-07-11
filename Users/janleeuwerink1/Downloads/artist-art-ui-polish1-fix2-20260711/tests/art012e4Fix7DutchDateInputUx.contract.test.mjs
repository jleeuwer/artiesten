import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const formModal = fs.readFileSync('client/src/components/ArtistFormModal.jsx', 'utf8');
const appCss = fs.readFileSync('client/src/app.css', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

test('ART-012E-4-Fix-7: edit form shows Dutch date text inputs', () => {
  assert.match(formModal, /function toDutchDateInputValue/);
  assert.match(formModal, /function dutchDateToIso/);
  assert.match(formModal, /function datePayloadValue/);
  assert.match(formModal, /placeholder="dd-mm-jjjj"/);
  assert.match(formModal, /aria-label=\{`\$\{label\} in formaat dd-mm-jjjj`\}/);
  assert.match(formModal, /label="Geboortedatum"/);
  assert.match(formModal, /label="Sterfdatum"/);
  assert.match(formModal, /12-03-1947/);
});

test('ART-012E-4-Fix-7: datepicker support remains available via explicit Dutch popover', () => {
  assert.match(formModal, /function DutchDateInput\(/);
  assert.match(formModal, /artist-date-picker-popover/);
  assert.match(formModal, /role="dialog"/);
  assert.match(formModal, /Datepicker voor/);
  assert.match(formModal, /Gebruik datum/);
  assert.match(formModal, /Wissen/);
  assert.match(formModal, /Sluiten/);
  assert.match(formModal, /Dag/);
  assert.match(formModal, /Maand/);
  assert.match(formModal, /Jaar/);
});

test('ART-012E-4-Fix-7: save converts Dutch input to ISO payload before API update', () => {
  assert.match(formModal, /ar_artist_dateofbirth: datePayloadValue\(form\.ar_artist_dateofbirth, "Geboortedatum"\)/);
  assert.match(formModal, /ar_artist_passing: datePayloadValue\(form\.ar_artist_passing, "Sterfdatum"\)/);
  assert.match(formModal, /const match = text\.match\(\/\^\(\\d\{2\}\)-\(\\d\{2\}\)-\(\\d\{4\}\)\$\/\)/);
});

test('ART-UI-Date-1: explicit datepicker popover replaces unreliable transparent native overlay', () => {
  assert.match(appCss, /ART-UI-Date-1-Fix-1: Dutch manual date input plus explicit in-app datepicker/);
  assert.match(appCss, /artist-date-input-group/);
  assert.match(appCss, /artist-date-picker-popover/);
  assert.match(appCss, /artist-date-picker-grid/);
  assert.doesNotMatch(appCss, /artist-hidden-date-picker/);
  assert.doesNotMatch(formModal, /showPicker/);
});

test('ART-012E-4-Fix-7: npm script is available and included in ART-012E-4 regression suite', () => {
  assert.equal(pkg.scripts['test:art012e4fix7'], 'node --test tests/art012e4Fix7DutchDateInputUx.contract.test.mjs');
  assert.equal(pkg.scripts['test:artuidate1:fix1'], 'node --test tests/artUiDate1Fix1DatepickerPopover.contract.test.mjs');
  assert.match(pkg.scripts['test:art012e4'], /art012e4Fix7DutchDateInputUx\.contract\.test\.mjs/);
  assert.match(pkg.scripts['test:art012e4'], /artUiDate1Fix1DatepickerPopover\.contract\.test\.mjs/);
});
