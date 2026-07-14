import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const docs=fs.readFileSync('docs/ART_013A_3_UX_1_Existing_Musician_Match_Link.md','utf8');
test('documentatie beschrijft match vóór nieuwe person-artist',()=>{assert.match(docs,/bestaande standalone musician/i);assert.match(docs,/geen tweede musician/i)});
test('documentatie beschrijft koppelen en promoveren',()=>{assert.match(docs,/Koppel aan bestaande musician/);assert.match(docs,/Maak ook aan als artiest/)});
test('documentatie beschermt bandrelaties en voorkomt stille overschrijving',()=>{assert.match(docs,/bandrelaties.*behouden/is);assert.match(docs,/nooit stil/is)});
