import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=(p)=>fs.readFileSync(p,'utf8');
const model=read('models/artist.js');
const controller=read('controllers/artistController.js');
const api=read('client/src/api.js');
const ui=read('client/src/components/ArtistPageContent.jsx');
const pkg=JSON.parse(read('package.json'));

test('VAL-1 centraliseert toegestane statusovergangen',()=>{
  assert.match(model,/NAME_PROPOSAL_TRANSITIONS/);
  assert.match(model,/INVALID_NAME_PROPOSAL_TRANSITION/);
  assert.match(model,/FOR UPDATE/);
});
test('VAL-1 controleert live canonical en spelling conflicts',()=>{
  assert.match(model,/canonical_owned_by_other_artist/);
  assert.match(model,/spelling_owned_by_other_artist/);
  assert.match(model,/detectNameProposalConflict/);
});
test('VAL-1 beschermt tegen stale browserstate',()=>{
  assert.match(model,/STALE_NAME_PROPOSAL/);
  assert.match(controller,/expectedUpdatedAt/);
  assert.match(api,/expectedUpdatedAt/);
  assert.match(ui,/expectedUpdatedAt: proposal\.updated_at/);
});
test('VAL-1 retourneert en toont generation summary',()=>{
  assert.match(model,/generationSummary/);
  assert.match(model,/processed:/);
  assert.match(ui,/name-proposal-generation-summary/);
  assert.match(ui,/nieuw.*bijgewerkt.*bestaand.*conflict/s);
});
test('VAL-1 levert Docker migratie preflight verify en db-test',()=>{
  for(const f of ['scripts/db-migrate-art012d4-val1-docker.sh','scripts/art012d4-val1-preflight.sh','scripts/art012d4-val1-verify.sh','scripts/db-test-art012d4-val1-docker.sh','scripts/sql/20260711_art012d4_val1_reviewqueue_hardening.sql']) assert.equal(fs.existsSync(f),true,f);
});
test('VAL-1 npm scripts zijn aangesloten',()=>{
  for(const k of ['db:migrate:art012d4:val1','name-proposals:preflight','name-proposals:verify','test:art012d4:val1:contract','test:art012d4:val1:db']) assert.ok(pkg.scripts[k],k);
});
