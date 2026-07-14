import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=(p)=>fs.readFileSync(new URL(`../${p}`, import.meta.url),'utf8');

test('Fix-3 drops every legacy source-type check regardless of constraint name',()=>{
  const s=read('scripts/sql/20260712_art013b2_fix3_source_type_constraint_hardening.sql');
  assert.match(s,/pg_get_constraintdef\(c\.oid\) ILIKE '%mb_source_type%'/);
  assert.match(s,/DROP CONSTRAINT %I/);
});

test('Fix-3 normalizes values and accepts Discogs, MusicBrainz and Wikidata case-insensitively',()=>{
  const s=read('scripts/sql/20260712_art013b2_fix3_source_type_constraint_hardening.sql');
  assert.match(s,/lower\(btrim\(mb_source_type\)\)/);
  assert.match(s,/'discogs'/);
  assert.match(s,/'musicbrainz'/);
  assert.match(s,/'wikidata'/);
});

test('migration runner executes Fix-3 hardening after prior migrations',()=>{
  const s=read('scripts/db-migrate-art013b2-docker.sh');
  const fix2=s.indexOf('fix2_source_type_constraint');
  const fix3=s.indexOf('fix3_source_type_constraint_hardening');
  assert.ok(fix2 >= 0 && fix3 > fix2);
});

test('verify prints exact active source-type constraint definitions and invalid values',()=>{
  const s=read('scripts/art013b2-verify.sh');
  assert.match(s,/actieve source-type constraints/);
  assert.match(s,/pg_get_constraintdef/);
  assert.match(s,/ongeldige mb_source_type waarden/);
});
