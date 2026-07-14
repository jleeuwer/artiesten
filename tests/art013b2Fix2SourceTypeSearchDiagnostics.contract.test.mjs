import test from "node:test";import assert from "node:assert/strict";import fs from "node:fs";
const read=p=>fs.readFileSync(p,"utf8");
test("Fix-2 migration expands source type constraint",()=>{const s=read("scripts/sql/20260712_art013b2_fix2_source_type_constraint.sql");assert.match(s,/discogs/);assert.match(s,/musicbrainz/);assert.match(s,/wikidata/);});
test("migration runner executes Fix-2 migration",()=>assert.match(read("scripts/db-migrate-art013b2-docker.sh"),/art013b2_fix2_source_type_constraint/));
test("missing proposal tables get a functional API error",()=>{const s=read("middleware/errorHandler.js");assert.match(s,/ART013B2_MIGRATION_REQUIRED/);assert.match(s,/db:migrate:art013b2/);});
test("member search includes artists and wrong type warnings",()=>{const s=read("models/musicianInBandModel.js");assert.match(s,/artist_without_musician/);assert.match(s,/artist_wrong_type/);assert.match(s,/correct_artist_type/);});
test("existing person artist can create and link musician transactionally",()=>{const s=read("services/musicianInBandService.js");assert.match(s,/createMemberFromArtist/);assert.match(s,/BEGIN/);assert.match(s,/artist\.ar_artist_type!=="person"/);});
test("frontend shows functional wrong type warning",()=>{const s=read("client\/src\/features\/musician-in-band\/MusicianInBandFormModal.jsx");assert.match(s,/corrigeer eerst naar Persoon/i);assert.match(s,/createMemberFromArtist/);});
