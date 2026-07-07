import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');

test('ART-015D-3B-Fix-1 keeps env example and refresh script aligned', () => {
  const env = read('.env.example');
  const script = read('scripts/env-refresh-example.sh');
  const pkg = JSON.parse(read('package.json'));

  assert.match(env, /ARTIST_DUPLICATE_MIN_SCORE=82/);
  assert.match(env, /ARTIST_DUPLICATE_MAX_CANDIDATES=500/);
  assert.match(env, /ARTIST_DUPLICATE_ALERT_ENABLED=true/);
  assert.match(env, /ARTIST_DUPLICATE_ALERT_WARNING_THRESHOLD=25/);

  assert.match(script, /ARTIST_DUPLICATE_ALERT_ENABLED=true/);
  assert.match(script, /ARTIST_DUPLICATE_ALERT_WARNING_THRESHOLD=25/);
  assert.equal(pkg.scripts['env:refresh-example'], 'bash scripts/env-refresh-example.sh');
});
