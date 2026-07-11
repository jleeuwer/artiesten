import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const modelPath = path.join(__dirname, '..', 'models', 'artist.js');
const controllerPath = path.join(__dirname, '..', 'controllers', 'artistController.js');
const pagePath = path.join(__dirname, '..', 'client', 'src', 'components', 'ArtistPageContent.jsx');
const modelSource = fs.readFileSync(modelPath, 'utf8');
const controllerSource = fs.readFileSync(controllerPath, 'utf8');
const pageSource = fs.readFileSync(pagePath, 'utf8');

test('hard delete checks file_details references before deleting artist', () => {
  assert.match(modelSource, /SELECT 1 FROM public\.file_details WHERE fd_artist_key = \$1 LIMIT 1/);
  assert.match(modelSource, /DELETE FROM public\.artiesten_spelling WHERE as_artist_key = \$1/);
  assert.match(modelSource, /DELETE FROM public\.artist WHERE ar_artist_key = \$1 RETURNING ar_artist_key/);
});

test('controller returns dedicated blockedBy payload for file_details references', () => {
  assert.match(controllerSource, /blockedBy: \"file_details\"/);
  assert.match(controllerSource, /Cannot delete forever: artist is referenced by file details\./);
});

test('trash UI shows a dedicated message for file_details blocking', () => {
  assert.match(pageSource, /cannot be deleted forever because it is referenced in file details/i);
});
