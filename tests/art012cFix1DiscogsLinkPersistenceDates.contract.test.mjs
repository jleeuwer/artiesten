import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

function read(path) {
  return readFileSync(path, 'utf8');
}

test('ART-012C-Fix-1 Discogs link persists before optional audit and handles optional dates', () => {
  const model = read('models/artist.js');
  const client = read('client/src/components/ArtistPageContent.jsx');
  const discogs = read('services/discogsClient.js');

  assert.match(model, /SAVEPOINT artist_discogs_link_optional_audit/);
  assert.match(model, /ROLLBACK TO SAVEPOINT artist_discogs_link_optional_audit/);
  assert.match(model, /artist_external_reference/);
  assert.match(model, /artist_enrichment_cache/);
  assert.match(model, /artist_external_image/);
  assert.match(model, /appliedArtistFields/);
  assert.match(model, /ar_artist_dateofbirth = CASE/);
  assert.match(model, /ar_artist_passing = CASE/);
  assert.match(model, /WHEN ar_artist_dateofbirth IS NULL/);
  assert.match(model, /WHEN ar_artist_passing IS NULL/);

  assert.match(discogs, /normalizeDiscogsDate/);
  assert.match(discogs, /birth_date/);
  assert.match(discogs, /death_date/);

  assert.match(client, /Geboortedatum overgenomen naar de lokale artiest/);
  assert.match(client, /Overlijdensdatum overgenomen naar de lokale artiest/);
  assert.match(client, /Geen gestructureerde geboorte-\/overlijdensdatum overgenomen/);
});

test('ART-012C-Fix-1 documentation explains link persistence and date behavior', () => {
  assert.ok(existsSync('docs/ART_012C_Fix_1_Discogs_Link_Persistence_Dates.md'));
  assert.ok(existsSync('Release Notes/ART_012C_Fix_1_Discogs_Link_Persistence_Dates_Release_Notes.md'));
  const doc = read('docs/ART_012C_Fix_1_Discogs_Link_Persistence_Dates.md');
  assert.match(doc, /artist_external_reference/);
  assert.match(doc, /artist_enrichment_cache/);
  assert.match(doc, /artist_external_image/);
  assert.match(doc, /admin_audit_log/);
  assert.match(doc, /savepoint/);
  assert.match(doc, /geboortedatum/);
  assert.match(doc, /overlijdensdatum/);
  assert.match(doc, /niet uit vrije profieltekst/);
});

test('ART-012C-Fix-1 package script is wired into ART-012 test set', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.match(pkg.scripts['test:art012c'], /art012cFix1DiscogsLinkPersistenceDates\.contract\.test\.mjs/);
  assert.match(pkg.scripts['test:art012'], /art012cFix1DiscogsLinkPersistenceDates\.contract\.test\.mjs/);
});
