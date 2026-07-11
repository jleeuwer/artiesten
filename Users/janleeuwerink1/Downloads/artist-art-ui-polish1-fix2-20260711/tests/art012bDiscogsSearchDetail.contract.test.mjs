import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';

function read(path) {
  return readFileSync(path, 'utf8');
}

test('ART-012B backend Discogs search/detail endpoints and config helper are wired', () => {
  const routes = read('routes/artistRoutes.js');
  const controller = read('controllers/artistController.js');
  const client = read('services/discogsClient.js');
  const config = read('config/discogsConfig.js');

  assert.match(routes, /\/discogs\/config/);
  assert.match(routes, /\/discogs\/:discogsArtistId/);
  assert.match(routes, /\/:id\/discogs\/search/);
  assert.match(controller, /searchDiscogsForArtist/);
  assert.match(controller, /getDiscogsArtistDetail/);
  assert.match(controller, /Discogs is niet geconfigureerd/);
  assert.match(client, /database\/search/);
  assert.match(client, /\/artists\/\$\{id\}/);
  assert.match(client, /normalizeArtistDetail/);
  assert.match(client, /Authorization: `Discogs token=\$\{config\.userToken\}`/);
  assert.match(config, /DISCOGS_USER_TOKEN/);
  assert.match(config, /DISCOGS_API_TOKEN/);
});

test('ART-012B migration prepares external reference, cache and image metadata tables', () => {
  const sqlPath = 'scripts/sql/20260606_art012b_discogs_artist_enrichment_basis.sql';
  assert.ok(existsSync(sqlPath), 'ART-012B SQL migration should exist');
  const sql = read(sqlPath);

  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.artist_external_reference/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.artist_enrichment_cache/);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.artist_external_image/);
  assert.match(sql, /REFERENCES public\.artist\(ar_artist_key\)/);
  assert.match(sql, /local_cache_path IS NULL OR local_cache_path !~ '\^\/'/);
  assert.match(sql, /remote_only/);

  const scriptPath = 'scripts/db-migrate-art012b-docker.sh';
  assert.ok(existsSync(scriptPath), 'Docker migration script should exist');
  assert.ok((statSync(scriptPath).mode & 0o111) !== 0, 'Docker migration script should be executable');
  assert.match(read(scriptPath), /docker exec -i/);
});

test('ART-012B frontend exposes Discogs search/detail as inspect-only UI', () => {
  const api = read('client/src/api.js');
  const page = read('client/src/components/ArtistPageContent.jsx');

  assert.match(api, /getDiscogsConfig/);
  assert.match(api, /searchArtistDiscogs/);
  assert.match(api, /getDiscogsArtistDetail/);
  assert.match(page, /Discogs artist enrichment/);
  assert.match(page, /Zoek in Discogs/);
  assert.match(page, /Discogs IDs vervangen nooit lokale artist keys/);
  assert.match(page, /ART-012C koppelt alleen de externe Discogs-referentie/);
  assert.match(page, /Lokale artist keys en artistnaam worden niet overschreven/);
  assert.match(page, /disabled=\{!discogsConfigured \|\| discogsLoading\}/);
});

test('ART-012B documentation and package scripts are wired', () => {
  assert.ok(existsSync('docs/ART_012B_Discogs_Search_Detail_Implementatie.md'));
  assert.ok(existsSync('docs/ART_012B_Testcases_en_Runbook.md'));
  assert.ok(existsSync('Release Notes/ART_012B_Discogs_Search_Detail_Release_Notes.md'));

  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.scripts['db:migrate:art012b'], 'bash scripts/db-migrate-art012b-docker.sh');
  assert.match(pkg.scripts['test:art012'], /art012bDiscogsSearchDetail\.contract\.test\.mjs/);
  assert.match(pkg.scripts['test:art012b'], /art012bDiscogsSearchDetail\.contract\.test\.mjs/);

  const readme = read('Readme.md');
  assert.match(readme, /ART-012B/);
  assert.match(readme, /npm run db:migrate:art012b/);
});
