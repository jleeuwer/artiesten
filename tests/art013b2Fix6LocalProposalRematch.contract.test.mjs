import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=(p)=>fs.readFileSync(p,'utf8');

test('Fix-6 exposes a local rematch API without a Discogs call',()=>{
 const service=read('services/musicianInBandProposalService.js');
 const routes=read('routes/musicianInBandProposalRoutes.js');
 assert.match(service,/async function rematch\(bandArtistKey\)/);
 assert.match(service,/Proposal\.listForRematch/);
 assert.match(service,/Matching\.classify/);
 assert.match(routes,/bands\/:artistKey\/rematch/);
});

test('Fix-6 preserves accepted proposals and conscious user statuses',()=>{
 const model=read('models/musicianInBandProposalModel.js');
 assert.match(model,/proposal_status <> 'accepted'/);
 assert.match(model,/proposal_status IN \('ignored','review_later'\)/);
});

test('Fix-6 refreshes musician, artist, relation and classification fields',()=>{
 const model=read('models/musicianInBandProposalModel.js');
 for(const token of ['proposed_musician_key=$2','proposed_artist_key=$3','proposed_relation_key=$4','match_status=$5','confidence_score=$6','conflict_reason=$7']) assert.match(model,new RegExp(token.replace('$','\\$')));
});

test('Fix-6 automatically rematches when the queue opens and offers a manual action',()=>{
 const ui=read('client/src/features/musician-in-band-proposals/DiscogsBandMemberProposalQueue.jsx');
 assert.match(ui,/rematch\(\{silent:true\}\)/);
 assert.match(ui,/Lokale matches vernieuwen/);
 assert.match(ui,/Discogs opnieuw ophalen/);
});
