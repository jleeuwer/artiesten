import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

test('ART-015D-3C-Fix-1 env example contains complete duplicate scanner config', () => {
  const env = read('.env.example');
  assert.match(env, /ARTIST_DUPLICATE_MIN_SCORE=82/);
  assert.match(env, /ARTIST_DUPLICATE_MAX_CANDIDATES=500/);
  assert.match(env, /ARTIST_DUPLICATE_ALERT_ENABLED=true/);
  assert.match(env, /ARTIST_DUPLICATE_ALERT_WARNING_THRESHOLD=25/);
  assert.match(env, /ARTIST_DUPLICATE_STALE_REVIEW_DAYS=14/);
  assert.match(env, /ARTIST_DUPLICATE_STALE_ALERT_ENABLED=true/);
  assert.match(env, /ARTIST_DUPLICATE_STALE_ALERT_THRESHOLD=1/);
});

test('ART-015D-3C-Fix-1 documentation explicitly distinguishes alerts, UI and mail', () => {
  const doc = read('docs/ART_015D_3C_Stale_Reviewqueue_Signalering.md');
  assert.match(doc, /Shellstarter alert via `public\.alerts`/);
  assert.match(doc, /UI-badge \*\*Te lang open\*\*/);
  assert.match(doc, /Echte mail[\s\S]*Niet geïmplementeerd/);
  assert.match(doc, /Mailstrategie[\s\S]*Voorbereid/);
  assert.match(doc, /ART-015D-3D/);
  assert.match(doc, /Scanner → schrijft Shellstarter-alerts via public\.alerts/);
  assert.match(doc, /Reviewqueue → toont stale candidates met badge\/waarschuwing/);
  assert.match(doc, /Mail → nog niet technisch geïmplementeerd/);
});

test('ART-015D-3C-Fix-1 package script is wired into ART-015D-3C tests', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.match(pkg.scripts['test:art015d3c:fix1'], /tests\/art015d3cFix1SignaleringEnv\.contract\.test\.mjs/);
  assert.match(pkg.scripts['test:art015d3c'], /art015d3cFix1SignaleringEnv/);
});
