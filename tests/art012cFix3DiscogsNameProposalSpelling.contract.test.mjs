import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');

test('ART-012C-Fix-3 UI makes Discogs name proposal rule explicit', () => {
  const page = read('client/src/components/ArtistPageContent.jsx');

  assert.match(page, /Discogs-namen zijn voorstellen/);
  assert.match(page, /artistnaam worden niet overschreven/);
  assert.match(page, /Canonical naamwijzigingen lopen later via artiestenspelling/);
  assert.match(page, /Koppel Discogs artist/);
});

test('ART-012C-Fix-3 documentation requires spelling-aware canonical rename', () => {
  const impl = read('docs/ART_012C_Discogs_Artist_Koppelen_Implementatie.md');
  const design = read('docs/ART_012_Discogs_Artist_Enrichment_Functioneel_Technisch_Ontwerp.md');
  const backlog = read('docs/BACKLOG.md');

  assert.match(impl, /Discogs artist name is een voorstel/);
  assert.match(impl, /nooit een directe overwrite van `artist\.ar_artist_name`/);
  assert.match(impl, /artiesten_spelling\.as_alternatieve_spelling/);
  assert.match(impl, /oude canonical naam behouden of toevoegen als alternatieve spelling/);

  assert.match(design, /canonical naamwijziging via artiestenspelling/);
  assert.match(design, /spelling-aware/);
  assert.match(design, /conflicten/);

  assert.match(backlog, /ART-012D — Discogs naamvoorstellen en artiestenspelling toepassen/);
  assert.match(backlog, /Discogs-naam toevoegen als alternatieve spelling/);
  assert.match(backlog, /Oude canonical naam behouden als alternatieve spelling/);
});

test('ART-012C-Fix-3 release notes document no migration', () => {
  const releaseNotes = read('Release Notes/ART_012C_Fix_3_Discogs_Name_Proposal_Spelling_Release_Notes.md');

  assert.match(releaseNotes, /Koppel Discogs artist/);
  assert.match(releaseNotes, /wijzigt de lokale canonical artist name niet/);
  assert.match(releaseNotes, /Geen nieuwe SQL-migratie nodig/);
});
