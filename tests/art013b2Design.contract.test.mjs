import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const design = fs.readFileSync('docs/ART_013B_2_Discogs_Bandleden_Proposals_Functioneel_Technisch_Ontwerp.md','utf8');
const cases = fs.readFileSync('docs/ART_013B_2_Testcases_en_Runbook.md','utf8');
const backlog = fs.readFileSync('docs/BACKLOG.md','utf8');

test('ART-013B-2 keeps manual data leading and Discogs primary', () => {
  assert.match(design, /Handmatige invoer blijft altijd mogelijk en leidend/);
  assert.match(design, /Discogs is de primaire externe bron/);
  assert.match(design, /MusicBrainz/);
  assert.match(design, /Wikidata/);
});

test('ART-013B-2 designs generic proposal and source tables', () => {
  assert.match(design, /musician_in_band_proposal/);
  assert.match(design, /musician_in_band_source/);
  assert.match(design, /source_type/);
});

test('ART-013B-2 never writes provider data directly to local truth', () => {
  assert.match(design, /schrijft nooit rechtstreeks naar `musician_in_band`/);
  assert.match(design, /expliciete gebruikersactie/);
});

test('ART-013B-2 supports standalone musician acceptance', () => {
  assert.match(design, /standalone musician/);
  assert.match(design, /Er wordt niet automatisch een artist aangemaakt/);
});

test('ART-013B-2 test basis contains 110 traceable cases', () => {
  const ids = cases.match(/ART013B2-TC-\d{3}/g) || [];
  assert.equal(new Set(ids).size, 110);
});

test('ART-013B-2 is present in backlog', () => {
  assert.match(backlog, /ART-013B-2/);
  assert.match(backlog, /DESIGN READY/);
});
