import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');

test('niet-persoonsartist blokkeert standalone musician niet', () => {
  const matching = read('services/musicianInBandMatchingService.js');
  assert.match(matching, /matchStatus:'artist_type_conflict', proposalStatus:'new'/);
  assert.match(matching, /blokkeert het aanmaken van een standalone musician niet/);
});

test('accept ondersteunt expliciete standalone fallback', () => {
  const service = read('services/musicianInBandProposalService.js');
  assert.match(service, /body\.createStandalone === true/);
  assert.match(service, /\['artist_type_conflict'\]\.includes\(proposal\.match_status\)/);
  assert.match(service, /proposal\.proposed_artist_key && !createStandalone/);
  assert.match(service, /artistKey: createStandalone \? null/);
  assert.match(service, /name: createStandalone \? proposal\.proposed_person_name/);
});

test('UI maakt onderscheid tussen kandidaat afwijzen en voorstel negeren', () => {
  const ui = read('client/src/features/musician-in-band-proposals/DiscogsBandMemberProposalQueue.jsx');
  assert.match(ui, /Aanmaken als musician/);
  assert.match(ui, /createStandalone:true/);
  assert.match(ui, /Voorstel negeren/);
  assert.doesNotMatch(ui, /artist_type_conflict','ambiguous/);
});
