import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const design = fs.readFileSync('docs/ART_UI_2_FASE_3_4_Tabel_Embedded_Functioneel_Technisch_Ontwerp.md', 'utf8');
const runbook = fs.readFileSync('docs/ART_UI_2_FASE_3_4_Testcases_en_Runbook.md', 'utf8');
const manifest = fs.readFileSync('docs/ART_UI_2_FASE_3_4_Sprintmanifest.md', 'utf8');

for (let index = 1; index <= 80; index += 1) {
  const id = `UI2-034-TC-${String(index).padStart(3, '0')}`;
  test(`${id} is traceerbaar`, () => assert.match(runbook, new RegExp(id)));
}

test('ontwerp kiest expliciete standalone en embedded scrollowners', () => {
  assert.match(design, /document is de primaire verticale scrollowner/i);
  assert.match(design, /Embedded heeft één primaire workspace-scroll/i);
  assert.match(design, /data-scroll-owner="document"/);
  assert.match(design, /data-scroll-owner="workspace"/);
});

test('ontwerp borgt sticky header en reset-preservecontract', () => {
  assert.match(design, /position: sticky/);
  assert.match(design, /preserveArtistTableScroll/);
  assert.match(design, /resetArtistTableScroll/);
});

test('ontwerp beschermt tegen oude detailresponses', () => {
  assert.match(design, /oude responses mogen gewiste detailstate niet herstellen/i);
  assert.match(runbook, /UI2-034-TC-032/);
});

test('sprint vereist geen database- of API-migratie', () => {
  assert.match(design, /Geen database\/API-wijziging/i);
  assert.match(manifest, /database- of API-wijzigingen/);
});

test('feature flag en rollback zijn vastgelegd', () => {
  assert.match(design, /VITE_ARTIST_UI_WORKSPACE_PHASE34=true/);
  assert.match(design, /false.*Fase 1\/2/s);
});
