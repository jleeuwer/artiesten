import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const root = process.cwd();
function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

test('ART-012B-Prep documents standard Discogs env names and legacy fallback', () => {
  const doc = read('docs/ART_012B_Prep_Discogs_Env_Standaardisatie.md');
  assert.match(doc, /DISCOGS_USER_TOKEN/);
  assert.match(doc, /DISCOGS_USER_AGENT/);
  assert.match(doc, /DISCOGS_BASE_URL/);
  assert.match(doc, /DISCOGS_CACHE_TTL_SECONDS=21600/);
  assert.match(doc, /DISCOGS_REQUEST_TIMEOUT_MS=10000/);
  assert.match(doc, /DISCOGS_API_TOKEN/);
  assert.match(doc, /DISCOGS_API_BASE_URL/);
  assert.match(doc, /DISCOGS_ENABLED/);
  assert.match(doc, /uitfaseren/);
});

test('ART-012B-Prep env example uses standard Discogs names', () => {
  const envExample = read('.env.example');
  assert.match(envExample, /DISCOGS_USER_TOKEN=/);
  assert.match(envExample, /DISCOGS_USER_AGENT=MusicappArtist\/1\.0/);
  assert.match(envExample, /DISCOGS_BASE_URL=https:\/\/api\.discogs\.com/);
  assert.match(envExample, /DISCOGS_CACHE_TTL_SECONDS=21600/);
  assert.match(envExample, /DISCOGS_REQUEST_TIMEOUT_MS=10000/);
  assert.doesNotMatch(envExample, /^DISCOGS_API_TOKEN=/m);
  assert.doesNotMatch(envExample, /^DISCOGS_API_BASE_URL=/m);
  assert.doesNotMatch(envExample, /^DISCOGS_ENABLED=/m);
});

test('ART-012B-Prep Discogs config helper supports standard names and legacy fallback', () => {
  const { getDiscogsConfig } = require('../config/discogsConfig.js');
  const standard = getDiscogsConfig({
    DISCOGS_USER_TOKEN: 'token-a',
    DISCOGS_USER_AGENT: 'MusicappArtist/1.0',
    DISCOGS_BASE_URL: 'https://api.discogs.com',
    DISCOGS_CACHE_TTL_SECONDS: '21600',
    DISCOGS_REQUEST_TIMEOUT_MS: '10000'
  });
  assert.equal(standard.enabled, true);
  assert.equal(standard.userToken, 'token-a');
  assert.equal(standard.usedLegacyToken, false);
  assert.equal(standard.baseUrl, 'https://api.discogs.com');

  const legacy = getDiscogsConfig({
    DISCOGS_API_TOKEN: 'legacy-token',
    DISCOGS_API_BASE_URL: 'https://api.discogs.com',
    DISCOGS_USER_AGENT: 'ImporterenSongs/1.25.6',
    DISCOGS_ENABLED: 'true'
  });
  assert.equal(legacy.enabled, true);
  assert.equal(legacy.userToken, 'legacy-token');
  assert.equal(legacy.usedLegacyToken, true);
  assert.equal(legacy.usedLegacyBaseUrl, true);

  const disabled = getDiscogsConfig({
    DISCOGS_USER_TOKEN: 'token-a',
    DISCOGS_USER_AGENT: 'MusicappArtist/1.0',
    DISCOGS_BASE_URL: 'https://api.discogs.com',
    DISCOGS_ENABLED: 'false'
  });
  assert.equal(disabled.enabled, false);
  assert.match(disabled.disabledReason, /legacy flag/);
});

test('ART-012B-Prep package scripts and docs are wired', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.match(pkg.scripts['test:art012'], /art012bPrepDiscogsEnvStandardization/);
  assert.match(pkg.scripts['test:unit'], /test:art012/);
  assert.match(read('Readme.md'), /ART-012B-Prep/);
  assert.match(read('docs/BACKLOG.md'), /ART-012B-Prep/);
  assert.match(read('docs/PROJECT_NOTES.md'), /ART-012B-Prep/);
  assert.match(read('Release Notes/ART_012B_Prep_Discogs_Env_Standardization_Release_Notes.md'), /Geen nieuwe SQL-migratie/);
});
