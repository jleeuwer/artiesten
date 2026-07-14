import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

function read(file) {
  assert.ok(fs.existsSync(file), `${file} should exist`);
  return fs.readFileSync(file, 'utf8');
}

test('ART-015D-2A-Fix-2 inserts timestamp values required by rerun-hardening migration', () => {
  const scanner = read('scripts/artist_duplicate_scanner.py');
  assert.match(scanner, /ART-015D-2A-Fix-2/);
  assert.match(scanner, /first_seen_at, last_seen_at/);
  assert.match(scanner, /now\(\)::timestamptz/);
  assert.match(scanner, /first_seen_scan_run_id, last_seen_scan_run_id, times_seen/);
});

test('ART-015D-2A-Fix-2 is documented in runbook and release notes', () => {
  assert.match(read('docs/ART_015D_Testcases_en_Runbook.md'), /first_seen_at/i);
  assert.match(read('docs/PROJECT_NOTES.md'), /ART-015D-2A-Fix-2/i);
  assert.match(read('Release Notes/ART_015D_2A_Fix_2_Candidate_Timestamps_Release_Notes.md'), /first_seen_at/i);
});
