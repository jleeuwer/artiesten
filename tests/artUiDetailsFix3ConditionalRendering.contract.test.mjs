import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('client/src/components/ArtistPageContent.jsx', 'utf8');

test('de vier detailsecties worden als één groep conditioneel gerenderd', () => {
  assert.match(source, /\{showRelationDetails \? \(<>/);
  assert.match(source, /<\/RelationDetailSection>\s*<\/\>\) : null\}/s);
  assert.doesNotMatch(source, /hidden=\{!open\}/);
});

test('de vier afgesproken secties gebruiken niet langer individuele toggles', () => {
  for (const title of ['Songs', 'Alternatieve spellingen', 'Hitlijsten', 'Mergehistorie']) {
    assert.match(source, new RegExp(`RelationDetailSection[^>]+title="${title}"`));
  }
  assert.doesNotMatch(source, /CollapsibleRelationSection/);
  assert.doesNotMatch(source, /onToggle=\{/);
});
