import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const service = fs.readFileSync('services/musicianInBandProposalService.js','utf8');

test('Discogs acceptatie gebruikt unknown voor ontbrekende begindatumprecisie', () => {
  assert.match(service, /proposal\.proposed_date_from \? 'day' : 'unknown'/);
});

test('Discogs acceptatie gebruikt unknown voor ontbrekende einddatumprecisie', () => {
  assert.match(service, /proposal\.proposed_date_to \? 'day' : 'unknown'/);
});

test('Discogs acceptatie schrijft geen null naar precision kolommen', () => {
  assert.doesNotMatch(service, /proposal\.proposed_date_from \? 'day' : null/);
  assert.doesNotMatch(service, /proposal\.proposed_date_to \? 'day' : null/);
});
