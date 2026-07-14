import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const service = fs.readFileSync('services/musicianInBandProposalService.js', 'utf8');
const model = fs.readFileSync('models/musicianInBandProposalModel.js', 'utf8');

test('proposal status mutation locks the current row transactionally', () => {
  assert.match(service, /BEGIN/);
  assert.match(service, /getById\(id, client, \{ forUpdate: true \}\)/);
  assert.match(service, /COMMIT/);
  assert.match(service, /ROLLBACK/);
});

test('stale comparison uses JavaScript millisecond precision instead of SQL timestamp equality', () => {
  assert.match(service, /new Date\(expectedUpdatedAt\)\.getTime\(\)/);
  assert.match(service, /new Date\(current\.updated_at\)\.getTime\(\)/);
  assert.doesNotMatch(model, /updated_at=\$\$?\{/);
  assert.doesNotMatch(model, /::timestamptz/);
});

test('real stale proposal changes still return stable API error', () => {
  assert.match(service, /STALE_MIB_PROPOSAL/);
  assert.match(service, /Laad de queue opnieuw/);
});

test('ignore, later and reopen remain the allowed status actions', () => {
  assert.match(service, /\['review_later','ignored','new'\]/);
});
