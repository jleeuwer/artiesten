import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const pkg = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

test('ART-013A-3 database npm scripts are present in root package.json', () => {
  assert.equal(pkg.scripts['artist-musician:preflight'], 'bash scripts/art013a3-preflight.sh');
  assert.equal(pkg.scripts['db:migrate:art013a3'], 'bash scripts/db-migrate-art013a3-docker.sh');
  assert.equal(pkg.scripts['artist-musician:verify'], 'bash scripts/art013a3-verify.sh');
  assert.equal(pkg.scripts['test:art013a3:db'], 'bash scripts/db-test-art013a3-docker.sh');
  assert.equal(pkg.scripts['verify:art013a3:install'], 'bash scripts/verify-art013a3-install.sh');
});
