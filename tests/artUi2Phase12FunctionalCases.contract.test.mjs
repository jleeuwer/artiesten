import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const runbook = fs.readFileSync('docs/ART_UI_2_FASE_1_2_Testcases_en_Runbook.md', 'utf8');
for (let index = 1; index <= 25; index += 1) {
  const id = `UI2-012-TC-${String(index).padStart(3, '0')}`;
  test(`${id} is traceerbaar`, () => assert.match(runbook, new RegExp(id)));
}
