import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('Docker/PostgreSQL preflight is explicit and read-only', () => {
  const script = read('scripts/art-ui-detail-scroll-db-preflight-docker.sh');
  assert.match(script, /docker inspect/);
  assert.match(script, /docker exec -i/);
  assert.match(script, /psql -v ON_ERROR_STOP=1/);
  assert.match(script, /to_regclass\('public\.artist'\)/);
  assert.doesNotMatch(script, /\b(?:ALTER|CREATE|DROP|TRUNCATE|INSERT|UPDATE|DELETE)\b/i);
});

test('migration script is an intentional no-op through the preflight', () => {
  const script = read('scripts/db-migrate-art-ui-detail-scroll-docker.sh');
  assert.match(script, /art-ui-detail-scroll-db-preflight-docker\.sh/);
  assert.match(script, /NO-OP/);
});

test('verify script repeats database reachability validation', () => {
  const script = read('scripts/art-ui-detail-scroll-db-verify-docker.sh');
  assert.match(script, /art-ui-detail-scroll-db-preflight-docker\.sh/);
  assert.match(script, /Verify geslaagd/);
});

test('package exposes database deployment commands', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.scripts['db:preflight:art-ui-detail-scroll'], 'bash scripts/art-ui-detail-scroll-db-preflight-docker.sh');
  assert.equal(pkg.scripts['db:migrate:art-ui-detail-scroll'], 'bash scripts/db-migrate-art-ui-detail-scroll-docker.sh');
  assert.equal(pkg.scripts['db:verify:art-ui-detail-scroll'], 'bash scripts/art-ui-detail-scroll-db-verify-docker.sh');
});
