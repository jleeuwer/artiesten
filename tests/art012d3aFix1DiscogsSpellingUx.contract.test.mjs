import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const pageSource = fs.readFileSync('client/src/components/ArtistPageContent.jsx', 'utf8');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const readme = fs.readFileSync('Readme.md', 'utf8');
const runbook = fs.readFileSync('docs/ART_012D_3A_Testcases_en_Runbook.md', 'utf8');
const backlog = fs.readFileSync('docs/BACKLOG.md', 'utf8');
const notes = fs.readFileSync('docs/PROJECT_NOTES.md', 'utf8');

test('ART-012D-3A-Fix-1 makes Discogs spelling proposal flow explicit in UI', () => {
  assert.match(pageSource, /Koppel eerst een Discogs artist voordat naamvoorstellen beschikbaar zijn/);
  assert.match(pageSource, /Na koppeling kun je Discogs-namen via de reviewqueue beoordelen/);
  assert.match(pageSource, /Discogs naamvoorstellen reviewqueue/);
  assert.match(pageSource, /ART-012D-4-Fix-1/);
  assert.doesNotMatch(pageSource, /await loadDiscogsSpellingProposals\(\)/);
});

test('ART-012D-3A-Fix-1 routes add spelling through the persistent reviewqueue UI', () => {
  assert.match(pageSource, /Voeg toe als spelling/);
  assert.match(pageSource, /applyDiscogsNameQueueProposalAsSpelling/);
  assert.match(pageSource, /function canApplyNameProposal/);
  assert.doesNotMatch(pageSource, /Preview canonical/);
});

test('ART-012D-3A-Fix-1 documentation and scripts are wired', () => {
  assert.ok(packageJson.scripts['test:art012d3a'].includes('art012d3aFix1DiscogsSpellingUx.contract.test.mjs'));
  assert.match(readme, /ART-012D-3A-Fix-1/);
  assert.match(runbook, /Zoek in Discogs\s*→\s*Detail bekijken\s*→\s*Koppel Discogs artist\s*→\s*Toon spellingvoorstellen/s);
  assert.match(backlog, /ART-012D-3A-Fix-1/);
  assert.match(notes, /ART-012D-3A-Fix-1/);
});
