import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';

const css = fs.readFileSync('client/src/app.css', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const audit = fs.readFileSync('scripts/audit-art-ui2-scroll.mjs', 'utf8');

test('ART-UI-2 heeft een uitvoerbaar scroll-auditcommando', () => {
  assert.equal(pkg.scripts['ui:scroll:audit'], 'node scripts/audit-art-ui2-scroll.mjs');
  assert.match(audit, /ART-UI-2-SCROLL-AUDIT/);
});

test('legacy relation-panel vertical scroll is physically removed', () => {
  assert.doesNotMatch(css, /\.artist-relation-panel\s*\{[^}]*overflow-y:\s*(?:auto|scroll)/s);
  assert.match(css, /\.artist-relation-panel\s*\{[^}]*overflow:\s*visible/s);
});

test('legacy detail tables and image grids no longer own vertical scroll', () => {
  assert.doesNotMatch(css, /\.artist-relation-table-scroll\s*\{[^}]*overflow:\s*auto/s);
  assert.doesNotMatch(css, /\.artist-discogs-image-grid\s*\{[^}]*overflow:\s*auto/s);
  assert.match(css, /\.artist-relation-table-scroll\s*\{[^}]*overflow-x:\s*auto/s);
});

test('scroll audit succeeds against the delivered stylesheet', () => {
  const result = spawnSync(process.execPath, ['scripts/audit-art-ui2-scroll.mjs'], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /passed=true violations=0/);
});
