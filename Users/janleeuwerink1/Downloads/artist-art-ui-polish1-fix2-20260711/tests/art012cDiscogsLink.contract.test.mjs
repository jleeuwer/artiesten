import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

function read(path) {
  return readFileSync(path, 'utf8');
}

test('ART-012C backend links a chosen Discogs artist as external reference/cache metadata', () => {
  const routes = read('routes/artistRoutes.js');
  const controller = read('controllers/artistController.js');
  const model = read('models/artist.js');

  assert.match(routes, /post\("\/:id\/discogs\/link"/);
  assert.match(controller, /linkDiscogsArtist/);
  assert.match(controller, /Discogs\.getArtistDetail/);
  assert.match(controller, /Artist\.linkDiscogsArtist/);

  assert.match(model, /async function linkDiscogsArtist/);
  assert.match(model, /artist_external_reference/);
  assert.match(model, /artist_enrichment_cache/);
  assert.match(model, /artist_external_image/);
  assert.match(model, /status = 'linked'/);
  assert.match(model, /cache_status, fetched_at, expires_at/);
  assert.match(model, /remote_only/);
  assert.match(model, /local_cache_path/);
});

test('ART-012C frontend exposes explicit link action and keeps local artist key leading', () => {
  const api = read('client/src/api.js');
  const page = read('client/src/components/ArtistPageContent.jsx');

  assert.match(api, /linkArtistDiscogs/);
  assert.match(api, /\/api\/artists\/\$\{id\}\/discogs\/link/);
  assert.match(page, /Koppel Discogs artist/);
  assert.match(page, /linkDiscogsDetailToArtist/);
  assert.match(page, /Gekoppelde Discogs-referentie/);
  assert.match(page, /Lokale artist keys en artistnaam worden niet overschreven/);
  assert.match(page, /discogsReferences/);
});

test('ART-012C documentation and package scripts are wired', () => {
  assert.ok(existsSync('docs/ART_012C_Discogs_Artist_Koppelen_Implementatie.md'));
  assert.ok(existsSync('docs/ART_012C_Testcases_en_Runbook.md'));
  assert.ok(existsSync('Release Notes/ART_012C_Discogs_Artist_Koppelen_Release_Notes.md'));

  const pkg = JSON.parse(read('package.json'));
  assert.match(pkg.scripts['test:art012'], /art012cDiscogsLink\.contract\.test\.mjs/);
  assert.match(pkg.scripts['test:art012c'], /art012cDiscogsLink\.contract\.test\.mjs/);

  const doc = read('docs/ART_012C_Discogs_Artist_Koppelen_Implementatie.md');
  assert.match(doc, /`artist\.ar_artist_key` blijft leidend/);
  assert.match(doc, /Discogs artist ID wordt nooit gebruikt als vervanging van de lokale sleutel/);
  assert.match(doc, /artist_external_reference/);
  assert.match(doc, /artist_enrichment_cache/);
  assert.match(doc, /artist_external_image/);
  assert.match(doc, /Binaire afbeeldingen worden niet in PostgreSQL opgeslagen/);
});
