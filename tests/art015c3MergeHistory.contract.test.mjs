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

test('ART-015C-3 exposes merge history endpoint and model query', () => {
  const routes = read('routes/artistRoutes.js');
  const controller = read('controllers/artistController.js');
  const model = read('models/artist.js');
  const api = read('client/src/api.js');

  assert.match(routes, /router\.get\("\/merge\/history"/);
  assert.match(controller, /async function getMergeHistory\s*\(/);
  assert.match(model, /async function getMergeHistory\s*\(/);
  assert.match(model, /FROM public\.artist_merge_history/);
  assert.match(api, /getMergeHistory/);
});

test('ART-015C-3 artist list supports merged artist filters and metadata', () => {
  const model = read('models/artist.js');
  const controller = read('controllers/artistController.js');
  const component = read('client/src/components/ArtistPageContent.jsx');

  assert.match(model, /mergeStatus === "merged_only"/);
  assert.match(model, /mergeStatus === "include_merged"/);
  assert.match(model, /ar_merged_into_artist_name/);
  assert.match(controller, /req\.query\.mergeStatus/);
  assert.match(component, /Actieve artiesten/);
  assert.match(component, /Inclusief samengevoegde artiesten/);
  assert.match(component, /Alleen samengevoegde artiesten/);
});

test('ART-015C-3 UI marks merged artists and can open canonical artist', () => {
  const component = read('client/src/components/ArtistPageContent.jsx');

  assert.match(component, /Samengevoegd/);
  assert.match(component, /Deze artiest is samengevoegd/);
  assert.match(component, /Open leidende artiest/);
  assert.match(component, /openCanonicalArtist/);
  assert.match(component, /Ontdubbelen is uitgeschakeld voor samengevoegde artiesten/);
  assert.match(component, /disabled=\{isMerged\}>Edit/);
  assert.match(component, /disabled=\{isMerged\}>Trash/);
});

test('ART-015C-3 relation panel shows read-only merge history', () => {
  const component = read('client/src/components/ArtistPageContent.jsx');
  const docs = read('docs/ART_015C_Testcases_en_Runbook.md');

  assert.match(component, /Mergehistorie/);
  assert.match(component, /relations\.mergeHistory/);
  assert.match(component, /Vervangen door/);
  assert.match(component, /Leidend voor/);
  assert.match(component, /mergeHistoryAffectedCount/);
  assert.match(docs, /ART-015C-3/);
  assert.match(docs, /Mergehistorie/);
});

test('ART-015C-3-Fix-1 resets duplicate workflow state when returning to list or selecting another artist', () => {
  const component = read('client/src/components/ArtistPageContent.jsx');

  assert.match(component, /function resetDuplicateWorkflowState\s*\(/);
  assert.match(component, /setDuplicateCandidates\(null\)/);
  assert.match(component, /setImpactData\(null\)/);
  assert.match(component, /setImpactOpen\(false\)/);
  assert.match(component, /setMergeReason\(""\)/);
  assert.match(component, /setMergeConfirmed\(false\)/);
  assert.match(component, /setMergeResult\(null\)/);
  assert.match(component, /if \(selectedArtist\?\.ar_artist_key !== row\.ar_artist_key\) \{\s*resetDuplicateWorkflowState\(\);[\s\S]*?\}/s);
  assert.match(component, /function scrollToArtistList\(\) \{\s*resetDuplicateWorkflowState\(\);/s);
});
