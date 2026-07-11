import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const sql = read('scripts/sql/20260609_art013a1_musician_backfill_from_person_artists.sql');
const migrate = read('scripts/db-migrate-art013a1-docker.sh');
const backfill = read('scripts/backfill-musicians-from-person-artists.sh');
const helper = read('scripts/lib/art013a2-db.sh');
const preview = read('scripts/sql/20260711_art013a2_backfill_preview.sql');
const execute = read('scripts/sql/20260711_art013a2_backfill_execute.sql');
const pkg = JSON.parse(read('package.json'));

test('ART-013A-1 migration supports nullable musician birth date and unique linked musician rows', () => {
  assert.match(sql, /ALTER TABLE public\.musician\s+ALTER COLUMN mu_musician_dateofbirth DROP NOT NULL/is);
  assert.match(sql, /CREATE UNIQUE INDEX IF NOT EXISTS uq_musician_ar_artist_key_not_null/is);
  assert.match(sql, /ON public\.musician \(ar_artist_key\)/is);
  assert.match(sql, /WHERE ar_artist_key IS NOT NULL/is);
  assert.doesNotMatch(sql, /INSERT INTO public\.musician/i, 'migration must not perform backfill inserts by itself');
});

test('ART-013A-1 backfill script has preview and execute modes and centralized Docker config', () => {
  assert.match(backfill, /MODE="preview"/);
  assert.match(backfill, /--execute/);
  assert.match(backfill, /--preview/);
  assert.match(backfill, /Usage: \$0 \[--preview\|--execute\]/);
  assert.match(backfill, /art013a2_load_env/);
  assert.match(helper, /ARTIST_DB_CONTAINER/);
  assert.match(helper, /docker exec -i/);
});

test('ART-013A-1 preview only reports valid person artists missing a linked musician', () => {
  assert.match(preview, /Geldige kandidaten/);
  assert.match(preview, /coalesce\(a\.ar_artist_type,'unknown'\)='person'/i);
  assert.match(preview, /NOT EXISTS \(SELECT 1 FROM public\.musician m WHERE m\.ar_artist_key=a\.ar_artist_key\)/is);
  assert.match(preview, /valid_candidates/);
  assert.match(preview, /already_linked/);
  assert.match(preview, /EMPTY_NAME|NAME_TOO_LONG/);
});

test('ART-013A-1 execute insert is idempotent and does not overwrite existing musician data', () => {
  assert.match(execute, /INSERT INTO public\.musician/is);
  assert.match(execute, /ar_artist_key, mu_musician_name, mu_musician_dateofbirth/is);
  assert.match(execute, /coalesce\(a\.ar_artist_type,'unknown'\)='person'/i);
  assert.match(execute, /NOT EXISTS \(SELECT 1 FROM public\.musician m WHERE m\.ar_artist_key=a\.ar_artist_key\)/is);
  assert.match(execute, /ON CONFLICT DO NOTHING/i);
  assert.doesNotMatch(execute, /UPDATE public\.musician/i, 'backfill must not update or overwrite existing musicians');
  assert.doesNotMatch(execute, /DELETE FROM public\.musician/i, 'backfill must never delete musicians');
});

test('ART-013A-1 package scripts are present', () => {
  assert.equal(pkg.scripts['db:migrate:art013a1'], 'bash scripts/db-migrate-art013a1-docker.sh');
  assert.equal(pkg.scripts['musician:backfill:preview'], 'bash scripts/backfill-musicians-from-person-artists.sh --preview');
  assert.equal(pkg.scripts['musician:backfill'], 'bash scripts/backfill-musicians-from-person-artists.sh --execute');
  assert.equal(pkg.scripts['test:art013a1'], 'node --test tests/art013a1MusicianBackfill.contract.test.mjs');
  assert.match(pkg.scripts['test:art013a'], /art013a1MusicianBackfill\.contract\.test\.mjs/);
  assert.match(migrate, /20260609_art013a1_musician_backfill_from_person_artists\.sql/);
});

test('ART-013A-1 documentation and release notes are present', () => {
  const design = read('docs/ART_013A_1_Musician_Backfill.md');
  const runbook = read('docs/ART_013A_1_Testcases_en_Runbook.md');
  const release = read('Release Notes/ART_013A_1_Musician_Backfill_Release_Notes.md');
  const backlog = read('docs/BACKLOG.md');
  const notes = read('docs/PROJECT_NOTES.md');

  for (const text of [design, runbook, release, backlog, notes]) {
    assert.match(text, /ART-013A-1/);
    assert.match(text, /person/i);
    assert.match(text, /idempotent|idempotente/i);
    assert.match(text, /musician:backfill/);
    assert.match(text, /geen automatische aanmaak|no auto-create|niet via trigger/i);
  }
  assert.match(runbook, /db:migrate:art013a1/);
  assert.match(runbook, /musician:backfill:preview/);
});
