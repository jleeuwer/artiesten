import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

test('ART-012 design keeps local artist key leading and Discogs as external lookup key', () => {
  const doc = read('docs/ART_012_Discogs_Artist_Enrichment_Functioneel_Technisch_Ontwerp.md');
  assert.match(doc, /artist\.ar_artist_key/);
  assert.match(doc, /Discogs artist ID wordt \*\*niet\*\* gebruikt als vervanging/);
  assert.match(doc, /Discogs ID is een externe lookup key/);
  assert.match(doc, /geen primaire sleutel/);
});

test('ART-012 design documents enrichment data and review/accept flow', () => {
  const doc = read('docs/ART_012_Discogs_Artist_Enrichment_Functioneel_Technisch_Ontwerp.md');
  assert.match(doc, /Real name/);
  assert.match(doc, /Profile\/biografie/);
  assert.match(doc, /Name variations/);
  assert.match(doc, /Aliases/);
  assert.match(doc, /Groups\/member of/);
  assert.match(doc, /Lokale verrijking gebeurt alleen na expliciete gebruikerskeuze/);
  assert.match(doc, /review\/accept-flow/);
});

test('ART-012 design selects external reference and cache model', () => {
  const doc = read('docs/ART_012_Discogs_Artist_Enrichment_Functioneel_Technisch_Ontwerp.md');
  assert.match(doc, /artist_external_reference/);
  assert.match(doc, /artist_enrichment_cache/);
  assert.match(doc, /Voorkeursrichting voor ART-012/);
  assert.match(doc, /source text not null/);
  assert.match(doc, /raw_data jsonb/);
});

test('ART-012 docs and env template include Discogs configuration', () => {
  const doc = read('docs/ART_012_Discogs_Artist_Enrichment_Functioneel_Technisch_Ontwerp.md');
  const envExample = read('.env.example');
  for (const key of [
    'DISCOGS_USER_TOKEN',
    'DISCOGS_USER_AGENT',
    'DISCOGS_BASE_URL',
    'DISCOGS_REQUEST_TIMEOUT_MS',
    'DISCOGS_CACHE_TTL_SECONDS',
    'ARTIST_IMAGE_CACHE_ENABLED',
    'ARTIST_IMAGE_CACHE_DIR',
    'ARTIST_IMAGE_CACHE_MAX_AGE_DAYS'
  ]) {
    assert.match(doc, new RegExp(key));
    assert.match(envExample, new RegExp(key));
  }
});


test('ART-012 design documents portable image metadata/cache storage', () => {
  const doc = read('docs/ART_012_Discogs_Artist_Enrichment_Functioneel_Technisch_Ontwerp.md');
  const envExample = read('.env.example');
  assert.match(doc, /Binaire images worden niet in PostgreSQL opgeslagen/);
  assert.match(doc, /artist_external_image/);
  assert.match(doc, /local_cache_path/);
  assert.match(doc, /relatieve cache-referentie/);
  assert.match(doc, /ARTIST_IMAGE_CACHE_DIR/);
  assert.match(envExample, /ARTIST_IMAGE_CACHE_ENABLED=false/);
  assert.match(envExample, /ARTIST_IMAGE_CACHE_DIR=data\/cache\/artist-images/);
  assert.match(envExample, /ARTIST_IMAGE_CACHE_MAX_AGE_DAYS=30/);
});

test('ART-012 backlog, runbook, release notes and package scripts are wired', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.match(pkg.scripts['test:art012'], /tests\/art012Documentation\.contract\.test\.mjs/);
  assert.match(pkg.scripts['test:unit'], /test:art012/);
  assert.match(read('docs/ART_012_Testcases_en_Runbook.md'), /TC-012A-001/);
  assert.match(read('Release Notes/ART_012A_Discogs_Artist_Enrichment_Design_Release_Notes.md'), /Geen nieuwe SQL-migratie/);
  assert.match(read('Readme.md'), /ART-012/);
  assert.match(read('docs/BACKLOG.md'), /ART-012/);
  assert.match(read('docs/BACKLOG.md'), /ART-017/);
  assert.match(read('docs/PROJECT_NOTES.md'), /ART-012/);
});
