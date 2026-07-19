import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.join(__dirname, '..');

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

test('Sprint 6 backend exposes favorite and relationship endpoints', () => {
  const routes = read('routes/artistRoutes.js');
  const controller = read('controllers/artistController.js');
  const model = read('models/artist.js');

  assert.match(routes, /router\.get\("\/:id\/relations"/);
  assert.match(routes, /router\.patch\("\/:id\/favorite"/);
  assert.match(controller, /async function getRelations\s*\(/);
  assert.match(controller, /async function setFavorite\s*\(/);
  assert.match(model, /async function getRelations\s*\(/);
  assert.match(model, /async function setFavorite\s*\(/);
});

test('Sprint 6 list query includes artist weight, hitlijst count and spelling count', () => {
  const model = read('models/artist.js');
  assert.match(model, /artist_weight/);
  assert.match(model, /version_count/);
  assert.match(model, /hitlijst_count/);
  assert.match(model, /spelling_count/);
  assert.match(model, /COUNT\(DISTINCT lower\(trim\(fd_tag_title\)\)\)/);
  assert.match(model, /fd_action IS NULL OR lower\(fd_action\) <> 'delete'/);
  assert.match(model, /COUNT\(DISTINCT fd_hitlijst\)/);
  assert.match(model, /COUNT\(\*\) AS spelling_count/);
});

test('Sprint 6 frontend includes favorite filter, sort and bottom relation panel', () => {
  const component = read('client/src/components/ArtistPageContent.jsx');
  assert.match(component, /Alleen favorieten/);
  assert.match(component, /favorite_first/);
  assert.match(component, /Relatie-inzicht/);
  assert.match(component, /Terug naar artiestenlijst/);
  assert.match(component, /scrollIntoView/);
  assert.match(component, /relationPanelRef/);
  assert.match(component, /title="Songs"/);
  assert.match(component, /title="Alternatieve spellingen"/);
  assert.match(component, /Hitlijsten/);
  assert.match(component, /getArtistRelations/);
  assert.match(component, /setArtistFavorite/);
});

test('Sprint 6 database migration adds ar_is_favorite safely', () => {
  const migration = read('scripts/sql/20260519_artists_sprint6_favorites.sql');
  assert.match(migration, /ADD COLUMN IF NOT EXISTS ar_is_favorite boolean NOT NULL DEFAULT false/);
  assert.match(migration, /idx_artist_is_favorite/);
});


test('Sprint 6 fix adds compact read-only relation panels to edit modal', () => {
  const modal = read('client/src/components/ArtistFormModal.jsx');
  assert.match(modal, /Relaties van deze artiest/);
  assert.match(modal, /Alle panelen zijn informatief en read-only/);
  assert.match(modal, /getArtistRelations/);
  assert.match(modal, /artist-relation-grid-compact/);
  assert.match(modal, /Bewerken gebeurt in de betreffende app via Shellstarter/);
});
