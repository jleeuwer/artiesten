import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');

const sql = read('scripts/sql/20260609_art013a_artist_to_musician_sync.sql');
const migrate = read('scripts/db-migrate-art013a-docker.sh');
const pkg = JSON.parse(read('package.json'));

test('ART-013A migration creates one-way artist to musician trigger and function', () => {
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.fn_artist_sync_to_musician\(\)/);
  assert.match(sql, /DROP TRIGGER IF EXISTS trg_artist_sync_to_musician ON public\.artist/);
  assert.match(sql, /CREATE TRIGGER trg_artist_sync_to_musician/);
  assert.match(sql, /AFTER UPDATE OF/);
  assert.match(sql, /ON public\.artist/);
  assert.match(sql, /EXECUTE FUNCTION public\.fn_artist_sync_to_musician\(\)/);
});

test('ART-013A sync is only for person artists and existing linked musicians', () => {
  assert.match(sql, /COALESCE\(NEW\.ar_artist_type, 'unknown'\) = 'person'/);
  assert.match(sql, /UPDATE public\.musician m/);
  assert.match(sql, /WHERE m\.ar_artist_key = NEW\.ar_artist_key/);
  assert.doesNotMatch(sql, /INSERT INTO public\.musician/i);
  assert.doesNotMatch(sql, /DELETE FROM public\.musician/i);
});

test('ART-013A sync maps only approved fields from artist to musician', () => {
  assert.match(sql, /mu_musician_name = NEW\.ar_artist_name::text/);
  assert.match(sql, /mu_musician_dateofbirth = COALESCE\(NEW\.ar_artist_dateofbirth, m\.mu_musician_dateofbirth\)/);
  assert.match(sql, /mu_musician_passing = NEW\.ar_artist_passing/);
  assert.match(sql, /mu_website_url = NEW\.ar_website_url/);
  assert.doesNotMatch(sql, /mu_musician_notes = NEW\.ar_artist_notes/);
  assert.doesNotMatch(sql, /ar_is_favorite/);
  assert.doesNotMatch(sql, /artist_external_reference/);
});

test('ART-013A trigger is not bidirectional and does not sync deletes or merges', () => {
  assert.doesNotMatch(sql, /ON public\.musician/);
  assert.doesNotMatch(sql, /AFTER DELETE/);
  assert.doesNotMatch(sql, /BEFORE DELETE/);
  assert.doesNotMatch(sql, /ar_is_deleted/);
  assert.doesNotMatch(sql, /ar_merged_into_artist_key/);
  assert.match(sql, /no bidirectional sync/i);
  assert.match(sql, /No auto-create, no delete\/merge sync/i);
});

test('ART-013A package script and docker migration script are present', () => {
  assert.equal(pkg.scripts['db:migrate:art013a'], 'bash scripts/db-migrate-art013a-docker.sh');
  assert.equal(pkg.scripts['test:art013a'], 'node --test tests/art013aArtistMusicianSync.contract.test.mjs');
  assert.match(migrate, /20260609_art013a_artist_to_musician_sync\.sql/);
  assert.match(migrate, /ARTIST_DB_CONTAINER/);
  assert.match(migrate, /docker exec -i/);
});

test('ART-013A documentation and release notes capture design decisions', () => {
  const design = read('docs/ART_013A_Artist_Musician_Sync.md');
  const runbook = read('docs/ART_013A_Testcases_en_Runbook.md');
  const release = read('Release Notes/ART_013A_Artist_Musician_Sync_Release_Notes.md');
  const backlog = read('docs/BACKLOG.md');
  const notes = read('docs/PROJECT_NOTES.md');

  for (const text of [design, runbook, release, backlog, notes]) {
    assert.match(text, /ART-013A/);
    assert.match(text, /artist\s*→\s*musician|artist -> musician/);
    assert.match(text, /niet bidirectioneel|one-way/i);
    assert.match(text, /geen automatische aanmaak|no auto-create/i);
    assert.match(text, /delete|verwijder/i);
  }
  assert.match(runbook, /db:migrate:art013a/);
  assert.match(runbook, /test:art013a/);
});
