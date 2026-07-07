import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

test('ART-015D-3D mailcontract documents alerts versus mail responsibilities', () => {
  const doc = read('docs/ART_015D_3D_Shellstarter_Mailcontract.md');
  assert.match(doc, /Shellstarter mailcontract/);
  assert.match(doc, /Echte e-mail[\s\S]*Niet geïmplementeerd/);
  assert.match(doc, /De Artiesten-app verstuurt \*\*geen mail rechtstreeks\*\*/);
  assert.match(doc, /Shellstarter blijft verantwoordelijk voor:[\s\S]*daadwerkelijke mailverzending/);
  assert.match(doc, /Alerts blijven leidend/);
});

test('ART-015D-3D mailcontract defines notification outbox and alternatives', () => {
  const doc = read('docs/ART_015D_3D_Shellstarter_Mailcontract.md');
  assert.match(doc, /Voorkeurscontract: notification outbox/);
  assert.match(doc, /notification_outbox/);
  assert.match(doc, /Optie A — Shellstarter leest `public\.alerts`/);
  assert.match(doc, /Optie B — Artiesten-app roept een Shellstarter API aan/);
  assert.match(doc, /Optie C — Notification outbox/);
  assert.match(doc, /Deze tabel wordt in ART-015D-3D \*\*nog niet gemigreerd\*\*/);
});

test('ART-015D-3D mailcontract captures mail decision matrix and retry rules', () => {
  const doc = read('docs/ART_015D_3D_Shellstarter_Mailcontract.md');
  assert.match(doc, /Scanner-run mislukt[\s\S]*Ja[\s\S]*Ja/);
  assert.match(doc, /Stale reviewqueue boven threshold[\s\S]*Optioneel\/Ja/);
  assert.match(doc, /Artist merge succesvol met hoge impact[\s\S]*Optioneel\/Ja/);
  assert.match(doc, /Mail mag de scanner of merge niet onnodig breken/);
  assert.match(doc, /idempotency key/);
});

test('ART-015D-3D docs, release notes and package scripts are wired', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.scripts['test:art015d3d'], 'node --test tests/art015d3dMailContract.contract.test.mjs');
  assert.match(pkg.scripts['test:art015d'], /test:art015d3d/);
  assert.match(read('docs/ART_015D_3D_Testcases_en_Runbook.md'), /TC-3D-001/);
  assert.match(read('Release Notes/ART_015D_3D_Shellstarter_Mailcontract_Release_Notes.md'), /Geen nieuwe SQL-migratie/);
  assert.match(read('Readme.md'), /ART-015D-3D/);
  assert.match(read('docs/BACKLOG.md'), /ART-015D-3D/);
  assert.match(read('docs/PROJECT_NOTES.md'), /ART-015D-3D/);
});
