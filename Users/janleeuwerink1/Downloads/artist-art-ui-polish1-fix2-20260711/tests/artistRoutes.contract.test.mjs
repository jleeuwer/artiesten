import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const routesPath = path.join(__dirname, '..', 'routes', 'artistRoutes.js');
const source = fs.readFileSync(routesPath, 'utf8');

test('hard delete route is declared before generic delete route', () => {
  const hardIndex = source.indexOf('router.delete("/:id/hard"');
  const softIndex = source.indexOf('router.delete("/:id"');
  assert.notEqual(hardIndex, -1);
  assert.notEqual(softIndex, -1);
  assert.ok(hardIndex < softIndex, 'Expected /:id/hard route before /:id route');
});
