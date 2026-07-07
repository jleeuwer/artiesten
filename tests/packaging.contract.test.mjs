import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

test('env example file is present and documents required runtime variables', () => {
  assert.ok(fs.existsSync(path.join(root, '.env.example')), '.env.example should exist');
  assert.ok(!fs.existsSync(path.join(root, '.sample.env')), '.sample.env should not be used anymore');
  assert.ok(!fs.existsSync(path.join(root, '.env.sample')), '.env.sample should not be used anymore');

  const content = read('.env.example');
  assert.ok(content.trim().length > 0, '.env.example should not be empty');
  assert.match(content, /PORT=3012/);
  assert.match(content, /DATABASE_URL=/);
  assert.match(content, /CORS_ORIGIN=/);
  assert.match(content, /VITE_ARTIST_APP_ENABLE_SHELL_MODE=/);
  assert.match(content, /VITE_ARTIST_APP_ALLOW_THEME_QUERY=/);
  assert.match(content, /VITE_ARTIST_APP_DEFAULT_THEME=/);
  assert.match(content, /ARTIST_DB_CONTAINER=my-postgresdb/);
  assert.match(content, /ARTIST_DB_USER=postgres/);
  assert.match(content, /ARTIST_DB_NAME=musicdb/);
});

test('gitignore protects local config, logs, dependencies and release noise', () => {
  const gitignore = read('.gitignore');
  for (const pattern of ['.env', 'logs/', 'node_modules/', 'client/node_modules/', '.DS_Store', '*.zip']) {
    assert.ok(gitignore.includes(pattern), `.gitignore should contain ${pattern}`);
  }
});

test('release packaging script excludes local-only artifacts', () => {
  const script = read('scripts/make-release-zip.sh');
  for (const excluded of ['node_modules/*', 'client/node_modules/*', '.git/*', '.env', '.sample.env', '.env.sample', 'logs/*', 'config/config.js', '.DS_Store', '__MACOSX/*', '*.woff', '*.woff2', '*.ttf', '*.otf']) {
    assert.ok(script.includes(excluded), `release script should exclude ${excluded}`);
  }
});



test('Sprint 6 migration docs and script use Docker PostgreSQL workflow', () => {
  assert.ok(fs.existsSync(path.join(root, 'scripts/db-migrate-sprint6-docker.sh')), 'docker migration script should exist');
  const script = read('scripts/db-migrate-sprint6-docker.sh');
  assert.match(script, /docker exec -i/);
  assert.match(script, /ARTIST_DB_CONTAINER/);
  assert.match(script, /artists-sprint6-migration-/);

  const packageJson = JSON.parse(read('package.json'));
  assert.equal(packageJson.scripts['db:migrate:sprint6'], 'bash scripts/db-migrate-sprint6-docker.sh');

  assert.match(read('Readme.md'), /npm run db:migrate:sprint6/);
  assert.match(read('Readme.md'), /docker exec -i my-postgresdb psql -U postgres -d musicdb/);
  assert.match(read('docs/ART_Sprint6_Testcases_en_Runbook.md'), /PostgreSQL in Docker/);
  assert.match(read('Release Notes/ART_Sprint6_Implementation_Release_Notes.md'), /ARTIST_DB_CONTAINER=my-postgresdb npm run db:migrate:sprint6/);
});

test('documentation contains backlog and project notes', () => {
  assert.ok(fs.existsSync(path.join(root, 'docs/BACKLOG.md')), 'docs/BACKLOG.md should exist');
  assert.ok(fs.existsSync(path.join(root, 'docs/PROJECT_NOTES.md')), 'docs/PROJECT_NOTES.md should exist');
  assert.match(read('Readme.md'), /Release-ZIP maken/);
  assert.match(read('docs/BACKLOG.md'), /ART-001/);
  assert.match(read('docs/PROJECT_NOTES.md'), /Shellstarter embedded contract/);
});


test('env cleanup script removes legacy env templates', () => {
  assert.ok(fs.existsSync(path.join(root, 'scripts/env-cleanup-legacy.sh')), 'scripts/env-cleanup-legacy.sh should exist');
  const script = read('scripts/env-cleanup-legacy.sh');
  assert.match(script, /rm -f \.sample\.env \.env\.sample/);
  const packageJson = JSON.parse(read('package.json'));
  assert.equal(packageJson.scripts['env:cleanup-legacy'], 'bash scripts/env-cleanup-legacy.sh');
  assert.match(read('Readme.md'), /npm run env:cleanup-legacy/);
});
