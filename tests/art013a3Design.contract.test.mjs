import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const design = read('docs/ART_013A_3_Artist_Musician_Asymmetrisch_Model_Functioneel_Technisch_Ontwerp.md');
const cases = read('docs/ART_013A_3_Testcases_en_Runbook.md');
const backlog = read('docs/BACKLOG.md');
const notes = read('docs/PROJECT_NOTES.md');
const readme = read('Readme.md');

test('ART-013A-3 legt het asymmetrische relatiecontract vast', () => {
  assert.match(design, /musician → artist = 0\.\.1/);
  assert.match(design, /person-artist → musician = exact 1/);
  assert.match(design, /musician\.ar_artist_key/);
  assert.match(design, /geen `artist_musician`-koppeltabel/);
});

test('ART-013A-3 ondersteunt standalone musician, koppelen en promotie', () => {
  assert.match(design, /Standalone musician/);
  assert.match(design, /Nieuw bandlid vanuit bandcontext/);
  assert.match(design, /promoveren naar artist/i);
  assert.match(design, /Bestaande artist en musician koppelen/);
});

test('ART-013A-3 borgt eenrichtingssync en transactionele flows', () => {
  assert.match(design, /artist is leidend/);
  assert.match(design, /synchroniseren nooit terug naar artist/);
  assert.match(design, /BEGIN[\s\S]*create standalone musician[\s\S]*create musician_in_band[\s\S]*COMMIT/);
});

test('ART-013A-3 testbasis bevat 100 traceerbare cases', () => {
  for (let i = 1; i <= 100; i += 1) {
    const id = `A3-TC-${String(i).padStart(3, '0')}`;
    assert.match(cases, new RegExp(id));
  }
  assert.match(cases, /leftovers=0/);
  assert.match(cases, /ARTIST_DB_TEST_ALLOWED=true/);
});

test('Backlog, projectnotities en README zijn bijgewerkt', () => {
  for (const content of [backlog, notes, readme]) {
    assert.match(content, /ART-013A-3/);
    assert.match(content, /standalone musician/i);
  }
});
