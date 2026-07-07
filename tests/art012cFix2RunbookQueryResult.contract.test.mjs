import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

function read(path) {
  return readFileSync(path, 'utf8');
}

test('ART-012C-Fix-2 runbook uses fetched_at for artist_enrichment_cache', () => {
  assert.ok(existsSync('docs/ART_012C_Fix_2_Runbook_Query_Result.md'));
  assert.ok(existsSync('Release Notes/ART_012C_Fix_2_Runbook_Query_Result_Release_Notes.md'));

  const runbook = read('docs/ART_012C_Testcases_en_Runbook.md');
  const fixDoc = read('docs/ART_012C_Fix_2_Runbook_Query_Result.md');

  assert.match(runbook, /artist_enrichment_cache[\s\S]*fetched_at/);
  assert.match(fixDoc, /artist_enrichment_cache[\s\S]*fetched_at/);
  assert.match(fixDoc, /artist_external_reference[\s\S]*synced_at/);
  assert.match(fixDoc, /artist_enrichment_cache` bevat geen kolom `synced_at`/);

  assert.doesNotMatch(runbook, /from artist_enrichment_cache[\s\S]{0,160}synced_at/);
  assert.doesNotMatch(fixDoc, /from artist_enrichment_cache[\s\S]{0,160}synced_at/);
});

test('ART-012C-Fix-2 documents the three persisted Discogs tables after linking', () => {
  const fixDoc = read('docs/ART_012C_Fix_2_Runbook_Query_Result.md');
  assert.match(fixDoc, /artist_external_reference/);
  assert.match(fixDoc, /artist_enrichment_cache/);
  assert.match(fixDoc, /artist_external_image/);
  assert.match(fixDoc, /artist\.ar_artist_key` blijft altijd leidend/);
  assert.match(fixDoc, /lokale artistnaam wordt niet automatisch overschreven/);
});

test('ART-012C-Fix-2 package scripts include the fix test', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.match(pkg.scripts['test:art012c'], /art012cFix2RunbookQueryResult\.contract\.test\.mjs/);
  assert.match(pkg.scripts['test:art012'], /art012cFix2RunbookQueryResult\.contract\.test\.mjs/);
  assert.equal(pkg.scripts['test:art012c:fix2'], 'node --test tests/art012cFix2RunbookQueryResult.contract.test.mjs');
});
