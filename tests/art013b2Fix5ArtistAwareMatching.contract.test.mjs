import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=(p)=>fs.readFileSync(p,'utf8');

test('matching zoekt naast musician ook canonical artist, spellingen en Discogs-reference',()=>{
 const model=read('models/musicianInBandProposalModel.js');
 assert.match(model,/findArtistMatches/);
 assert.match(model,/public\.artiesten_spelling/);
 assert.match(model,/artist_external_reference/);
});

test('matching diagnosticeert person, missing type en verkeerd type apart',()=>{
 const service=read('services/musicianInBandMatchingService.js');
 for(const status of ['matched_artist_person','artist_type_missing','artist_type_conflict']) assert.match(service,new RegExp(status));
});

test('acceptatie blokkeert ontbrekend of ambigu type en koppelt person artist transactioneel',()=>{
 const service=read('services/musicianInBandProposalService.js');
 assert.match(service,/MIB_ARTIST_MATCH_REVIEW_REQUIRED/);
 assert.match(service,/artistKey: createStandalone \? null : \(artist\?\.ar_artist_key/);
 assert.match(service,/ar_artist_type !== 'person'/);
});

test('proposal schema bewaart gematchte artist en ondersteunt nieuwe matchstatussen',()=>{
 const sql=read('scripts/sql/20260712_art013b2_discogs_band_member_proposals.sql');
 assert.match(sql,/proposed_artist_key/);
 assert.match(sql,/artist_type_missing/);
 assert.match(sql,/artist_type_conflict/);
});

test('reviewqueue toont artistdiagnostiek en blokkeert acceptatie tot correctie',()=>{
 const ui=read('client/src/features/musician-in-band-proposals/DiscogsBandMemberProposalQueue.jsx');
 assert.match(ui,/matched_artist_name/);
 assert.match(ui,/needsArtistCorrection/);
 assert.match(ui,/Controle nodig/);
});
