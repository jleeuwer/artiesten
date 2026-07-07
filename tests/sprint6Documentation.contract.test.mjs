import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname);
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

test('Sprint 6 functional/technical design document exists and covers agreed backlog themes', () => {
  const content = read('docs/ART_Sprint6_Artiesten_Relatieinzicht_Functioneel_Technisch_Ontwerp.md');

  assert.match(content, /artiestgewicht/i);
  assert.match(content, /favoriete artiesten/i);
  assert.match(content, /read-only relatiepaneel/i);
  assert.match(content, /Discogs artist enrichment/i);
  assert.match(content, /Muzikant \/ artiest \/ band \/ album relaties/i);
  assert.match(content, /Artiesten ontdubbelen \/ samenvoegen/i);
  assert.match(content, /albums/i);
});

test('Sprint 6 testcases and runbook document exists', () => {
  const content = read('docs/ART_Sprint6_Testcases_en_Runbook.md');

  assert.match(content, /ART-S6-F001/);
  assert.match(content, /ART-S6-F012/);
  assert.match(content, /ART-S6-T001/);
  assert.match(content, /npm run test:sprint6/);
});

test('Backlog includes Sprint 6 and newly agreed artist backlog items', () => {
  const backlog = read('docs/BACKLOG.md');

  assert.match(backlog, /ART-008.*relatie-inzicht, gewicht en sortering/i);
  assert.match(backlog, /ART-011.*Favoriete artiesten/i);
  assert.match(backlog, /ART-012.*Discogs artist enrichment/i);
  assert.match(backlog, /ART-013.*Muzikant \/ artiest \/ band \/ album relaties/i);
  assert.match(backlog, /ART-014.*Albums in musicdb/i);
  assert.match(backlog, /ART-015.*Artiesten ontdubbelen/i);
});
