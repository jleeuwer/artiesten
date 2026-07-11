import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

function read(file) {
  assert.ok(fs.existsSync(file), `${file} should exist`);
  return fs.readFileSync(file, 'utf8');
}

test('ART-015D-2A-Fix-1 sends generated SQL to psql through stdin instead of command arguments', () => {
  const scanner = read('scripts/artist_duplicate_scanner.py');
  assert.match(scanner, /ART-015D-2A-Fix-1/);
  assert.match(scanner, /Run SQL through psql stdin/);
  assert.match(scanner, /input=sql/);
  assert.doesNotMatch(scanner, /cmd\.extend\(\["-c", sql\]\)/);
});

test('ART-015D-2A-Fix-1 is documented in runbook and release notes', () => {
  assert.match(read('docs/ART_015D_Testcases_en_Runbook.md'), /argument list too long/i);
  assert.match(read('docs/PROJECT_NOTES.md'), /ART-015D-2A-Fix-1/i);
  assert.match(read('Release Notes/ART_015D_2A_Fix_1_Psql_Stdin_Release_Notes.md'), /psql stdin/i);
});
