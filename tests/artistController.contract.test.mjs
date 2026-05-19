import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const controllerPath = path.join(__dirname, '..', 'controllers', 'artistController.js');
const source = fs.readFileSync(controllerPath, 'utf8');

test('artistController declares route handlers required by artistRoutes', () => {
  for (const key of ['list', 'get', 'create', 'update', 'remove', 'restore', 'hardDelete']) {
    assert.match(source, new RegExp(`async function ${key}\\s*\\(`), `Expected async function ${key} to exist`);
    assert.match(source, new RegExp(`\\b${key}\\b`), `Expected ${key} to be exported`);
  }
});

test('create validates required artist name', () => {
  assert.match(source, /Artist name is required/);
});

test('update validates numeric id', () => {
  assert.match(source, /Invalid id/);
});
